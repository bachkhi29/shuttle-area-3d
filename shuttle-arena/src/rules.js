// rules.js — Hàm thuần cho Arcade 11 (Spec Mục 4.3, 4.4, 4.5, 4.6, 7.1)
// Không import Three.js, không DOM, không Math.random(), không đọc giờ hệ thống.
// Dùng được cả trong browser (window.Rules) và Node.js (module.exports).
(function (root) {
  'use strict';

  const CONFIG = {
    rulesetName: 'Arcade 11',
    rulesetDesc: 'Arcade 11 — luật riêng của game: tới 11, cách 2, tối đa 15',
    targetScore: 11,
    leadRequired: 2,
    maxScoreCap: 15,
    court: {
      widthHalf: 2.59,      // vạch biên đơn x = ±2.59
      lengthHalf: 6.70,     // vạch cuối sân z = ±6.70
      shortServiceZ: 1.98,  // vạch giao cầu ngắn z = ±1.98
      netZ: 0.0,
      netHeightCenter: 1.524,
      netHeightPost: 1.55
    },
    serve: {
      playerStandZ: 5.00,
      playerReceiveZ: 4.50,
      aiStandZ: -5.00,
      aiReceiveZ: -4.50,
      boxX: 1.30,           // ±1.30 cho ô phải/trái
      serviceTargetZ: 4.34  // trung điểm giữa vạch giao ngắn 1.98 và biên cuối 6.70
    },
    match: {
      interceptHeight: 2.10, // Match-only planned contact; Training stays at 1.58 m.
      errorOffset: { side: 1.10, deep: 2.00 },
      ai: { speedCap: 4.65, reactionDelay: 0.22, interceptNoise: 0.18 }
    },
    contactQuality: {
      cleanGapMax: 0.70,    // gap <= 0.70
      cleanHeightMin: 0.90 // y >= 0.90
    },
    pointReasons: {
      FLOOR_IN: { code: 'FLOOR_IN', text: 'Cầu rơi trong sân' },
      OUT: { code: 'OUT', text: 'Cầu ngoài sân' },
      NET: { code: 'NET', text: 'Cầu chạm lưới' },
      WHIFF: { code: 'WHIFF', text: 'Không đón kịp cầu' }
    }
  };

  /**
   * Kiểm tra điều kiện thắng trận Arcade 11 (Mục 4.3, 7.1.1):
   * (my >= 11 && my - opp >= 2) || my == 15
   */
  function winsMatch(my, opp) {
    if (typeof my !== 'number' || typeof opp !== 'number') return false;
    if (my < CONFIG.targetScore) return false;
    if (my === CONFIG.maxScoreCap) return true;
    if (my > CONFIG.maxScoreCap) return false; // Không vượt quá cap 15
    return (my - opp) >= CONFIG.leadRequired;
  }

  /**
   * Tính ô giao cầu và ô nhận cầu theo điểm số (Mục 4.4, 7.1.2)
   * serverScore: điểm hiện tại của người giao
   * serverSide: 'player' | 'ai'
   *
   * Quy ước:
   * Điểm chẵn (0, 2, 4...) -> ô phải
   * Điểm lẻ (1, 3, 5...)   -> ô trái
   * Phải/trái nhìn về phía lưới:
   * - Người chơi (z > 0 nhìn về -z): phải là x > 0 (+1.30), trái là x < 0 (-1.30)
   * - AI (z < 0 nhìn về +z): phải là x < 0 (-1.30), trái là x > 0 (+1.30)
   * Người nhận luôn đứng ở ô chéo đối diện.
   */
  function serveBox(serverScore, serverSide) {
    const isEven = (serverScore % 2 === 0);
    const serverBoxName = isEven ? 'right' : 'left';
    const receiverBoxName = isEven ? 'right' : 'left';

    let serverX, serverZ, receiverX, receiverZ, targetX, targetZ;

    if (serverSide === 'player') {
      serverX = isEven ? CONFIG.serve.boxX : -CONFIG.serve.boxX;
      serverZ = CONFIG.serve.playerStandZ;

      // Người nhận (AI) ở ô chéo đối diện:
      // Player giao từ ô phải (x=1.30, z=5.0) -> sang nửa sân AI (z < 0).
      // Ô đối diện cùng x=1.30 ở phía AI là ô bên trái của AI (nhìn về phía lưới).
      // Theo Spec Mục 4.4: người giao (x=±1.30, z=±5.00), người nhận ở ô chéo phía đối diện (x=∓1.30, z=∓4.50)
      // Chú ý dấu trong Spec:
      // Người giao: (x = ±1.30 ; z = ±5.00)
      // Người nhận: (x = ∓1.30 ; z = ∓4.50)
      // Điểm rơi đích: (x = ∓1.30 ; z = ∓4.34)
      // Tức nếu serverX là +1.30 thì receiverX là -1.30, targetX là -1.30!
      // Đảm bảo khớp đúng Spec 4.4:
      receiverX = -serverX;
      receiverZ = CONFIG.serve.aiReceiveZ;

      targetX = receiverX;
      targetZ = -CONFIG.serve.serviceTargetZ;
    } else {
      // AI giao
      serverX = isEven ? -CONFIG.serve.boxX : CONFIG.serve.boxX;
      serverZ = CONFIG.serve.aiStandZ;

      receiverX = -serverX;
      receiverZ = CONFIG.serve.playerReceiveZ;

      targetX = receiverX;
      targetZ = CONFIG.serve.serviceTargetZ;
    }

    return {
      serverSide,
      serverScore,
      isEven,
      boxName: serverBoxName,
      serverPos: { x: serverX, y: 0, z: serverZ },
      receiverPos: { x: receiverX, y: 0, z: receiverZ },
      targetPos: { x: targetX, y: 0.08, z: targetZ }
    };
  }

  /**
   * Kiểm tra toạ độ (x, z) có nằm trong sân đơn hay không (Mục 7.1.3).
   * Chạm vạch = TRONG (chấp nhận |x| <= 2.59 và |z| <= 6.70).
   * Sai số làm tròn cho phép 1e-4 để xử lý floating point.
   */
  function isInSingles(x, z) {
    const EPS = 1e-4;
    return Math.abs(x) <= (CONFIG.court.widthHalf + EPS) &&
           Math.abs(z) <= (CONFIG.court.lengthHalf + EPS);
  }

  /**
   * Kiểm tra toạ độ có nằm trong nửa sân của bên nhận hay không:
   * player side: z > 0 (từ netZ tới lengthHalf)
   * ai side: z < 0 (từ -lengthHalf tới netZ)
   */
  function isInSinglesSide(x, z, side) {
    const EPS = 1e-4;
    if (!isInSingles(x, z)) return false;
    if (side === 'player') {
      return z >= -EPS && z <= (CONFIG.court.lengthHalf + EPS);
    } else {
      return z <= EPS && z >= -(CONFIG.court.lengthHalf + EPS);
    }
  }

  /**
   * Kiểm tra chất lượng tiếp xúc (Mục 4.6):
   * SẠCH: gap <= 0.70 VÀ height >= 0.90
   * CỐ VỚI: ngược lại
   */
  function isCleanContact(gap, height) {
    return (gap <= CONFIG.contactQuality.cleanGapMax) &&
           (height >= CONFIG.contactQuality.cleanHeightMin);
  }

  /** Contact is the record already appended to S.contacts. Aim is world-space X.
   * Return a copy; never mutate the chosen target or the recorded measurement.
   * v0.6 shot variants receive the same metre offsets on their own target.
   */
  function applyStretchedError(target, contact, aim, hitterSide) {
    const result = { ...target };
    if (isCleanContact(contact.gap, contact.height)) return result;
    if (aim !== 0) result.x += Math.sign(aim) * CONFIG.match.errorOffset.side;
    else result.z += (hitterSide === 'player' ? -1 : 1) * CONFIG.match.errorOffset.deep;
    return result;
  }

  /**
   * Tính điểm rơi dự kiến theo chất lượng cú đánh (Mục 4.6, 7.1.4):
   * - SẠCH: đúng đích theo aim (-1: Trái, 0: Giữa, 1: Phải)
   * - CỐ VỚI:
   *   + aim !== 0: lệch thêm 1.10m ra phía biên đó
   *   + aim === 0: lệch thêm 2.00m sâu về cuối sân
   * hitterSide: 'player' | 'ai'
   */
  function resolveShotTarget(aim, hitterSide, isClean) {
    let baseX, baseZ;
    if (hitterSide === 'player') {
      baseX = aim * 1.65;
      baseZ = -4.90; // Sang sân AI
    } else {
      // AI đánh sang sân người chơi
      baseX = -aim * 1.65;
      baseZ = 4.90;
    }

    if (baseX === 0) baseX = 0;
    if (baseZ === 0) baseZ = 0;

    if (isClean) {
      return { x: baseX, z: baseZ, isClean: true, isOut: false };
    }

    // Cố với: tính offset
    let targetX = baseX;
    let targetZ = baseZ;

    if (aim !== 0) {
      // Lệch thêm 1.10m ra phía biên đang nhắm
      if (hitterSide === 'player') {
        const sign = aim > 0 ? 1 : -1;
        targetX = sign * (1.65 + CONFIG.match.errorOffset.side); // ±2.75
      } else {
        const sign = aim > 0 ? -1 : 1;
        targetX = sign * (1.65 + CONFIG.match.errorOffset.side); // ∓2.75
      }
    } else {
      // Nhắm giữa: lệch thêm 2.00m sâu về cuối sân
      if (hitterSide === 'player') {
        targetZ = -4.90 - CONFIG.match.errorOffset.deep; // -6.90
      } else {
        targetZ = 4.90 + CONFIG.match.errorOffset.deep;  // +6.90
      }
    }

    // Chuẩn hóa -0 thành 0 để tránh vấn đề so sánh dấu
    if (targetX === 0) targetX = 0;
    if (targetZ === 0) targetZ = 0;

    const isOut = !isInSingles(targetX, targetZ);
    return { x: targetX, z: targetZ, isClean: false, isOut };
  }

  /**
   * Xác định bên được điểm theo mã lý do kết thúc rally (Mục 4.5):
   * - FLOOR_IN: người vừa đánh được điểm
   * - OUT: đối thủ của người vừa đánh được điểm
   * - NET: đối thủ của người vừa đánh được điểm
   * - WHIFF: người vừa đánh được điểm
   */
  function resolvePointWinner(reasonCode, lastHitterSide) {
    const opp = lastHitterSide === 'player' ? 'ai' : 'player';
    switch (reasonCode) {
      case 'FLOOR_IN':
      case 'WHIFF':
        return lastHitterSide;
      case 'OUT':
      case 'NET':
        return opp;
      default:
        return opp;
    }
  }

  /**
   * Quản lý idempotent kết thúc điểm (Mục 4.2, 7.1.5):
   * Không bao giờ tính 2 điểm cho cùng 1 rallyId.
   */
  function createPointManager(initialScore = { player: 0, ai: 0 }, initialServer = 'player') {
    let lastProcessedRallyId = -1;
    const scores = { player: initialScore.player || 0, ai: initialScore.ai || 0 };
    let server = initialServer;
    let matchEnded = false;
    let winner = null;
    const history = [];

    function processPoint(rallyId, reasonCode, lastHitterSide) {
      if (matchEnded) return null;
      if (rallyId <= lastProcessedRallyId) {
        // Bỏ qua sự kiện tới muộn
        return null;
      }
      lastProcessedRallyId = rallyId;

      const pointWinner = resolvePointWinner(reasonCode, lastHitterSide);
      scores[pointWinner]++;

      // Người thắng điểm được giao cầu ở điểm tiếp theo (rally scoring)
      server = pointWinner;

      const reasonInfo = CONFIG.pointReasons[reasonCode] || { code: reasonCode, text: reasonCode };

      if (winsMatch(scores[pointWinner], scores[pointWinner === 'player' ? 'ai' : 'player'])) {
        matchEnded = true;
        winner = pointWinner;
      }

      const pointRecord = {
        rallyId,
        reason: reasonInfo.code,
        reasonText: reasonInfo.text,
        hitter: lastHitterSide,
        winner: pointWinner,
        scores: { ...scores },
        nextServer: server,
        matchEnded,
        matchWinner: winner
      };

      history.push(pointRecord);
      return pointRecord;
    }

    return {
      getScores: () => ({ ...scores }),
      getServer: () => server,
      isMatchEnded: () => matchEnded,
      getWinner: () => winner,
      getLastProcessedRallyId: () => lastProcessedRallyId,
      getHistory: () => [...history],
      processPoint
    };
  }

  const Rules = {
    CONFIG,
    winsMatch,
    serveBox,
    isInSingles,
    isInSinglesSide,
    isCleanContact,
    applyStretchedError,
    resolveShotTarget,
    resolvePointWinner,
    createPointManager
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Rules;
  } else {
    root.Rules = Rules;
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
