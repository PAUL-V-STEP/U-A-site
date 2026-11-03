/* ============================================================
   УНИВЕРСАЛ-АЭРО · «ПЕРРОН»
   main.js — прогрессивное улучшение (ES2020, IIFE, без зависимостей)
   ============================================================ */
(function () {
  'use strict';

  /* Если сайт выложат на хостинг — укажите адрес обработчика форм
     (POST multipart/form-data). Пустая строка = отправка письма через mailto: */
  var FORM_ENDPOINT = '';
  var FORM_EMAIL = 'universal@asvt.ru';

  var docEl = document.documentElement;
  docEl.classList.remove('no-js');
  docEl.classList.add('js-anim');

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- Шапка: прячется при скролле вниз ---------- */
  (function () {
    var header = $('.site-header');
    if (!header) return;
    var lastY = 0, hidden = false;
    window.addEventListener('scroll', function () {
      var y = window.scrollY || 0;
      if (document.getElementById('menu-check') && document.getElementById('menu-check').checked) return;
      if (y > lastY && y > 140 && !hidden) { header.classList.add('is-hidden'); hidden = true; }
      else if ((y < lastY || y < 140) && hidden) { header.classList.remove('is-hidden'); hidden = false; }
      lastY = y;
    }, { passive: true });
  })();

  /* ---------- Мобильное меню: фокус-ловушка, Esc ---------- */
  (function () {
    var check = document.getElementById('menu-check');
    var menu = $('.mobile-menu');
    var btn = $('.menu-btn');
    if (!check || !menu || !btn) return;
    function onKey(e) {
      if (!check.checked) return;
      if (e.key === 'Escape') { check.checked = false; btn.focus(); return; }
      if (e.key !== 'Tab') return;
      var f = $$('a[href]', menu).filter(function (el) { return el.offsetParent !== null; });
      if (f.indexOf(btn) !== -1) { /* nothing */ }
      if (e.target === menu || f.indexOf(e.target) === -1) return;
      if (!e.shiftKey && e.target === f[f.length - 1]) { e.preventDefault(); btn.focus(); }
      if (e.shiftKey && document.activeElement === btn) { e.preventDefault(); f[f.length - 1].focus(); }
    }
    check.addEventListener('change', function () {
      btn.setAttribute('aria-expanded', check.checked ? 'true' : 'false');
      document.body.style.overflow = check.checked ? 'hidden' : '';
      if (check.checked) { var first = $('a[href]', menu); if (first) first.focus(); }
    });
    document.addEventListener('keydown', onKey);
    $$('a[href]', menu).forEach(function (a) {
      a.addEventListener('click', function () { check.checked = false; document.body.style.overflow = ''; });
    });
  })();

  /* ---------- Появление секций ---------- */
  (function () {
    if (!('IntersectionObserver' in window) || prefersReduced.matches) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  })();

  /* ---------- Линия руления ---------- */
  (function () {
    var svg = $('.taxi-svg');
    if (!svg) return;
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', 'taxi-path');
    svg.appendChild(path);
    var R = 36; // радиус скругления

    function pts() {
      var box = svg.parentElement.getBoundingClientRect();
      var isDesk = window.innerWidth >= 1024;
      var x = isDesk ? Math.round(box.width * 0.10) : 28;
      return $$('.stand-marker', svg.parentElement).map(function (m) {
        var r = m.getBoundingClientRect();
        return { x: x, y: Math.round(r.top - box.top + r.height / 2) };
      });
    }
    function build() {
      var box = svg.parentElement.getBoundingClientRect();
      svg.setAttribute('viewBox', '0 0 ' + Math.round(box.width) + ' ' + Math.round(box.height));
      var points = pts();
      if (points.length < 2) return;
      var d = 'M ' + points[0].x + ' 0';
      for (var i = 0; i < points.length; i++) {
        var p = points[i];
        var half = Math.min((points[Math.min(i + 1, points.length - 1)].y - p.y) / 2, R * 1.2);
        d += ' L ' + p.x + ' ' + (p.y - half);
        d += ' A ' + R + ' ' + R + ' 0 0 ' + (i % 2 === 0 ? 1 : 0) + ' ' + (p.x + (i % 2 === 0 ? R : -R)) + ' ' + p.y;
        d += ' L ' + points[i].x + ' ' + p.y;
      }
      var lastY = points[points.length - 1].y;
      d += ' L ' + points[points.length - 1].x + ' ' + Math.min(box.height, lastY + 160);
      path.setAttribute('d', d);
      var len = path.getTotalLength();
      path.style.strokeDasharray = len;
      if (prefersReduced.matches) { path.style.strokeDashoffset = 0; return; }
      path.style.strokeDashoffset = len;
      update(len);
    }
    function update(len) {
      if (len == null) len = path.getTotalLength();
      var box = svg.parentElement.getBoundingClientRect();
      var vh = window.innerHeight;
      var progress = Math.min(1, Math.max(0, (vh * 0.75 - box.top) / (box.height - vh * 0.25)));
      path.style.strokeDashoffset = String(len * (1 - progress));
      $$('.taxi-marker', svg).forEach(function (mk) {
        var y = parseFloat(mk.getAttribute('data-y') || 0);
        var yNow = len * progress;
        mk.style.opacity = yNow >= y - 10 ? '1' : '0';
      });
    }
    var raf = null;
    function onScroll() { if (prefersReduced.matches) return; if (raf) return; raf = requestAnimationFrame(function () { raf = null; update(); }); }
    function onResize() { build(); }
    build();
    // маркеры стоянок
    $$('.stand-marker', svg.parentElement).forEach(function (m) {
      var box = svg.parentElement.getBoundingClientRect();
      var r = m.getBoundingClientRect();
      var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      var x = window.innerWidth >= 1024 ? Math.round(box.width * 0.10) : 28;
      c.setAttribute('class', 'taxi-marker');
      c.setAttribute('r', '8');
      c.setAttribute('cx', x);
      c.setAttribute('cy', Math.round(r.top - box.top + r.height / 2));
      c.setAttribute('data-y', Math.round(r.top - box.top + r.height / 2));
      c.style.opacity = prefersReduced.matches ? '1' : '0';
      c.style.transition = 'opacity 300ms var(--ease-out)';
      svg.appendChild(c);
    });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize);
    window.addEventListener('load', onResize);
  })();

  /* ---------- Split-flap цифры ---------- */
  (function () {
    var CH = '0123456789';
    function spin(el, final, dur) {
      if (prefersReduced.matches) { el.textContent = final; return; }
      var t0 = null;
      function tick(t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / dur);
        if (p >= 1) { el.textContent = final; return; }
        if (final === ' ' || final === '+' || final === '–') { el.textContent = final; requestAnimationFrame(tick); return; }
        el.textContent = final === '-' ? '-' : CH[Math.floor(Math.random() * 10) % 10];
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
    $$('.stat-num[data-flip]').forEach(function (num) {
      var value = num.getAttribute('data-flip');
      var cells = [];
      num.innerHTML = '';
      value.split('').forEach(function (ch) {
        var cell = document.createElement('span');
        cell.className = 'sf';
        cell.innerHTML = '<span class="cur">' + (prefersReduced.matches ? ch : '0') + '</span>';
        num.appendChild(cell);
        cells.push({ cell: cell, value: ch });
      });
      var run = function () {
        cells.forEach(function (c, i) {
          var cur = c.cell.querySelector('.cur');
          setTimeout(function () { spin(cur, c.value, 700 + i * 60); }, i * 40);
        });
      };
      if (prefersReduced.matches || !('IntersectionObserver' in window)) { run(); return; }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { run(); io.disconnect(); } });
      }, { threshold: 0.4 });
      io.observe(num);
    });
  })();

  /* ---------- Табло: превью при наведении (предзагрузка) ---------- */
  (function () {
    $$('.dep-row .dep-preview').forEach(function (img) { img.loading = 'lazy'; });
  })();

  /* ---------- Каталог: фильтры, поиск, сортировка ---------- */
  (function () {
    var list = $('[data-filter-list]');
    if (!list) return;
    var chips = $$('.chip[data-tag]');
    var search = $('.search-input');
    var sortSel = $('[data-sort]');
    var rows = $$('[data-tags]', list);
    function apply() {
      var active = chips.filter(function (c) { return c.getAttribute('aria-pressed') === 'true'; })
        .map(function (c) { return c.getAttribute('data-tag'); });
      var q = (search && search.value || '').trim().toLowerCase();
      rows.forEach(function (row) {
        var tags = (row.getAttribute('data-tags') || '').split(' ');
        var text = (row.getAttribute('data-search') || row.textContent).toLowerCase();
        var okTags = !active.length || active.some(function (t) { return tags.indexOf(t) !== -1; });
        var okQuery = !q || text.indexOf(q) !== -1;
        row.hidden = !(okTags && okQuery);
      });
      // сортировка
      if (sortSel) {
        var mode = sortSel.value;
        var sorted = rows.slice().sort(function (a, b) {
          if (mode === 'order') return (+a.getAttribute('data-order') || 0) - (+b.getAttribute('data-order') || 0);
          var key = mode === 'model' ? 'data-model' : 'data-name';
          var av = a.getAttribute(key) || '', bv = b.getAttribute(key) || '';
          return av.localeCompare(bv, 'ru');
        });
        sorted.forEach(function (r) { list.appendChild(r); });
      }
      var note = $('[data-filter-empty]');
      if (note) note.hidden = rows.some(function (r) { return !r.hidden; });
    }
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
        apply();
      });
    });
    if (search) search.addEventListener('input', apply);
    if (sortSel) sortSel.addEventListener('change', apply);
  })();

  /* ---------- Горизонтальный «перрон»: клавиатура ---------- */
  (function () {
    $$('.rail').forEach(function (rail) {
      rail.tabIndex = 0;
      rail.addEventListener('keydown', function (e) {
        var step = rail.clientWidth * 0.6;
        if (e.key === 'ArrowRight') { rail.scrollBy({ left: step, behavior: 'smooth' }); e.preventDefault(); }
        if (e.key === 'ArrowLeft') { rail.scrollBy({ left: -step, behavior: 'smooth' }); e.preventDefault(); }
        if (e.key === 'Home') { rail.scrollTo({ left: 0, behavior: 'smooth' }); e.preventDefault(); }
        if (e.key === 'End') { rail.scrollTo({ left: rail.scrollWidth, behavior: 'smooth' }); e.preventDefault(); }
      });
    });
  })();

  /* ---------- Переключатель «Фото / Чертёж» ---------- */
  (function () {
    $$('.bp-toggle').forEach(function (tg) {
      var scope = tg.closest('[data-bp-scope]') || document;
      tg.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-mode]');
        if (!btn) return;
        $$('button[data-mode]', tg).forEach(function (b) {
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        var mode = btn.getAttribute('data-mode');
        $$('.img-photo', scope).forEach(function (im) { im.style.opacity = mode === 'blueprint' ? '0' : ''; });
        $$('.img-blueprint', scope).forEach(function (im) { im.style.opacity = mode === 'blueprint' ? '1' : ''; });
        $$('[data-bp-frame]', scope).forEach(function (fr) {
          fr.classList.toggle('blueprint-grid', mode === 'blueprint');
        });
      });
    });
  })();

  /* ---------- Лайтбокс (галереи и документы) ---------- */
  (function () {
    var dlg = $('#lightbox');
    if (!dlg) return;
    var img = $('.lightbox img', dlg);
    var cap = $('.lightbox__cap', dlg);
    var prev = $('.lightbox__btn--prev', dlg);
    var next = $('.lightbox__btn--next', dlg);
    var items = [], idx = 0, lastFocus = null;
    function open(list, i) {
      items = list; idx = i; lastFocus = document.activeElement;
      set();
      if (!dlg.open) dlg.showModal();
      $$('.lightbox__btn--close', dlg).forEach(function (b) { b.focus(); });
    }
    function set() {
      var it = items[idx];
      img.src = it.full || it.thumb;
      img.alt = it.alt || '';
      if (it.fullset) img.srcset = it.fullset || '';
      cap.textContent = it.caption || '';
      var multi = items.length > 1;
      prev.hidden = !multi; next.hidden = !multi;
    }
    function close() { dlg.close(); if (lastFocus) lastFocus.focus(); }
    function step(d) { idx = (idx + d + items.length) % items.length; set(); }
    $$('[data-lb-full]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var grp = a.getAttribute('data-lb-group') || '';
        var group = grp ? $$('[data-lb-group="' + grp + '"]') : [a];
        var list = group.map(function (el) {
          return { full: el.getAttribute('data-lb-full'), fullset: el.getAttribute('data-lb-fullset'), alt: el.getAttribute('data-lb-alt') || '', caption: el.getAttribute('data-lb-caption') || '', thumb: el.href };
        });
        open(list, group.indexOf(a));
      });
    });
    $$('.lightbox__btn--close', dlg).forEach(function (b) { b.addEventListener('click', close); });
    prev && prev.addEventListener('click', function () { step(-1); });
    next && next.addEventListener('click', function () { step(1); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
    document.addEventListener('keydown', function (e) {
      if (!dlg.open) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    });
  })();

  /* ---------- Курсор-прицел над медиа ---------- */
  (function () {
    if (prefersReduced.matches || !window.matchMedia('(pointer: fine)').matches) return;
    var sight = document.createElement('div');
    sight.className = 'cursor-sight mono';
    sight.setAttribute('aria-hidden', 'true');
    sight.style.cssText = 'position:fixed;z-index:90;pointer-events:none;display:none;left:0;top:0;font-size:11px;letter-spacing:.08em;color:#FFC72C;mix-blend-mode:difference;';
    sight.innerHTML = '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M14 0v28M0 14h28"/><circle cx="14" cy="14" r="6"/></svg><span class="cs-xy" style="position:absolute;left:34px;top:4px;white-space:nowrap"></span>';
    document.body.appendChild(sight);
    var xy = sight.querySelector('.cs-xy');
    var zones = $$('.plate__media, .rail-card__media, .gallery a, .case__media');
    if (!zones.length) return;
    zones.forEach(function (z) {
      z.addEventListener('mouseenter', function () { sight.style.display = 'block'; });
      z.addEventListener('mouseleave', function () { sight.style.display = 'none'; });
      z.addEventListener('mousemove', function (e) {
        sight.style.transform = 'translate(' + (e.clientX + 14) + 'px,' + (e.clientY - 40) + 'px)';
        xy.textContent = 'X:' + String(e.clientX).padStart(4, '0') + ' Y:' + String(e.clientY).padStart(4, '0');
      });
    });
  })();

  /* ---------- Видео: пауза в hero + кастомный плеер ---------- */
  (function () {
    var heroBtn = $('.hero-pause');
    var heroVideo = $('.hero-media video');
    if (heroBtn && heroVideo) {
      heroBtn.addEventListener('click', function () {
        var playing = !heroVideo.paused;
        if (playing) heroVideo.pause(); else heroVideo.play();
        heroBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
        $('.hero-pause .vp-i-play', heroBtn.parentNode) && 0;
        var pi = heroBtn.querySelector('.vp-i-play'), pa = heroBtn.querySelector('.vp-i-pause');
        heroBtn.querySelector('.hero-pause__text').textContent = playing ? 'Воспроизвести' : 'Пауза';
        if (pi && pa) { pi.style.display = playing ? '' : 'none'; pa.style.display = playing ? 'none' : ''; }
      });
    }
    $$('.video-player').forEach(function (vp) {
      var v = vp.querySelector('video');
      var overlay = vp.querySelector('.vp-overlay');
      var playBtn = vp.querySelector('.vp-play');
      var btn = vp.querySelector('.vp-btn');
      var track = vp.querySelector('.vp-track');
      var fill = vp.querySelector('.vp-fill');
      var time = vp.querySelector('.vp-time');
      if (!v) return;
      function fmt(s) {
        s = Math.max(0, Math.floor(s || 0));
        return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
      }
      function sync() {
        v.paused ? vp.classList.remove('is-playing') : vp.classList.add('is-playing');
      }
      function toggle() { v.paused ? v.play() : v.pause(); }
      overlay && overlay.addEventListener('click', function () { if (v.paused) v.play(); });
      playBtn && playBtn.addEventListener('click', toggle);
      btn && btn.addEventListener('click', toggle);
      v.addEventListener('play', sync);
      v.addEventListener('pause', sync);
      v.addEventListener('timeupdate', function () {
        if (fill && v.duration) fill.style.width = (v.currentTime / v.duration * 100) + '%';
        if (time) time.textContent = fmt(v.currentTime) + ' / ' + fmt(v.duration);
        if (track && v.duration) {
          track.setAttribute('aria-valuenow', String(Math.round(v.currentTime / v.duration * 100)));
          track.setAttribute('aria-valuetext', fmt(v.currentTime));
        }
      });
      v.addEventListener('loadedmetadata', function () { if (time) time.textContent = '00:00 / ' + fmt(v.duration); });
      track && track.addEventListener('click', function (e) {
        var r = track.getBoundingClientRect();
        v.currentTime = (e.clientX - r.left) / r.width * (v.duration || 0);
      });
      track && track.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { v.currentTime = Math.min((v.duration || 0), v.currentTime + 5); e.preventDefault(); }
        if (e.key === 'ArrowLeft') { v.currentTime = Math.max(0, v.currentTime - 5); e.preventDefault(); }
      });
      sync();
    });
    // Hero: на мобильных подменяем источники на лёгкую версию, при reduced motion — только постер
    if (heroVideo) {
      var mq = window.matchMedia('(max-width: 768px)');
      if (mq.matches) {
        var mp4 = heroVideo.querySelector('source[type="video/mp4"]');
        if (mp4) {
          mp4.src = 'assets/video/hero-loop-mobile.mp4';
          heroVideo.querySelectorAll('source[type="video/webm"]').forEach(function (s) { s.remove(); });
          heroVideo.load();
        }
      }
      if (prefersReduced.matches) { heroVideo.removeAttribute('autoplay'); heroVideo.pause(); }
    }
  })();

  /* ---------- Копирование (контакты, заявки) ---------- */
  function copyText(text, done) {
    if (navigator.clipboard && window.isSecureContext !== false) {
      navigator.clipboard.writeText(text).then(done, function () { legacy(); });
    } else { legacy(); }
    function legacy() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) { /* ничего */ }
      document.body.removeChild(ta);
      done();
    }
  }
  (function () {
    $$('.copy-btn[data-copy]').forEach(function (btn) {
      var orig = btn.querySelector('.copy-btn__text');
      var label = orig ? orig.textContent : btn.textContent;
      btn.addEventListener('click', function () {
        copyText(btn.getAttribute('data-copy'), function () {
          if (orig) { orig.textContent = 'Скопировано'; setTimeout(function () { orig.textContent = label; }, 1800); }
        });
      });
    });
  })();

  /* ---------- Формы: проверка + mailto/endpoint ---------- */
  (function () {
    function val(form, name) {
      var f = form.elements[name];
      return f ? String(f.value || '').trim() : '';
    }
    function err(field, msg) {
      var box = field.closest('.field, .check');
      if (!box) return;
      box.classList.add('is-error');
      var e = box.querySelector('.field__err');
      if (e && msg) e.textContent = msg;
    }
    function clearErrs(form) {
      $$('.is-error', form).forEach(function (b) { b.classList.remove('is-error'); });
    }
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    function maskPhone(input) {
      input.addEventListener('input', function () {
        var d = input.value.replace(/\D/g, '');
        if (d.charAt(0) === '8') d = '7' + d.slice(1);
        if (d.charAt(0) !== '7') d = '7' + d;
        d = d.slice(0, 11);
        var out = '+7';
        if (d.length > 1) out += ' (' + d.slice(1, 4);
        if (d.length >= 4) out += ') ' + d.slice(4, 7);
        if (d.length >= 7) out += '-' + d.slice(7, 9);
        if (d.length >= 9) out += '-' + d.slice(9, 11);
        input.value = out === '+7' ? '' : out;
      });
    }
    $$('input[data-phone]').forEach(maskPhone);

    $$('form[data-form]').forEach(function (form) {
      var kind = form.getAttribute('data-form');
      var success = $('.form-success[data-success-for="' + form.id + '"]') || $('.form-success', form.parentElement);
      var product = form.getAttribute('data-product') || '';

      // тема и тело письма
      function build() {
        var name = val(form, 'name');
        var company = val(form, 'company');
        var phone = val(form, 'phone');
        var email = val(form, 'email');
        var msg = val(form, 'message');
        var subject, lines = [];
        if (kind === 'tender') subject = '[Тендер] ' + (company || 'Компания') + ' — ' + (name || 'контакт');
        else if (kind === 'quote') subject = '[КП] ' + (product || msg.slice(0, 60) || 'Запрос коммерческого предложения');
        else if (kind === 'callback') subject = '[Обратный звонок] ' + (phone || name);
        else subject = '[Консультация] ' + (name || phone || 'заявка с сайта');
        if (company) lines.push('Компания: ' + company);
        if (name) lines.push('Контактное лицо: ' + name);
        if (phone) lines.push('Телефон: ' + phone);
        if (email) lines.push('E-mail: ' + email);
        if (product) lines.push('Модель: ' + product);
        if (msg) lines.push('', msg);
        if (kind === 'tender') lines.push('', '(приложите файл тендерной документации к письму)');
        return { subject: subject, body: lines.join('\r\n') };
      }
      function validate() {
        clearErrs(form);
        var ok = true;
        $$('[required]', form).forEach(function (f) {
          if (f.type === 'checkbox') {
            if (!f.checked) { err(f, 'Необходимо согласие на обработку персональных данных'); ok = false; }
            return;
          }
          if (!String(f.value || '').trim()) { err(f, 'Заполните поле'); ok = false; }
          else if (f.type === 'email' && !emailRe.test(f.value)) { err(f, 'Введите корректный e-mail'); ok = false; }
          else if (f.hasAttribute('data-phone') && f.value.replace(/\D/g, '').length < 11) { err(f, 'Введите телефон полностью'); ok = false; }
        });
        return ok;
      }

      form.addEventListener('submit', function (e) {
        if (form.getAttribute('data-form-native') === 'true') return; // режим без JS
        if (!validate()) {
          e.preventDefault();
          var bad = form.querySelector('.is-error input, .is-error textarea');
          if (bad) bad.focus();
          return;
        }
        if (FORM_ENDPOINT) {
          e.preventDefault();
          var btn = form.querySelector('[type="submit"]');
          var fd = new FormData(form);
          fd.append('_kind', kind);
          if (product) fd.append('_product', product);
          if (btn) { btn.disabled = true; }
          fetch(FORM_ENDPOINT, { method: 'POST', body: fd })
            .then(function (r) { if (!r.ok) throw new Error('net'); done(); })
            .catch(function () {
              var errBox = $('.form-ajax-error', form);
              if (errBox) errBox.hidden = false;
            })
            .finally(function () { if (btn) btn.disabled = false; });
          return;
        }
        e.preventDefault();
        done();
      });

      function done() {
        var data = build();
        var mailto = 'mailto:' + FORM_EMAIL +
          '?subject=' + encodeURIComponent(data.subject) +
          '&body=' + encodeURIComponent(data.body);
        if (success) {
          var subjEl = success.querySelector('[data-mail-subject]');
          var bodyEl = success.querySelector('[data-mail-body]');
          if (subjEl) subjEl.textContent = data.subject;
          if (bodyEl) bodyEl.textContent = data.body;
          var copyBtn = success.querySelector('.copy-btn');
          if (copyBtn) copyBtn.setAttribute('data-copy', 'Тема: ' + data.subject + '\r\n\r\n' + data.body);
          form.hidden = true;
          success.classList.add('is-on');
          success.setAttribute('tabindex', '-1');
          success.focus();
        }
        window.location.href = mailto;
      }
    });
  })();

})();
