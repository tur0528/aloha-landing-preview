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

  var waFloat = $('.wa-float');
  if (waFloat && 'IntersectionObserver' in window) {
    var visible = new Set();
    var fo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) visible.add(en.target); else visible.delete(en.target); });
      waFloat.classList.toggle('is-hidden', visible.size > 0);
    }, { threshold: 0, rootMargin: '0px 0px 96px 0px' });
    ['.hero', '#apply', '.site-footer'].forEach(function (s) { var el = $(s); if (el) fo.observe(el); });
  }

  /* ---------- ticker ---------- */
  if (!reduceMotion) {
    $$('.ticker-track').forEach(function (t) {
      var g = $('.ticker-group', t); if (!g) return;
      for (var k = 0; k < 2; k++) { var c = g.cloneNode(true); c.setAttribute('aria-hidden', 'true'); t.appendChild(c); }
    });
  }

  /* ---------- gallery ---------- */
  var grid = $('#gallery-grid');
  (window.GALLERY || []).forEach(function (item) {
    var fig = document.createElement('figure');
    fig.className = 'g-item' + (item.wide ? ' g-wide' : '');
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'g-open';
    btn.setAttribute('aria-label', 'הגדלה: ' + (item.alt || ''));
    if (item.type === 'video') {
      btn.innerHTML = '<img loading="lazy" decoding="async" src="' + item.poster + '" alt="' + (item.alt || '') + '" width="' + item.width + '" height="' + item.height + '">' +
        '<span class="g-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg></span>';
    } else {
      btn.innerHTML = '<picture><source type="image/webp" srcset="' + (item.small ? item.small + ' 640w, ' : '') + item.webp + ' ' + item.width + 'w" sizes="(min-width: 900px) 30vw, 46vw">' +
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
  function closeLightbox() { if (lb && lb.open) lb.close(); }
  if (lb) {
    $('.lb-close', lb).addEventListener('click', closeLightbox);
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
    lb.addEventListener('close', function () { lbBody.innerHTML = ''; });
  }

  /* ---------- videos ----------
     One audible video at a time.
     Craft tries unmuted play when it enters the viewport (and again on a later
     user gesture). If the browser blocks that, it stays muted and the visible
     control reads "הפעל סאונד". Clips with data-audio="no" never claim sound.
  */
  var audible = null;
  var locking = false;

  function videoOf(btn) {
    var id = btn && btn.getAttribute('aria-controls');
    return id ? document.getElementById(id) : null;
  }
  function hasAudio(v) { return v && v.getAttribute('data-audio') === 'yes'; }
  function setPlayUi(v) {
    $$('.js-play').forEach(function (btn) {
      if (videoOf(btn) !== v) return;
      var paused = v.paused;
      btn.textContent = paused ? 'נגן' : 'השהה';
      btn.setAttribute('aria-pressed', paused ? 'false' : 'true');
    });
  }
  function setSoundUi(v, on) {
    $$('.js-sound').forEach(function (btn) {
      if (videoOf(btn) !== v) return;
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.textContent = on ? 'כבה סאונד' : 'הפעל סאונד';
    });
  }
  function silenceOthers(current) {
    if (locking) return;
    locking = true;
    $$('video').forEach(function (v) {
      if (v === current) return;
      if (!v.muted) v.muted = true;
      if (hasAudio(v)) setSoundUi(v, false);
    });
    if (audible && audible !== current) audible = null;
    locking = false;
  }
  function mostlyVisible(v) {
    var r = v.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
    return visible > Math.min(r.height, vh) * 0.35;
  }
  function playMuted(v) {
    if (v.dataset.userPaused === '1') return;
    v.muted = true;
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
    if (hasAudio(v)) setSoundUi(v, false);
  }
  /* Best-effort unmute. On failure, muted playback + "הפעל סאונד". */
  function requestAudible(v) {
    if (!hasAudio(v) || v.dataset.soundPref === 'off' || v.dataset.userPaused === '1') return;
    audible = v;
    silenceOthers(v);
    v.muted = false;
    var p = v.play();
    var fallback = function () {
      if (v.dataset.userPaused === '1') { setSoundUi(v, !v.muted && !v.paused); return; }
      playMuted(v);
      if (audible === v) audible = null;
    };
    var ok = function () {
      if (v.dataset.userPaused === '1') return;
      if (v.muted || v.paused) { fallback(); return; }
      audible = v;
      v.dataset.soundUnlocked = '1';
      setSoundUi(v, true);
      setPlayUi(v);
    };
    if (p && p.then) p.then(ok).catch(fallback);
    else ok();
  }

  $$('.js-play').forEach(function (btn) {
    var v = videoOf(btn);
    if (!v) return;
    btn.addEventListener('click', function () {
      if (v.paused) {
        v.dataset.userPaused = '0';
        var p = v.play();
        if (p && p.catch) p.catch(function () {});
      } else {
        v.pause();
        v.dataset.userPaused = '1';
      }
      setPlayUi(v);
    });
    v.addEventListener('play', function () { setPlayUi(v); });
    v.addEventListener('pause', function () { setPlayUi(v); });
    setPlayUi(v);
  });

  $$('.js-sound').forEach(function (btn) {
    var v = videoOf(btn);
    if (!v || !hasAudio(v)) { btn.hidden = true; return; }
    btn.addEventListener('click', function () {
      if (v.muted) {
        v.dataset.soundPref = 'on';
        v.dataset.userPaused = '0';
        requestAudible(v);
      } else {
        v.dataset.soundPref = 'off';
        v.muted = true;
        if (audible === v) audible = null;
        setSoundUi(v, false);
      }
    });
    v.addEventListener('volumechange', function () {
      if (locking) return;
      if (!v.muted) {
        silenceOthers(v);
        audible = v;
        setSoundUi(v, true);
      } else if (audible === v) {
        audible = null;
        setSoundUi(v, false);
      }
    });
  });

  var loops = $$('.js-loop-video');
  if (reduceMotion) {
    loops.forEach(function (v) {
      v.removeAttribute('autoplay');
      v.pause();
      setPlayUi(v);
    });
  } else if ('IntersectionObserver' in window) {
    var vo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (v.dataset.userPaused === '1') return;
        if (en.isIntersecting) {
          if (hasAudio(v) && v.dataset.soundPref !== 'off' && !audible) requestAudible(v);
          else { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        } else {
          v.pause();
          if (audible === v) {
            v.muted = true;
            audible = null;
            setSoundUi(v, false);
          }
        }
      });
    }, { threshold: 0.35 });
    loops.forEach(function (v) { vo.observe(v); });
  }

  /* A real user gesture can unlock sound the autoplay attempt could not. */
  function unlockFromGesture(e) {
    if (e.target.closest && e.target.closest('.js-sound, .js-kiosk-play, .js-play, a, button, input, textarea, select, label')) return;
    var ids = ['team-boat', 'craft-resin'];
    for (var i = 0; i < ids.length; i++) {
      var v = document.getElementById(ids[i]);
      if (!v || !hasAudio(v)) continue;
      if (v.dataset.soundPref === 'off' || v.dataset.soundUnlocked === '1' || v.dataset.userPaused === '1') continue;
      if (!mostlyVisible(v)) continue;
      requestAudible(v);
      return;
    }
  }
  document.addEventListener('pointerdown', unlockFromGesture);

  $$('.js-click-video').forEach(function (v) {
    var screen = v.parentElement;
    var btn = $('.js-kiosk-play', screen);
    if (!btn) return;
    function start() {
      screen.parentElement.classList.add('is-playing');
      v.controls = true;
      v.dataset.userPaused = '0';
      if (hasAudio(v)) requestAudible(v);
      else { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    }
    btn.addEventListener('click', start);
    v.addEventListener('ended', function () {
      screen.parentElement.classList.remove('is-playing');
      v.controls = false;
      if (audible === v) audible = null;
    });
    v.addEventListener('volumechange', function () {
      if (locking) return;
      if (!v.muted) {
        silenceOthers(v);
        audible = v;
      } else if (audible === v) audible = null;
    });
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
