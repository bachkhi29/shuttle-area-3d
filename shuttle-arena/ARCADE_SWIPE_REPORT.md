# Báo cáo v1.2 — Arcade Swipe vertical slice

## Đã cài gì

- Mouse swipe trên canvas bằng Pointer Events: ngang chọn lane, lên chọn Clear, xuống nhanh chọn Smash, giữ/chậm chọn Drop.
- Gesture chỉ gọi `aim()`, `setShotType()` và `arm()`; bộ giải `range/contact/physics` vẫn quyết định cú đánh hợp lệ.
- Dead-zone 28 px, lane threshold 18 px, vertical threshold 18 px, fast speed 600 px/s, smash distance 96 px, hold 280 ms, command queue 0,85 s nằm chung trong `INPUT_CONFIG.swipe`.
- Giao diện stylized arcade sáng: sân cyan–green, nhân vật cyan/coral, panel trắng trong, HUD tỉ số rõ, menu có thứ bậc, responsive mobile.
- Đường vuốt, nhãn cú đánh, hướng dẫn trong sân và impact ring tại tọa độ contact. Có `prefers-reduced-motion`.
- Keyboard/Space/WASD/QCE/JKL và touch-hit cũ vẫn hoạt động.

## Kết quả kiểm tra PASS–FAIL

- `node test/rules.test.js`: **20 PASS / 0 FAIL**.
- `node test/contact.test.js`: **27 PASS / 0 FAIL**.
- `python test/browser.py`: **30 PASS / 0 FAIL**.
- Bản một file `Shuttle_Arena_3D_v1.2_ARCADE_SWIPE.html`: **offline smoke PASS**, không tải script/CSS từ ngoài và không có JavaScript exception.
- Training parity với v0.3 và v0.6: **PASS** cho 3 drill × 2 pace × 60 giây.
- Kịch bản contact cố với OUT, cầu chạm lưới, AI Match, full match/rematch, mobile overflow, console error: **PASS**.

## Thông số khác Spec và lý do

- Không đổi thông số gameplay Spec v0.4: contact sạch `gap <= 0,70`, cao `>= 0,90`; offset biên `1,10 m`; offset sâu `2,00 m`; AI Thường `4,65 m/s`, `0,22 s`, `±0,18 m`.
- Match tiếp tục dùng intercept height `2,10 m` theo điều chỉnh đã ghi ở Bước 4 để tránh đánh sớm gây OUT hàng loạt; Training giữ baseline cũ.
- Các ngưỡng swipe là input mới của v1.2, chưa có trong Spec v0.4. Chúng nằm trong một config để playtest và chỉnh mà không tác động physics.

## Sẵn sàng bước tiếp theo chưa

**Có.** Vertical slice đủ ổn để sang pass tiếp theo: camera response có giới hạn, particle/SFX production, pose lunge/recovery, art pass nhân vật–arena và benchmark thiết bị.
