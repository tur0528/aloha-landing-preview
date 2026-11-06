(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- toast ---------- */
  var toastEl = $('#toast'), toastTimer;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 4200);
  }

  /* ---------- WhatsApp ---------- */
  function waNumber() { return String(window.WHATSAPP_NUMBER || '').replace(/\D/g, ''); }
  function waUrl(text) { return 'https://wa.me/' + waNumber() + '?text=' + encodeURIComponent(text); }
  $$('.js-wa-display').forEach(function (el) {
    el.textContent = window.WHATSAPP_DISPLAY || (waNumber() ? '+' + waNumber() : '');
  });
  $$('.js-whatsapp').forEach(function (a) {
    if (waNumber()) {
      a.href = waUrl(a.getAttribute('data-wa-text') || '');
      a.target = '_blank'; a.rel = 'noopener';
    } else {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        console.warn('[Aloha] WHATSAPP_NUMBER is empty. Set it in js/config.js');
        toast('מספר הוואטסאפ עוד לא הוגדר (TODO). בינתיים אפשר להשאיר פרטים בטופס.');
        var f = $('#apply'); if (f) f.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    }
  });

  /* ---------- hide floating WhatsApp while the apply section / footer is on screen ---------- */
  var waFloat = $('.wa-float');
  if (waFloat && 'IntersectionObserver' in window) {
    var visible = new Set();
    var fo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) visible.add(en.target); else visible.delete(en.target); });
      waFloat.classList.toggle('is-hidden', visible.size > 0);
    }, { threshold: 0.05 });
    ['#apply', '.site-footer'].forEach(function (s) { var el = $(s); if (el) fo.observe(el); });
  }

  /* ---------- ticker: duplicate the group for a seamless loop ---------- */
  $$('.ticker-track').forEach(function (t) {
    var g = $('.ticker-group', t); if (!g) return;
    for (var k = 0; k < 2; k++) { var c = g.cloneNode(true); c.setAttribute('aria-hidden', 'true'); t.appendChild(c); }
  });

  /* ---------- header state ---------- */
  var header = $('.site-header');
  function onScroll() { header.classList.toggle('is-solid', window.scrollY > 40); }
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- gallery ---------- */
  var grid = $('#gallery-grid');
  (window.GALLERY || []).forEach(function (item, i) {
    var fig = document.createElement('figure');
    fig.className = 'g-item reveal' + (item.wide ? ' g-wide' : '');
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'g-open';
    btn.setAttribute('aria-label', 'הגדלה: ' + (item.alt || ''));
    if (item.type === 'video') {
      btn.innerHTML = '<img loading="lazy" decoding="async" src="' + item.poster + '" alt="' + (item.alt || '') + '" width="' + item.width + '" height="' + item.height + '">' +
        '<span class="g-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg></span>';
    } else {
      btn.innerHTML = '<picture><source type="image/webp" srcset="' + (item.small ? item.small + ' 640w, ' : '') + item.webp + ' ' + item.width + 'w" sizes="(min-width: 900px) 40vw, 92vw">' +
        '<img loading="lazy" decoding="async" src="' + item.jpg + '" alt="' + (item.alt || '') + '" width="' + item.width + '" height="' + item.height + '"></picture>';
    }
    btn.addEventListener('click', function () { openLightbox(item); });
    fig.appendChild(btn); grid.appendChild(fig);
  });

  /* ---------- lightbox ---------- */
  var lb = $('#lightbox'), lbBody = $('#lb-body');
  function openLightbox(item) {
    if (!lb || typeof lb.showModal !== 'function') return;
    lbBody.innerHTML = item.type === 'video'
      ? '<video src="' + item.src + '" poster="' + item.poster + '" controls autoplay playsinline></video>'
      : '<picture><source type="image/webp" srcset="' + item.webp + '"><img src="' + item.jpg + '" alt="' + (item.alt || '') + '"></picture>';
    lb.showModal();
  }
  function closeLightbox() { lb.close(); }
  if (lb) {
    $('.lb-close', lb).addEventListener('click', closeLightbox);
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
    lb.addEventListener('close', function () { lbBody.innerHTML = ''; });
  }

  /* ---------- reveal on scroll ---------- */
  var reveals = $$('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    document.documentElement.classList.add('js-reveal');
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); ro.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { ro.observe(el); });
  }

  /* ---------- videos ---------- */
  var hero = $('.hero-video');
  if (hero && reduceMotion) { hero.removeAttribute('autoplay'); hero.pause(); }

  // muted loops: play only while visible (saves data/battery)
  var autos = $$('.js-auto-video');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var vo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else v.pause();
      });
    }, { threshold: 0.25 });
    autos.forEach(function (v) { vo.observe(v); });
  }

  // click-to-play with sound
  $$('.js-click-video').forEach(function (v) {
    var frame = v.parentElement, btn = $('.play-btn', frame);
    function start() {
      frame.classList.add('is-playing');
      v.controls = true; v.muted = false;
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    }
    btn.addEventListener('click', start);
    v.addEventListener('ended', function () { frame.classList.remove('is-playing'); v.controls = false; });
  });

  // family boat: tap to unmute (autoplay stays muted by browser policy)
  $$('.js-sound-video').forEach(function (v) {
    var wrap = v.closest('.craft-media, .family-media') || v.parentElement;
    var btn = $('.sound-btn', wrap);
    if (!btn) return;
    var label = $('.sound-label', btn);
    function setOn(on) {
      v.muted = !on;
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (label) label.textContent = on ? 'כבה סאונד' : 'הפעל סאונד';
      if (on) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    }
    btn.addEventListener('click', function () { setOn(v.muted); });
  });

  /* ---------- form ---------- */
  var form = $('#apply-form');
  if (!form) return;
  var status = $('#form-status');
  var startInput = $('#f-start');
  var today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  startInput.min = today.toISOString().slice(0, 10);

  var MSG = {
    name: 'נא למלא שם מלא',
    phone: 'נא למלא מספר טלפון תקין',
    age: 'גיל בין 18 ל-99',
    passport: 'נא לבחור כן או לא',
    start: 'נא לבחור תאריך מהיום והלאה'
  };
  function setErr(name, msg) {
    var el = $('#e-' + name);
    if (el) el.textContent = msg || '';
    var input = form.elements[name];
    var target = input && input.length && !input.tagName ? input[0].closest('fieldset') : input;
    if (target && target.setAttribute) {
      if (msg) target.setAttribute('aria-invalid', 'true'); else target.removeAttribute('aria-invalid');
    }
    return !msg;
  }
  var validators = {
    name: function () { return form.elements.name.value.trim().length >= 2 ? '' : MSG.name; },
    phone: function () {
      var d = form.elements.phone.value.replace(/[\s\-().]/g, '');
      return /^\+?\d{9,15}$/.test(d) ? '' : MSG.phone;
    },
    age: function () {
      var v = form.elements.age.value.trim(); if (!v) return '';
      var n = Number(v); return (n >= 18 && n <= 99) ? '' : MSG.age;
    },
    passport: function () { return form.elements.passport.value ? '' : MSG.passport; },
    start: function () {
      var v = startInput.value; return v && v >= startInput.min ? '' : MSG.start;
    }
  };
  function check(name) { return setErr(name, validators[name]()); }

  ['name', 'phone', 'age', 'start'].forEach(function (n) {
    var el = form.elements[n];
    el.addEventListener('blur', function () { if (el.value !== '' || el.dataset.touched) check(n); el.dataset.touched = '1'; });
    el.addEventListener('input', function () { if (el.getAttribute('aria-invalid')) check(n); });
  });
  $$('input[name="passport"]', form).forEach(function (r) {
    r.addEventListener('change', function () {
      check('passport');
      $('#passport-note').hidden = form.elements.passport.value !== 'no';
    });
  });

  function data() {
    return {
      name: form.elements.name.value.trim(),
      phone: form.elements.phone.value.trim(),
      age: form.elements.age.value.trim(),
      us_passport: form.elements.passport.value,
      us_work_eligible: form.elements.passport.value,
      start_date: startInput.value,
      message: form.elements.message.value.trim(),
      source: 'aloha-landing',
      submitted_at: new Date().toISOString()
    };
  }
  function waMessage(d) {
    return ['היי, אני רוצה להגיש מועמדות לעבודה בהוואי',
      'שם: ' + d.name, 'טלפון: ' + d.phone,
      d.age ? 'גיל: ' + d.age : null,
      'אפשרות עבודה בארה״ב: ' + (d.us_passport === 'yes' ? 'כן' : 'לא'),
      'אפשר להתחיל מ: ' + d.start_date,
      d.message ? 'קצת עליי: ' + d.message : null].filter(Boolean).join('\n');
  }
  function done(msg, ok) {
    status.textContent = msg; status.className = 'form-status ' + (ok ? 'is-ok' : 'is-warn');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var firstBad = null;
    Object.keys(validators).forEach(function (n) {
      if (!check(n) && !firstBad) firstBad = n;
    });
    if (firstBad) {
      var el = form.elements[firstBad]; (el.length && !el.tagName ? el[0] : el).focus();
      done('יש לתקן את השדות המסומנים', false);
      return;
    }
    var d = data();
    var endpoint = String(window.FORM_ENDPOINT || '').trim();
    var btn = $('button[type="submit"]', form);

    if (endpoint) {
      btn.disabled = true; btn.classList.add('is-loading'); done('שולחים...', true);
      fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); })
        .then(function () { form.reset(); $('#passport-note').hidden = true; done('תודה! קיבלנו את הפרטים ונחזור אליך בקרוב.', true); })
        .catch(function () { done('משהו השתבש בשליחה. אפשר לנסות שוב או לפנות בוואטסאפ.', false); })
        .then(function () { btn.disabled = false; btn.classList.remove('is-loading'); });
      return;
    }
    if (waNumber()) {
      window.open(waUrl(waMessage(d)), '_blank', 'noopener');
      done('נפתחה הודעת וואטסאפ עם הפרטים. נשאר רק ללחוץ שליחה.', true);
      return;
    }
    console.warn('[Aloha] FORM_ENDPOINT and WHATSAPP_NUMBER are both empty. Set one in js/config.js', d);
    done('הטופס עוד לא מחובר (TODO: FORM_ENDPOINT או WHATSAPP_NUMBER ב-js/config.js). הפרטים לא נשלחו.', false);
  });
})();
