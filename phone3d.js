// Real 3D phone for the sticky showcase phones (effect #1) and the Explore phone (#13), desktop only.
// The CSS phone stays in the page as the source of truth: GSAP still turns it (effects.js) and main.js
// still swaps its screenshots. This module hides it, draws a real model on top, and copies its
// rotation + active screenshot. If anything fails (no WebGL, CDN down), the CSS phone simply stays.
// Model: "iPhone 17 Pro" by Ranguel, CC BY 4.0 (credited in the footer). Apple logo is covered by the app logo.
// Three.js is imported on demand (see init) so phones and reduced-motion visitors never download it.
let THREE, GLTFLoader, RoomEnvironment;

// Finish follows the CSS phone's metal-* class (the Explore swatches switch it)
const FINISH = {
  'metal-renly':    { frame: '#1f7a5c', back: '#2b8a6a' },   // Emerald Titanium
  'metal-flight':   { frame: '#1c3259', back: '#253f6b' },   // Deep Blue Titanium
  'metal-graphite': { frame: '#3a3a3f', back: '#47474d' },   // Graphite
  'metal-silver':   { frame: '#c9c9ce', back: '#e2e2e5' },   // Silver
};
const LOGO = { renly: 'assets/renly-logo-mark.png', flight: 'assets/skysaver-logo-mark.png' };
const finishOf = (el) => FINISH[Object.keys(FINISH).find((k) => el.classList.contains(k)) || 'metal-renly'];
const appOf = (el) => el.dataset.app || (el.classList.contains('metal-flight') ? 'flight' : 'renly');

const wanted = matchMedia('(min-width: 821px)').matches
  && !matchMedia('(prefers-reduced-motion: reduce)').matches
  && window.gsap;

// Only fetch the 2.5 MB model once the first app showcase is getting close.
if (wanted) {
  const first = document.querySelector('.showcase');
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    io.disconnect();
    removeEventListener('scroll', near);
    init().catch((err) => console.warn('3D phone unavailable, keeping the CSS phone.', err));
  };
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) start(); }, { rootMargin: '1500px 0px' });
  const near = () => { if (first.getBoundingClientRect().top < innerHeight + 1500) start(); };   // backup for IO
  io.observe(first);
  addEventListener('scroll', near, { passive: true });
  near();
}

async function init() {
  const phones = [...document.querySelectorAll('.showcase-phone .phone--tall, #explore-phone')];
  if (!phones.length) return;
  [THREE, { GLTFLoader }, { RoomEnvironment }] = await Promise.all([
    import('three'),
    import('three/addons/loaders/GLTFLoader.js'),
    import('three/addons/environments/RoomEnvironment.js'),
  ]);
  const gltf = await new GLTFLoader().loadAsync('assets/phone-web.glb');
  const texLoader = new THREE.TextureLoader();
  phones.forEach((cssPhone) => mount(cssPhone, gltf, texLoader));
}

function mount(cssPhone, gltf, texLoader) {
  let queued = false;   // draw() is requested by loaders below, so declare its state first
  const host = cssPhone.closest('.showcase-phone') || cssPhone.parentElement;   // sticky holder, or the Explore wrap

  // Renderer + scene with soft studio reflections
  const canvas = document.createElement('canvas');
  canvas.className = 'phone3d';
  canvas.setAttribute('aria-hidden', 'true');
  host.append(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(22, 1, 0.01, 10);

  // Model: own copy of every material so each phone can have its own finish
  const model = gltf.scene.clone(true);
  let oled = null, glassBack = null;
  const frameMats = [], backMats = [];
  model.traverse((o) => {
    if (!o.isMesh) return;
    o.material = o.material.clone();
    const name = o.material.name;
    if (name === 'Anodized_aluminum') {
      Object.assign(o.material, { metalness: 1, roughness: 0.32 });
      frameMats.push(o.material);
    } else if (name === 'Frosted_glass') {
      Object.assign(o.material, { metalness: 0.15, roughness: 0.5 });
      backMats.push(o.material);
      glassBack = o;
    } else if (name === 'OLED') {
      oled = o;
    } else if (name === 'Glass_tint') {
      // the original Apple logo is a gap in the frosted back showing this shiny layer: match it to the back so it disappears
      Object.assign(o.material, { transparent: false, opacity: 1, transmission: 0, metalness: 0.15, roughness: 0.5 });
      backMats.push(o.material);
    } else if (name === 'Glass') {
      // front cover glass: keep the reflections, lose the grey tint over the screenshot
      Object.assign(o.material, { transmission: 0, opacity: 0.1, roughness: 0, envMapIntensity: 0.8 });
    }
  });

  // Centre it, and turn it so the screen faces the camera (+z)
  const inner = new THREE.Group();
  inner.add(model);
  let box = new THREE.Box3().setFromObject(model);
  model.position.sub(box.getCenter(new THREE.Vector3()));
  if (new THREE.Box3().setFromObject(oled).getCenter(new THREE.Vector3()).z < 0) inner.rotation.y = Math.PI;
  const pivot = new THREE.Group();
  pivot.add(inner);
  scene.add(pivot);
  pivot.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(pivot);
  const size = box.getSize(new THREE.Vector3());

  // App logo on the back glass (covers the original logo position)
  const glassBox = new THREE.Box3().setFromObject(glassBack);
  const logoTex = {};
  for (const [app, url] of Object.entries(LOGO)) {
    logoTex[app] = texLoader.load(url, () => draw());
    logoTex[app].colorSpace = THREE.SRGBColorSpace;
  }
  const logo = new THREE.Mesh(
    new THREE.PlaneGeometry(size.x * 0.3, size.x * 0.3),
    new THREE.MeshStandardMaterial({ transparent: true, metalness: 1, roughness: 0.18, color: '#f4f4f6' }),   // polished silver, like Apple's logo
  );
  logo.position.set(0, (glassBox.min.y + glassBox.max.y) / 2, glassBox.min.z - 0.0003);
  logo.rotation.y = Math.PI;   // face the back
  pivot.add(logo);

  // Colour + logo follow the CSS phone (Explore swatches / app tabs change its class and data-app)
  const applyFinish = () => {
    const f = finishOf(cssPhone);
    frameMats.forEach((m) => m.color.set(f.frame));
    backMats.forEach((m) => m.color.set(f.back));
    logo.material.map = logoTex[appOf(cssPhone)];
    logo.material.needsUpdate = true;
    draw();
  };
  new MutationObserver(applyFinish).observe(cssPhone, { attributeFilter: ['class', 'data-app'] });

  // Screen = whichever screenshot the CSS phone is showing right now (drawn "cover" into a canvas)
  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 590;
  screenCanvas.height = 1288;   // matches the model's ~0.458 screen aspect
  const sctx = screenCanvas.getContext('2d');
  const screenTex = new THREE.CanvasTexture(screenCanvas);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  screenTex.flipY = false;   // glTF UV convention
  screenTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  screenTex.wrapS = THREE.RepeatWrapping;
  screenTex.repeat.x = -1;   // the model's screen UVs run right-to-left
  // Unlit, un-tonemapped: the screenshot keeps its true colours (the glass layer above still adds reflections)
  oled.material = new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false, side: THREE.DoubleSide });   // its faces point inward, like the original

  const paintScreen = () => {
    const img = cssPhone.querySelector('.screen img.is-active') || cssPhone.querySelector('.screen img');
    if (!img || !img.complete || !img.naturalWidth) { img?.addEventListener('load', paintScreen, { once: true }); return; }
    const W = screenCanvas.width, H = screenCanvas.height;
    const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    sctx.fillStyle = '#000';
    sctx.fillRect(0, 0, W, H);
    sctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
    screenTex.needsUpdate = true;
    draw();
  };
  new MutationObserver(paintScreen).observe(cssPhone.querySelector('.screen'), { subtree: true, attributeFilter: ['class', 'src'] });
  paintScreen();

  // Keep the canvas over the CSS phone's layout box (offset* ignores the GSAP transform)
  const fit = () => {
    const w = cssPhone.offsetWidth, h = cssPhone.offsetHeight;
    const cw = w * 1.5, ch = h * 1.2;
    Object.assign(canvas.style, {
      left: `${cssPhone.offsetLeft - (cw - w) / 2}px`, top: `${cssPhone.offsetTop - (ch - h) / 2}px`,
      width: `${cw}px`, height: `${ch}px`,
    });
    renderer.setSize(cw, ch, false);
    camera.aspect = cw / ch;
    // distance so the phone's height takes 1/1.2 of the canvas, like the CSS phone
    camera.position.set(0, 0, (size.y / 2) * 1.2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) + size.z / 2);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    draw();
  };

  // Render only when something changed
  function draw() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; renderer.render(scene, camera); });
  }
  let visible = false, lastY = NaN, lastX = NaN;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) draw(); }).observe(host);
  gsap.ticker.add(() => {
    if (!visible) return;
    const ry = gsap.getProperty(cssPhone, 'rotationY') || 0, rx = gsap.getProperty(cssPhone, 'rotationX') || 0;
    if (ry === lastY && rx === lastX) return;
    lastY = ry; lastX = rx;
    pivot.rotation.set(THREE.MathUtils.degToRad(-rx), THREE.MathUtils.degToRad(ry), 0);   // CSS rotateX tips the top away; three's +x tips it toward us
    draw();
  });

  addEventListener('resize', fit);
  applyFinish();
  fit();
  cssPhone.classList.add('is-3d');   // hide the CSS phone (its Dynamic Island stays visible)
}
