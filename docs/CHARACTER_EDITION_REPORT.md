# Shuttle Arena 3D v1.4 — nhân vật 3D

## Đã cài

- Tạo nhân vật chính 3D theo ngôn ngữ tạo hình của ảnh tham khảo: đầu lớn, mắt biểu cảm, tóc xanh đậm với lọn cyan, áo cyan có viền xanh lá/coral, quần navy, giày trắng nhiều màu, vợt đỏ/cyan. Đối thủ có màu tóc, áo và vợt riêng để dễ phân biệt.
- Nhân vật dùng mesh thật trong Three.js. Các khớp tay chân được code điều khiển khi split-step, chạy đón, vung vợt và smash. Chỉ thay tạo hình; kích thước tầm đánh, tốc độ và luật tính điểm vẫn theo gameplay v1.3.
- Tạo file nguồn Blender chỉnh sửa được và GLB có armature, hai action M1. Đây là nguồn để chỉnh model trong Blender; bản chạy trên trình duyệt dựng tạo hình tương ứng trực tiếp bằng Three.js để pose contact tiếp tục bám mô phỏng từng frame. Mọi hình học và vật liệu trong dự án đều được dựng mới dựa trên phong cách ảnh người dùng cung cấp.

## Kết quả kiểm tra

- Luật: **20/20 PASS**. Contact: **27/27 PASS**.
- Browser/Chromium WebGL: **33/33 PASS**. Bao gồm thao tác chuột thật, AI, Match, Training parity với v0.3/v0.6 và pose split-step/smash.
- File GLB import lại vào Blender: **PASS**, 66 mesh gắn armature, đủ hai action `ANIM_SPLIT_STEP` và `ANIM_SMASH_OVERHEAD_JUMP`.
- HTML một file: **PASS** khởi động Match, chuyển sang Training, hiển thị cả hai nhân vật và không có JavaScript exception.

## Giới hạn hình ảnh

Nhân vật đã chơi được trong bản game hiện tại và có file Blender để tiếp tục chỉnh. Ảnh mẫu có mức hoàn thiện kiểu phim hoạt hình cao hơn: tóc điêu khắc, da/mắt, quần áo, chất liệu và ánh sáng tinh hơn. Bản v1.4 ưu tiên silhouette rõ ở camera sân, animation và hiệu năng WebGL. Để đạt gần chất lượng ảnh mẫu ở cảnh cận sẽ cần sculpt/texture thủ công hoặc asset chuyên nghiệp, rồi đưa GLB hoàn thiện vào pipeline animation runtime.
