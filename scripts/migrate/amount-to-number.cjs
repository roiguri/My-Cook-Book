/**
 * amount-to-number.cjs   (Phase 2b migration)
 *
 * Converts every recipe ingredient `amount` from a STRING to a canonical
 * Firestore NUMBER (or null if genuinely unparseable). Idempotent:
 * amounts that are already numbers are skipped, so re-running is safe.
 *
 * .cjs because the repo package.json is "type": "module". Runs LOCALLY
 * from the repo root: firebase-admin is resolved from functions/node_modules
 * and credentials come from `gcloud auth application-default login`.
 *
 * SAFETY
 *  - Dry-run is the DEFAULT (no writes). Pass --apply to write.
 *  - --apply REQUIRES an explicit --project=<id>.
 *  - A determinism self-check runs first: the inlined parseAmount must
 *    produce the expected vector or the script aborts (guards drift from
 *    §3 / recipe-ingredients-utils.js).
 *  - Each document is transformed in its own try/catch; a bad doc is
 *    logged and skipped, never aborting the batch.
 *  - Every run writes a full before->after report to scripts/migrate/reports/.
 *
 * Usage (from repo root):
 *   node scripts/migrate/amount-to-number.cjs --project=cook-book-test-479e8           # dry-run
 *   node scripts/migrate/amount-to-number.cjs --apply --project=cook-book-test-479e8   # apply
 *   # prod only after staging validated AND a separate approval:
 *   node scripts/migrate/amount-to-number.cjs --project=my-cook-book-67fde
 *   node scripts/migrate/amount-to-number.cjs --apply --project=my-cook-book-67fde
 *
 * Projects: staging = cook-book-test-479e8 | prod = my-cook-book-67fde
 */

const path = require('path');
const fs = require('fs');

function requireAdmin() {
  try {
    return require('firebase-admin');
  } catch {
    return require(path.join(process.cwd(), 'functions', 'node_modules', 'firebase-admin'));
  }
}
const admin = requireAdmin();

const ARGS = process.argv.slice(2);
const APPLY = ARGS.includes('--apply');
const PROJECT_ARG = (ARGS.find((a) => a.startsWith('--project=')) || '').split('=')[1];
const OUT_ARG = (ARGS.find((a) => a.startsWith('--out=')) || '').split('=')[1];
const ACTIVE_PROJECT =
  PROJECT_ARG || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || '';

if (!ACTIVE_PROJECT) {
  console.error('No project. Pass --project=<id> (e.g. --project=cook-book-test-479e8).');
  process.exit(1);
}
if (APPLY && !PROJECT_ARG) {
  console.error('Refusing --apply without an explicit --project=<id>. Aborting.');
  process.exit(1);
}

/* ---- Inlined parseAmount — MUST stay in sync with §3 /
 * src/js/utils/recipes/recipe-ingredients-utils.js. The self-check below
 * fails the run if this drifts. ---- */
const COMMON_FRACTIONS = {
  '⅛': 1 / 8,
  '¼': 1 / 4,
  '⅓': 1 / 3,
  '½': 1 / 2,
  '⅔': 2 / 3,
  '¾': 3 / 4,
};
const COMMON_RATIOS = Object.values(COMMON_FRACTIONS);
const matchesCommonRatio = (v) => COMMON_RATIOS.some((r) => Math.abs(v - r) < 1e-6);

function parseAmount(input) {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') return Number.isFinite(input) ? input : null;
  const s = String(input).trim();
  if (s === '') return null;
  if (/^\d+(\.\d+)?$/.test(s)) {
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : null;
  }
  if (Object.prototype.hasOwnProperty.call(COMMON_FRACTIONS, s)) return COMMON_FRACTIONS[s];
  const mixUni = s.match(/^(\d+)\s*([⅛¼⅓½⅔¾])$/);
  if (mixUni) return parseInt(mixUni[1], 10) + COMMON_FRACTIONS[mixUni[2]];
  const frac = s.match(/^(\d+)\/(\d+)$/);
  if (frac) {
    const den = parseInt(frac[2], 10);
    if (den === 0) return null;
    const v = parseInt(frac[1], 10) / den;
    return matchesCommonRatio(v) ? v : null;
  }
  const mixAscii = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixAscii) {
    const den = parseInt(mixAscii[3], 10);
    if (den === 0) return null;
    const fv = parseInt(mixAscii[2], 10) / den;
    if (!matchesCommonRatio(fv)) return null;
    return parseInt(mixAscii[1], 10) + fv;
  }
  return null;
}

// Determinism self-check (must match recipe-ingredients-utils.js parseAmount).
function selfCheck() {
  const approx = (a, b) => a !== null && b !== null && Math.abs(a - b) < 1e-9;
  const cases = [
    ['2', 2],
    ['2.5', 2.5],
    ['0.375', 0.375],
    ['1/2', 0.5],
    ['3/4', 0.75],
    ['1/8', 0.125],
    ['1/3', 1 / 3],
    ['2/3', 2 / 3],
    ['½', 0.5],
    ['1½', 1.5],
    ['1 1/2', 1.5],
    ['2 3/4', 2.75],
    ['3/8', null],
    ['2-3', null],
    ['to taste', null],
    ['', null],
  ];
  for (const [input, expected] of cases) {
    const got = parseAmount(input);
    const ok = expected === null ? got === null : approx(got, expected);
    if (!ok) {
      console.error(
        `Determinism self-check FAILED for ${JSON.stringify(input)}: expected ` +
          `${expected}, got ${got}. Inlined parseAmount has drifted. Aborting.`,
      );
      process.exit(1);
    }
  }
}

function classify(raw) {
  if (typeof raw === 'number') return 'already-number';
  const s = String(raw == null ? '' : raw).trim();
  if (s === '') return 'unparseable';
  if (/^\d+$/.test(s)) return 'integer';
  if (/^\d+\.\d+$/.test(s)) return 'decimal';
  if (Object.prototype.hasOwnProperty.call(COMMON_FRACTIONS, s) || /^\d+\s*[⅛¼⅓½⅔¾]$/.test(s))
    return 'unicode-fraction';
  if (/^\d+\/\d+$/.test(s)) return 'ascii-fraction';
  if (/^\d+\s+\d+\/\d+$/.test(s)) return 'mixed';
  return 'unparseable';
}

selfCheck();
admin.initializeApp({ projectId: ACTIVE_PROJECT });
const db = admin.firestore();

async function migrate() {
  const _lines = [];
  const P = (s = '') => {
    _lines.push(String(s));
    process.stdout.write(`${s}\n`);
  };

  P(
    `\n=== amount → number  |  project: ${ACTIVE_PROJECT}  |  mode: ${
      APPLY ? 'APPLY (writes)' : 'DRY-RUN (no writes)'
    } ===\n`,
  );

  const snapshot = await db.collection('recipes').get();
  P(`Scanning ${snapshot.size} recipes...\n`);

  const breakdown = {
    integer: 0,
    decimal: 0,
    'ascii-fraction': 0,
    'unicode-fraction': 0,
    mixed: 0,
    'already-number': 0,
    unparseable: 0,
  };
  let totalAmounts = 0;
  let converted = 0;
  let integerConverted = 0;
  let skipped = 0;
  const blanked = [];
  const changes = [];
  const docErrors = [];
  let recipesChanged = 0;

  let batch = db.batch();
  let pending = 0;

  for (const docSnap of snapshot.docs) {
    const id = docSnap.id;
    try {
      const recipe = docSnap.data();
      const recipeName = String(recipe.name || '(no name)');
      let changed = false;

      const mapAmount = (ing) => {
        if (!ing || typeof ing !== 'object') return ing;
        totalAmounts += 1;
        const kind = classify(ing.amount);
        breakdown[kind] += 1;

        if (typeof ing.amount === 'number') {
          skipped += 1;
          return ing;
        }
        const n = parseAmount(ing.amount);
        if (n === null) {
          blanked.push({ id, recipe: recipeName, item: ing.item, value: ing.amount });
          changed = true;
          return { ...ing, amount: null };
        }
        converted += 1;
        changed = true;
        if (kind === 'integer') {
          integerConverted += 1;
        } else {
          changes.push({
            recipe: recipeName,
            id,
            item: String(ing.item || ''),
            old: ing.amount,
            next: n,
          });
        }
        return { ...ing, amount: n };
      };

      const update = {};
      if (Array.isArray(recipe.ingredientSections)) {
        const next = recipe.ingredientSections.map((sec) => ({
          ...sec,
          items: Array.isArray(sec && sec.items) ? sec.items.map(mapAmount) : sec && sec.items,
        }));
        if (changed) update.ingredientSections = next;
      } else if (Array.isArray(recipe.ingredients)) {
        const next = recipe.ingredients.map(mapAmount);
        if (changed) update.ingredients = next;
      }

      if (changed) {
        recipesChanged += 1;
        if (APPLY) {
          batch.update(docSnap.ref, update);
          pending += 1;
          if (pending === 500) {
            P('Committing batch of 500...');
            await batch.commit();
            batch = db.batch();
            pending = 0;
          }
        }
      }
    } catch (err) {
      docErrors.push({ id, error: err && err.message ? err.message : String(err) });
    }
  }

  if (APPLY && pending > 0) {
    P(`Committing final batch of ${pending}...`);
    await batch.commit();
  }

  P('--- CHANGES (fractions / unicode / mixed / decimals) ---');
  if (changes.length === 0) {
    P('  (none)');
  } else {
    changes.sort((a, b) => a.recipe.localeCompare(b.recipe));
    let last = null;
    for (const c of changes) {
      if (c.recipe !== last) {
        P(`\n  ▶ ${c.recipe}  (${c.id})`);
        last = c.recipe;
      }
      P(`      ${c.item || '(item?)'} :  "${c.old}"  →  ${c.next}`);
    }
  }
  P('');

  if (blanked.length) {
    P('--- BLANKED (could not parse → null) ---');
    for (const b of blanked)
      P(`  ▶ ${b.recipe} (${b.id})  ${b.item || ''} :  "${b.value}"  → null`);
    P('');
  }
  if (docErrors.length) {
    P('--- SKIPPED DOCUMENTS (transform error) ---');
    for (const e of docErrors) P(`  ${e.id} : ${e.error}`);
    P('');
  }

  P('--- Candidate breakdown (by representation) ---');
  for (const [k, v] of Object.entries(breakdown)) P(`  ${k.padEnd(18)}: ${v}`);
  P('');
  P('--- Result ---');
  P(`  Total amounts                 : ${totalAmounts}`);
  P(`  Converted → number            : ${converted}`);
  P(`    ├─ listed changes above     : ${changes.length}`);
  P(`    └─ plain integers ("X"→X)   : ${integerConverted}  (value unchanged)`);
  P(`  Skipped (already a number)    : ${skipped}`);
  P(`  Blanked → null                : ${blanked.length}`);
  P(`  Doc errors (skipped)          : ${docErrors.length}`);
  P(`  Recipes changed               : ${recipesChanged}`);
  P(`\n=== ${APPLY ? 'APPLY complete — writes committed' : 'DRY-RUN complete — no writes'} ===\n`);
  if (!APPLY && (converted > 0 || blanked.length > 0)) {
    P('Real candidates exist. Re-run with --apply --project=<active> to migrate.');
  }
  if (APPLY) {
    P('Idempotency check: re-run WITHOUT --apply; "Converted → number" must be 0.');
  }

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = OUT_ARG
    ? path.resolve(OUT_ARG)
    : path.join(
        __dirname,
        'reports',
        `amount-migration_${ACTIVE_PROJECT}_${APPLY ? 'apply' : 'dryrun'}_${ts}.txt`,
      );
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${_lines.join('\n')}\n`, 'utf8');
  console.log(`Report written to: ${outPath}\n`);
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
