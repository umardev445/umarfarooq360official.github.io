(function () {
  'use strict';
  if (window.AspirePrivacy) return;
  const key = 'aspirecompass_analytics_choice_v1';
  const measurementId = 'G-54C36SGS3Z';
  const disabledKey = 'ga-disable-' + measurementId;
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
    window.gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    window.gtag('js', new Date());
    window.gtag('config', measurementId, { allow_google_signals: false, allow_ad_personalization_signals: false });
    const script = document.createElement('script');
    script.id = 'aspire-analytics'; script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
    document.head.appendChild(script);
  }
  function apply(value) {
    current = valid(value) ? value : null;
    window[disabledKey] = current !== 'yes';
    if (current === 'yes') {
      if (started) window.gtag?.('consent', 'update', { analytics_storage: 'granted' });
      else startAnalytics();
    } else {
      if (started) window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
      clearAnalyticsCookies();
    }
  }
  window.AspirePrivacy = { analyticsAllowed: () => current === 'yes', open: () => {} };
  function initialise() {
    const panel = document.getElementById('analytics-choice');
    const settings = document.querySelectorAll('.privacy-settings');
    apply(readChoice());
    if (!panel) return;
    panel.hidden = valid(current);
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
        apply(event.key === null ? null : event.newValue); panel.hidden = valid(current);
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialise, { once: true });
  else initialise();
})();
