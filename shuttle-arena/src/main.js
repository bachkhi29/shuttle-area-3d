// main.js — Vòng lặp chính, khởi tạo, fixed timestep, hàm tiện ích dùng chung
// Tách từ baseline v0.3. Logic 100% giống baseline — chỉ tách file.
// Spec Bước 1: chưa thêm bất kỳ tính năng Quick Match nào.
//
// Ghi chú kỹ thuật (suy ra khi cài đặt, không có trong Spec):
// Baseline dùng global scope (không phải ES modules). Để giữ đúng hành vi
// và tránh lỗi CORS khi mở file:// trực tiếp, các file src/ đều dùng
// <script> thường (không type="module"). Hàm/biến được khai báo ở đây
// là global và được dùng bởi court.js, actors.js, shuttle.js, training.js,
// hud.js, input.js theo thứ tự load trong index.html.
'use strict';

// ─── Tiện ích ───────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// ─── Hằng số vật lý (LOCKED — Spec K1, Mục 3) ──────────────────────────────
const DRAG = .35, GRAVITY = 9.81, FIXED = 1 / 120;

// ─── Renderer & Scene ────────────────────────────────────────────────────────
let renderer;
function createRenderer() {
  let canvas = $('view');
  let gl = null;

  const glOpts = [
    { antialias: true, depth: true },
    { antialias: false, depth: true },
    {}
  ];

  // 1. Thử lấy trực tiếp WebGL2 trên canvas hiện tại
  for (const opt of glOpts) {
    try {
      gl = canvas.getContext('webgl2', opt);
      if (gl) break;
    } catch (_) {}
  }

  // 2. Nếu canvas ban đầu trong DOM bị "kẹt" lỗi, thay bằng canvas mới sạch 100%
  if (!gl && canvas && canvas.parentNode) {
    const parent = canvas.parentNode;
    const cleanCanvas = document.createElement('canvas');
    cleanCanvas.id = 'view';
    cleanCanvas.tabIndex = 0;
    cleanCanvas.setAttribute('aria-label', canvas.getAttribute('aria-label') || 'Sân cầu lông 3D');
    parent.replaceChild(cleanCanvas, canvas);
    canvas = cleanCanvas;

    for (const opt of glOpts) {
      try {
        gl = canvas.getContext('webgl2', opt);
        if (gl) break;
      } catch (_) {}
    }
  }

  // 3. Nếu lấy được WebGL2, khởi tạo Three.js trực tiếp từ ngữ cảnh đó
  if (gl) {
    return new THREE.WebGLRenderer({ canvas, context: gl, antialias: true });
  }

  // 4. Fallback WebGL 1
  try {
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      return new THREE.WebGLRenderer({ canvas, context: gl, antialias: false });
    }
  } catch (_) {}

  // 5. Thử constructor thông thường
  return new THREE.WebGLRenderer({ canvas, antialias: false, failIfMajorPerformanceCaveat: false });
}
function getWebGLDiagnosticInfo() {
  const canvas = document.createElement('canvas');
  let webgl2Ok = false, webgl1Ok = false;
  try { webgl2Ok = !!canvas.getContext('webgl2'); } catch (_) {}
  try { webgl1Ok = !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl')); } catch (_) {}
  return { webgl2Ok, webgl1Ok };
}
try {
  renderer = createRenderer();
} catch (e) {
  const diag = getWebGLDiagnosticInfo();
  const isBrave = (navigator.brave && typeof navigator.brave.isBrave === 'function') || /Brave/.test(navigator.userAgent);
  $('intro').innerHTML = '<strong>Trình duyệt chưa khởi tạo được WebGL.</strong>' +
    '<br><span style="font-size:12px;color:#a8c0b5;">Trạng thái: WebGL 2: ' + (diag.webgl2Ok ? 'Bật' : '<b style="color:#ffb499;">Bị chặn (Blocked)</b>') + ' · WebGL 1: ' + (diag.webgl1Ok ? 'Bật' : '<b style="color:#ffb499;">Bị chặn (Blocked)</b>') + '</span>' +
    '<div style="font-size:12px;text-align:left;background:#15242b;padding:12px 14px;border-radius:8px;margin-top:10px;line-height:1.6;border:1px solid #324953;">' +
    '<b style="color:#d4f788;font-size:13px;">🦁 NẾU BẠN DÙNG BRAVE BROWSER:</b><br>' +
    'Brave có tính năng <b>Lá chắn (Brave Shields)</b> mặc định chặn WebGL để chống theo dõi vân tay (Fingerprinting).<br>' +
    '&bull; <b>Bước 1:</b> Nhìn lên thanh địa chỉ URL của Brave, bấm vào <b>biểu tượng Đầu Sư Tử màu cam</b> ở góc phải.<br>' +
    '&bull; <b>Bước 2:</b> Gạt công tắc chuyển sang <b>TẮT (Shields are DOWN)</b> cho trang này.<br>' +
    '&bull; Hoặc vào <code>brave://settings/shields</code> &rarr; chuyển <i>Fingerprinting protection</i> từ Strict sang Standard.<br>' +
    '<hr style="border:0;border-top:1px solid #283e46;margin:8px 0;">' +
    '<b style="color:#9fd8f3;">NẾU DÙNG EDGE HOẶC CHROME:</b><br>' +
    '&bull; Mở tab mới: <code>chrome://flags/#ignore-gpu-blocklist</code> (hoặc <code>brave://flags/#ignore-gpu-blocklist</code>) &rarr; chọn <b>Enabled</b> &rarr; <b>Relaunch</b>.' +
    '</div>';
  $('intro').className = 'error';
  $('begin').disabled = true;
  console.error('WebGL context creation failed:', e);
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#111e27');
scene.fog = new THREE.Fog('#111e27', 23, 48);

const camera = new THREE.PerspectiveCamera(43, 1, .1, 100);
camera.position.set(.2, 8.6, 15.1);
camera.lookAt(0, .15, 0);

// ─── Ánh sáng ────────────────────────────────────────────────────────────────
scene.add(new THREE.HemisphereLight(0xc5e5ef, 0x243028, 2.15));
const light = new THREE.DirectionalLight(0xfff4d4, 3.3);
light.position.set(-4, 13, 4);
light.castShadow = true;
light.shadow.mapSize.set(2048, 2048);
Object.assign(light.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 35 });
light.shadow.bias = -.0005;
light.shadow.normalBias = .025;
scene.add(light);
let fill = new THREE.DirectionalLight(0x9dd4f0, 1.05);
fill.position.set(7, 6, -6);
scene.add(fill);

// ─── Hàm dựng geometry dùng chung (court.js, actors.js dùng) ────────────────
const mats = {};
function mat(c, rough = .8, metal = 0) {
  const k = c + ' ' + rough + ' ' + metal;
  return mats[k] || (mats[k] = new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: metal }));
}
function box(w, h, d, c, x, y, z, parent = scene) {
  let m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c));
  m.position.set(x, y, z);
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function cylinder(a, b, r, c, parent = scene, r2 = r) {
  let m = new THREE.Mesh(new THREE.CylinderGeometry(r2, r, a.distanceTo(b), 10), mat(c, .62));
  m.position.copy(a).add(b).multiplyScalar(.5);
  m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize());
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m);
  return m;
}
function line(a, b, c, parent = scene) {
  const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
  const mesh = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: .76 }));
  parent.add(mesh);
  return mesh;
}
function label(text, x, y, z, size = 1) {
  let c = document.createElement('canvas'); c.width = 1024; c.height = 128;
  let g = c.getContext('2d');
  g.fillStyle = '#d8e8d8'; g.font = '700 58px sans-serif'; g.textAlign = 'center';
  g.fillText(text, 512, 88);
  let tex = new THREE.CanvasTexture(c),
    m = new THREE.Mesh(new THREE.PlaneGeometry(7 * size, .9 * size), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
  m.position.set(x, y, z);
  scene.add(m);
}

// ─── Dựng sân (logic từ court.js) ────────────────────────────────────────────
box(30, .2, 37, '#263039', 0, -.15, 0);
box(8.4, .035, 16.4, '#234c49', 0, -.025, 0);
box(6.1, .025, 13.4, '#257369', 0, 0, 0);

function mark(x, z, w, d) { box(w, .007, d, '#ecf1de', x, .019, z); }
[-3.05, 3.05, -2.59, 2.59].forEach(x => mark(x, 0, .04, 13.4));
[-6.7, 6.7, -5.94, 5.94, -1.98, 1.98].forEach(z => mark(0, z, 6.1, .04));
[-1, 1].forEach(s => mark(0, s * 4.34, .04, 4.72));

for (let side of [-1, 1]) {
  for (let row = 0; row < 3; row++) {
    box(1.1, .26 + row * .22, 15, '#22343e', side * (6.3 + row * 1.25), row * .11, 0);
    for (let z = -6; z <= 6; z += .65) {
      box(.48, .13, .45, row % 2 ? '#526068' : '#435564', side * (6.25 + row * 1.25), .38 + row * .22, z);
      box(.48, .48, .1, '#314650', side * (6.55 + row * 1.25), .62 + row * .22, z);
    }
  }
  box(.15, 3.9, 22, '#182d36', side * 11, 1.9, 0);
  for (let z = -9; z <= 9; z += 6) { box(.09, .09, 3, '#cfddd1', side * 6.4, 5.6, z); }
}
box(24, 6, .15, '#1c303a', 0, 2.9, -11.5);
label('SHUTTLE  ARENA', 0, 3, -11.39, 1.35);

// Lưới cầu lông
[-3.05, 3.05].forEach(x => {
  cylinder(V(x, 0, 0), V(x, 1.55, 0), .045, '#697781');
  box(.32, .08, .44, '#34464c', x, .04, 0);
});
for (let x = -3.03; x <= 3.05; x += .115)
  line(V(x, .79, 0), V(x, 1.524 + .026 * Math.abs(x) / 3.05, 0), '#a3b9b1');
for (let y = .79; y < 1.53; y += .095)
  line(V(-3.03, y, 0), V(3.03, y, 0), '#9daea6');
for (let x = -3.05; x < 3.05; x += .305) {
  cylinder(V(x, 1.524 + .026 * Math.abs(x) / 3.05, 0),
    V(x + .305, 1.524 + .026 * Math.abs(x + .305) / 3.05, 0), .014, '#f6efdf');
}

// ─── Vật liệu nhân vật (actors.js dùng) ──────────────────────────────────────
const skin = mat('#c79d7c', .83), shoe = mat('#e1e7d7', .75), shorts = mat('#1a242c');

function sphere(r, material, parent) {
  let m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), material);
  m.castShadow = true; parent.add(m); return m;
}
function segment(r, material, parent) {
  let m = new THREE.Mesh(new THREE.CylinderGeometry(r * .86, r, 1, 10), material);
  m.castShadow = true; parent.add(m); return m;
}
function setBone(mesh, a, b) {
  mesh.position.copy(a).add(b).multiplyScalar(.5);
  mesh.scale.y = a.distanceTo(b);
  mesh.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize());
}
function bend(a, b, l1, l2, hint) {
  let delta = b.clone().sub(a), d = clamp(delta.length(), .001, l1 + l2 - .001),
    axis = delta.normalize(), mid = (l1 * l1 - l2 * l2 + d * d) / (2 * d),
    height = Math.sqrt(Math.max(0, l1 * l1 - mid * mid));
  let side = hint.clone().sub(axis.clone().multiplyScalar(hint.dot(axis))).normalize();
  return a.clone().addScaledVector(axis, mid).addScaledVector(side, height);
}

// ─── Dựng nhân vật (logic từ actors.js) ──────────────────────────────────────
function actor(side) {
  let group = new THREE.Group(); scene.add(group);
  group.rotation.y = side === 'ai' ? Math.PI : 0;
  const jersey = mat(side === 'ai' ? '#e4a275' : '#98c9c8');
  const a = { side, group, x: 0, z: side === 'ai' ? -4.5 : 4.5, vx: 0, vz: 0, phase: 0, shot: null, split: 0, feet: [], speed: 0 };
  a.torso = new THREE.Mesh(new THREE.CylinderGeometry(.26, .195, .52, 12), jersey);
  a.torso.scale.z = .65; a.torso.castShadow = true; group.add(a.torso);
  a.pelvis = box(.37, .22, .27, '#1c2b35', 0, .88, 0, group);
  a.head = sphere(.139, skin, group); a.head.scale.set(.86, 1.12, .92);
  a.hair = sphere(.142, mat('#282321'), group); a.hair.scale.set(.87, .60, .94);
  a.neck = segment(.053, skin, group);
  a.legs = [0, 1].map(() => ({
    upper: segment(.085, shorts, group), lower: segment(.058, skin, group),
    sock: segment(.06, mat('#d8e4da'), group), foot: box(.145, .10, .29, '#dce6dd', 0, 0, 0, group)
  }));
  a.arms = [0, 1].map(() => ({
    upper: segment(.054, jersey, group), lower: segment(.044, skin, group),
    hand: sphere(.049, skin, group)
  }));
  a.racket = new THREE.Group(); group.add(a.racket);
  let hoop = new THREE.Mesh(new THREE.TorusGeometry(.135, .012, 6, 30), mat('#e8d7a4', .35, .55));
  hoop.scale.y = 1.36; a.racket.add(hoop);
  cylinder(V(0, -.17, 0), V(0, -.48, 0), .008, '#d3d9d1', a.racket);
  cylinder(V(0, -.43, 0), V(0, -.57, 0), .017, '#33343c', a.racket);
  for (let i = -3; i <= 3; i++) {
    let x = i * .033, h = Math.sqrt(Math.max(0, 1 - x * x / (.132 * .132))) * .178;
    line(V(x, -h, 0), V(x, h, 0), '#d9e1d3', a.racket);
  }
  for (let i = -4; i <= 4; i++) {
    let y = i * .035, w = Math.sqrt(Math.max(0, 1 - y * y / (.18 * .18))) * .132;
    line(V(-w, y, 0), V(w, y, 0), '#d9e1d3', a.racket);
  }
  resetFeet(a); return a;
}
function resetFeet(a) {
  a.feet = [-.19, .19].map((x) => ({
    world: V(a.x + x, .055, a.z), from: V(a.x + x, .055, a.z),
    to: V(a.x + x, .055, a.z), swing: false
  }));
}

const player = actor('player'), opponent = actor('ai');

// ─── Cầu lông 3D (shuttle object) ────────────────────────────────────────────
const shuttle = new THREE.Group(); scene.add(shuttle);
let cork = new THREE.Mesh(new THREE.SphereGeometry(.042, 10, 8), mat('#e5dbc2'));
cork.position.y = -.064; shuttle.add(cork);
let skirt = new THREE.Mesh(new THREE.ConeGeometry(.095, .18, 12, 1, true),
  new THREE.MeshStandardMaterial({ color: '#f9f4df', side: THREE.DoubleSide, roughness: .75 }));
skirt.rotation.z = Math.PI; skirt.position.y = .04; shuttle.add(skirt);
for (let i = 0; i < 12; i++) {
  let angle = i * Math.PI / 6;
  cylinder(V(0, -.06, 0), V(Math.cos(angle) * .094, .13, Math.sin(angle) * .094), .0027, '#ffffff', shuttle);
}

// ─── Trail & rings ───────────────────────────────────────────────────────────
const trailPoints = Array.from({ length: 10 }, () => V());
const trailGeo = new THREE.BufferGeometry().setFromPoints(trailPoints);
const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: '#fcf4b8', transparent: true, opacity: .4 }));
scene.add(trail);

function floorRing(r, color) {
  let m = new THREE.Mesh(new THREE.RingGeometry(r - .018, r, 48),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .8, side: THREE.DoubleSide, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = .038; scene.add(m); return m;
}
const landingRing = floorRing(.28, '#e9d79b'), standRing = floorRing(.34, '#bfdbe0'), reachRing = floorRing(.6, '#cdf696');
const ballShadow = new THREE.Mesh(new THREE.CircleGeometry(.13, 20),
  new THREE.MeshBasicMaterial({ color: '#101c20', transparent: true, opacity: .5, depthWrite: false }));
ballShadow.rotation.x = -Math.PI / 2; ballShadow.position.y = .036; scene.add(ballShadow);

// ─── Game State ──────────────────────────────────────────────────────────────
const S = {
  mode: 'match', // 'match' (Arcade 11 v0.4) | 'training' (v0.3)
  running: false, started: false, ended: false, clock: 0, ball: null, wait: .65,
  hits: 0, drops: 0, rally: 0, best: 0, aim: 0, held: false, queuedUntil: -1,
  assist: true, pace: .8, drill: 'center', keys: new Set(), seed: 73, feeds: 0,
  lastContact: null, event: '', eventUntil: 0, sound: false, contacts: [], faults: 0
};

// Expose player/opponent trên S để hud.js dùng
S.player = player;
S.opponent = opponent;

function rnd() { S.seed = (S.seed * 1664525 + 1013904223) >>> 0; return S.seed / 4294967296; }

// ─── Vật lý cầu (logic từ shuttle.js) ────────────────────────────────────────
function sample(b, t) {
  t = clamp(t, 0, b.T);
  let f = (1 - Math.exp(-DRAG * t)) / DRAG;
  return V(b.start.x + b.v.x * f, b.start.y + (b.v.y + GRAVITY / DRAG) * f - GRAVITY * t / DRAG, b.start.z + b.v.z * f);
}
function velocity(b, t) {
  let e = Math.exp(-DRAG * t);
  return V(b.v.x * e, (b.v.y + GRAVITY / DRAG) * e - GRAVITY / DRAG, b.v.z * e);
}
function trajectory(start, end, T) {
  let f = (1 - Math.exp(-DRAG * T)) / DRAG;
  return { start: start.clone(), end: end.clone(), v: V((end.x - start.x) / f, (end.y - start.y + GRAVITY * T / DRAG) / f - GRAVITY / DRAG, (end.z - start.z) / f), T, t: 0 };
}
function planIntercept(b, side) {
  for (let t = b.T * .38; t <= b.T; t += .007) {
    let p = sample(b, t);
    if (velocity(b, t).y < 0 && p.y < 1.58 && p.y > .55 && p.z * (side === 'player' ? 1 : -1) > .75) {
      return { t, point: p, x: clamp(p.x - (side === 'player' ? .22 : -.22), -2.43, 2.43), z: clamp(p.z + (side === 'player' ? .42 : -.42), side === 'player' ? .7 : -6.3, side === 'player' ? 6.3 : -.7) };
    }
  }
  let p = sample(b, b.T * .9);
  return { t: b.T * .9, point: p, x: p.x, z: p.z };
}
function launch(start, end, side) {
  let T = 2.03, b;
  for (let i = 0; i < 12; i++) {
    b = trajectory(start, end, T);
    let lo = 0, hi = T;
    for (let j = 0; j < 30; j++) { let t = (lo + hi) / 2, p = sample(b, t); if ((p.z > 0) === (start.z > 0)) lo = t; else hi = t; }
    if (sample(b, (lo + hi) / 2).y > 1.82) break;
    T += .12;
  }
  b.side = side; b.intercept = planIntercept(b, side);
  b.id = S.feeds * 1000 + S.hits; b.previous = start.clone();
  S.ball = b; S.wait = 0;
  trailPoints.forEach(p => p.copy(start));
  opponent.split = side === 'ai' ? .2 : 0;
  player.split = side === 'player' ? .2 : 0;
}

// ─── Training drills (logic từ training.js) ───────────────────────────────────
function feedTarget() {
  S.feeds++;
  if (S.drill === 'center') return V((rnd() - .5) * .22, .08, 4.5);
  let side = S.feeds % 2 ? 1 : -1;
  return V(side * (S.drill === 'wide' ? 1.65 : 1.25 + rnd() * .65), .08, S.drill === 'mixed' ? 2.8 + rnd() * 2.6 : 4.5);
}
function feed() {
  let start = V(opponent.x + (opponent.side === 'ai' ? -.25 : .25), 1.75, opponent.z + .35);
  setShot(opponent, start);
  launch(start, feedTarget(), 'player');
}

// ─── Tầm với & intent (logic từ v0.3) ────────────────────────────────────────
function range(a, p) {
  let shoulder = V(a.x + (a.side === 'player' ? .23 : -.23), 1.42, a.z);
  let valid = p.y >= .5 && p.y <= 2.65 && p.z * (a.side === 'player' ? 1 : -1) > .42;
  let dx = p.x - shoulder.x, dz = p.z - shoulder.z;
  return valid && Math.hypot(dx, p.y - shoulder.y, dz) <= 1.13 && dz * (a.side === 'player' ? -1 : 1) > -.65;
}
function reachable(a, b) { return b && b.side === a.side && velocity(b, b.t).y < .4 && range(a, sample(b, b.t)); }
function intent() { return S.held || S.keys.has('Space') || S.clock <= S.queuedUntil; }
function gameEvent(text, seconds = .85) { S.event = text; S.eventUntil = S.clock + seconds; }

// ─── Âm thanh ────────────────────────────────────────────────────────────────
let audioContext;
function tone(freq, duration = .04) {
  if (!S.sound) return;
  try {
    audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    let o = audioContext.createOscillator(), g = audioContext.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(freq, audioContext.currentTime);
    o.frequency.exponentialRampToValueAtTime(freq * .6, audioContext.currentTime + duration);
    g.gain.setValueAtTime(.045, audioContext.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + duration);
    o.connect(g); g.connect(audioContext.destination);
    o.start(); o.stop(audioContext.currentTime + duration);
  } catch (e) { }
}

// ─── Tiếp xúc & đánh cầu ────────────────────────────────────────────────────
function setShot(a, point) { a.shot = { at: S.clock, point: point.clone() }; }
function contact(a) {
  let b = S.ball, p = sample(b, b.t);
  if (!range(a, p)) return false;
  setShot(a, p);
  S.lastContact = { who: a.side, at: S.clock, point: p.clone() };
  S.contacts.push({ who: a.side, height: p.y, gap: Math.hypot(p.x - a.x, p.z - a.z), netSide: p.z });
  if (S.contacts.length > 1000) S.contacts.shift();
  tone(a.side === 'player' ? 860 : 640);
  if (a.side === 'player') {
    S.hits++; S.rally++; S.best = Math.max(S.best, S.rally);
    S.queuedUntil = -1; gameEvent('Đánh trúng · về vị trí sẵn sàng');
    launch(p, V(S.aim * 1.65, .08, -4.9), 'ai');
  } else {
    launch(p, feedTarget(), 'player');
  }
  return true;
}
function drop(reason) {
  if (S.ball?.side === 'player') S.drops++;
  S.rally = 0; S.ball = null; S.wait = 1.05; S.queuedUntil = -1;
  gameEvent(reason, 1.05); tone(170, .1);
}

// ─── Di chuyển ───────────────────────────────────────────────────────────────
function move(a, tx, tz, dt, customMax) {
  let dx = tx - a.x, dz = tz - a.z, d = Math.hypot(dx, dz),
    max = customMax || (a.side === 'ai' ? (S.mode === 'match' ? 4.65 : 5.6) : 4.65),
    desired = Math.min(max, d * 7),
    vx = d > .015 ? dx / d * desired : 0,
    vz = d > .015 ? dz / d * desired : 0;
  const blend = 1 - Math.exp(-15 * dt);
  a.vx = lerp(a.vx, vx, blend); a.vz = lerp(a.vz, vz, blend);
  a.x = clamp(a.x + a.vx * dt, -2.70, 2.70);
  a.z = clamp(a.z + a.vz * dt, a.side === 'ai' ? -6.35 : .58, a.side === 'ai' ? -.58 : 6.35);
  a.speed = Math.hypot(a.vx, a.vz);
  a.split = Math.max(0, a.split - dt);
}

// ─── Tick (fixed timestep, logic từ v0.3) ────────────────────────────────────
function tick(dt) {
  if (!S.running) return;
  if (S.mode === 'match' && typeof Match !== 'undefined') {
    Match.tick(dt);
    return;
  }
  S.clock += dt;
  let k = S.keys,
    dx = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0),
    dz = (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0) - (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0),
    n = Math.hypot(dx, dz);
  let target = { x: player.x, z: player.z };
  if (n) { target = { x: player.x + dx / n, z: player.z + dz / n }; }
  else if (S.assist) { target = S.ball?.side === 'player' ? S.ball.intercept : { x: 0, z: 4.4 }; }
  move(player, target.x, target.z, dt);
  let dest = S.ball?.side === 'ai' ? S.ball.intercept : { x: 0, z: -4.4 };
  move(opponent, dest.x, dest.z, dt);
  animateFeet(player, dt); animateFeet(opponent, dt);

  if (!S.ball) { S.wait -= dt; if (S.wait <= 0) feed(); return; }
  let b = S.ball;
  b.previous.copy(sample(b, b.t)); b.t += dt;
  let p = sample(b, b.t);

  // Phát hiện chạm lưới (từ v0.3)
  if (b.previous.z * p.z <= 0 && Math.abs(b.previous.z - p.z) > .00001) {
    let fraction = Math.abs(b.previous.z) / (Math.abs(b.previous.z) + Math.abs(p.z));
    let h = lerp(b.previous.y, p.y, fraction);
    if (h < 1.55) { S.faults++; drop('Cầu chạm lưới · chuẩn bị lại'); return; }
  }

  if (b.side === 'player' && intent() && reachable(player, b)) { contact(player); return; }
  if (b.side === 'ai' && reachable(opponent, b)) { contact(opponent); return; }
  if (b.t >= b.T || p.y <= .09) {
    drop(b.side === 'player'
      ? (intent() ? 'Cầu ngoài tầm với · tới vòng xanh nhạt' : 'Cầu rơi · giữ Space sớm hơn ở pha tới')
      : 'Đối thủ chưa tới kịp · pha mới');
  }
}

// ─── Animate feet (từ actors.js) ─────────────────────────────────────────────
function animateFeet(a, dt) {
  let moving = a.speed > .15;
  if (moving) a.phase += dt * (1.8 + a.speed * .25);
  let sign = a.side === 'ai' ? -1 : 1;
  for (let i = 0; i < 2; i++) {
    let f = a.feet[i], phase = (a.phase + i * .5) % 1, swing = moving && phase < .48;
    let rest = V(a.x + sign * (i === 0 ? -.19 : .19), .06, a.z + (i === 0 ? .06 : -.06));
    if (swing && !f.swing) { f.from.copy(f.world); f.to.copy(rest).add(V(a.vx * .11, 0, a.vz * .11)); }
    if (swing) {
      let u = phase / .48; f.world.copy(f.from).lerp(f.to, u * u * (3 - 2 * u));
      f.world.y = .06 + Math.sin(u * Math.PI) * .12;
    } else if (!moving) { f.world.lerp(rest, Math.min(1, dt * 8)); f.world.y = .06; }
    else if (Math.hypot(f.world.x - a.x, f.world.z - a.z) > .62) { f.world.copy(rest); }
    f.swing = swing;
  }
}

// ─── Render actor (từ actors.js) ─────────────────────────────────────────────
function renderActor(a) {
  let group = a.group;
  group.position.set(a.x, 0, a.z); group.updateMatrixWorld(true);
  let split = a.split > 0 ? Math.sin(a.split / .2 * Math.PI) * .055 : 0,
    hipY = .91 - split, lean = Math.min(.10, a.speed * .013);
  a.torso.position.set(0, hipY + .31, -lean); a.torso.rotation.x = -lean;
  a.pelvis.position.set(0, hipY - .025, 0);
  a.head.position.set(0, hipY + .84, -lean - .035);
  a.hair.position.set(0, hipY + .916, -lean - .025);
  setBone(a.neck, V(0, hipY + .57, -lean), V(0, hipY + .72, -lean));

  for (let i = 0; i < 2; i++) {
    let leg = a.legs[i], foot = group.worldToLocal(a.feet[i].world.clone()),
      hip = V(i === 0 ? -.14 : .14, hipY - .06, 0),
      ankle = foot.clone().add(V(0, .05, .04)),
      knee = bend(hip, ankle, .43, .45, V(0, 0, -1));
    setBone(leg.upper, hip, knee); setBone(leg.lower, knee, ankle);
    setBone(leg.sock, ankle, ankle.clone().lerp(knee, .3));
    leg.foot.position.copy(foot); leg.foot.position.z -= .035;
  }

  let ls = V(-.23, hipY + .54, -lean), rs = V(.23, hipY + .54, -lean),
    leftHand = V(-.34, hipY + .37, -.32), rightHand = V(.31, hipY + .37, -.28),
    racketCenter = V(.37, hipY + .61, -.65), shot = a.shot, elapsed = shot ? S.clock - shot.at : 99;

  if (elapsed < .42) {
    let local = group.worldToLocal(shot.point.clone()),
      hold = elapsed < .045 ? 0 : clamp((elapsed - .045) / .375, 0, 1);
    let follow = local.clone().add(V(-.18, -.32, -.20));
    racketCenter.copy(local).lerp(follow, Math.sin(hold * Math.PI * .5));
    let fromShoulder = racketCenter.clone().sub(rs).normalize();
    rightHand.copy(racketCenter).addScaledVector(fromShoulder, -.53);
    leftHand.set(-.42, hipY + .35, .10);
  } else if (S.ball?.side === a.side && S.ball.T - S.ball.t < .9) {
    rightHand.set(.42, hipY + .57, .07);
    racketCenter.set(.47, hipY + 1.07, .1);
    leftHand.set(-.42, hipY + .43, -.27);
    if (a.side === 'ai' || intent()) {
      for (let lead = .008; lead <= .18; lead += .008) {
        let future = sample(S.ball, S.ball.t + lead);
        if (velocity(S.ball, S.ball.t + lead).y < .4 && range(a, future)) {
          let local = group.worldToLocal(future), blend = 1 - lead / .18;
          racketCenter.lerp(local, blend * blend * (3 - 2 * blend));
          rightHand.copy(racketCenter).addScaledVector(racketCenter.clone().sub(rs).normalize(), -.53);
          break;
        }
      }
    }
  }

  let elbowL = bend(ls, leftHand, .31, .30, V(-1, -.3, 0)),
    elbowR = bend(rs, rightHand, .32, .32, V(.5, -.6, .6));
  [[ls, elbowL, leftHand], [rs, elbowR, rightHand]].forEach((p, i) => {
    setBone(a.arms[i].upper, p[0], p[1]);
    setBone(a.arms[i].lower, p[1], p[2]);
    a.arms[i].hand.position.copy(p[2]);
  });
  a.racket.position.copy(racketCenter);
  a.racket.quaternion.setFromUnitVectors(V(0, 1, 0), racketCenter.clone().sub(rightHand).normalize());
}

// ─── Draw (từ v0.3) ──────────────────────────────────────────────────────────
function draw() {
  renderActor(player); renderActor(opponent);
  let b = S.ball;
  shuttle.visible = trail.visible = ballShadow.visible = landingRing.visible = standRing.visible = !!b;
  reachRing.visible = S.running && b?.side === 'player';
  if (b) {
    let p = sample(b, b.t), v = velocity(b, b.t);
    shuttle.position.copy(p);
    shuttle.quaternion.setFromUnitVectors(V(0, -1, 0), v.normalize());
    ballShadow.position.set(p.x, .035, p.z);
    ballShadow.scale.setScalar(1 + p.y * .17);
    landingRing.position.set(b.end.x, .04, b.end.z);
    standRing.position.set(b.intercept.x, .045, b.intercept.z);
    standRing.visible = b.side === 'player';
    reachRing.position.set(player.x, .043, player.z);
    reachRing.material.opacity = reachable(player, b) ? .92 : .18;
    for (let i = 0; i < trailPoints.length; i++) trailPoints[i].copy(sample(b, Math.max(0, b.t - i * .018)));
    trailGeo.setFromPoints(trailPoints);
  }
  renderer.render(scene, camera);
  hud();
}

// ─── HUD (Cập nhật giao diện Quick Match & Training) ─────────────────────────
function hud() {
  if (S.mode === 'match' && typeof Match !== 'undefined' && Match.pointManager) {
    const scores = Match.getScores();
    if ($('playerScore')) $('playerScore').textContent = scores.player;
    if ($('aiScore')) $('aiScore').textContent = scores.ai;
    if ($('matchRallyNum')) $('matchRallyNum').textContent = Match.rallyId;
    if ($('panelPlayerScore')) $('panelPlayerScore').textContent = scores.player;
    if ($('panelAiScore')) $('panelAiScore').textContent = scores.ai;
    if ($('panelRally')) $('panelRally').textContent = Match.matchStats.currentRally;
    if ($('panelBestRally')) $('panelBestRally').textContent = Match.matchStats.longestRally;

    if ($('playerServeDot')) $('playerServeDot').classList.toggle('active', Match.server === 'player');
    if ($('aiServeDot')) $('aiServeDot').classList.toggle('active', Match.server === 'ai');
    if ($('matchServeStatus')) {
      const boxName = Match.currentBox?.boxName === 'right' ? 'ô phải' : 'ô trái';
      $('matchServeStatus').textContent = 'Lượt giao cầu: ' + (Match.server === 'player' ? 'Bạn' : 'Đối thủ') + ' (' + boxName + ')';
    }

    let title = 'Chuẩn bị', detail = '', ready = false;

    if (!S.running) {
      title = S.started ? 'Đã tạm dừng' : 'Trận đấu Arcade 11';
      detail = 'Bấm Vào trận đấu hoặc phím P để tiếp tục.';
    } else if (Match.state === 'MATCH_END') {
      $('overlay').hidden = false;
      if ($('modeSelectScreen')) $('modeSelectScreen').style.display = 'none';
      if ($('matchEndScreen')) $('matchEndScreen').style.display = 'block';
      const winner = Match.getWinner();
      if ($('matchResultTitle')) {
        $('matchResultTitle').textContent = winner === 'player' ? 'CHIẾN THẮNG!' : 'ĐỐI THỦ THẮNG';
        $('matchResultTitle').className = winner === 'player' ? 'win' : 'loss';
      }
      if ($('finalScoreText')) $('finalScoreText').textContent = scores.player + ' - ' + scores.ai;
      if ($('finalTotalRallies')) $('finalTotalRallies').textContent = Match.matchStats.totalRallies;
      if ($('finalBestRally')) $('finalBestRally').textContent = Match.matchStats.longestRally;
      title = winner === 'player' ? 'Thắng trận!' : 'Thua trận';
      detail = 'Bấm Đấu lại (Rematch) để chơi ván mới.';
    } else if (Match.state === 'PRE_SERVE') {
      title = 'Di chuyển về ô giao/nhận';
      detail = 'Nhân vật đang di chuyển vào vị trí chẵn/lẻ theo luật.';
    } else if (Match.state === 'SERVING') {
      if (Match.server === 'player') {
        ready = true;
        title = intent() ? 'Đang phát cầu' : 'LƯỢT BẠN GIAO CẦU · GIỮ SPACE';
        detail = 'Bấm hoặc giữ Space để phát cầu cao sâu chéo sân.';
      } else {
        title = 'ĐỐI THỦ PHÁT CẦU';
        detail = 'Sẵn sàng đón cầu ở ô chéo đối diện.';
      }
    } else if (Match.state === 'POINT_END') {
      title = S.event || 'Kết thúc pha cầu';
      detail = 'Chuẩn bị cho pha tiếp theo...';
    } else if (S.ball) {
      if (reachable(player, S.ball)) {
        ready = true;
        title = intent() ? 'Đang vung vợt' : 'TRONG TẦM · GIỮ SPACE';
        detail = 'Cầu đã đủ gần để đánh.';
      } else if (intent()) {
        title = 'Đã nhận lệnh · chờ cầu vào tầm';
        detail = S.assist ? 'Nhân vật đang tới vị trí đón. Cứ giữ Space.' : 'WASD tới vòng xanh nhạt và tiếp tục giữ Space.';
      } else if (S.ball.side === 'player') {
        title = 'Cầu đang tới · giữ Space ngay';
        detail = 'Đón cầu ở vòng xanh nhạt.';
      } else {
        title = 'Đã đánh trả · về vị trí trung tâm';
        detail = 'Chọn Trái / Giữa / Phải để đổi hướng cú đánh tiếp theo.';
      }
    }

    $('cueTitle').textContent = title;
    $('cueDetail').textContent = detail;
    $('cue').classList.toggle('ready', ready);
    $('pause').textContent = S.running ? 'Tạm dừng' : 'Tiếp tục';
    return;
  }

  // Training HUD (y hệt v0.3)
  ['hits', 'drops', 'best', 'rally'].forEach(id => {
    const el = $(id); if (el) el.textContent = S[id];
  });
  const total = S.hits + S.drops;
  const accEl = $('accuracy');
  if (accEl) accEl.textContent = total ? Math.round(S.hits / total * 100) + '%' : '—';
  let title = 'Chuẩn bị nhận cầu',
    detail = 'Vòng vàng: điểm cầu rơi. Vòng xanh nhạt: vị trí đứng đón.',
    ready = false;
  if (!S.running) { title = S.started ? 'Đã tạm dừng' : 'Giữ Space để đánh trả'; detail = 'Bấm Vào sân tập hoặc Space để tiếp tục.'; }
  else if (!S.ball) { title = S.event || 'Chuẩn bị pha tiếp theo'; detail = 'Ông có thể giữ Space trong suốt buổi tập.'; }
  else if (S.ball.side === 'ai') { title = 'Đã trả cầu · hồi vị'; detail = 'Chọn Trái / Giữa / Phải để đổi hướng cú đánh tiếp theo.'; }
  else if (reachable(player, S.ball)) { ready = true; title = intent() ? 'Đang vung vợt' : 'TRONG TẦM · GIỮ SPACE'; detail = 'Cầu đã đủ gần để đánh.'; }
  else if (intent()) { title = 'Đã nhận lệnh · chờ cầu vào tầm'; detail = S.assist ? 'Nhân vật đang tới vị trí đón. Cứ giữ Space.' : 'Di chuyển vào vòng xanh nhạt và tiếp tục giữ Space.'; }
  else { title = 'Cầu đang tới · giữ Space ngay'; detail = S.assist ? 'Hỗ trợ di chuyển đang bật. Ông không cần canh đúng một khung hình.' : 'WASD tới vòng xanh nhạt. Bấm hoặc giữ Space để đánh.'; }
  $('cueTitle').textContent = title; $('cueDetail').textContent = detail;
  $('cue').classList.toggle('ready', ready);
  $('pause').textContent = S.running ? 'Tạm dừng' : 'Tiếp tục';
}

// ─── Chuyển chế độ (Spec Mục 4.1) ──────────────────────────────────────────
function switchMode(newMode) {
  S.mode = newMode;
  S.running = false;
  S.ball = null;
  S.keys.clear();
  S.held = false;
  S.queuedUntil = -1;

  [player, opponent].forEach(a => {
    Object.assign(a, { x: 0, z: a.side === 'player' ? 4.5 : -4.5, vx: 0, vz: 0, phase: 0, shot: null, split: 0, speed: 0 });
    resetFeet(a);
  });

  if (newMode === 'match') {
    if (typeof Match !== 'undefined') Match.reset();
    if ($('modeTag')) $('modeTag').textContent = 'QUICK MATCH · ARCADE 11';
    if ($('begin')) $('begin').textContent = 'Vào trận đấu';
    if ($('switchModeBtn')) $('switchModeBtn').textContent = 'Chuyển sang Luyện tập (Training)';
    if ($('trainingBadge')) $('trainingBadge').style.display = 'none';
    if ($('trainingCounter')) $('trainingCounter').style.display = 'none';
    if ($('trainingPanel')) $('trainingPanel').style.display = 'none';
    if ($('matchScoreboard')) $('matchScoreboard').style.display = 'flex';
    if ($('matchCounter')) $('matchCounter').style.display = 'block';
    if ($('matchPanel')) $('matchPanel').style.display = 'block';
    $('selectMatchCard')?.classList.add('featured');
    $('selectTrainingCard')?.classList.remove('featured');
  } else {
    Object.assign(S, { hits: 0, drops: 0, rally: 0, best: 0, wait: 0.65 });
    if ($('modeTag')) $('modeTag').textContent = 'TRAINING COURT / 01';
    if ($('begin')) $('begin').textContent = 'Vào sân tập';
    if ($('switchModeBtn')) $('switchModeBtn').textContent = 'Chuyển sang Đấu nhanh (Arcade 11)';
    if ($('trainingBadge')) $('trainingBadge').style.display = 'block';
    if ($('trainingCounter')) $('trainingCounter').style.display = 'block';
    if ($('trainingPanel')) $('trainingPanel').style.display = 'block';
    if ($('matchScoreboard')) $('matchScoreboard').style.display = 'none';
    if ($('matchCounter')) $('matchCounter').style.display = 'none';
    if ($('matchPanel')) $('matchPanel').style.display = 'none';
    $('selectMatchCard')?.classList.remove('featured');
    $('selectTrainingCard')?.classList.add('featured');
  }
  hud();
}

// ─── State management ─────────────────────────────────────────────────────────
function setRunning(value) {
  S.running = value; S.started = S.started || value;
  S.keys.clear(); S.held = false; S.queuedUntil = -1;
  $('overlay').hidden = value;
  if ($('begin')) $('begin').textContent = S.started ? (S.mode === 'match' ? 'Tiếp tục trận đấu' : 'Tiếp tục tập') : (S.mode === 'match' ? 'Vào trận đấu' : 'Vào sân tập');
  if (value) $('view').focus();
}
function reset() {
  S.running = false;
  S.keys.clear();
  if (S.mode === 'match' && typeof Match !== 'undefined') {
    Match.reset();
  } else {
    Object.assign(S, { clock: 0, ball: null, wait: .65, hits: 0, drops: 0, rally: 0, best: 0, held: false, queuedUntil: -1, seed: 73, feeds: 0, lastContact: null, event: '', eventUntil: 0, contacts: [], faults: 0 });
  }
  [player, opponent].forEach(a => {
    Object.assign(a, { x: 0, z: a.side === 'player' ? 4.5 : -4.5, vx: 0, vz: 0, phase: 0, shot: null, split: 0, speed: 0 });
    resetFeet(a);
  });
  setRunning(true);
}
function aim(value) {
  S.aim = value;
  document.querySelectorAll('[data-aim]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.aim === value)));
}

// ─── Input & Buttons ────────────────────────────────────────────────────────
function arm() { if (!S.running) setRunning(true); S.held = true; S.queuedUntil = S.clock + .85; }

$('begin').onclick = () => setRunning(true);
$('pause').onclick = () => setRunning(!S.running);
$('reset').onclick = reset;

$('selectMatchCard')?.addEventListener('click', () => { switchMode('match'); });
$('selectTrainingCard')?.addEventListener('click', () => { switchMode('training'); });
$('switchModeBtn')?.addEventListener('click', () => { switchMode(S.mode === 'match' ? 'training' : 'match'); });
$('rematchBtn')?.addEventListener('click', () => {
  if ($('matchEndScreen')) $('matchEndScreen').style.display = 'none';
  if ($('modeSelectScreen')) $('modeSelectScreen').style.display = 'block';
  if (typeof Match !== 'undefined') Match.reset();
  setRunning(true);
});
$('menuBtn')?.addEventListener('click', () => {
  S.running = false;
  if ($('matchEndScreen')) $('matchEndScreen').style.display = 'none';
  if ($('modeSelectScreen')) $('modeSelectScreen').style.display = 'block';
  $('overlay').hidden = false;
});

$('assist').onchange = e => { S.assist = e.target.checked; $('view').focus(); };
$('drill').onchange = e => { S.drill = e.target.value; $('view').focus(); };
$('pace').onchange = e => { S.pace = +e.target.value; $('view').focus(); };
document.querySelectorAll('[data-aim]').forEach(b => b.onclick = () => aim(+b.dataset.aim));
$('audio').onclick = () => {
  S.sound = !S.sound;
  $('audio').textContent = 'Âm thanh: ' + (S.sound ? 'bật' : 'tắt');
  $('audio').setAttribute('aria-pressed', String(S.sound));
  tone(600);
};
$('fullscreen').onclick = async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch (e) { gameEvent('Trình duyệt chưa cho phép toàn màn hình'); }
};

$('touchhit').addEventListener('pointerdown', e => { e.preventDefault(); $('touchhit').setPointerCapture(e.pointerId); arm(); });
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => $('touchhit').addEventListener(type, () => S.held = false));

window.addEventListener('keydown', e => {
  if (e.target?.tagName === 'SELECT' || e.target?.tagName === 'INPUT') return;
  const codes = ['Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyQ', 'KeyE', 'KeyC', 'KeyP'];
  if (!codes.includes(e.code)) return;
  e.preventDefault();
  if (e.repeat) return;
  if (e.code === 'KeyP') { setRunning(!S.running); return; }
  if (e.code === 'Space') arm();
  S.keys.add(e.code);
  if (e.code === 'KeyQ') aim(-1);
  if (e.code === 'KeyE') aim(1);
  if (e.code === 'KeyC') aim(0);
});
window.addEventListener('keyup', e => { S.keys.delete(e.code); if (e.code === 'Space') S.held = false; });
window.addEventListener('blur', () => { if (S.running) setRunning(false); });
document.addEventListener('visibilitychange', () => { if (document.hidden && S.running) setRunning(false); });

// ─── Resize ───────────────────────────────────────────────────────────────────
function resize() {
  let r = $('view').getBoundingClientRect();
  camera.aspect = r.width / r.height;
  camera.updateProjectionMatrix();
  renderer.setSize(r.width, r.height, false);
}
window.addEventListener('resize', resize);
resize();

// ─── Game loop (fixed timestep, logic từ v0.3) ───────────────────────────────
let previous = performance.now(), acc = 0;
function frame(now) {
  let dt = Math.min(.1, (now - previous) / 1000);
  previous = now;
  if (S.running) { acc += dt * S.pace; while (acc >= FIXED) { tick(FIXED); acc -= FIXED; } }
  else acc = 0;
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ─── Khởi tạo chế độ Đấu nhanh (v0.4) ────────────────────────────────────────
if (typeof Match !== 'undefined') {
  Match.init({
    S, player, opponent, Rules: typeof Rules !== 'undefined' ? Rules : null,
    launch, setShot, tone, gameEvent, rnd, move, animateFeet, sample, velocity,
    range, reachable, intent, clamp, lerp, V
  });
}
switchMode('match');

// ─── QA hook (bắt buộc giữ & mở rộng theo Spec Mục 7.2) ──────────────────────
if (location.hash === '#qa') {
  window.__rally = {
    state: S, player, opponent, reset, tick, draw, sample, range, reachable, launch,
    contact, feed, renderer, camera, scene,
    match: typeof Match !== 'undefined' ? Match : null,
    rules: typeof Rules !== 'undefined' ? Rules : null,
    switchMode,
    advance(seconds) { for (let t = 0; t < seconds; t += FIXED) tick(FIXED); },
    setRunning, arm
  };
}

