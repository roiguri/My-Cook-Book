/**
 * Generic notification helper for Cloud Functions.
 *
 * Channel-agnostic API for sending notifications to users. Currently backed
 * by FCM. Call sites (triggers, callables) should never call FCM directly —
 * they go through these helpers so we can swap channels or add fan-out (email,
 * in-app) without touching trigger code.
 *
 * Public API:
 *   - sendNotificationToUsers(uids, payload): Send to a specific list of user IDs.
 *   - sendNotificationToRole(role, payload):  Send to all users with the given role.
 *
 * payload shape:
 *   {
 *     title:        string,
 *     body:         string,
 *     data?:        object  // string-valued; merged into FCM data payload
 *     collapseKey?: string  // groups notifications so a newer one replaces older
 *     url?:         string  // deep link opened on notificationclick
 *   }
 */
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

async function sendNotificationToUsers(uids, payload) {
  if (!Array.isArray(uids) || uids.length === 0) return { sent: 0, pruned: 0 };

  const db = getFirestore();
  const userDocs = await Promise.all(uids.map((uid) => db.collection('users').doc(uid).get()));

  // Flatten all tokens across the recipient set, keeping track of which user
  // each token belongs to so we can prune dead tokens individually.
  const tokenIndex = []; // [{ uid, entry }]
  for (const snap of userDocs) {
    if (!snap.exists) continue;
    const data = snap.data() || {};
    const tokens = Array.isArray(data.fcmTokens) ? data.fcmTokens : [];
    for (const entry of tokens) {
      if (entry && typeof entry.token === 'string' && entry.token) {
        tokenIndex.push({ uid: snap.id, entry });
      }
    }
  }

  if (tokenIndex.length === 0) return { sent: 0, pruned: 0 };

  // Data-only payload: when `notification` is present on a Web push, FCM auto-
  // displays a banner using the site favicon AND the SW's onBackgroundMessage
  // also fires our own — yielding two notifications. Sending only `data` makes
  // the SW (and the page's onMessage) the single source of truth for display.
  const message = {
    data: stringifyData({
      ...(payload.data || {}),
      title: payload.title,
      body: payload.body,
      url: payload.url || '/dashboard',
    }),
    tokens: tokenIndex.map((t) => t.entry.token),
    webpush: {
      headers: payload.collapseKey ? { Topic: payload.collapseKey } : undefined,
      fcmOptions: payload.url ? { link: payload.url } : undefined,
    },
  };

  const response = await getMessaging().sendEachForMulticast(message);

  // Prune tokens that came back as permanently invalid.
  const deadByUser = new Map(); // uid -> [entry, ...]
  response.responses.forEach((res, i) => {
    if (res.success) return;
    const code = res.error && res.error.code;
    if (
      code === 'messaging/registration-token-not-registered' ||
      code === 'messaging/invalid-registration-token' ||
      code === 'messaging/invalid-argument'
    ) {
      const { uid, entry } = tokenIndex[i];
      if (!deadByUser.has(uid)) deadByUser.set(uid, []);
      deadByUser.get(uid).push(entry);
    }
  });

  let prunedCount = 0;
  if (deadByUser.size > 0) {
    await Promise.all(
      Array.from(deadByUser.entries()).map(async ([uid, entries]) => {
        prunedCount += entries.length;
        await db
          .collection('users')
          .doc(uid)
          .update({ fcmTokens: FieldValue.arrayRemove(...entries) })
          .catch((err) => console.warn(`[notifications] prune failed for ${uid}:`, err.message));
      }),
    );
  }

  return { sent: response.successCount, failed: response.failureCount, pruned: prunedCount };
}

async function sendNotificationToRole(role, payload) {
  if (!role) return { sent: 0, pruned: 0 };
  const db = getFirestore();
  const snap = await db.collection('users').where('role', '==', role).get();
  const uids = snap.docs.map((d) => d.id);
  return sendNotificationToUsers(uids, payload);
}

// FCM data payload must contain only string values.
function stringifyData(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    out[k] = typeof v === 'string' ? v : String(v);
  }
  return out;
}

module.exports = { sendNotificationToUsers, sendNotificationToRole };
