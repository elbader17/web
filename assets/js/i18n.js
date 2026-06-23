/* ============================================================
   Eduardo Bader — i18n Module
   Reads translations from window.I18N_DATA (inlined by build),
   swaps text via data-i18n attributes, persists choice in localStorage.
   Default: English.
   ============================================================ */

(function () {
  'use strict';

  const STORAGE_KEY = 'eduardo-lang';
  const SUPPORTED = ['en', 'es'];
  const DEFAULT_LANG = 'en';

  function getInitialLang() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;
    } catch (e) { /* localStorage unavailable */ }
    const navLang = (navigator.language || navigator.userLanguage || '').slice(0, 2).toLowerCase();
    return SUPPORTED.indexOf(navLang) !== -1 ? navLang : DEFAULT_LANG;
  }

  let currentLang = getInitialLang();
  let dict = null;

  function resolveKey(key, obj) {
    return key.split('.').reduce(function (acc, k) {
      return acc == null ? acc : acc[k];
    }, obj);
  }

  function apply() {
    if (!dict) return;

    document.documentElement.setAttribute('lang', currentLang);

    const meta = dict.meta || {};
    if (meta.title) document.title = meta.title;
    if (meta.description) setMeta('description', meta.description);
    if (meta.ogTitle) setMeta('og:title', meta.ogTitle, 'property');
    if (meta.ogDescription) setMeta('og:description', meta.ogDescription, 'property');
    if (meta.twitterTitle) setMeta('twitter:title', meta.twitterTitle);
    if (meta.twitterDescription) setMeta('twitter:description', meta.twitterDescription);
    if (meta.ogLocale) setMeta('og:locale', meta.ogLocale, 'property');

    const nodes = document.querySelectorAll('[data-i18n]');
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      const key = el.getAttribute('data-i18n');
      const value = resolveKey(key, dict);
      if (value == null) continue;
      if (typeof value === 'string') {
        el.innerHTML = value;
      }
    }

    const attrNodes = document.querySelectorAll('[data-i18n-attr]');
    for (let i = 0; i < attrNodes.length; i++) {
      const el = attrNodes[i];
      const spec = el.getAttribute('data-i18n-attr');
      const parts = spec.split('|');
      const attr = parts[0];
      const key = parts[1];
      const value = resolveKey(key, dict);
      if (value == null) continue;
      if (typeof value === 'string') {
        el.setAttribute(attr, value);
      }
    }

    const arrayNodes = document.querySelectorAll('[data-i18n-array]');
    for (let i = 0; i < arrayNodes.length; i++) {
      const el = arrayNodes[i];
      const spec = el.getAttribute('data-i18n-array');
      const parts = spec.split('|');
      const key = parts[0];
      const templateSel = parts[1];
      const value = resolveKey(key, dict);
      if (!Array.isArray(value)) continue;
      const tmpl = templateSel ? document.querySelector(templateSel) : null;
      el.innerHTML = '';
      value.forEach(function (item) {
        if (tmpl) {
          const clone = tmpl.content.firstElementChild.cloneNode(true);
          if (typeof item === 'string') clone.textContent = item;
          el.appendChild(clone);
        } else if (typeof item === 'string') {
          const span = document.createElement('span');
          span.textContent = item;
          el.appendChild(span);
        }
      });
    }

    document.querySelectorAll('[data-lang-switch]').forEach(function (btn) {
      const lang = btn.getAttribute('data-lang-switch');
      const active = lang === currentLang;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      btn.classList.toggle('is-active', active);
    });

    document.dispatchEvent(new CustomEvent('i18n:applied', { detail: { lang: currentLang, dict: dict } }));
  }

  function setMeta(name, value, attr) {
    const sel = attr ? 'meta[property="' + name + '"]' : 'meta[name="' + name + '"]';
    const el = document.querySelector(sel);
    if (el) el.setAttribute('content', value);
  }

  function load(lang) {
    if (SUPPORTED.indexOf(lang) === -1) lang = DEFAULT_LANG;
    const data = (window.I18N_DATA && window.I18N_DATA[lang]) || null;
    if (!data) {
      console.warn('i18n: missing translation for', lang);
      return Promise.resolve();
    }
    dict = data;
    currentLang = data.lang || lang;
    apply();
    try { localStorage.setItem(STORAGE_KEY, currentLang); } catch (e) { /* ignore */ }
    return Promise.resolve();
  }

  function setLang(lang) {
    if (lang === currentLang && dict) return Promise.resolve();
    return load(lang);
  }

  function getLang() { return currentLang; }

  document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-lang-switch]');
    if (!btn) return;
    e.preventDefault();
    const lang = btn.getAttribute('data-lang-switch');
    if (lang && lang !== currentLang) {
      setLang(lang);
    }
  });

  window.i18n = { load: load, setLang: setLang, getLang: getLang, apply: apply };

  function init() {
    if (!window.I18N_DATA) {
      console.warn('i18n: window.I18N_DATA not loaded — run scripts/build_i18n.py');
      return;
    }
    load(currentLang);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
