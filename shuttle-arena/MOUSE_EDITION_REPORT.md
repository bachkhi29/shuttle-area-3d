# Shuttle Arena 3D v1.3 — Mouse Edition

## Đã cài gì

- Xem video gameplay *Smash Badminton 3D: Road to 15000 Cups* do người dùng gửi (94 giây). Dựng lại bằng hình học và giao diện của dự án: sân tím, khán đài/hậu cảnh tông đào, avatar cartoon dễ phân biệt, vệt cầu cyan, thông báo cú đánh và điểm. Giữ bố cục ngang phù hợp PC.
- Bỏ điều khiển gameplay bằng phím. Nhân vật tự chạy đón cầu, người chơi nhấp để giao/đánh hoặc vuốt chuột để chọn Clear/Drop/Smash/Drive và điểm rơi. Thành phần ngang và độ sâu của nét vuốt là tọa độ liên tục; có vòng xem trước điểm rơi.
- Giải quỹ đạo thấp cho Drop/Drive/Smash. Cú được gọi là Smash khi thật sự hướng xuống và qua lưới; tư thế chưa đủ đổi sang Drive/Lift, báo đúng cú đã thực hiện. Giao diện chỉ lý do và bên được điểm.
- AI Match chờ contact sạch rồi mới swing. Nếu không tới kịp, detector xử lý bỏ lỡ thay vì AI đánh cố với liên tục và OUT. Công thức contact cố với theo Spec vẫn áp dụng đối xứng khi contact đó xảy ra. Training giữ quy trình feed/motor cũ.

## Kết quả kiểm tra

- PASS `node test/rules.test.js`: **20/20** (gồm Mục 7.1.4).
- PASS `node test/contact.test.js`: **27/27**.
- PASS `python test/browser.py`: **33/33** trên Chromium WebGL/SwiftShader. Bộ này gồm nhấp giao cầu và vuốt chuột thật trên canvas, đích X/độ sâu đúng nét vuốt, detector NET/OUT và phía được điểm, ba luật Match, rematch, Training parity chính xác với v0.3 và v0.6, màn hình hẹp và không lỗi JavaScript.
- Mô phỏng 90 giây với mỗi loại Drop/Smash: AI trả lần lượt **33/37 cú**, **0** contact cố với và **0** OUT do AI. Đây là hồi quy cho lỗi AI OUT sau 2–4 lần chạm; mô phỏng dùng người chơi luôn đánh, nên không phải phép đo độ khó cho người chơi thật.
- Vuốt xuống-phải trong bài kiểm tra chạm cầu ở cao 1,99 m: cú thực tế là Drive thấp (đúng vì chưa đủ điều kiện Smash), điểm rơi X=1,133 m và sâu 3,477 m đúng theo nét vuốt; cầu qua lưới ở 1,630 m. Động lượng đi lên ban đầu 0,698 m/s nhưng đỉnh chỉ cao hơn điểm chạm rất ít; không còn bị solver đẩy thành cú lob cao.
- PASS smoke test bản HTML một file trên Chromium/WebGL: vào Match được, không có JavaScript exception.

## Khác tài liệu gốc và bước tiếp

- Theo yêu cầu mới, điều khiển PC dùng chuột thay cho Space/WASD/J/K/L được ghi ở GDD/TDD v1.2. [GAMEPLAY_MOUSE_V1.3.md](GAMEPLAY_MOUSE_V1.3.md) là phần cập nhật có hiệu lực cho hệ điều khiển này.
- Thông số vật lý, ngưỡng contact và `CONFIG.match` không đổi. Tốc độ AI Training 5,6 m/s, Match Thường 4,65 m/s, reactionDelay 0,22 s, noise ±0,18 m vẫn theo Spec/bản trước.
- Bản v1.3 chơi được đầy đủ nhưng avatar và animation vẫn là procedural. Bước làm bản hình ảnh hoàn thiện cần rig/asset/animation nhất quán, âm thanh và thêm hiệu ứng có kiểm thử hiệu năng. Gameplay chuột và công bằng AI đã đủ ổn định để tiếp tục phần đó.
