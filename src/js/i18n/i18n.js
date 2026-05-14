/**
 * I18nService - Lightweight client-side localization for the SPA.
 *
 * Public API:
 *   - init(): One-time setup. Resolves the active locale from localStorage,
 *       browser settings, or the default, loads the translation file, and
 *       sets <html lang> and <html dir>. Idempotent.
 *   - getLocale(): Returns the active locale code (e.g. 'he').
 *   - getSupportedLocales(): Returns the list of configured locale codes.
 *   - setLocale(locale): Switches the active locale, persists the choice,
 *       updates <html lang>/<html dir>, and fires a `locale-changed` event.
 *   - t(key, params?): Translates a dot-path key (e.g. 'nav.home') with
 *       optional `{name}` interpolation. Returns the key path if missing.
 *
 * Events:
 *   - 'locale-changed' (CustomEvent<{ locale }>) — fired after a successful
 *       setLocale call. Subscribe via `i18nService.addEventListener(...)`.
 *
 * Adding a new locale:
 *   1. Add the code to SUPPORTED_LOCALES below.
 *   2. Create `./locales/<code>.json` with the same key shape as he.json.
 *   3. Add the code to RTL_LOCALES if appropriate.
 */

const STORAGE_KEY = 'mcb_locale_v1';
const SUPPORTED_LOCALES = ['he'];
const DEFAULT_LOCALE = 'he';
const RTL_LOCALES = new Set(['he', 'ar']);

class I18nService extends EventTarget {
  constructor() {
    super();
    this._locale = DEFAULT_LOCALE;
    this._messages = {};
    this._initPromise = null;
  }

  init() {
    if (this._initPromise) return this._initPromise;
    this._initPromise = (async () => {
      const locale = this._resolveInitialLocale();
      await this._load(locale);
      this._applyHtmlAttrs();
    })();
    return this._initPromise;
  }

  getLocale() {
    return this._locale;
  }

  getSupportedLocales() {
    return [...SUPPORTED_LOCALES];
  }

  async setLocale(locale) {
    if (!SUPPORTED_LOCALES.includes(locale) || locale === this._locale) return;
    await this._load(locale);
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch (_) {
      // Storage may be unavailable (private mode, quota); ignore.
    }
    this._applyHtmlAttrs();
    this.dispatchEvent(new CustomEvent('locale-changed', { detail: { locale } }));
  }

  t(key, params) {
    if (typeof key !== 'string' || !key) return '';
    const value = key.split('.').reduce((acc, part) => {
      return acc != null && typeof acc === 'object' ? acc[part] : undefined;
    }, this._messages);
    if (typeof value !== 'string') return key;
    if (!params) return value;
    return value.replace(/\{(\w+)\}/g, (match, name) =>
      Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
    );
  }

  _resolveInitialLocale() {
    let stored = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch (_) {
      stored = null;
    }
    const nav =
      typeof navigator !== 'undefined' && navigator.language
        ? navigator.language.split('-')[0]
        : null;
    const candidates = [stored, nav, DEFAULT_LOCALE];
    return candidates.find((c) => c && SUPPORTED_LOCALES.includes(c)) || DEFAULT_LOCALE;
  }

  async _load(locale) {
    const messages = await this._loadMessages(locale);
    this._messages = messages || {};
    this._locale = locale;
  }

  // Indirection point: dynamic JSON import in production; tests override this
  // to provide messages without exercising the bundler's JSON loader.
  async _loadMessages(locale) {
    const mod = await import(`./locales/${locale}.json`);
    return mod.default || mod;
  }

  _applyHtmlAttrs() {
    if (typeof document === 'undefined' || !document.documentElement) return;
    document.documentElement.lang = this._locale;
    document.documentElement.dir = RTL_LOCALES.has(this._locale) ? 'rtl' : 'ltr';
  }
}

const i18nService = new I18nService();

export { I18nService, SUPPORTED_LOCALES, i18nService as default };
