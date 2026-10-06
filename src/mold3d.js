// A two-plate injection mold, built from primitives, running a real molding cycle:
// clamp -> inject -> cool -> open -> eject -> close. Opening is along X, like the
// platens of a horizontal molding machine. Fixed half on the left, moving half on the right.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { gsap } from 'gsap';

const PHASES = ['Clamp', 'Inject', 'Cool', 'Open', 'Eject'];

export function initMold3D(host, ui = {}) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = window.innerWidth < 760;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const camBase = new THREE.Vector3(6.0, 3.4, 10.6);
  const target = new THREE.Vector3(1.25, -0.1, 0);
  camera.position.copy(camBase);
  camera.lookAt(target);

  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(4, 6, 5);
  scene.add(key, new THREE.AmbientLight(0xbfd2dc, 0.25));

  // ---------- materials
  const steel = new THREE.MeshStandardMaterial({ color: 0xc3ccd3, metalness: 1, roughness: 0.3 });
  const steelDark = new THREE.MeshStandardMaterial({ color: 0x8b959d, metalness: 1, roughness: 0.42 });
  const polished = new THREE.MeshStandardMaterial({ color: 0xe6ecf0, metalness: 1, roughness: 0.1 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xf2f5f7, metalness: 1, roughness: 0.06 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: 1, roughness: 0.32 });
  const hoseBlue = new THREE.MeshStandardMaterial({ color: 0x2f6fe0, roughness: 0.55 });
  const hoseRed = new THREE.MeshStandardMaterial({ color: 0xd6453a, roughness: 0.55 });
  const cavityMat = new THREE.MeshStandardMaterial({ color: 0x6b7680, metalness: 1, roughness: 0.12 });
  const plastic = new THREE.MeshStandardMaterial({ color: 0x0e7f62, roughness: 0.38, metalness: 0, transparent: true });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0x2fbf93, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });

  const box = (w, h, d, mat, r = 0.03) => new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat);
  const cyl = (r, l, mat, seg = 28) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, seg), mat);
    m.rotation.z = Math.PI / 2; // along X
    return m;
  };

  const H = 2.5, D = 2.5;          // plate height (Y) and depth (Z)
  const root = new THREE.Group();
  scene.add(root);

  // ---------- fixed half (left)
  const fixed = new THREE.Group();
  const aPlate = box(0.95, H, D, steel); aPlate.position.x = -0.475;
  const clampA = box(0.32, H + 0.5, D, steelDark); clampA.position.x = -0.95 - 0.16;
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.12, 48), polished);
  ring.rotation.z = Math.PI / 2; ring.position.x = -1.33;
  const sprue = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.2, 32), brass);
  sprue.rotation.z = Math.PI / 2; sprue.position.x = -1.43;
  // cavity pocket on the parting face (seen when the mold is open)
  const pocket = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.9), cavityMat);
  pocket.rotation.y = Math.PI / 2; pocket.position.set(0.002, 0, 0);
  fixed.add(aPlate, clampA, ring, sprue, pocket);
  // cooling fittings on the top of the A plate
  for (const [z, mat] of [[-0.7, hoseBlue], [0.7, hoseRed]]) {
    const nip = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.22, 20), brass);
    nip.position.set(-0.48, H / 2 + 0.11, z);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.16, 20), mat);
    cap.position.set(-0.48, H / 2 + 0.28, z);
    fixed.add(nip, cap);
  }
  // guide bushings (faces of the pillar holes)
  for (const [y, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.02, 32), polished);
    b.rotation.z = Math.PI / 2; b.position.set(0.001, y * (H / 2 - 0.28), z * (D / 2 - 0.28));
    fixed.add(b);
  }
  root.add(fixed);

  // ---------- moving half (right)
  const moving = new THREE.Group();
  const bPlate = box(0.95, H, D, steel); bPlate.position.x = 0.475;
  const support = box(0.3, H, D, steelDark); support.position.x = 0.95 + 0.15;
  const railT = box(0.75, 0.42, D, steel); railT.position.set(1.25 + 0.375, H / 2 - 0.21, 0);
  const railB = box(0.75, 0.42, D, steel); railB.position.set(1.25 + 0.375, -H / 2 + 0.21, 0);
  const clampB = box(0.32, H + 0.5, D, steelDark); clampB.position.x = 2.0 + 0.16;
  const ejPlate = box(0.22, H - 1.0, D - 0.3, polished); ejPlate.position.x = 1.5;
  const core = box(0.38, 0.78, 1.08, polished, 0.08); core.position.x = -0.19 + 0.0; // proud of the B plate face
  moving.add(bPlate, support, railT, railB, clampB, ejPlate, core);
  for (const [z, mat] of [[-0.7, hoseBlue], [0.7, hoseRed]]) {
    const nip = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.22, 20), brass);
    nip.position.set(0.48, H / 2 + 0.11, z);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.16, 20), mat);
    cap.position.set(0.48, H / 2 + 0.28, z);
    moving.add(nip, cap);
  }
  // guide pillars, fixed in the B plate, entering the A plate
  for (const [y, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const p = cyl(0.13, 1.5, chrome); p.position.set(-0.25, y * (H / 2 - 0.28), z * (D / 2 - 0.28));
    moving.add(p);
  }
  // ejector pins: move with the ejector plate
  const pins = new THREE.Group();
  for (const [y, z] of [[0.28, 0.38], [0.28, -0.38], [-0.28, 0.38], [-0.28, -0.38]]) {
    const pin = cyl(0.045, 1.55, chrome, 16); pin.position.set(0.6, y, z);
    pins.add(pin);
  }
  moving.add(pins);
  root.add(moving);

  // ---------- the molded part: a shallow cap that sits on the core
  const part = new THREE.Group();
  const shell = box(0.1, 0.92, 1.22, plastic, 0.04); shell.position.x = -0.43;
  const wallT = box(0.36, 0.07, 1.22, plastic, 0.02); wallT.position.set(-0.22, 0.425, 0);
  const wallB = wallT.clone(); wallB.position.y = -0.425;
  const wallF = box(0.36, 0.92, 0.07, plastic, 0.02); wallF.position.set(-0.22, 0, 0.575);
  const wallK = wallF.clone(); wallK.position.z = -0.575;
  part.add(shell, wallT, wallB, wallF, wallK);
  part.visible = false;
  moving.add(part);

  // injection glow along the parting line
  const seam = new THREE.Mesh(new THREE.BoxGeometry(0.018, H + 0.01, D + 0.01), glowMat);
  root.add(seam);
  const melt = new THREE.PointLight(0x5fe0b6, 0, 3);
  melt.position.set(0.6, 0, 0);
  root.add(melt);

  root.rotation.y = -0.08;

  // ---------- cycle
  const OPEN = 2.35, EJECT = 0.42;
  const state = { shot: 1 };
  const setPhase = (i) => ui.onPhase?.(i, PHASES[i]);

  const tl = gsap.timeline({ repeat: -1, paused: true, defaults: { ease: 'power2.inOut' },
    onRepeat: () => { state.shot += 1; ui.onShot?.(state.shot); } });
  tl.call(() => { setPhase(0); part.visible = false; plastic.opacity = 1; part.position.set(0, 0, 0); part.rotation.set(0, 0, 0); })
    .fromTo(moving.position, { x: OPEN }, { x: 0, duration: 1.1, ease: 'power3.inOut' })
    .call(() => setPhase(1))
    .to(glowMat, { opacity: 0.55, duration: 0.25 })
    .to(melt, { intensity: 6, duration: 0.25 }, '<')
    .to(seam.scale, { y: 1.04, z: 1.04, duration: 0.9, ease: 'none' })
    .call(() => { part.visible = true; setPhase(2); })
    .to(glowMat, { opacity: 0, duration: 1.0, ease: 'power1.out' })
    .to(melt, { intensity: 0, duration: 1.0, ease: 'power1.out' }, '<')
    .set(seam.scale, { y: 1, z: 1 })
    .call(() => setPhase(3))
    .to(moving.position, { x: OPEN, duration: 1.2, ease: 'power3.inOut' })
    .call(() => setPhase(4))
    .to([pins.position, ejPlate.position], { x: `-=${EJECT}`, duration: 0.45, ease: 'power2.out' })
    .to(part.position, { x: -EJECT, duration: 0.45, ease: 'power2.out' }, '<')
    .to(part.position, { y: -2.6, duration: 0.75, ease: 'power2.in' })
    .to(part.rotation, { z: 0.9, x: 0.4, duration: 0.75, ease: 'power1.in' }, '<')
    .to(plastic, { opacity: 0, duration: 0.3 }, '-=0.3')
    .to([pins.position, ejPlate.position], { x: `+=${EJECT}`, duration: 0.4 }, '-=0.5')
    .to({}, { duration: 0.35 });

  // ---------- sizing, pointer parallax, visibility
  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the same horizontal field of view on any screen shape, so the open mold always fits
    const HF = THREE.MathUtils.degToRad(40);
    camera.fov = THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(HF / 2) / camera.aspect)), 26, 64);
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(host);
  resize();

  const pointer = { x: 0, y: 0 };
  if (!reduced) {
    window.addEventListener('pointermove', (e) => {
      pointer.x = e.clientX / window.innerWidth - 0.5;
      pointer.y = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });
  }

  let visible = true;
  let raf = 0;
  const loop = () => {
    raf = requestAnimationFrame(loop);
    camera.position.x += (camBase.x + pointer.x * 0.9 - camera.position.x) * 0.04;
    camera.position.y += (camBase.y - pointer.y * 0.6 - camera.position.y) * 0.04;
    camera.lookAt(target);
    ui.onTick?.(tl.time());
    renderer.render(scene, camera);
  };

  if (reduced) {
    // one informative still: mold open, part on the core
    moving.position.x = OPEN; part.visible = true;
    setPhase(3);
    renderer.render(scene, camera);
    return { renderer };
  }

  const start = () => { if (!raf) { tl.play(); loop(); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; tl.pause(); };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible && !document.hidden ? start() : stop(); }, { threshold: 0.05 }).observe(host);
  document.addEventListener('visibilitychange', () => (document.hidden || !visible ? stop() : start()));
  start();
  return { renderer, timeline: tl };
}
