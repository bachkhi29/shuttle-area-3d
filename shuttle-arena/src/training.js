// training.js — Bài tập Training: feed, feedTarget, thống kê buổi tập
// Tách từ baseline v0.3, giữ nguyên 3 bài tập, 2 nhịp, thống kê.
// Phụ thuộc: S (game state), launch, V, rnd, opponent, player, trailPoints
'use strict';

function initTraining({ S, launch, V, rnd, opponent, player, trailPoints, setShot }) {

  function feedTarget() {
    S.feeds++;
    if (S.drill === 'center') return V((rnd() - .5) * .22, .08, 4.5);
    let side = S.feeds % 2 ? 1 : -1;
    return V(
      side * (S.drill === 'wide' ? 1.65 : 1.25 + rnd() * .65),
      .08,
      S.drill === 'mixed' ? 2.8 + rnd() * 2.6 : 4.5
    );
  }

  function feed() {
    let start = V(opponent.x + (opponent.side === 'ai' ? -.25 : .25), 1.75, opponent.z + .35);
    setShot(opponent, start);
    launch(start, feedTarget(), 'player', S, trailPoints, opponent, player);
  }

  return { feed, feedTarget };
}
