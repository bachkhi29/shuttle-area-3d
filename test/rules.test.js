// test/rules.test.js — Kiểm thử tự động cho rules.js theo Spec Mục 7.1
const assert = require('assert');
const Rules = require('../src/rules.js');

console.log('--- Bắt đầu kiểm thử tự động rules.js (Spec Mục 7.1) ---');

let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  FAIL: ${name}`);
    console.error(`    ${err.message}`);
    failedTests++;
  }
}

// ─── 7.1.1: winsMatch ────────────────────────────────────────────────────────
test('7.1.1 winsMatch: 11-9 là thắng', () => {
  assert.strictEqual(Rules.winsMatch(11, 9), true);
});

test('7.1.1 winsMatch: 11-10 là chưa thắng', () => {
  assert.strictEqual(Rules.winsMatch(11, 10), false);
});

test('7.1.1 winsMatch: 12-10 là thắng', () => {
  assert.strictEqual(Rules.winsMatch(12, 10), true);
});

test('7.1.1 winsMatch: 10-12 là không thắng (đối xứng)', () => {
  assert.strictEqual(Rules.winsMatch(10, 12), false);
});

test('7.1.1 winsMatch: 14-13 là chưa thắng', () => {
  assert.strictEqual(Rules.winsMatch(14, 13), false);
});

test('7.1.1 winsMatch: 15-14 là thắng theo cap 15', () => {
  assert.strictEqual(Rules.winsMatch(15, 14), true);
});

test('7.1.1 winsMatch: 15-14 là tỉ số duy nhất chạm cap', () => {
  assert.strictEqual(Rules.winsMatch(15, 14), true);
  assert.strictEqual(Rules.winsMatch(14, 14), false);
  // Không có tỉ số 16-15 vì trận kết thúc ở 15
  assert.strictEqual(Rules.winsMatch(16, 15), false);
});

// ─── 7.1.2: serveBox ─────────────────────────────────────────────────────────
test('7.1.2 serveBox: Người chơi giao điểm chẵn 0, 2, 4 -> ô phải, receiver chéo', () => {
  [0, 2, 4].forEach(score => {
    const box = Rules.serveBox(score, 'player');
    assert.strictEqual(box.isEven, true);
    assert.strictEqual(box.boxName, 'right');
    assert.strictEqual(box.serverPos.x, 1.30);
    assert.strictEqual(box.serverPos.z, 5.00);
    // Người nhận ở ô chéo: x = -1.30, z = -4.50
    assert.strictEqual(box.receiverPos.x, -1.30);
    assert.strictEqual(box.receiverPos.z, -4.50);
    // Điểm rơi đích tâm ô nhận: z = -4.34
    assert.strictEqual(box.targetPos.x, -1.30);
    assert.strictEqual(box.targetPos.z, -4.34);
  });
});

test('7.1.2 serveBox: Người chơi giao điểm lẻ 1, 3, 5 -> ô trái, receiver chéo', () => {
  [1, 3, 5].forEach(score => {
    const box = Rules.serveBox(score, 'player');
    assert.strictEqual(box.isEven, false);
    assert.strictEqual(box.boxName, 'left');
    assert.strictEqual(box.serverPos.x, -1.30);
    assert.strictEqual(box.serverPos.z, 5.00);
    assert.strictEqual(box.receiverPos.x, 1.30);
    assert.strictEqual(box.receiverPos.z, -4.50);
    assert.strictEqual(box.targetPos.x, 1.30);
    assert.strictEqual(box.targetPos.z, -4.34);
  });
});

test('7.1.2 serveBox: AI giao điểm chẵn 0, 2, 4 -> ô phải (x = -1.30 theo view AI)', () => {
  [0, 2, 4].forEach(score => {
    const box = Rules.serveBox(score, 'ai');
    assert.strictEqual(box.isEven, true);
    assert.strictEqual(box.boxName, 'right');
    assert.strictEqual(box.serverPos.x, -1.30);
    assert.strictEqual(box.serverPos.z, -5.00);
    assert.strictEqual(box.receiverPos.x, 1.30);
    assert.strictEqual(box.receiverPos.z, 4.50);
    assert.strictEqual(box.targetPos.x, 1.30);
    assert.strictEqual(box.targetPos.z, 4.34);
  });
});

test('7.1.2 serveBox: AI giao điểm lẻ 1, 3, 5 -> ô trái (x = 1.30 theo view AI)', () => {
  [1, 3, 5].forEach(score => {
    const box = Rules.serveBox(score, 'ai');
    assert.strictEqual(box.isEven, false);
    assert.strictEqual(box.boxName, 'left');
    assert.strictEqual(box.serverPos.x, 1.30);
    assert.strictEqual(box.serverPos.z, -5.00);
    assert.strictEqual(box.receiverPos.x, -1.30);
    assert.strictEqual(box.receiverPos.z, 4.50);
    assert.strictEqual(box.targetPos.x, -1.30);
    assert.strictEqual(box.targetPos.z, 4.34);
  });
});

// ─── 7.1.3: isInSingles & isInSinglesSide ─────────────────────────────────────
test('7.1.3 isInSingles: (±2.59, ±6.70) là trong (chạm vạch = trong)', () => {
  assert.strictEqual(Rules.isInSingles(2.59, 6.70), true);
  assert.strictEqual(Rules.isInSingles(-2.59, 6.70), true);
  assert.strictEqual(Rules.isInSingles(2.59, -6.70), true);
  assert.strictEqual(Rules.isInSingles(-2.59, -6.70), true);
  assert.strictEqual(Rules.isInSingles(0, 0), true);
});

test('7.1.3 isInSingles: (±2.60, 4.0) là ngoài', () => {
  assert.strictEqual(Rules.isInSingles(2.60, 4.0), false);
  assert.strictEqual(Rules.isInSingles(-2.60, 4.0), false);
});

test('7.1.3 isInSingles: (0, 6.71) là ngoài', () => {
  assert.strictEqual(Rules.isInSingles(0, 6.71), false);
  assert.strictEqual(Rules.isInSingles(0, -6.71), false);
});

test('7.1.3 isInSinglesSide: Điểm rơi sai phía z không tính là rơi trong sân của phía đó', () => {
  // Cầu rơi ở z = -4.0 là sân AI, không phải sân người chơi
  assert.strictEqual(Rules.isInSinglesSide(0, -4.0, 'player'), false);
  assert.strictEqual(Rules.isInSinglesSide(0, -4.0, 'ai'), true);

  // Cầu rơi ở z = 4.0 là sân người chơi, không phải sân AI
  assert.strictEqual(Rules.isInSinglesSide(0, 4.0, 'ai'), false);
  assert.strictEqual(Rules.isInSinglesSide(0, 4.0, 'player'), true);
});

// ─── 7.1.4: Lệch cố với (Contact Quality -> Error Offset) ─────────────────────
test('7.1.4 Contact Quality: Contact sạch (gap <= 0.70 & height >= 0.90) -> đích không đổi', () => {
  assert.strictEqual(Rules.isCleanContact(0.50, 1.20), true);
  assert.strictEqual(Rules.isCleanContact(0.70, 0.90), true);

  const shotPlayerLeft = Rules.resolveShotTarget(-1, 'player', true);
  assert.strictEqual(shotPlayerLeft.x, -1.65);
  assert.strictEqual(shotPlayerLeft.z, -4.90);
  assert.strictEqual(shotPlayerLeft.isClean, true);
  assert.strictEqual(shotPlayerLeft.isOut, false);

  const shotPlayerCenter = Rules.resolveShotTarget(0, 'player', true);
  assert.strictEqual(shotPlayerCenter.x, 0);
  assert.strictEqual(shotPlayerCenter.z, -4.90);
  assert.strictEqual(shotPlayerCenter.isClean, true);
  assert.strictEqual(shotPlayerCenter.isOut, false);
});

test('7.1.4 Contact Quality: Cố với + nhắm biên -> đích x = ±2.75 (OUT biên > 2.59)', () => {
  // Người chơi cố với nhắm Phải (aim = 1) -> x = 2.75 (> 2.59 => OUT)
  const pRight = Rules.resolveShotTarget(1, 'player', false);
  assert.strictEqual(pRight.x, 2.75);
  assert.strictEqual(pRight.z, -4.90);
  assert.strictEqual(pRight.isClean, false);
  assert.strictEqual(pRight.isOut, true);

  // Người chơi cố với nhắm Trái (aim = -1) -> x = -2.75 (< -2.59 => OUT)
  const pLeft = Rules.resolveShotTarget(-1, 'player', false);
  assert.strictEqual(pLeft.x, -2.75);
  assert.strictEqual(pLeft.z, -4.90);
  assert.strictEqual(pLeft.isClean, false);
  assert.strictEqual(pLeft.isOut, true);
});

test('7.1.4 Contact Quality: Cố với + nhắm giữa -> đích z = -6.90 (OUT cuối sân < -6.70)', () => {
  const pCenter = Rules.resolveShotTarget(0, 'player', false);
  assert.strictEqual(pCenter.x, 0);
  assert.strictEqual(pCenter.z, -6.90);
  assert.strictEqual(pCenter.isClean, false);
  assert.strictEqual(pCenter.isOut, true);
});

test('7.1.4 Contact Quality: Đối xứng cho AI khi cố với', () => {
  // AI nhắm giữa (aim = 0) đánh sang sân người chơi: z = 4.90 + 2.00 = 6.90 (> 6.70 => OUT)
  const aiCenter = Rules.resolveShotTarget(0, 'ai', false);
  assert.strictEqual(aiCenter.x, 0);
  assert.strictEqual(aiCenter.z, 6.90);
  assert.strictEqual(aiCenter.isOut, true);

  // AI nhắm biên
  const aiSide = Rules.resolveShotTarget(1, 'ai', false);
  assert.strictEqual(Math.abs(aiSide.x), 2.75);
  assert.strictEqual(aiSide.isOut, true);
});

// ─── 7.1.5: pointEnd idempotent (RallyId) ────────────────────────────────────
test('7.1.5 Idempotent: pointEnd gọi 2 lần với cùng rallyId -> điểm chỉ tăng một lần', () => {
  const mgr = Rules.createPointManager({ player: 0, ai: 0 }, 'player');

  // Lần 1: rallyId = 1, player đánh ghi điểm FLOOR_IN
  const res1 = mgr.processPoint(1, 'FLOOR_IN', 'player');
  assert.notStrictEqual(res1, null);
  assert.strictEqual(res1.scores.player, 1);
  assert.strictEqual(res1.scores.ai, 0);
  assert.strictEqual(res1.winner, 'player');

  // Lần 2: gọi lại với cùng rallyId = 1 (do va chạm trễ hoặc chạm đất lần 2)
  const res2 = mgr.processPoint(1, 'FLOOR_IN', 'player');
  assert.strictEqual(res2, null, 'Lần 2 cùng rallyId phải bị bỏ qua (return null)');

  // Điểm số không được tăng thêm
  const finalScores = mgr.getScores();
  assert.strictEqual(finalScores.player, 1);
  assert.strictEqual(finalScores.ai, 0);

  // Sự kiện trễ với rallyId cũ hơn (ví dụ 0) cũng phải bị bỏ qua
  const resOld = mgr.processPoint(0, 'OUT', 'ai');
  assert.strictEqual(resOld, null);
  assert.strictEqual(mgr.getScores().player, 1);
  assert.strictEqual(mgr.getScores().ai, 0);

  // Rally tiếp theo rallyId = 2: hoạt động bình thường
  const res3 = mgr.processPoint(2, 'OUT', 'player'); // player đánh OUT -> AI được điểm
  assert.notStrictEqual(res3, null);
  assert.strictEqual(res3.winner, 'ai');
  assert.strictEqual(res3.scores.player, 1);
  assert.strictEqual(res3.scores.ai, 1);
  assert.strictEqual(res3.nextServer, 'ai');
});

console.log('───────────────────────────────────────────────────────');
console.log(`Kết quả: ${passedTests} passed, ${failedTests} failed.`);
if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('TẤT CẢ UNIT TESTS CHO rules.js ĐÃ PASS 100%!');
}
