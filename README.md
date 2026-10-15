# Shuttle Arena 3D — dự án sạch cho Antigravity

Đây là **bản mới nhất v1.4 Character Edition**. Hãy dùng **nhánh `main`** và mở **cả thư mục này** trong Antigravity. `index.html` là điểm vào game; `src/main.js` và `src/rules.js` là mã gameplay đang dùng. Không cần npm, backend hay API key.

## Chơi và phát triển

1. Tải ZIP của nhánh `main` trên GitHub rồi giải nén, hoặc `git clone` repo và dùng `main`.
2. Mở thư mục vừa giải nén trong Antigravity. Có thể mở `index.html` trực tiếp bằng Chrome/Edge. Nếu trình duyệt chặn tài nguyên local, chạy `python -m http.server 8000` tại thư mục này rồi vào `http://localhost:8000`.
3. Muốn chơi một file duy nhất, mở `PLAY_v1.4.html`. Đây là **file được tạo từ source**, không sửa trực tiếp. Tạo lại bằng `python tools/build_offline.py PLAY_v1.4.html`.

Nhấp chuột để giao/đánh thường. Vuốt lên là Clear; vuốt xuống ngắn là Drop; vuốt xuống dài là Smash khi tư thế hợp lệ. Thành phần ngang của cú vuốt chọn điểm rơi liên tục. Nhân vật tự chạy đón cầu; Esc tạm dừng.

## Cần sửa file nào?

| Đường dẫn | Vai trò |
| --- | --- |
| `index.html`, `styles.css` | Bố cục và giao diện đang chạy |
| `src/main.js` | Render 3D, điều khiển chuột, gameplay, AI và hoạt ảnh |
| `src/rules.js` | Luật, contact, sai số cú đánh; dùng chung trong test |
| `vendor/three.min.js` | Three.js r160 local; chỉ thay khi chủ động nâng thư viện |
| `tools/build_offline.py`, `PLAY_v1.4.html` | Công cụ build và bản chơi một file được sinh ra |
| `test/*.js`, `test/browser.py` | Test hồi quy; chạy khi sửa gameplay |
| `test/fixtures/` | v0.3/v0.6 **chỉ để so sánh Training**, không phải mã nguồn mới |
| `docs/` | Spec gốc, GDD/TDD, quy tắc chuột mới hơn và báo cáo v1.4 |
| `assets/*.blend`, `assets/*.glb` | Nhân vật Blender chỉnh sửa được và bản xuất để chuẩn bị pipeline asset |

Nhân vật trên sân hiện được vẽ bằng mesh trong `src/main.js`; sửa `.blend` hoặc `.glb` **chưa tự thay đổi nhân vật runtime**. Khi muốn dùng model Blender trong game, cần nối loader, animation và kiểm tra lại hitbox. Đây là việc tiếp theo, không phải tính năng đã có.

## Thứ tự tài liệu khi có khác biệt

1. `docs/GAMEPLAY_MOUSE_V1.3.md` quy định điều khiển chuột và AI mới hơn, thay phần điều khiển cũ trong GDD/TDD.
2. `docs/Spec_v0.4.md` quy định contact, sai số, Match AI và luật cơ bản.
3. `docs/Shuttle_Arena_3D_GDD_TDD_v1.2_Arcade_Swipe.docx` là định hướng sản phẩm/phạm vi tổng thể; phần keyboard/hybrid đã lỗi thời.
4. `docs/CHARACTER_EDITION_REPORT.md` ghi thay đổi và giới hạn của v1.4.

Code và test trong nhánh `main` là trạng thái thực tế khi tài liệu cũ chưa được cập nhật hết. Không cần lấy code từ các nhánh `codex/*`, `release/*` hoặc `feature/*`; chúng được giữ làm lịch sử để đối chiếu.

## Kiểm tra trước khi sửa hoặc bàn giao

```sh
node test/rules.test.js
node test/contact.test.js
python test/browser.py
```

Browser test cần Python `playwright` và Chromium; mặc định dùng `/usr/bin/chromium`, có thể đặt biến `CHROMIUM` tới binary khác. Test tự mở server tại `127.0.0.1`; ảnh và kết quả được ghi vào `work/qa/` (đã ignore). Hai HTML trong `test/fixtures/` chỉ phục vụ kiểm chứng rằng Training còn tương đương v0.3/v0.6.

Phạm vi hiện tại là bản chơi được/vertical slice, chưa có model Blender trong runtime, nhiều kiểu giao cầu, hệ âm thanh production hoặc luật BWF đầy đủ. Hãy phát triển tiếp từ source ở thư mục gốc này.
