// court.js — Dựng sân, lưới, arena (tách từ baseline v0.3, không đổi logic)
'use strict';

// Phụ thuộc: THREE global, mat() / box() / cylinder() / line() / label() từ main.js
// Được gọi 1 lần từ main.js sau khi scene/renderer đã khởi tạo.

function buildCourt(scene, { mat, box, cylinder, line, label }) {
  // --- Sân nền ---
  box(30, .2, 37, '#263039', 0, -.15, 0);
  box(8.4, .035, 16.4, '#234c49', 0, -.025, 0);
  box(6.1, .025, 13.4, '#257369', 0, 0, 0);

  // --- Vạch kẻ sân ---
  function mark(x, z, w, d) { box(w, .007, d, '#ecf1de', x, .019, z); }
  [-3.05, 3.05, -2.59, 2.59].forEach(x => mark(x, 0, .04, 13.4));
  [-6.7, 6.7, -5.94, 5.94, -1.98, 1.98].forEach(z => mark(0, z, 6.1, .04));
  [-1, 1].forEach(s => mark(0, s * 4.34, .04, 4.72));

  // --- Arena seating và tường ---
  for (let side of [-1, 1]) {
    for (let row = 0; row < 3; row++) {
      box(1.1, .26 + row * .22, 15, '#22343e', side * (6.3 + row * 1.25), row * .11, 0);
      for (let z = -6; z <= 6; z += .65) {
        box(.48, .13, .45, row % 2 ? '#526068' : '#435564', side * (6.25 + row * 1.25), .38 + row * .22, z);
        box(.48, .48, .1, '#314650', side * (6.55 + row * 1.25), .62 + row * .22, z);
      }
    }
    box(.15, 3.9, 22, '#182d36', side * 11, 1.9, 0);
    for (let z = -9; z <= 9; z += 6) {
      box(.09, .09, 3, '#cfddd1', side * 6.4, 5.6, z);
    }
  }
  box(24, 6, .15, '#1c303a', 0, 2.9, -11.5);
  label('SHUTTLE  ARENA', 0, 3, -11.39, 1.35);

  // --- Lưới cầu lông: cột 1.55m, giữa 1.524m ---
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  [-3.05, 3.05].forEach(x => {
    cylinder(V(x, 0, 0), V(x, 1.55, 0), .045, '#697781');
    box(.32, .08, .44, '#34464c', x, .04, 0);
  });
  for (let x = -3.03; x <= 3.05; x += .115)
    line(V(x, .79, 0), V(x, 1.524 + .026 * Math.abs(x) / 3.05, 0), '#a3b9b1');
  for (let y = .79; y < 1.53; y += .095)
    line(V(-3.03, y, 0), V(3.03, y, 0), '#9daea6');
  for (let x = -3.05; x < 3.05; x += .305) {
    cylinder(
      V(x, 1.524 + .026 * Math.abs(x) / 3.05, 0),
      V(x + .305, 1.524 + .026 * Math.abs(x + .305) / 3.05, 0),
      .014, '#f6efdf'
    );
  }
}
