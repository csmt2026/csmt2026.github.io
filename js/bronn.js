/* Unseen Advisory, Bronn build: vanilla JS, no dependencies.
   Everything here is an enhancement. The page reads fully with JS off. */
(function () {
  'use strict';

  /* Contact form endpoint. Empty means nothing is delivered, so the
     sent state points people to Calendly and never promises a reply.
     Set a POST target (Formspree, Web3Forms, a Vercel function) to wire it. */
  var FORM_ENDPOINT = 'https://unseen-advisory.vercel.app/api/contact';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Nav: transparent over the hero, solid once the hero has gone */
  var nav = $('#nav');
  var hero = $('.hero');
  var onScroll = function () {
    var limit = hero ? hero.offsetHeight - nav.offsetHeight - 8 : 8;
    nav.classList.toggle('is-solid', window.scrollY > limit);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  /* Burger menu */
  var burger = $('.burger');
  var menu = $('#mobmenu');
  var setMenu = function (open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('data-open', String(open));
    document.body.classList.toggle('menu-open', open);
  };
  burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') setMenu(false);
  });

  /* Reveal: Bronn's 30px rise, once. Visible by default without JS. */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    reveals.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-in'); else io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* Ticker: duplicate-free loop already in markup; pause when off screen */
  var ticker = $('.ticker__track');
  if (ticker && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      ticker.style.animationPlayState = en[0].isIntersecting ? 'running' : 'paused';
    }).observe(ticker);
  }

  /* Tier links pre-select their service in the form. Where the anchor would leave that field below the
     fold (phones), its scroll is retargeted to centre the field, so the visitor sees the choice carried
     over. The link still navigates to #contact as normal; the field is not focused, so no picker opens. */
  var select = $('#f-service');
  var contact = $('#contact');
  $$('[data-service]').forEach(function (a) {
    a.addEventListener('click', function () {
      var wanted = a.getAttribute('data-service');
      $$('option', select).some(function (o) {
        if (o.textContent === wanted) { select.value = o.value || o.textContent; return true; }
        return false;
      });
      var landsAt = select.getBoundingClientRect().bottom - contact.getBoundingClientRect().top + nav.offsetHeight;
      if (landsAt > window.innerHeight - 16) {
        setTimeout(function () { select.scrollIntoView({ block: 'center' }); }, 0);
      }
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

    var done = function () { form.setAttribute('data-sent', 'true'); $('.form__done', form).focus(); };
    if (!FORM_ENDPOINT) { done(); return; }
    $('.form__done-sent', form).hidden = false;
    $('.form__done-alt', form).hidden = true;

    var btn = $('.form__submit', form);
    btn.disabled = true;
    fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ name: name, email: email, service: select.value, message: $('#f-message').value.trim(), _subject: 'Unseen Advisory enquiry from ' + name })
    }).then(function (r) {
      if (!r.ok) throw new Error('bad status ' + r.status);
      done();
    }).catch(function () {
      showError('That did not send. Please book a call using the link below.');
    }).finally(function () { btn.disabled = false; });
  });
})();
