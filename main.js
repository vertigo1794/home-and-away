// Smooth anchor scrolling (CSS scroll-behavior would break ScrollTrigger).
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
document.addEventListener('click', (e) => {
  const href = e.target.closest('a[href^="#"]')?.getAttribute('href');
  const target = href && href.length > 1 && document.querySelector(href);
  if (!target) return;
  e.preventDefault();
  if (window.lenis) lenis.scrollTo(target, { duration: 1.4 });
  else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
});

if (reduceMotion) document.querySelectorAll('video[autoplay]').forEach((v) => { v.removeAttribute('autoplay'); v.pause(); });

// Film: manual play; when a film ends it slides to the next one (and keeps playing if it has a film).
(() => {
  const track = document.getElementById('film-track');
  if (!track) return;
  const slides = [...track.querySelectorAll('.film-slide')];
  const dots = [...document.querySelectorAll('.film .reel-dot')];
  const playBtn = document.getElementById('film-play');
  const videoAt = (i) => slides[i].querySelector('video');
  let index = 0;

  const syncUI = () => {
    const v = videoAt(index);
    const playing = !!v && !v.paused;
    playBtn.classList.toggle('is-paused', !playing);
    playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    playBtn.disabled = !v;
    slides.forEach((sl) => { const sv = sl.querySelector('video'); sl.classList.toggle('is-playing', !!sv && !sv.paused); });
    dots.forEach((d, n) => { d.classList.toggle('is-active', n === index); d.setAttribute('aria-current', n === index); });
    document.getElementById('film-prev').disabled = index === 0;
    document.getElementById('film-next').disabled = index === slides.length - 1;
  };

  const go = (i, autoplay) => {
    const prev = videoAt(index);
    if (prev) prev.pause();
    index = Math.max(0, Math.min(slides.length - 1, i));
    track.style.transform = `translateX(${-100 * index}%)`;
    slides.forEach((sl, n) => sl.setAttribute('aria-hidden', n !== index));
    const v = videoAt(index);
    if (v && autoplay) { v.currentTime = 0; v.play().catch(() => {}); }
    syncUI();
  };

  slides.forEach((slide, n) => {
    const v = slide.querySelector('video');
    if (!v) return;
    slide.querySelector('.film-play').addEventListener('click', () => v.play().catch(() => {}));
    v.addEventListener('click', () => { v.paused ? v.play() : v.pause(); });
    v.addEventListener('play', syncUI);
    v.addEventListener('pause', syncUI);
    v.addEventListener('timeupdate', () => {
      if (v.duration) dots[n].firstElementChild.style.width = `${(v.currentTime / v.duration) * 100}%`;
    });
    v.addEventListener('ended', () => {
      dots[n].firstElementChild.style.width = '0';
      if (n < slides.length - 1) go(n + 1, true); else syncUI();
    });
  });

  const isPlaying = () => !!videoAt(index) && !videoAt(index).paused;
  dots.forEach((d, n) => d.addEventListener('click', () => go(n, isPlaying())));
  document.getElementById('film-prev').addEventListener('click', () => go(index - 1, isPlaying()));
  document.getElementById('film-next').addEventListener('click', () => go(index + 1, isPlaying()));
  playBtn.addEventListener('click', () => { const v = videoAt(index); if (v) v.paused ? v.play() : v.pause(); });

  // Swipe left/right on the film
  let startX = null;
  track.addEventListener('pointerdown', (e) => { startX = e.clientX; });
  track.addEventListener('pointerup', (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1), !!videoAt(index) && !videoAt(index).paused);
  });

  // Pause (no auto-resume: the film has sound) when it leaves the screen.
  new IntersectionObserver(([e]) => { if (!e.isIntersecting) { const v = videoAt(index); if (v) v.pause(); } }).observe(track);

  go(0, false);
})();

// Intro: build the icon grid, alternate the big icon, tilt it toward the pointer.
(() => {
  const intro = document.getElementById('intro');
  if (!intro) return;
  const glyphs = ['house', 'plane', 'pin', 'chat', 'ticket'];
  document.getElementById('intro-grid').innerHTML = Array.from({ length: 60 }, (_, i) =>
    `<div class="gicon"><svg><use href="#i-${glyphs[(i * 7) % glyphs.length]}"/></svg></div>`).join('');
  if (reduceMotion) return;
  setInterval(() => { intro.dataset.icon = intro.dataset.icon === 'renly' ? 'sky' : 'renly'; }, 2800);
  const icon = document.getElementById('intro-icon');
  intro.addEventListener('pointermove', (e) => {
    const r = intro.getBoundingClientRect();
    icon.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 24}deg`);
    icon.style.setProperty('--rx', `${((e.clientY - r.top) / r.height - 0.5) * -18}deg`);
  });
  intro.addEventListener('pointerleave', () => { icon.style.setProperty('--rx', '0deg'); icon.style.setProperty('--ry', '0deg'); });
})();

// Explore: app tabs, feature list (one open at a time), phone finish swatches.
(() => {
  const phone = document.getElementById('explore-phone');
  if (!phone) return;
  const img = document.getElementById('explore-img');
  const swatchName = document.getElementById('swatch-name');
  const tabs = [...document.querySelectorAll('.segmented [role="tab"]')];
  const swatches = [...document.querySelectorAll('.swatch')];

  const showScreen = (src) => {
    if (img.getAttribute('src') === src) return;
    img.style.opacity = 0;
    setTimeout(() => { img.src = src; img.style.opacity = 1; }, 250);
  };
  const setFinish = (sw) => {
    phone.classList.remove(...swatches.map((s) => s.dataset.metal));
    phone.classList.add(sw.dataset.metal);
    swatches.forEach((s) => s.setAttribute('aria-pressed', s === sw));
    swatchName.textContent = sw.dataset.name;
  };
  const openItem = (item) => {
    item.parentElement.querySelectorAll('.explore-item').forEach((el) => {
      el.classList.toggle('is-open', el === item);
      el.setAttribute('aria-expanded', el === item);
    });
    showScreen(item.dataset.screen);
  };

  document.querySelectorAll('.explore-item').forEach((item) => item.addEventListener('click', () => openItem(item)));
  swatches.forEach((sw) => sw.addEventListener('click', () => setFinish(sw)));
  tabs.forEach((tab) => tab.addEventListener('click', () => {
    tabs.forEach((t) => t.setAttribute('aria-selected', t === tab));
    document.querySelectorAll('.explore-group').forEach((g) => { g.hidden = g.dataset.app !== tab.dataset.app; });
    openItem(document.querySelector(`.explore-group[data-app="${tab.dataset.app}"] .explore-item`));
    setFinish(swatches.find((s) => s.dataset.metal === tab.dataset.metal));
  }));
})();

// Scene switching: page background + text colours follow whichever section crosses 55% of the viewport.
// Measured on every scroll (not per-trigger toggles) so big jumps and restored scroll positions stay correct.
(() => {
  const sections = [...document.querySelectorAll('[data-scene]:not(body)')];
  const update = () => {
    const line = innerHeight * 0.55;
    const hit = sections.find((el) => { const r = el.getBoundingClientRect(); return r.top <= line && r.bottom > line; });
    if (hit) document.body.dataset.scene = hit.dataset.scene;
  };
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();
})();

// Page works without GSAP (e.g. offline) — content just stays static.
if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);

  // Smooth wheel/trackpad scrolling (touch stays native), driven by GSAP's ticker so pins and scrubs stay in step
  if (window.Lenis && !reduceMotion) {
    window.lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // Sticky phone: swap screen + highlight the feature currently in the middle.
  document.querySelectorAll('.showcase').forEach((showcase) => {
    const screens = showcase.querySelectorAll('.showcase-phone img');
    showcase.querySelectorAll('.feature').forEach((feature) => {
      ScrollTrigger.create({
        trigger: feature,
        start: 'top center',
        end: 'bottom center',
        toggleClass: 'is-active',
        onToggle: (self) => {
          if (!self.isActive) return;
          screens.forEach((img, i) => img.classList.toggle('is-active', i === +feature.dataset.screen));
        },
      });
    });
  });

  // Motion only when the user hasn't asked for reduced motion.
  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    // Hero intro
    // Intro on load: icon pops in, grid ripples out from the centre, text rises
    gsap.from('.intro-icon-wrap', { scale: 0.6, opacity: 0, duration: 1.2, ease: 'back.out(1.6)' });
    gsap.from('.gicon', { opacity: 0, scale: 0.85, duration: 0.9, ease: 'power2.out', stagger: { each: 0.015, from: 'center' }, delay: 0.2 });
    gsap.from('.intro-anim', { y: 40, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.12, delay: 0.4 });

    // Intro on scroll: pinned; grid spreads and fades, text lifts away, icon zooms past the camera
    gsap.timeline({ scrollTrigger: { trigger: '.intro', start: 'top top', end: '+=100%', scrub: true, pin: true, invalidateOnRefresh: true, refreshPriority: 20 } })
      .to('.intro-text, .intro-hint', { y: -80, opacity: 0, duration: 0.4 }, 0)
      .to('.intro-grid', { scale: 1.6, opacity: 0, duration: 1 }, 0)
      .to('.intro-icon-wrap', {
        // glide to the middle of the screen while zooming, so it never clips under the nav
        y: () => { const w = document.querySelector('.intro-icon-wrap'); return w.offsetParent.clientHeight / 2 - (w.offsetTop + w.offsetHeight / 2); },
        scale: 5, opacity: 0, duration: 1, ease: 'power2.in',
      }, 0.15);


    // About: words light up one by one while scrolling
    document.querySelectorAll('.statement').forEach((p) => {
      p.innerHTML = p.textContent.split(/(\s+)/)
        .map((w) => (w.trim() ? `<span class="word">${w}</span>` : w)).join('');
      gsap.fromTo(p.querySelectorAll('.word'), { opacity: 0.15 }, {
        opacity: 1, stagger: 0.1, ease: 'none',
        scrollTrigger: { trigger: p, start: 'top 80%', end: 'bottom 45%', scrub: true },
      });
    });

    // Generic fade-up
    gsap.set('.reveal', { y: 50, opacity: 0 });
    ScrollTrigger.batch('.reveal', {
      start: 'top 88%',
      once: true,
      onEnter: (els) => gsap.to(els, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', stagger: 0.12 }),
    });

    // Numbers count up from 0 (HTML already holds the final value as fallback)
    document.querySelectorAll('[data-count]').forEach((el) => {
      const n = { v: 0 };
      gsap.to(n, {
        v: +el.dataset.count, duration: 1.6, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onUpdate: () => { el.textContent = Math.round(n.v); },
      });
    });

    // Big app names scale in
    gsap.utils.toArray('.app-name').forEach((el) => {
      gsap.from(el, {
        scale: 0.85, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 40%', scrub: true },
      });
    });
  });

  // The intro pin (created last) pushes every later section down; measure triggers in page order.
  ScrollTrigger.sort();
  ScrollTrigger.refresh();
}
