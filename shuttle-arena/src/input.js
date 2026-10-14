// input.js — Xử lý bàn phím, touch, aim, pause, resize, blur
// Tách từ baseline v0.3, giữ nguyên mọi keybinding (Space/WASD/Q/C/E/P).
// Phụ thuộc: $, S, setRunning, aim, arm, event (game event fn)
'use strict';

function initInput({ $, S, setRunning, aim, arm, gameEvent }) {

  function initKeyboard() {
    window.addEventListener('keydown', e => {
      if (e.target?.tagName === 'SELECT' || e.target?.tagName === 'INPUT') return;
      const codes = ['Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD',
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'KeyQ', 'KeyE', 'KeyC', 'KeyP'];
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
    window.addEventListener('keyup', e => {
      S.keys.delete(e.code);
      if (e.code === 'Space') S.held = false;
    });
    window.addEventListener('blur', () => { if (S.running) setRunning(false); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && S.running) setRunning(false);
    });
  }

  function initTouch() {
    $('touchhit').addEventListener('pointerdown', e => {
      e.preventDefault();
      $('touchhit').setPointerCapture(e.pointerId);
      arm();
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type =>
      $('touchhit').addEventListener(type, () => S.held = false)
    );
  }

  function initControls() {
    $('begin').onclick = () => setRunning(true);
    $('pause').onclick = () => setRunning(!S.running);
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
  }

  initKeyboard();
  initTouch();
  initControls();
}
