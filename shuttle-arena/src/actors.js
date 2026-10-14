// actors.js — Dựng nhân vật bằng code, resetFeet, animateFeet, renderActor
// Tách từ baseline v0.3, không đổi logic.
// Phụ thuộc: THREE global, S (game state), mat/box/cylinder/line/sphere/segment/setBone/bend từ main.js
'use strict';

function buildActors(scene, { mat, box, cylinder, line, V, clamp, lerp, S }) {
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

  function renderActor(a, ball, intent, reachable, sample) {
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
    } else if (ball && ball.side === a.side && ball.T - ball.t < .9) {
      rightHand.set(.42, hipY + .57, .07);
      racketCenter.set(.47, hipY + 1.07, .1);
      leftHand.set(-.42, hipY + .43, -.27);
      if (a.side === 'ai' || intent()) {
        for (let lead = .008; lead <= .18; lead += .008) {
          let future = sample(ball, ball.t + lead);
          if (velocity(ball, ball.t + lead).y < .4 && range(a, future)) {
            let local = group.worldToLocal(future),
              blend = 1 - lead / .18;
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

  return { actor, resetFeet, animateFeet, renderActor };
}
