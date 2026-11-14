(function () {
  'use strict';
  if (window.AspirePrivacy) return;
  const key = 'aspirecompass_analytics_choice_v1';
  const measurementId = 'G-54C36SGS3Z';
  const disabledKey = 'ga-disable-' + measurementId;
  // Google applies these defaults using the visitor's region, not browser
  // language or time zone. Never persist a default as an explicit opt-in.
  const consentRegions = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI',
    'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL',
    'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO', 'GB', 'CH'];
  let current = null, started = false, previousFocus = null;
  window[disabledKey] = true;

  function valid(value) { return value === 'yes' || value === 'no'; }
  function readChoice() {
    try {
      const saved = localStorage.getItem(key);
      if (valid(saved)) return saved;
      // Keep an explicit choice made in the earlier Spanish implementation.
      const legacy = localStorage.getItem('aspirecompass_es_analytics');
      if (valid(legacy)) { localStorage.setItem(key, legacy); localStorage.removeItem('aspirecompass_es_analytics'); return legacy; }
    } catch { /* An unavailable storage API does not disable the tools. */ }
    return null;
  }
  function clearAnalyticsCookies() {
    const names = document.cookie.split(';').map(value => value.trim().split('=')[0])
      .filter(name => /^(_ga($|_)|_gid$|_gat($|_))/.test(name));
    const host = location.hostname.split('.');
    const domains = [''];
    for (let index = 0; index < host.length - 1; index++) {
      const domain = host.slice(index).join('.'); domains.push('; domain=' + domain, '; domain=.' + domain);
    }
    for (const name of names) for (const domain of domains) {
      document.cookie = name + '=; Max-Age=0; path=/' + domain + '; SameSite=Lax';
    }
  }
  function startAnalytics() {
    if (started || !['aspirecompass.org', 'www.aspirecompass.org'].includes(location.hostname)) return;
    started = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    window.gtag('consent', 'default', { analytics_storage: 'denied', region: consentRegions });
    if (current === 'yes') window.gtag('consent', 'update', { analytics_storage: 'granted' });
    window.gtag('js', new Date());
    window.gtag('config', measurementId, { allow_google_signals: false, allow_ad_personalization_signals: false });
    const script = document.createElement('script');
    script.id = 'aspire-analytics'; script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
    document.head.appendChild(script);
  }
  function apply(value) {
    const previous = current;
    current = valid(value) ? value : null;
    // A cleared preference must not leave an earlier global opt-in active in
    // an open tab. Stay disabled there until the next page loads its defaults.
    const reset = started && valid(previous) && current === null;
    window[disabledKey] = current === 'no' || reset;
    if (!window[disabledKey]) {
      if (started && current === 'yes') window.gtag?.('consent', 'update', { analytics_storage: 'granted' });
      else startAnalytics();
    } else {
      if (started) window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
      clearAnalyticsCookies();
    }
  }
  // This reports whether events may reach the consent-aware tag. Cookie
  // permission is enforced separately by Google's regional consent defaults.
  window.AspirePrivacy = { analyticsAllowed: () => !window[disabledKey], open: () => {} };
  apply(readChoice());
  function initialise() {
    const panel = document.getElementById('analytics-choice');
    const settings = document.querySelectorAll('.privacy-settings');
    if (!panel) return;
    panel.hidden = true;
    function open() {
      previousFocus = document.activeElement; panel.hidden = false;
      panel.querySelector('[data-consent]')?.focus();
    }
    window.AspirePrivacy.open = open;
    settings.forEach(button => { button.hidden = false; button.addEventListener('click', open); });
    panel.addEventListener('click', event => {
      const button = event.target.closest?.('[data-consent]');
      if (!button || !panel.contains(button) || !valid(button.dataset.consent)) return;
      const value = button.dataset.consent;
      try { localStorage.setItem(key, value); } catch { /* Apply in this tab even without persistent storage. */ }
      apply(value); panel.hidden = true;
      const target = previousFocus || document.querySelector('h1');
      if (target) {
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
      previousFocus = null;
    });
    window.addEventListener('storage', event => {
      if (event.key === key || event.key === null) {
        apply(event.key === null ? null : event.newValue); panel.hidden = true;
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialise, { once: true });
  else initialise();
})();
