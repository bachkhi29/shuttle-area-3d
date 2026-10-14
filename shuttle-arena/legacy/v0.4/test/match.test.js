// test/match.test.js — Kiểm thử tích hợp logic trận đấu Quick Match Arcade 11
const assert = require('assert');
const Rules = require('../../../src/rules.js');
const Match = require('../src/match.js');

console.log('--- Bắt đầu kiểm thử tích hợp Match Mode (Spec Mục 4 & 7) ---');

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

// Giả lập context tối thiểu cho Match
const mockPlayer = { x: 0, z: 4.5, vx: 0, vz: 0, side: 'player' };
const mockAi = { x: 0, z: -4.5, vx: 0, vz: 0, side: 'ai' };
const mockS = {
  mode: 'match',
  running: true,
  clock: 0,
  ball: null,
  keys: new Set(),
  aim: 0,
  assist: true,
  seed: 42
};

let lastTone = null;
let lastGameEvent = null;
let lastLaunched = null;

const mockContext = {
  S: mockS,
  player: mockPlayer,
  opponent: mockAi,
  Rules: Rules,
  launch: (start, end, side) => { lastLaunched = { start, end, side }; },
  setShot: () => {},
  tone: (f, d) => { lastTone = { f, d }; },
  gameEvent: (text, s) => { lastGameEvent = { text, s }; },
  rnd: () => 0.5,
  move: (a, x, z, dt, speed) => { a.x = x; a.z = z; },
  animateFeet: () => {},
  sample: () => ({ x: 0, y: 1.2, z: 0 }),
  velocity: () => ({ x: 0, y: -2, z: 0 }),
  range: () => true,
  reachable: () => true,
  intent: () => true,
  clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
  lerp: (a, b, t) => a + (b - a) * t,
  V: (x = 0, y = 0, z = 0) => ({ x, y, z })
};

// ─── Test 1: Khởi tạo và reset trạng thái ────────────────────────────────────
test('Match: Khởi tạo ở 0-0, người chơi giao trước, ô phải (x = 1.30)', () => {
  Match.init(mockContext);
  assert.strictEqual(Match.server, 'player');
  assert.strictEqual(Match.rallyId, 1);
  const scores = Match.getScores();
  assert.strictEqual(scores.player, 0);
  assert.strictEqual(scores.ai, 0);
  assert.strictEqual(Match.currentBox.boxName, 'right');
  assert.strictEqual(Match.currentBox.serverPos.x, 1.30);
  assert.strictEqual(Match.currentBox.serverPos.z, 5.00);
});

// ─── Test 2: Giao cầu và chuyển lượt theo điểm số ───────────────────────────
test('Match: Giao cầu chẵn/lẻ đổi ô chính xác', () => {
  Match.init(mockContext);
  Match.state = 'RALLY';
  
  // Điểm 0-0: Player giao ô phải
  assert.strictEqual(Match.currentBox.boxName, 'right');

  // Player ghi điểm 1-0: Player tiếp tục giao nhưng đổi sang ô trái
  Match.pointEnd('FLOOR_IN', 'player');
  assert.strictEqual(Match.getScores().player, 1);
  assert.strictEqual(Match.server, 'player');
  Match.updateServeBox();
  assert.strictEqual(Match.currentBox.boxName, 'left');
  assert.strictEqual(Match.currentBox.serverPos.x, -1.30);

  // AI ghi điểm 1-1: AI được giao cầu, điểm AI = 1 (lẻ) -> ô trái của AI
  Match.state = 'RALLY';
  Match.rallyId++;
  Match.pointEnd('OUT', 'player'); // player đánh OUT -> AI được điểm
  assert.strictEqual(Match.getScores().ai, 1);
  assert.strictEqual(Match.server, 'ai');
  Match.updateServeBox();
  assert.strictEqual(Match.currentBox.boxName, 'left');
  assert.strictEqual(Match.currentBox.serverPos.x, 1.30); // x dương là bên trái của AI nhìn về lưới
});

// ─── Test 3: Cả 4 lý do kết thúc điểm (FLOOR_IN, OUT, NET, WHIFF) ───────────
test('Match: Xử lý đúng 4 lý do điểm và phân định người thắng điểm', () => {
  Match.init(mockContext);
  Match.state = 'RALLY';

  // FLOOR_IN: người vừa đánh được điểm
  Match.pointEnd('FLOOR_IN', 'player');
  assert.strictEqual(Match.lastPointInfo.winner, 'player');
  assert.strictEqual(Match.lastPointInfo.reasonText, 'Cầu rơi trong sân');

  // OUT: đối thủ của người vừa đánh được điểm
  Match.state = 'RALLY';
  Match.rallyId++;
  Match.pointEnd('OUT', 'player'); // player đánh out -> AI được điểm
  assert.strictEqual(Match.lastPointInfo.winner, 'ai');
  assert.strictEqual(Match.lastPointInfo.reasonText, 'Cầu ngoài sân');

  // NET: đối thủ của người vừa đánh được điểm
  Match.state = 'RALLY';
  Match.rallyId++;
  Match.pointEnd('NET', 'ai'); // AI đánh chạm lưới -> player được điểm
  assert.strictEqual(Match.lastPointInfo.winner, 'player');
  assert.strictEqual(Match.lastPointInfo.reasonText, 'Cầu chạm lưới');

  // WHIFF: người vừa đánh được điểm
  Match.state = 'RALLY';
  Match.rallyId++;
  Match.pointEnd('WHIFF', 'ai'); // AI vừa đánh, player không đón kịp -> AI được điểm
  assert.strictEqual(Match.lastPointInfo.winner, 'ai');
  assert.strictEqual(Match.lastPointInfo.reasonText, 'Không đón kịp cầu');
});

// ─── Test 4: Chơi trọn 1 trận tới MATCH_END (11-9) ───────────────────────────
test('Match: Chơi trọn trận tới 11-9, xác định thắng cuộc và MATCH_END', () => {
  Match.init(mockContext);
  
  // Player thắng 10 điểm, AI thắng 9 điểm
  for (let i = 0; i < 9; i++) {
    Match.state = 'RALLY';
    Match.rallyId++;
    Match.pointEnd('FLOOR_IN', 'player');
    Match.state = 'RALLY';
    Match.rallyId++;
    Match.pointEnd('FLOOR_IN', 'ai');
  }
  Match.state = 'RALLY';
  Match.rallyId++;
  Match.pointEnd('FLOOR_IN', 'player'); // 10 - 9

  assert.strictEqual(Match.getScores().player, 10);
  assert.strictEqual(Match.getScores().ai, 9);
  assert.strictEqual(Match.isMatchEnded(), false);

  // Điểm quyết định 11 - 9
  Match.state = 'RALLY';
  Match.rallyId++;
  Match.pointEnd('FLOOR_IN', 'player');
  assert.strictEqual(Match.getScores().player, 11);
  assert.strictEqual(Match.getScores().ai, 9);
  assert.strictEqual(Match.isMatchEnded(), true);
  assert.strictEqual(Match.getWinner(), 'player');

  // Sau khi MATCH_END, gọi pointEnd tiếp không làm đổi điểm
  Match.state = 'RALLY';
  Match.rallyId++;
  Match.pointEnd('FLOOR_IN', 'ai');
  assert.strictEqual(Match.getScores().ai, 9);
});

// ─── Test 5: Rematch reset sạch sẽ ──────────────────────────────────────────
test('Match: Rematch reset điểm về 0-0, người chơi giao trước', () => {
  Match.reset();
  assert.strictEqual(Match.getScores().player, 0);
  assert.strictEqual(Match.getScores().ai, 0);
  assert.strictEqual(Match.isMatchEnded(), false);
  assert.strictEqual(Match.getWinner(), null);
  assert.strictEqual(Match.server, 'player');
  assert.strictEqual(Match.state, 'PRE_SERVE');
});

console.log('───────────────────────────────────────────────────────');
console.log(`Kết quả: ${passedTests} passed, ${failedTests} failed.`);
if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('TẤT CẢ TÍCH HỢP MATCH MODE ĐÃ PASS 100%!');
}
