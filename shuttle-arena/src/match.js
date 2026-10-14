// match.js — Quản lý chế độ Đấu nhanh (Quick Match - Arcade 11)
// Theo đặc tả Spec v0.4: Mục 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
(function (root) {
  'use strict';

  let ctx = null; // context chứa reference tới Three, scene, player, opponent, Rules, S...

  const Match = {
    state: 'MENU', // 'MENU' | 'PRE_SERVE' | 'SERVING' | 'RALLY' | 'POINT_END' | 'MATCH_END' | 'PAUSED'
    rallyId: 1,
    pointManager: null,
    server: 'player', // người chơi giao trước ở đầu trận (Mục 4.4)
    currentBox: null,
    lastHitter: null,
    lastPointInfo: null,
    timer: 0,
    aiServeTimer: 0,
    prepTimer: 0,
    pointEndTimer: 0,
    matchStats: {
      totalRallies: 0,
      longestRally: 0,
      currentRally: 0
    },
    aiConfig: {
      speedCap: 4.65,        // Mục 4.7: tốc độ AI ở Match = 4.65 m/s (bằng người chơi)
      reactionDelay: 0.22,   // Mục 4.7: trễ 0.22s trước khi bắt đầu di chuyển tới điểm đón
      interceptNoiseMax: 0.18 // Mục 4.7: nhiễu điểm đón ±0.18m
    },
    aiState: {
      currentNoise: 0,
      aiAim: 0
    },

    init(context) {
      ctx = context;
      this.reset();
    },

    reset() {
      if (!ctx || !ctx.Rules) return;
      this.pointManager = ctx.Rules.createPointManager({ player: 0, ai: 0 }, 'player');
      this.server = 'player';
      this.rallyId = 1;
      this.lastHitter = null;
      this.lastPointInfo = null;
      this.timer = 0;
      this.aiServeTimer = 0;
      this.prepTimer = 0.5;
      this.pointEndTimer = 0;
      this.matchStats = {
        totalRallies: 0,
        longestRally: 0,
        currentRally: 0
      };
      this.updateServeBox();
      this.setupAiForRally();
      this.state = 'PRE_SERVE';
    },

    setupAiForRally() {
      if (!ctx) return;
      // Nhiễu điểm đón ±0.18m dùng rnd() có seed (Mục 4.7, không dùng Math.random)
      this.aiState.currentNoise = (ctx.rnd() - 0.5) * (this.aiConfig.interceptNoiseMax * 2);
      // Hướng đánh của AI: đổi hướng Trái/Giữa/Phải (-1, 0, 1) có seed
      const r = ctx.rnd();
      this.aiState.aiAim = r < 0.33 ? -1 : (r < 0.66 ? 0 : 1);
    },

    updateServeBox() {
      if (!ctx || !ctx.Rules || !this.pointManager) return;
      const scores = this.pointManager.getScores();
      const serverScore = scores[this.server] || 0;
      this.currentBox = ctx.Rules.serveBox(serverScore, this.server);
    },

    pointEnd(reasonCode, hitterSide) {
      if (!this.pointManager || this.state === 'POINT_END' || this.state === 'MATCH_END') return;

      const record = this.pointManager.processPoint(this.rallyId, reasonCode, hitterSide);
      if (!record) return; // Đã xử lý rallyId này rồi (idempotent, Mục 7.1.5)

      this.lastPointInfo = record;
      this.matchStats.totalRallies++;
      this.server = record.nextServer;
      this.state = 'POINT_END';
      this.pointEndTimer = 1.2; // 1.2 giây để người chơi đọc lý do điểm (Mục 4.2)

      if (ctx.S) {
        ctx.S.ball = null;
        ctx.S.wait = 0;
        ctx.S.queuedUntil = -1;
      }

      // Thông báo âm thanh và chữ
      if (record.winner === 'player') {
        ctx.tone(880, 0.12);
        ctx.gameEvent(`${record.reasonText} · Bạn được điểm!`, 1.2);
      } else {
        ctx.tone(200, 0.15);
        ctx.gameEvent(`${record.reasonText} · Đối thủ được điểm`, 1.2);
      }
    },

    tick(dt) {
      if (!ctx || !ctx.S || !ctx.S.running) return;

      const S = ctx.S;
      const player = ctx.player;
      const opponent = ctx.opponent;
      const Rules = ctx.Rules;

      S.clock += dt;

      // ─── Xử lý theo từng trạng thái trận đấu (State Machine) ───────────────
      switch (this.state) {
        case 'PRE_SERVE': {
          // Hai nhân vật di chuyển bằng motor hiện có về vị trí giao / nhận (Mục 4.4)
          this.prepTimer -= dt;
          const targetPlayer = this.server === 'player' ? this.currentBox.serverPos : this.currentBox.receiverPos;
          const targetAi = this.server === 'ai' ? this.currentBox.serverPos : this.currentBox.receiverPos;

          ctx.move(player, targetPlayer.x, targetPlayer.z, dt, 4.65);
          ctx.move(opponent, targetAi.x, targetAi.z, dt, 4.65);
          ctx.animateFeet(player, dt);
          ctx.animateFeet(opponent, dt);

          const pDist = Math.hypot(player.x - targetPlayer.x, player.z - targetPlayer.z);
          const aiDist = Math.hypot(opponent.x - targetAi.x, opponent.z - targetAi.z);

          // Khi cả hai đã vào vị trí hoặc hết thời gian chuẩn bị
          if ((pDist < 0.12 && aiDist < 0.12) || this.prepTimer <= 0) {
            this.state = 'SERVING';
            if (this.server === 'ai') {
              // AI trễ 0.6–1.0 giây trước khi phát cầu (Mục 4.4)
              this.aiServeTimer = 0.6 + ctx.rnd() * 0.4;
            }
          }
          break;
        }

        case 'SERVING': {
          const targetPlayer = this.server === 'player' ? this.currentBox.serverPos : this.currentBox.receiverPos;
          const targetAi = this.server === 'ai' ? this.currentBox.serverPos : this.currentBox.receiverPos;
          ctx.move(player, targetPlayer.x, targetPlayer.z, dt, 4.65);
          ctx.move(opponent, targetAi.x, targetAi.z, dt, 4.65);
          ctx.animateFeet(player, dt);
          ctx.animateFeet(opponent, dt);

          if (this.server === 'player') {
            // Người chơi phát cầu bằng cách giữ hoặc bấm Space (Mục 4.4)
            if (ctx.intent()) {
              const start = ctx.V(player.x + 0.25, 1.45, player.z - 0.25);
              const target = ctx.V(this.currentBox.targetPos.x, 0.08, this.currentBox.targetPos.z);
              ctx.setShot(player, start);
              ctx.tone(780, 0.05);
              ctx.launch(start, target, 'ai');
              this.lastHitter = 'player';
              this.matchStats.currentRally = 0;
              this.setupAiForRally();
              this.state = 'RALLY';
              ctx.gameEvent('Giao cầu cao sâu', 0.8);
            }
          } else {
            // AI phát cầu tự động sau khoảng trễ (Mục 4.4)
            this.aiServeTimer -= dt;
            if (this.aiServeTimer <= 0) {
              const start = ctx.V(opponent.x - 0.25, 1.45, opponent.z + 0.25);
              const target = ctx.V(this.currentBox.targetPos.x, 0.08, this.currentBox.targetPos.z);
              ctx.setShot(opponent, start);
              ctx.tone(640, 0.05);
              ctx.launch(start, target, 'player');
              this.lastHitter = 'ai';
              this.matchStats.currentRally = 0;
              this.state = 'RALLY';
              ctx.gameEvent('Đối thủ phát cầu', 0.8);
            }
          }
          break;
        }

        case 'RALLY': {
          // 1. Di chuyển người chơi
          const k = S.keys;
          const dx = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
          const dz = (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0) - (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0);
          const n = Math.hypot(dx, dz);
          let targetPlayer = { x: player.x, z: player.z };
          if (n) {
            targetPlayer = { x: player.x + dx / n, z: player.z + dz / n };
          } else if (S.assist) {
            targetPlayer = S.ball?.side === 'player' ? S.ball.intercept : { x: 0, z: 4.4 };
          }
          ctx.move(player, targetPlayer.x, targetPlayer.z, dt, 4.65);

          // 2. Di chuyển AI ở Match (Mục 4.7):
          // - speedCap = 4.65 m/s (bằng người chơi)
          // - reactionDelay = 0.22s (trước 0.22s AI đứng ở vị trí hồi vị hoặc vị trí hiện tại)
          // - interceptNoise: áp dụng độ lệch ±0.18m đã tính
          let destAi = { x: 0, z: -4.4 };
          if (S.ball?.side === 'ai') {
            if (S.ball.t >= this.aiConfig.reactionDelay) {
              // Sau 0.22s mới di chuyển tới điểm đón (kèm nhiễu)
              destAi = {
                x: ctx.clamp(S.ball.intercept.x + this.aiState.currentNoise, -2.43, 2.43),
                z: S.ball.intercept.z
              };
            } else {
              // Trong 0.22s đầu: AI đứng giữ vị trí hồi vị
              destAi = { x: 0, z: -4.4 };
            }
          }
          ctx.move(opponent, destAi.x, destAi.z, dt, this.aiConfig.speedCap);

          ctx.animateFeet(player, dt);
          ctx.animateFeet(opponent, dt);

          if (!S.ball) return;
          const b = S.ball;
          b.previous.copy(ctx.sample(b, b.t));
          b.t += dt;
          const p = ctx.sample(b, b.t);

          // 3. Kiểm tra va chạm lưới (Mục 4.5 NET):
          if (b.previous.z * p.z <= 0 && Math.abs(b.previous.z - p.z) > 0.00001) {
            const fraction = Math.abs(b.previous.z) / (Math.abs(b.previous.z) + Math.abs(p.z));
            const h = ctx.lerp(b.previous.y, p.y, fraction);
            if (h < 1.55) {
              this.pointEnd('NET', this.lastHitter);
              return;
            }
          }

          // 4. Kiểm tra người chơi tiếp xúc cầu (Contact):
          if (b.side === 'player' && ctx.intent() && ctx.reachable(player, b)) {
            const gap = Math.hypot(p.x - player.x, p.z - player.z);
            const isClean = Rules.isCleanContact(gap, p.y);
            const shotTarget = Rules.resolveShotTarget(S.aim, 'player', isClean);

            ctx.setShot(player, p);
            this.lastHitter = 'player';
            this.matchStats.currentRally++;
            this.matchStats.longestRally = Math.max(this.matchStats.longestRally, this.matchStats.currentRally);
            ctx.tone(isClean ? 860 : 720);
            S.queuedUntil = -1;

            if (isClean) {
              ctx.gameEvent('Cú đánh sạch · Cầu vào sâu');
            } else {
              ctx.gameEvent(shotTarget.isOut ? 'Cố với · Cầu bay lệch ngoài biên!' : 'Cố với · Lực đánh không chuẩn');
            }

            // Đổi hướng AI cho pha tiếp theo
            this.setupAiForRally();

            ctx.launch(p, ctx.V(shotTarget.x, 0.08, shotTarget.z), 'ai');
            return;
          }

          // 5. Kiểm tra AI tiếp xúc cầu:
          if (b.side === 'ai' && ctx.reachable(opponent, b)) {
            const gap = Math.hypot(p.x - opponent.x, p.z - opponent.z);
            const isClean = Rules.isCleanContact(gap, p.y);
            const shotTarget = Rules.resolveShotTarget(this.aiState.aiAim, 'ai', isClean);

            ctx.setShot(opponent, p);
            this.lastHitter = 'ai';
            this.matchStats.currentRally++;
            this.matchStats.longestRally = Math.max(this.matchStats.longestRally, this.matchStats.currentRally);
            ctx.tone(isClean ? 640 : 540);

            ctx.launch(p, ctx.V(shotTarget.x, 0.08, shotTarget.z), 'player');
            return;
          }

          // 6. Cầu chạm đất / hết thời gian bay:
          if (b.t >= b.T || p.y <= 0.09) {
            const inCourt = Rules.isInSingles(p.x, p.z);
            if (!inCourt) {
              // Cầu rơi ngoài sân -> Người vừa đánh chịu lỗi OUT
              this.pointEnd('OUT', this.lastHitter);
            } else {
              // Cầu rơi trong sân
              const receivingSide = b.side; // phía phải đón cầu
              const receiverInBounds = Rules.isInSinglesSide(p.x, p.z, receivingSide);

              if (receiverInBounds) {
                // Cầu rơi trong sân phía nhận mà phía nhận không đón kịp -> FLOOR_IN hoặc WHIFF
                const receiver = receivingSide === 'player' ? player : opponent;
                const distToReceiver = Math.hypot(p.x - receiver.x, p.z - receiver.z);
                const reason = distToReceiver > 1.2 ? 'FLOOR_IN' : 'WHIFF';
                this.pointEnd(reason, this.lastHitter);
              } else {
                // Rơi trong sân của chính người vừa đánh (không qua sân)
                this.pointEnd('FLOOR_IN', receivingSide);
              }
            }
          }
          break;
        }

        case 'POINT_END': {
          // Giữ khoảng nghỉ 1.2 giây cho người chơi đọc tỉ số và lý do (Mục 4.2)
          this.pointEndTimer -= dt;
          if (this.pointEndTimer <= 0) {
            if (this.pointManager.isMatchEnded()) {
              this.state = 'MATCH_END';
              ctx.tone(this.pointManager.getWinner() === 'player' ? 980 : 250, 0.35);
            } else {
              this.rallyId++;
              this.updateServeBox();
              this.setupAiForRally();
              this.state = 'PRE_SERVE';
              this.prepTimer = 0.5;
            }
          }
          break;
        }

        case 'MATCH_END': {
          // Đã xong trận, chờ người chơi bấm Rematch hoặc Về Menu
          break;
        }
      }
    },

    getScores() {
      return this.pointManager ? this.pointManager.getScores() : { player: 0, ai: 0 };
    },

    getWinner() {
      return this.pointManager ? this.pointManager.getWinner() : null;
    },

    isMatchEnded() {
      return this.pointManager ? this.pointManager.isMatchEnded() : false;
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Match;
  } else {
    root.Match = Match;
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
