/* Unseen Advisory: vanilla JS, no dependencies.
   Everything here is an enhancement. The page reads fully with JS off. */
(function () {
  'use strict';

  /* ------------------------------------------------------------
     Contact form endpoint.
     The live site's form never sent anything: it showed an alert
     and opened Calendly. Set FORM_ENDPOINT to a real POST target
     (Formspree, Web3Forms, a Vercel function) and the form posts
     there as JSON. Left empty, it falls back to the live behaviour
     minus the alert: an inline confirmation with the Calendly link.
     ------------------------------------------------------------ */
  var FORM_ENDPOINT = '';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Nav: hairline once the page has moved */
  var nav = $('#nav');
  var onScroll = function () { nav.classList.toggle('is-scrolled', window.scrollY > 8); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Burger menu */
  var burger = $('.burger');
  var menu = $('#mobmenu');
  var setMenu = function (open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('data-open', String(open));
    document.body.classList.toggle('menu-open', open);
  };
  burger.addEventListener('click', function () {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') setMenu(false);
  });

  /* Scroll reveal: opacity and 8px, once. Content is visible by
     default (html.js gates the hidden state), so a JS failure or a
     mid-page scroll restore never leaves a section blank. */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    reveals.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight) el.classList.add('is-in'); else io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* Tier CTAs pre-select their service in the form */
  var select = $('#f-service');
  $$('[data-service]').forEach(function (a) {
    a.addEventListener('click', function () {
      var wanted = a.getAttribute('data-service');
      $$('option', select).some(function (o) {
        if (o.textContent === wanted) { select.value = o.value || o.textContent; return true; }
        return false;
      });
    });
  });

  /* Contact form */
  var form = $('#contactForm');
  var error = $('.form__error', form);
  var showError = function (msg) { error.textContent = msg; error.hidden = false; };
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    error.hidden = true;
    var name = $('#f-name').value.trim();
    var email = $('#f-email').value.trim();
    if (!name) { showError('Please add your name.'); $('#f-name').focus(); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { showError('Please add a valid email address.'); $('#f-email').focus(); return; }
    if (form.elements._gotcha && form.elements._gotcha.value) { form.setAttribute('data-sent', 'true'); return; }

    var payload = {
      name: name,
      email: email,
      service: select.value,
      message: $('#f-message').value.trim(),
      _subject: 'Unseen Advisory enquiry from ' + name
    };
    var done = function () { form.setAttribute('data-sent', 'true'); $('.form__done', form).focus(); };

    /* No endpoint means nothing is delivered, so never promise a reply. */
    if (!FORM_ENDPOINT) { done(); return; }
    $('.form__done-sent', form).hidden = false;
    $('.form__done-alt', form).hidden = true;

    var btn = $('.form__submit', form);
    btn.disabled = true;
    fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) {
      if (!r.ok) throw new Error('bad status ' + r.status);
      done();
    }).catch(function () {
      showError('That did not send. Please email directly or book a call below.');
    }).finally(function () { btn.disabled = false; });
  });
})();
