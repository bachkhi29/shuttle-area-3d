# Shuttle Arena 3D v1.0 — Official MVP

**Ngày phát hành:** 14/10/2026  
**Nền:** v0.7 Match MVP đã hoàn tất Bước 5 của Spec v0.4.

## Phạm vi chính thức

- Quick Match chơi trọn trận với ruleset Arcade 11, Preview 15 và Classic 21.
- AI Dễ, Thường và Khó; AI dùng motor, tầm đánh và Shot Resolver chung với người chơi.
- Training giữ hành vi baseline v0.3, gồm ba bài tập và hai nhịp cầu.
- Shot System: Standard, Drop/Net, Clear/Lift, Smash/Drive.
- State machine, giao cầu chẵn/lẻ, bốn lý do điểm, pause, kết quả và rematch.
- HUD thể thao, giao diện co giãn, âm thanh cơ bản, toàn màn hình.
- Lưu cài đặt assist, âm thanh, bài tập, nhịp, ruleset và AI bằng `localStorage` schema version 1.

## Kết quả phát hành

| Nhóm | Kết quả |
|---|---:|
| Rules | PASS 20/20 |
| Contact quality | PASS 27/27 |
| Browser/integration | PASS 27/27 |
| Training parity với v0.3 và v0.6 | PASS |
| Standalone HTML browser smoke | PASS |
| Source ZIP tải mới từ GitHub | PASS |
| JavaScript syntax và runtime console | PASS |

Không thay các hằng số gameplay khóa trong Spec. Match vẫn dùng điểm đón 2,10 m đã công bố ở Bước 4; Training giữ 1,58 m.

## Ý nghĩa “Official MVP”

Đây là bản game chính thức có thể chơi và phát hành trong phạm vi gameplay MVP. Nhân vật hiện vẫn dựng bằng code. Bản này không tuyên bố đã đạt realistic/mocap, Replay, History, Graphics Presets hoặc mô phỏng đầy đủ luật trọng tài BWF. Những phần đó thuộc các milestone nâng cấp riêng trong GDD/TDD v1.1.
