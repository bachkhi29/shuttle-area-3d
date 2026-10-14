# Shuttle Arena 3D v0.7 — Báo cáo Bước 5 / Match MVP

Ngày 14/10/2026. Nền phát triển: bản v0.6 do chủ dự án duyệt cảm giác chơi, tiếp nối v0.6.1 Bước 4. Phạm vi Bước 5 theo Mục 9 Spec v0.4 là QA trọn gói Mục 7.1–7.3, sửa lỗi, hoàn thiện tài liệu và giao một bản chơi được.

## Đã cài gì

- Giữ nguyên gameplay Bước 4: contact sạch/cố với chỉ dùng `gap` và `height` trong `S.contacts`; AI Match Thường dùng 4,65 m/s, 0,22 giây và nhiễu ±0,18 m có seed.
- Sửa đối xứng lý do `WHIFF`: cả người chơi và AI đều nhận `WHIFF` khi đã đưa cầu vào tầm nhưng không đánh; nếu chưa từng vào tầm thì là `FLOOR_IN`.
- Sửa chẩn đoán khởi động: thiếu hoặc hỏng `vendor/three.min.js` báo lỗi gói Three.js và khóa cả hai nút bắt đầu; lỗi tạo WebGL mới hướng người dùng tới tăng tốc đồ họa. Điều này xử lý đúng sự cố bản trước từng báo nhầm WebGL.
- Mở rộng QA cho đủ bốn lý do điểm; quyền giao sau rally; ô giao chẵn/lẻ của hai phía; luật 15/21 best-of-three; AI Dễ/Khó; và trường hợp thư viện Three.js bị thiếu.
- Đóng nhãn bản phát hành `v0.7 Match MVP`, giữ `index.html` là điểm mở source và tạo file một trang offline `Shuttle_Arena_3D_v0.7_MATCH_MVP.html`.

## Kết quả kiểm tra PASS–FAIL

| Nhóm | Kết quả | Bằng chứng |
|---|---:|---|
| Rules Spec 7.1 | **PASS 20/20** | `node test/rules.test.js` |
| Contact quality 7.1.4 | **PASS 27/27** | `node test/contact.test.js` |
| Browser/integration | **PASS 26/26** | `python test/browser.py`, `qa/results.json` |
| Training parity 7.2 | **PASS** | Trạng thái bằng chính xác v0.3 và v0.6 ở 3 bài × 2 nhịp × 60 giây mô phỏng |
| Kịch bản 7.3.1 | **PASS** | Chơi mô phỏng trọn Arcade 11 tới `MATCH_END`, có Results và Rematch |
| Kịch bản 7.3.2 | **PASS** | WASD lệch marker + Space muộn ở 3 hướng → `OUT`, AI được đúng một điểm |
| Kịch bản 7.3.3 | **PASS** | Quỹ đạo thấp từ cả hai phía → `NET`, đúng text và đúng bên được điểm |
| Kịch bản 7.3.4 | **PASS** | Người thắng rally giao tiếp; bốn tổ hợp player/AI × chẵn/lẻ đứng đúng ô |
| Kịch bản 7.3.5 | **PASS** | Pause và blur dừng đồng hồ, vật lý và điểm; resume tiếp tục |
| Kịch bản 7.3.6 | **PASS** | Ba rematch liên tiếp reset 0–0, player giao trước, không rò contact |
| Kịch bản 7.3.7 | **PASS** | Match ↔ Training reset sạch, Training giữ tốc độ AI 5,6 m/s |
| Bốn lý do điểm | **PASS** | `FLOOR_IN`, `OUT`, `NET`, `WHIFF` đúng text và người thắng |
| Luật/AI kế thừa v0.6 | **PASS** | 15/21 đi hết best-of-three; Dễ/Khó giữ bộ tham số riêng |
| Runtime/console | **PASS** | Không page error; cú pháp JS hợp lệ; layout 390 px không tràn ngang |
| File một trang offline | **PASS** | Không URL ngoài; Three.js/rules/main/styles được nhúng; browser smoke test |

Không còn FAIL trong phạm vi Bước 5. Các kiểm tra browser chạy bằng Chromium/SwiftShader trong môi trường QA; cảm giác tay và GPU máy thật vẫn cần chủ dự án chơi thử.

## Thông số nào đã chỉnh khác Spec và vì sao

1. Không thay các hằng số khóa của Bước 4: `0,70 / 0,90`, `+1,10 / +2,00`, `4,65 / 0,22 / ±0,18`; không đổi `DRAG=0,35`, `GRAVITY=9,81`, fixed timestep `1/120`.
2. Giữ điều chỉnh tích hợp đã công bố ở Bước 4: Match lập điểm đón ở độ cao `2,10 m`, Training vẫn `1,58 m`. Đây là cách tránh đánh quá sớm ở mép tầm với và không thêm nguồn dữ liệu contact.
3. Không thêm thông số gameplay mới trong Bước 5. Sửa `WHIFF` chỉ làm hai phía dùng cùng điều kiện đã có.
4. Giữ luật 15/21, AI Dễ/Khó và Shot System J/K/L từ v0.6 vì đây là nền chủ dự án đã duyệt; QA lại luồng chính nhưng không nhận là mô phỏng đầy đủ luật BWF.

## Sẵn sàng sang bước tiếp theo chưa?

**Có. Match MVP đã hoàn tất Bước 5 của Spec v0.4 và sẵn sàng làm baseline game chính.** Bước hợp lý tiếp theo theo GDD/TDD v1.1 là chọn một milestone riêng: M1 Animation Feasibility trên rig thật trước khi Realistic Polish, hoặc M5 P1 gồm Replay/Stats/History/Graphics Presets. Không trộn hai milestone để còn xác định được nguyên nhân khi có lỗi.

Giới hạn còn công bố: nhân vật procedural chưa qua gate rig/mocap; giao cầu chỉ kiểu cao sâu; chưa fault/let/đổi sân đầy đủ; chưa benchmark GPU máy người dùng 10 phút; chưa Replay/History/Presets; chưa deploy public production.
