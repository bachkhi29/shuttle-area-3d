// shuttle.js — Vật lý cầu: trajectory, sample, velocity, launch, planIntercept
// Tách từ baseline v0.3, giữ nguyên mọi hằng số và hàm.
// Phụ thuộc: THREE global, S (game state), V / clamp từ main.js
'use strict';

// Hằng số vật lý — KHÔNG THAY ĐỔI (đã khóa theo Spec K1)
const DRAG = .35, GRAVITY = 9.81, FIXED = 1 / 120;

function sample(b, t) {
  t = clamp(t, 0, b.T);
  let f = (1 - Math.exp(-DRAG * t)) / DRAG;
  return V(
    b.start.x + b.v.x * f,
    b.start.y + (b.v.y + GRAVITY / DRAG) * f - GRAVITY * t / DRAG,
    b.start.z + b.v.z * f
  );
}

function velocity(b, t) {
  let e = Math.exp(-DRAG * t);
  return V(b.v.x * e, (b.v.y + GRAVITY / DRAG) * e - GRAVITY / DRAG, b.v.z * e);
}

function trajectory(start, end, T) {
  let f = (1 - Math.exp(-DRAG * T)) / DRAG;
  return {
    start: start.clone(), end: end.clone(),
    v: V(
      (end.x - start.x) / f,
      (end.y - start.y + GRAVITY * T / DRAG) / f - GRAVITY / DRAG,
      (end.z - start.z) / f
    ),
    T, t: 0
  };
}

function planIntercept(b, side) {
  for (let t = b.T * .38; t <= b.T; t += .007) {
    let p = sample(b, t);
    if (velocity(b, t).y < 0 && p.y < 1.58 && p.y > .55 && p.z * (side === 'player' ? 1 : -1) > .75) {
      return {
        t, point: p,
        x: clamp(p.x - (side === 'player' ? .22 : -.22), -2.43, 2.43),
        z: clamp(p.z + (side === 'player' ? .42 : -.42),
          side === 'player' ? .7 : -6.3,
          side === 'player' ? 6.3 : -.7)
      };
    }
  }
  let p = sample(b, b.T * .9);
  return { t: b.T * .9, point: p, x: p.x, z: p.z };
}

function launch(start, end, side, S, trailPoints, opponent, player) {
  let T = 2.03, b;
  for (let i = 0; i < 12; i++) {
    b = trajectory(start, end, T);
    let lo = 0, hi = T;
    for (let j = 0; j < 30; j++) {
      let t = (lo + hi) / 2, p = sample(b, t);
      if ((p.z > 0) === (start.z > 0)) lo = t; else hi = t;
    }
    if (sample(b, (lo + hi) / 2).y > 1.82) break;
    T += .12;
  }
  b.side = side;
  b.intercept = planIntercept(b, side);
  b.id = S.feeds * 1000 + S.hits;
  b.previous = start.clone();
  S.ball = b;
  S.wait = 0;
  trailPoints.forEach(p => p.copy(start));
  opponent.split = side === 'ai' ? .2 : 0;
  player.split = side === 'player' ? .2 : 0;
}
