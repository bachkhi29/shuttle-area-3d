# Gameplay chuột v1.3 — ghi chú thiết kế và kiểm thử

Tài liệu này cập nhật hướng điều khiển của GDD/TDD v1.2. Các phần vật lý, luật, chất lượng tiếp xúc và Training từ Spec v0.4 vẫn giữ hiệu lực. Bản v1.3 là playtest trên PC, chưa phải bản phát hành cuối.

## Tham chiếu video

Video gameplay *Smash Badminton 3D: Road to 15000 Cups* do người dùng cung cấp (94 giây, khung dọc) gợi ra sân tím sáng, hậu cảnh sân vận động tông đào, hai nhân vật cartoon dễ phân biệt, vệt cầu cyan, bảng điểm lớn và thông báo tức thời khi đánh hoặc mất điểm. Game của dự án dùng hình học, màu sắc và giao diện tự dựng; không lấy hình ảnh, âm thanh hay nhân vật từ video. Vì người dùng chơi trên PC, bố cục giữ tỉ lệ ngang và tối ưu thao tác chuột thay vì sao chép UI điện thoại.

## Quy tắc điều khiển mới

- Nhân vật tự di chuyển bằng motor hiện có tới vị trí đón. Người chơi chỉ dùng chuột để giao cầu, đánh và chọn điểm rơi. Escape tạm dừng. Các phím di chuyển/đánh cũ không còn là điều khiển gameplay.
- Nhấp lên sân để giao cầu hoặc đánh tiêu chuẩn. Tọa độ ngang của nhấp cho đích liên tục trong sân.
- Vuốt lên: Clear sâu. Vuốt xuống ngắn: Drop gần lưới. Vuốt xuống dài: thử Smash thấp; nếu độ cao hoặc góc cầu không cho phép thì chuyển Drive/Lift và hiện đúng tên cú thực tế. Vuốt ngang thay đổi X đích liên tục, không ép về ba làn.
- Vòng cam báo điểm rơi yêu cầu; lời nhắc ngay khi vuốt báo cú dự kiến; sau khi chạm cầu báo cú đã thực hiện hoặc tiếp xúc cố với. Pha mất điểm hiện lý do và điểm thuộc về ai.
- Đường cầu thấp dùng nghiệm thời gian tối thiểu đủ vượt lưới. Cú Smash chỉ được gọi là Smash nếu vận tốc ban đầu hướng xuống và qua lưới. Cú ở tầm thấp không thể đi xuống mà vẫn vượt lưới sẽ thành Lift; phản hồi tránh tạo cảm giác vuốt xuống mà cầu bị “phóng lên” vô cớ.

## Công bằng AI và luật

AI Match chờ đến khi **thực sự** vào cửa sổ tiếp xúc sạch (gap ≤ 0,70 m; độ cao ≥ 0,90 m) mới đánh. Nếu không tới kịp, AI bỏ lỡ và luật phân xử WHIFF/FLOOR_IN; không tự động đánh cố với ở mép tầm vợt gây OUT hàng loạt. Contact cố với chủ động được tạo vẫn chịu offset theo `CONFIG.match.errorOffset` cho cả hai phía. AI giữ motor và giới hạn tốc độ, reaction delay và noise theo mức; Training giữ hành vi v0.3/v0.6.

## Giới hạn và bước sau

Avatar hiện là hình học procedural để thử tỷ lệ, màu và nhịp animation; cần asset nhân vật có rig/animation hoàn chỉnh, đa dạng cú đánh, camera, âm thanh và tối ưu hiệu năng trước bản chính. V1.3 tập trung giải quyết độ chính xác thao tác và nhịp rally trước khi đầu tư asset cuối.

Kiểm thử: `node test/rules.test.js`, `node test/contact.test.js`, `python test/browser.py`. Browser suite gồm thao tác chuột thật trên canvas, rally Drop/Smash với AI, màn hình hẹp, luật, Training parity và mô phỏng trọn trận.
