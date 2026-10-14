// hud.js — Cập nhật HUD Training: thống kê, cue text, pause state
// Tách từ baseline v0.3, giữ nguyên logic hud().
// Phụ thuộc: $, S, reachable, intent (được truyền vào qua initHud)
'use strict';

function initHud({ $, S, reachable, intent, sample }) {

  function hud() {
    ['hits', 'drops', 'best', 'rally'].forEach(id => $(id).textContent = S[id]);
    let total = S.hits + S.drops;
    $('accuracy').textContent = total ? Math.round(S.hits / total * 100) + '%' : '—';

    let title = 'Chuẩn bị nhận cầu',
      detail = 'Vòng vàng: điểm cầu rơi. Vòng xanh nhạt: vị trí đứng đón.',
      ready = false;

    if (!S.running) {
      title = S.started ? 'Đã tạm dừng' : 'Giữ Space để đánh trả';
      detail = 'Bấm Vào sân tập hoặc Space để tiếp tục.';
    } else if (!S.ball) {
      title = S.event || 'Chuẩn bị pha tiếp theo';
      detail = 'Ông có thể giữ Space trong suốt buổi tập.';
    } else if (S.ball.side === 'ai') {
      title = 'Đã trả cầu · hồi vị';
      detail = 'Chọn Trái / Giữa / Phải để đổi hướng cú đánh tiếp theo.';
    } else if (reachable(S.player, S.ball)) {
      ready = true;
      title = intent() ? 'Đang vung vợt' : 'TRONG TẦM · GIỮ SPACE';
      detail = 'Cầu đã đủ gần để đánh.';
    } else if (intent()) {
      title = 'Đã nhận lệnh · chờ cầu vào tầm';
      detail = S.assist
        ? 'Nhân vật đang tới vị trí đón. Cứ giữ Space.'
        : 'Di chuyển vào vòng xanh nhạt và tiếp tục giữ Space.';
    } else {
      title = 'Cầu đang tới · giữ Space ngay';
      detail = S.assist
        ? 'Hỗ trợ di chuyển đang bật. Ông không cần canh đúng một khung hình.'
        : 'WASD tới vòng xanh nhạt. Bấm hoặc giữ Space để đánh.';
    }

    $('cueTitle').textContent = title;
    $('cueDetail').textContent = detail;
    $('cue').classList.toggle('ready', ready);
    $('pause').textContent = S.running ? 'Tạm dừng' : 'Tiếp tục';
  }

  return { hud };
}
