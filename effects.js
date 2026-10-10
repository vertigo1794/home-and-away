// Home & Away: Apple-style effects layer. Numbers (#1–#28) match the idea list.
// Loaded BEFORE main.js: it reshapes headings/stats before main.js sets up reveals and count-ups,
// and creates its pinned sections before main.js sorts + refreshes ScrollTrigger.
(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const G = !!(window.gsap && window.ScrollTrigger);
  const motion = G && !RM;
  if (G) gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.toggle('fx-motion', motion);

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const LOGO = { renly: 'assets/renly-logo-mark.png', flight: 'assets/skysaver-logo-mark.png' };
  const appOf = (phone) => phone.dataset.app || (phone.classList.contains('metal-flight') ? 'flight' : 'renly');
  const onceVisible = (el, fn, threshold = 0.4) =>
    new IntersectionObserver(([e], o) => { if (e.isIntersecting) { o.disconnect(); fn(); } }, { threshold }).observe(el);
  const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');

  // Big phones (sticky showcase + Explore) get a back face and a live Dynamic Island.
  const bigPhones = $$('.phone--tall, #explore-phone');

  // #1 #13 Back of the phone: camera bump + app logo
  bigPhones.forEach((p) => {
    p.classList.add('phone--3d');
    p.insertAdjacentHTML('beforeend', `<div class="phone-back" aria-hidden="true"><span class="cam"></span><img src="${LOGO[appOf(p)]}" alt=""></div>`);
  });

  // #15 Live Dynamic Island: expands with a notification while the phone is on screen
  const ISLAND = {
    renly: [['3 new buyer matches', 'Taman Desa Residence'], ['Nurul A.', 'Saturday 11am works for me'], ['Viewing booked', 'Sat, 11:00 AM']],
    flight: [['Price drop · RM 189', 'KUL → SIN, 24 Oct'], ['Seat 14A confirmed', 'AK703 · Window'], ['Gate changed to L4', 'Boarding 07:50']],
  };
  bigPhones.forEach((p) => {
    const screen = $('.screen', p);
    screen.classList.add('has-island');
    const isl = document.createElement('div');
    isl.className = 'island';
    isl.setAttribute('aria-hidden', 'true');
    isl.innerHTML = '<span class="island-ico"><img alt=""></span><span class="island-text"><b></b><small></small></span>';
    screen.append(isl);
    if (RM) return;
    let n = 0, timer;
    const show = () => {
      const app = appOf(p), [title, sub] = ISLAND[app][n++ % 3];
      isl.dataset.app = app;
      $('img', isl).src = LOGO[app];
      $('b', isl).textContent = title;
      $('small', isl).textContent = sub;
      isl.classList.add('is-open');
      setTimeout(() => isl.classList.remove('is-open'), 2800);
    };
    new IntersectionObserver(([e]) => {
      clearInterval(timer);
      if (e.isIntersecting) { setTimeout(show, 900); timer = setInterval(show, 5600); }
    }, { threshold: 0.5 }).observe(p);
  });

  // #16 Notifications that drop onto the sticky phone while you read the features
  const NOTIF = {
    renly: [['3 new buyer matches', 'Taman Desa Residence', 'now'], ['Nurul A.', 'Saturday 11am works for me.', '2m'], ['Viewing booked', 'Sat, 11:00 AM', '5m']],
    flight: [['Price drop alert', 'KUL → SIN now RM 189', 'now'], ['Seat 14A confirmed', 'AK703 · Window seat', '3m'], ['Gate changed', 'Now boarding at L4', '8m']],
  };
  $$('.showcase').forEach((sc) => {
    const app = sc.id === 'flight' ? 'flight' : 'renly';
    $('.showcase-phone', sc).insertAdjacentHTML('beforeend', `<div class="notif-stack" aria-hidden="true">${NOTIF[app]
      .map(([t, s, w]) => `<div class="notif" data-app="${app}"><span class="notif-ico"><img src="${LOGO[app]}" alt=""></span><span class="notif-body"><b>${t}</b><span>${s}</span></span><time>${w}</time></div>`)
      .join('')}</div>`);
  });

  // #20 Split-flap airport board ("KUL > SIN": letters scramble, then settle)
  const AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  $$('.solari').forEach((el) => {
    el.textContent = '';
    const flaps = [...el.dataset.text.replace(/ /g, '')].map((ch) => {
      const f = document.createElement('span');
      const letter = /[A-Z0-9]/.test(ch);
      f.className = letter ? 'flap' : 'flap flap--gap';
      f.textContent = ch === '>' ? '✈' : ch;
      f.setAttribute('aria-hidden', 'true');
      el.append(f);
      return { f, ch, letter };
    });
    if (RM) return;
    let running = false;
    const run = () => {
      if (running) return;
      running = true;
      let left = flaps.filter((x) => x.letter).length;
      flaps.forEach(({ f, ch, letter }, i) => {
        if (!letter) return;
        let k = 0;
        const max = 8 + i * 3;
        const t = setInterval(() => {
          f.textContent = ++k >= max ? ch : AZ[(Math.random() * 26) | 0];
          if (k >= max) { clearInterval(t); if (--left === 0) running = false; }
        }, 55);
      });
    };
    onceVisible(el, run, 0.6);
    el.addEventListener('mouseenter', run);
  });

  // #21 Flip-board digits for the four stats (replaces main.js's count-up for these)
  $$('.stat-num [data-count]').forEach((span) => {
    const target = span.dataset.count;
    span.removeAttribute('data-count');
    span.setAttribute('aria-label', target);
    span.parentElement.classList.add('has-reels');
    span.innerHTML = [...target].map((d) =>
      `<span class="digit" aria-hidden="true"><span class="digit-col" data-d="${d}">${'01234567890123456789'.replace(/./g, '<span>$&</span>')}</span></span>`).join('');
    const cols = $$('.digit-col', span);
    const roll = () => cols.forEach((c, i) => {
      c.style.transitionDelay = `${i * 0.12}s`;
      c.style.transform = `translateY(${-(+c.dataset.d + 10)}em)`;
    });
    if (RM) roll(); else onceVisible(span, roll, 0.6);
  });

  // #22 Headings rise word by word from behind a mask (takes over from main.js's fade-up)
  $$('.section-title, .bento-heading, .app-tagline').forEach((h) => {
    h.classList.remove('reveal');
    h.classList.add('mask-words');
    h.innerHTML = h.textContent.trim().split(/\s+/).map((w) => `<span class="w"><span>${esc(w)}</span></span>`).join(' ');
  });

  // #17 Interactive seat map
  const seatmap = $('.seatmap');
  if (seatmap) {
    const taken = new Set(['12B', '12E', '13A', '13F', '14C', '15B', '15D']);
    seatmap.innerHTML = [12, 13, 14, 15].map((row) => ['A', 'B', 'C', 'D', 'E', 'F'].map((c, i) =>
      `${i === 3 ? `<span class="seat-aisle" aria-hidden="true">${row}</span>` : ''}<button class="seat" aria-pressed="false" aria-label="Seat ${row}${c}${taken.has(row + c) ? ', taken' : ''}" data-seat="${row}${c}"${taken.has(row + c) ? ' disabled' : ''}></button>`).join('')).join('');
    seatmap.addEventListener('click', (e) => {
      const b = e.target.closest('.seat');
      if (!b || b.disabled) return;
      $$('.seat', seatmap).forEach((s) => s.setAttribute('aria-pressed', s === b));
      $('.seat-pick').textContent = `Seat ${b.dataset.seat} selected`;
    });
  }

  // #18 Boarding pass flips on click / tap
  $$('.pass').forEach((p) => p.addEventListener('click', () => {
    p.setAttribute('aria-pressed', p.classList.toggle('is-flipped'));
  }));

  // #6 Drag-to-compare split
  $$('.split').forEach((sp) => {
    const range = $('input', sp);
    const set = (v) => { range.value = v; sp.style.setProperty('--x', `${v}%`); };
    range.addEventListener('input', () => set(range.value));
    set(50);
    if (motion) onceVisible(sp, () => {   // a little sweep to show it's draggable
      const o = { v: 82 };
      gsap.to(o, { v: 50, duration: 1.6, ease: 'elastic.out(1, .55)', onUpdate: () => set(Math.round(o.v)) });
    }, 0.5);
  });

  // #10 Apple Intelligence glow + Explore tab → back logo / island app
  const ephone = $('#explore-phone');
  const ewrap = $('.explore-phone-wrap');
  if (ephone) {
    $$('.explore-item').forEach((it) => it.addEventListener('click', () => ewrap.classList.toggle('is-ai', it.hasAttribute('data-ai'))));
    $$('.segmented [role="tab"]').forEach((t) => t.addEventListener('click', () => {
      ewrap.classList.remove('is-ai');
      ephone.dataset.app = t.dataset.app;
      $('.phone-back img', ephone).src = LOGO[t.dataset.app];
    }));
  }

  // #13 Drag the Explore phone to spin it in 3D; it springs back to the front
  if (ephone && G && !RM) {
    let sx = null, sy = 0, ry = 0;
    gsap.set(ephone, { transformPerspective: 1200 });
    ewrap.addEventListener('pointerdown', (e) => {
      sx = e.clientX; sy = e.clientY;
      ewrap.setPointerCapture(e.pointerId);
      ewrap.classList.add('is-dragging');
      gsap.killTweensOf(ephone);
    });
    ewrap.addEventListener('pointermove', (e) => {
      if (sx === null) return;
      ry = (e.clientX - sx) * 0.6;
      gsap.set(ephone, { rotationY: ry, rotationX: gsap.utils.clamp(-25, 25, -(e.clientY - sy) * 0.25) });
    });
    const release = () => {
      if (sx === null) return;
      sx = null;
      ewrap.classList.remove('is-dragging');
      gsap.to(ephone, {
        rotationY: Math.round(ry / 360) * 360, rotationX: 0, duration: 1.4, ease: 'elastic.out(1, .5)',
        onComplete: () => gsap.set(ephone, { rotationY: 0 }),
      });
    };
    ewrap.addEventListener('pointerup', release);
    ewrap.addEventListener('pointercancel', release);
  }

  // #25 Team cards play the maker's film on hover (muted)
  if (FINE && !RM) $$('.member').forEach((m) => {
    const v = $('.member-film', m);
    m.addEventListener('mouseenter', () => v.play().then(() => v.classList.add('is-ready')).catch(() => {}));
    m.addEventListener('mouseleave', () => { v.pause(); v.classList.remove('is-ready'); });
  });

  // #3 "Built to move.": the film plays inside the letters (white text multiplied over the video).
  const mask = $('.masktext');
  if (mask) {
    const v = $('video', mask);
    // The film opens on a black "Introducing" card, which would make the letters black: skip it (and on every loop)
    const SKIP = 0.8;
    const skipIntro = () => { if (v.currentTime < SKIP) v.currentTime = SKIP; };
    v.addEventListener('loadedmetadata', skipIntro);
    v.addEventListener('timeupdate', skipIntro);
    // Play while on screen, pause off screen. Re-checked on every scroll / load step / tap, so a play() the
    // browser refused once (not loaded yet, autoplay blocked until a gesture) is simply tried again.
    let warming = false;
    const sync = () => {
      if (RM) return;
      const r = mask.getBoundingClientRect();
      const on = r.bottom > 0 && r.top < innerHeight;
      if (on && v.paused) v.play().catch(() => {});
      else if (!on && !v.paused && !warming) v.pause();
    };
    new IntersectionObserver(sync).observe(mask);
    ['scroll', 'pointerdown', 'touchstart', 'keydown'].forEach((t) => addEventListener(t, sync, { passive: true }));
    v.addEventListener('canplay', sync);
    // Warm the decoder once at load (play, then pause off screen): starting it cold mid-scroll made a hitch around About
    v.addEventListener('canplay', () => {
      if (RM || !v.paused) return;
      warming = true;
      v.play().catch(() => {}).finally(() => { warming = false; sync(); });
    }, { once: true });
    sync();
  }

  // #5 Frame sequence: lazy-load the 63 frames, draw the one that matches the scroll
  const seq = $('.seq');
  const FRAMES = 63;
  const frames = [];
  const seqCanvas = seq && $('canvas', seq);
  const ctx = seqCanvas && seqCanvas.getContext('2d');
  // Phones get a portrait 4:5 canvas; frames are drawn "cover" (centre crop) so either shape stays full.
  if (seqCanvas && innerWidth <= 820) { seqCanvas.width = 600; seqCanvas.height = 750; }
  const drawFrame = (i) => {
    const im = frames[i];
    if (!im || !im.complete || !im.naturalWidth) return;
    const W = seqCanvas.width, H = seqCanvas.height;
    const s = Math.max(W / im.naturalWidth, H / im.naturalHeight);
    const sw = W / s, sh = H / s;
    ctx.drawImage(im, (im.naturalWidth - sw) / 2, (im.naturalHeight - sh) / 2, sw, sh, 0, 0, W, H);
  };
  if (seq) {
    const first = motion ? 0 : FRAMES - 1;
    new IntersectionObserver(([e], o) => {
      if (!e.isIntersecting) return;
      o.disconnect();
      for (let i = 0; i < FRAMES; i++) {
        const im = new Image();
        im.src = `assets/seq/f${String(i + 1).padStart(3, '0')}.jpg`;
        if (i === first) im.onload = () => drawFrame(first);
        frames.push(im);
      }
    }, { rootMargin: '1500px 0px' }).observe(seq);
  }

  // #28 Ambient light: sample the playing film's colour (falls back to brand colours,
  // e.g. on file:// where the browser won't let a canvas read the video's pixels)
  const filmPin = $('.film-pin');
  if (filmPin && !RM) {
    const preset = ['rgba(198, 242, 26, .45)', 'rgba(201, 163, 92, .4)'];   // Renly lime, Sky Saver gold
    const vids = $$('.film-slide video');
    const track = $('#film-track');
    const c = document.createElement('canvas');
    c.width = c.height = 8;
    const cx = c.getContext('2d', { willReadFrequently: true });
    let visible = false;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(filmPin);
    setInterval(() => {
      if (!visible) return;
      const idx = Math.abs(parseFloat((/(-?\d+)%/.exec(track.style.transform) || [0, 0])[1])) / 100 || 0;
      const v = vids[idx];
      let col = preset[idx] || preset[0];
      if (v && !v.paused && v.readyState >= 2) {
        try {
          cx.drawImage(v, 0, 0, 8, 8);
          const d = cx.getImageData(0, 0, 8, 8).data;
          let r = 0, g = 0, b = 0;
          for (let k = 0; k < d.length; k += 4) { r += d[k]; g += d[k + 1]; b += d[k + 2]; }
          const n = d.length / 4;
          col = `rgba(${(r / n) | 0}, ${(g / n) | 0}, ${(b / n) | 0}, .55)`;
        } catch { /* tainted canvas: keep the preset */ }
      }
      filmPin.style.setProperty('--amb', col);
    }, 400);
  }

  // #24 Scroll progress ring
  const ringFill = $('.progress-ring-fill');
  const ring = () => {
    const h = document.documentElement;
    if (ringFill) ringFill.style.setProperty('--p', Math.min(1, scrollY / Math.max(1, h.scrollHeight - innerHeight)).toFixed(4));
  };
  addEventListener('scroll', ring, { passive: true });
  addEventListener('resize', ring);
  ring();

  // #12 #8 #27 #14 Pointer effects (mouse / trackpad only)
  if (FINE && !RM) {
    const spot = document.createElement('div');
    spot.className = 'spotlight';
    const lens = document.createElement('div');
    lens.className = 'glass-lens';
    const tag = document.createElement('div');
    tag.className = 'cursor-tag';
    [spot, lens, tag].forEach((el) => { el.setAttribute('aria-hidden', 'true'); document.body.append(el); });

    addEventListener('pointermove', (e) => {
      const { clientX: x, clientY: y, target } = e;
      spot.style.setProperty('--mx', `${x}px`);
      spot.style.setProperty('--my', `${y}px`);
      lens.style.transform = tag.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      lens.classList.toggle('is-on', !!target.closest('.bento-grid'));
      const t = target.closest('[data-cursor]');
      if (t) {
        tag.textContent = t.classList.contains('film-frame') && $('.film-slide.is-playing') ? 'Pause' : t.dataset.cursor;
        tag.classList.add('is-on');
      } else tag.classList.remove('is-on');
    }, { passive: true });

    // #14 Magnetic buttons
    $$('.btn, .film-play, .reel-btn').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        b.style.translate = `${(e.clientX - r.left - r.width / 2) * 0.25}px ${(e.clientY - r.top - r.height / 2) * 0.35}px`;
      });
      b.addEventListener('pointerleave', () => { b.style.translate = ''; });
    });
  }

  // #26 Easter egg: Konami code, or click the intro icon 5 times → a plane flies across
  const flyby = () => {
    if (!G || RM || $('.flyby')) return;
    document.body.insertAdjacentHTML('beforeend', '<svg class="flyby" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-plane"/></svg>');
    const p = $('.flyby'), W = innerWidth, H = innerHeight;
    gsap.timeline({ onComplete: () => p.remove() })
      .set(p, { x: -100, y: H * 0.8, rotation: 50, scale: 0.6 })
      .to(p, { keyframes: [
        { x: W * 0.3, y: H * 0.4, rotation: 60, scale: 1.1, duration: 0.9 },
        { x: W * 0.65, y: H * 0.3, rotation: 80, duration: 0.8 },
        { x: W + 140, y: H * 0.05, rotation: 60, scale: 0.7, duration: 0.9 },
      ], ease: 'power1.inOut' });
  };
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let kpos = 0;
  addEventListener('keydown', (e) => {
    kpos = e.key === KONAMI[kpos] ? kpos + 1 : e.key === KONAMI[0] ? 1 : 0;
    if (kpos === KONAMI.length) { kpos = 0; flyby(); }
  });
  let clicks = 0, clickTimer;
  $('#intro-icon')?.addEventListener('click', () => {
    clearTimeout(clickTimer);
    clickTimer = setTimeout(() => { clicks = 0; }, 1500);
    if (++clicks >= 5) { clicks = 0; flyby(); }
  });

  // Ways to get it: QR codes drawn from each card's download link (they follow the link if it changes)
  if (window.qrcode) $$('.qr[data-url]').forEach((el) => {
    const qr = qrcode(0, 'M');
    qr.addData(el.dataset.url);
    qr.make();
    el.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  });

  // Watch the film: full-screen player that plays both films back to back
  const dialog = $('#film-dialog');
  if (dialog) {
    const player = $('video', dialog), now = $('.film-dialog-now', dialog);
    const FILMS = $$('.film-slide video').map((v, i) => ({ src: v.getAttribute('src'), poster: v.getAttribute('poster'), name: i ? 'Sky Saver' : 'Renly' }));
    let i = 0;
    const load = (n) => {
      i = n;
      Object.assign(player, { src: FILMS[i].src, poster: FILMS[i].poster });
      now.textContent = `${FILMS[i].name} · ${i + 1} of ${FILMS.length}`;
      player.play().catch(() => {});
    };
    $('.watch-film')?.addEventListener('click', () => {
      $$('video').forEach((v) => { if (v !== player) v.pause(); });   // nothing else keeps playing behind it
      dialog.showModal();
      load(0);
    });
    player.addEventListener('ended', () => { if (i < FILMS.length - 1) load(i + 1); else dialog.close(); });
    $('.film-dialog-close', dialog).addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => { player.pause(); player.removeAttribute('src'); player.load(); });
  }

  if (!motion) return;   // everything below is scroll-driven animation

  // #22 Word mask rise
  $$('.mask-words').forEach((h) => gsap.from($$('.w > span', h), {
    yPercent: 115, duration: 1, ease: 'power4.out', stagger: 0.06,
    scrollTrigger: { trigger: h, start: 'top 88%', once: true },
  }));

  // Pinned scenes. refreshPriority follows page order (intro in main.js is 20) so each pin
  // is measured after the pins above it have added their spacing.
  const originAt = (el, fx, fy) => `${el.offsetLeft + el.offsetWidth * fx}px ${el.offsetTop + el.offsetHeight * fy}px`;

  // #3 Film inside the letters, then dive into the hole of the "o": the black fades while we pass through, opening onto the film
  if (mask) {
    const p = $('.mt-words', mask), text = $('text', p);
    const setOrigin = () => {   // centre of the o's counter ("Builtto move." -> index 6)
      const o = text.getExtentOfChar(6);
      gsap.set(p, { smoothOrigin: false, svgOrigin: `${o.x + o.width * 0.5} ${o.y + o.height * 0.6}` });
    };
    setOrigin();
    ScrollTrigger.addEventListener('refreshInit', setOrigin);
    gsap.timeline({ scrollTrigger: { trigger: mask, start: 'top top', end: '+=130%', scrub: true, pin: true, refreshPriority: 9 } })
      .to(p, { scale: 30, ease: 'power2.in', duration: 1 }, 0)
      .to($('.masktext-ink', mask), { autoAlpha: 0, ease: 'power1.in', duration: 0.3 }, 0.6);   // autoAlpha: hidden once faded, so the huge mask stops being drawn
  }

  // #2 Zoom through the stem of the "R" until Renly's cream fills the screen
  const zword = $('.zoomthru-word');
  if (zword) {
    const r = $('.zoomthru-o');
    const setOrigin = () => gsap.set(zword, { transformOrigin: originAt(r, 0.14, 0.72) })   // middle of the R's stem, below its bowl;
    setOrigin();
    ScrollTrigger.addEventListener('refreshInit', setOrigin);
    // the word is already on screen as the section scrolls in, so the pin is all zoom (no blank screen)
    const small = () => innerWidth <= 820;   // on phones the stage is a shorter card, pinned in the middle of the screen
    gsap.timeline({ scrollTrigger: { trigger: '.zoomthru', start: () => (small() ? 'center center' : 'top top'), end: '+=110%', scrub: true, pin: true, refreshPriority: 8, invalidateOnRefresh: true } })
      .to('.zoomthru-sub', { opacity: 0, y: 20, duration: 0.15 }, 0)
      .to(zword, { scale: 80, ease: 'power3.in', duration: 1 }, 0)
      .to('.zoomthru-stage', { autoAlpha: 0, duration: 0.05 }, 0.95);   // reveal Renly, already sitting underneath
  }

  // Desktop-only scroll choreography
  gsap.matchMedia().add('(min-width: 821px)', () => {
    // #1 Sticky phones turn a full 360° as they arrive, landing screen-first
    $$('.showcase').forEach((sc) => {
      gsap.fromTo($('.showcase-phone .phone', sc), { rotationY: -360 }, {
        rotationY: 0, transformPerspective: 1400, ease: 'none',
        scrollTrigger: { trigger: $('.showcase-body', sc), start: 'top bottom', end: 'top 10%', scrub: true },
      });
    });

    // #16 Notifications stack up while the features scroll past, then clear away
    $$('.showcase').forEach((sc) => {
      const cards = $$('.notif', sc);
      gsap.set(cards, { y: -30, opacity: 0, scale: 0.92 });
      const tl = gsap.timeline({ scrollTrigger: { trigger: $('.features', sc), start: 'top 35%', end: 'bottom 65%', scrub: true } });
      cards.forEach((c, i) => tl.to(c, { y: 0, opacity: 1, scale: 1, duration: 0.15 }, i * 0.28));
      tl.to(cards, { y: -24, opacity: 0, duration: 0.1, stagger: 0.03 }, 0.9);
    });

    // #4 Vertical scroll becomes a sideways pan through Renly's screens
    const hs = $('.hscroll'), tr = $('.hscroll-track');
    if (hs) {
      hs.classList.add('is-pinned');
      const dist = () => Math.max(0, tr.scrollWidth - innerWidth);
      gsap.to(tr, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: hs, start: 'top 100px', end: () => `+=${dist()}`, scrub: true, pin: true, refreshPriority: 7.5, invalidateOnRefresh: true },
      });
      return () => { hs.classList.remove('is-pinned'); };
    }
  });

  // #23 Navy curtain rises over Renly and brings Sky Saver in
  if ($('.curtain')) {
    // navy card widens to full screen while the section scrolls in (never blank), title rises, short pin holds it
    gsap.timeline({ scrollTrigger: { trigger: '.curtain', start: 'top bottom', end: 'top top', scrub: true } })
      .fromTo('.curtain-panel', { clipPath: 'inset(0% 7% 0% 7% round 48px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', duration: 1 })   // visible card that widens to full bleed
      .from('.curtain-logo, .curtain-word, .curtain-sub', { y: 90, opacity: 0, stagger: 0.06, duration: 0.35 }, 0.55);
    ScrollTrigger.create({ trigger: '.curtain', start: 'top top', end: '+=45%', pin: true, refreshPriority: 7 });
  }

  // #5 Scrub the film's opening frame by frame
  if (seq) {
    const st = { f: 0 };
    gsap.timeline({ scrollTrigger: { trigger: seq, start: 'top top', end: '+=180%', scrub: 0.4, pin: true, refreshPriority: 6 } })
      .to(st, { f: FRAMES - 1, ease: 'none', duration: 1, onUpdate: () => drawFrame(Math.round(st.f)) })
      .fromTo('.seq-caption', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.15 }, 0.85);
  }
})();
