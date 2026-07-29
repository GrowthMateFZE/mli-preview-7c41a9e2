/* Relationship Medicine™ — site behaviour
   Vanilla JS, no dependencies. Progressive enhancement: every page is
   readable and navigable with JS disabled. */
(function () {
  'use strict';

  /* ---------------------------------------------------------------- config */
  // Where form submissions go. Leave empty until the client's ESP / CRM is
  // chosen — with no endpoint, submissions fall back to an email handoff so a
  // real enquiry is never silently swallowed.
  var CONFIG = window.MLI_CONFIG || {};
  var FORM_ENDPOINT = CONFIG.formEndpoint || '';
  var CONTACT_EMAIL = CONFIG.contactEmail || 'hello@myloveintelligence.com';

  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  /* ------------------------------------------------------------ mobile nav */
  function initNav() {
    var toggle = $('.nav-toggle');
    var drawer = $('.mobile-nav');
    if (!toggle || !drawer) return;

    function setOpen(open) {
      drawer.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('nav-open', open);
      drawer.setAttribute('aria-hidden', String(!open));
    }

    toggle.addEventListener('click', function () {
      setOpen(!drawer.classList.contains('is-open'));
    });

    var close = $('.mobile-nav__close', drawer);
    if (close) close.addEventListener('click', function () { setOpen(false); });

    $$('a', drawer).forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });

    // Reset if the viewport grows past the mobile breakpoint.
    var mq = window.matchMedia('(min-width: 861px)');
    var onChange = function (e) { if (e.matches) setOpen(false); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);

    setOpen(false);
  }

  /* --------------------------------------------------------- sticky header */
  function initHeader() {
    var header = $('.site-header');
    if (!header) return;
    var tick = function () {
      header.classList.toggle('is-stuck', window.scrollY > 8);
    };
    tick();
    window.addEventListener('scroll', tick, { passive: true });
  }

  /* --------------------------------------------------------- scroll reveal */
  function initReveal() {
    var items = $$('.reveal');
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------------ FAQ */
  function initFaq() {
    var items = $$('.faq__item');
    if (!items.length) return;

    items.forEach(function (item) {
      var btn    = $('.faq__q', item);
      var answer = $('.faq__a', item);
      var mark   = $('.faq__mark', item);
      if (!btn || !answer) return;

      btn.addEventListener('click', function () {
        var isOpen = btn.getAttribute('aria-expanded') === 'true';

        // Accordion: close the others.
        items.forEach(function (other) {
          if (other === item) return;
          var ob = $('.faq__q', other), oa = $('.faq__a', other), om = $('.faq__mark', other);
          if (ob) ob.setAttribute('aria-expanded', 'false');
          if (oa) oa.hidden = true;
          if (om) om.textContent = '+';
        });

        btn.setAttribute('aria-expanded', String(!isOpen));
        answer.hidden = isOpen;
        if (mark) mark.textContent = isOpen ? '+' : '−';
      });
    });
  }

  /* ------------------------------------------------------- form submission */
  function serialize(form) {
    var data = {};
    $$('input, textarea, select', form).forEach(function (f) {
      if (!f.name || f.type === 'submit') return;
      data[f.name] = f.value;
    });
    return data;
  }

  function mailtoHandoff(data, subject) {
    var lines = Object.keys(data).map(function (k) {
      return k.replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }) +
             ': ' + data[k];
    });
    return 'mailto:' + CONTACT_EMAIL +
           '?subject=' + encodeURIComponent(subject) +
           '&body=' + encodeURIComponent(lines.join('\n'));
  }

  /* Sends a payload. Resolves true on delivery, false if it must be handed
     off to the visitor's mail client. */
  function deliver(data, subject) {
    if (!FORM_ENDPOINT) {
      // No backend wired yet — hand off to email rather than pretend it sent.
      window.location.href = mailtoHandoff(data, subject);
      return Promise.resolve(false);
    }
    return fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (res) {
      if (!res.ok) throw new Error('Bad response ' + res.status);
      return true;
    });
  }

  function showError(form, msg) {
    var err = $('.form-error', form.parentNode) || $('.form-error', form);
    if (err) {
      err.textContent = msg;
      err.hidden = false;
    }
  }

  /* Any element with [data-form] gets: validate → deliver → swap in success. */
  function initForms() {
    $$('[data-form]').forEach(function (form) {
      var kind      = form.getAttribute('data-form');
      var successEl = document.getElementById(form.getAttribute('data-success'));
      var subject   = form.getAttribute('data-subject') || 'Website enquiry';
      var btn       = $('button[type="submit"], .js-submit', form);

      form.addEventListener('submit', function (e) {
        e.preventDefault();

        var data = serialize(form);
        var email = data.email || '';
        var name  = data.name;

        if (!email.trim() || email.indexOf('@') === -1) {
          showError(form, 'Please enter a valid email address.');
          var emailField = $('input[type="email"]', form);
          if (emailField) emailField.focus();
          return;
        }
        if (kind === 'contact' && name !== undefined && !String(name).trim()) {
          showError(form, 'Please tell us your name.');
          return;
        }

        var errEl = $('.form-error', form) || $('.form-error', form.parentNode);
        if (errEl) errEl.hidden = true;

        var original = btn ? btn.textContent : '';
        if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

        deliver(data, subject)
          .then(function () {
            if (successEl) {
              form.hidden = true;
              successEl.hidden = false;
              successEl.setAttribute('tabindex', '-1');
              successEl.focus();
            }
          })
          .catch(function () {
            showError(form, 'Something went wrong. Please email ' + CONTACT_EMAIL + '.');
          })
          .then(function () {
            if (btn) { btn.disabled = false; btn.textContent = original; }
          });
      });
    });
  }

  /* ------------------------------------------------------------- shop cart */
  function initShop() {
    var buttons = $$('[data-add-to-basket]');
    if (!buttons.length) return;

    var pill  = $('[data-basket-pill]');
    var count = $('[data-basket-count]');
    var n = 0;
    var toast, timer;

    function render() {
      if (pill)  pill.hidden = n === 0;
      if (count) count.textContent = String(n);
    }

    function showToast() {
      clearTimeout(timer);
      if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        toast.setAttribute('role', 'status');
        document.body.appendChild(toast);
      }
      toast.textContent = 'Added to your basket · ' + n + (n === 1 ? ' item' : ' items');
      toast.hidden = false;
      timer = setTimeout(function () { if (toast) toast.hidden = true; }, 2200);
    }

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        n += 1;
        render();
        showToast();
      });
    });

    render();
  }

  /* ------------------------------------------------------------------ init */
  function init() {
    initNav();
    initHeader();
    initReveal();
    initFaq();
    initForms();
    initShop();

    // Stamp the current year anywhere it's needed.
    $$('[data-year]').forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
