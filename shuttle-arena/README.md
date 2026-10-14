# Shuttle Arena 3D v1.2 — Arcade Swipe

Mở **`index.html`** bằng Chrome/Edge để chơi offline. Không cần npm, build, backend hay API key. Toàn bộ Three.js r160 được đóng gói tại `vendor/three.min.js`.

Gói bàn giao cục bộ có file một trang `Shuttle_Arena_3D_v1.2_ARCADE_SWIPE.html` không tải tài nguyên ngoài. Để tạo lại, chạy `python tools/build_offline.py ../Shuttle_Arena_3D_v1.2_ARCADE_SWIPE.html`. Bản source `index.html` dùng ba file local bên cạnh; nếu di chuyển riêng `index.html`, game sẽ báo đúng lỗi thiếu Three.js thay vì báo nhầm WebGL.

Nếu muốn dùng server local: `python -m http.server 8000` trong thư mục này, rồi mở `http://127.0.0.1:8000`.

## Bản nền và phạm vi

Runtime phát triển trực tiếp từ `Shuttle_Arena_3D_v0.6_Package/game_v06.js` ông đã chơi thử; không lấy runtime v0.4 cũ làm nền. `index.html` là điểm mở bản mới. Gói v0.6 và hai baseline v0.3 trong dự án được giữ nguyên để đối chiếu. Các fragment v0.4 không còn được nạp đã chuyển vào `legacy/v0.4/`.

Đây là vertical slice v1.2 theo hướng stylized arcade: Quick Match, Training, ba luật, ba mức AI và Shot System chơi trọn vẹn; avatar runtime có split-step/overhead smash procedural. Giao diện sáng, sân cyan–lime–coral, HUD theo thứ bậc, đường vuốt và impact ring giúp cú đánh dễ đọc. Giữ Three.js/JavaScript, vật lý DRAG=0.35, GRAVITY=9.81 và fixed timestep=1/120. Cài đặt người chơi được lưu cục bộ bằng schema `shuttle-arena.settings.v1`. Rig Blender/GLB M1 được giữ làm R&D, không còn chặn production.

## Điều khiển

- **Vuốt chuột trên sân**: ngang chọn Trái/Giữa/Phải; vuốt lên chọn Clear; vuốt xuống nhanh chọn Smash; giữ rồi vuốt chọn Drop. Khi thả chuột, lệnh được xếp hàng tối đa 0,85 giây và vẫn phải qua kiểm tra contact/range.
- Giữ **Space**: đánh/giao; **WASD/mũi tên** ghi đè hỗ trợ di chuyển.
- **Q/C/E** hoặc nút: trái/giữa/phải.
- **J/K/L**: chọn Drop/Clear/Smash (không đủ điều kiện Smash thì Drive); K cũng có thể khởi phát ý định đánh như v0.6.
- **P/Esc**: tạm dừng. Mất focus cũng dừng.
- **Đổi chế độ**: về menu; **Đấu lại**: reset trận.

## Contact và AI

`src/rules.js` là module thuần, chạy trong browser và Node:

- `isCleanContact(gap,height)`: đúng ngưỡng `gap <= 0.70 && height >= 0.90`, không cộng dung sai mở rộng.
- `applyStretchedError(target,contact,aim,hitterSide)`: đọc `gap/height` từ record vừa ghi vào `S.contacts`, trả bản sao target. Aim ở API này là hướng ngang theo tọa độ thế giới; AI đổi dấu từ hướng nhìn của nó trước khi gọi.
- `CONFIG.match.errorOffset = {side:1.10, deep:2.00}`. Cú tiêu chuẩn cố với rơi x=±2.75 hoặc z=∓6.90. Với J/K/L, cộng cùng số mét vào đích riêng của cú đã chọn: Drop không nhất thiết OUT, Clear giữa cố với tới |z|=7.95.
- `CONFIG.match.ai = {speedCap:4.65, reactionDelay:0.22, interceptNoise:0.18}` cho mức Thường ở Match. Nhiễu dùng `rnd()/S.seed`, lấy một lần mỗi rally, không bốc lại mỗi cú. Hướng AI tuần hoàn trái/giữa/phải theo rallyId, thứ tự bắt đầu lấy từ seed.
- Hai bên dùng cùng `move`, `range`, `reachable`, `contactWindow`, `contact` và bộ giải cú đánh. Không đánh cầu quá hạn bay, chạm đất, sai lượt hoặc ngoài tầm.
- Match chờ thời điểm intercept thay vì đánh ngay ở mép tầm với. Độ cao lập điểm đón Match là 2.10 m để còn hỗ trợ cú đánh trên cao; Training vẫn là 1.58 m. Đây là điều chỉnh tích hợp có giải thích trong báo cáo, không phải thay ngưỡng phân loại sạch/cố với.
- Training giữ tốc độ AI 5.6 m/s, không áp lỗi contact hoặc phản xạ/nhiễu của Match. Cú tiêu chuẩn đã đối chiếu trạng thái mô phỏng chính xác với cả v0.3 và v0.6, cả 3 bài × 2 nhịp.

## Kiểm thử Bước 5

```sh
node test/rules.test.js
node test/contact.test.js
python test/browser.py
```

Browser test cần Python `playwright` và Chromium (mặc định `/usr/bin/chromium`; đổi qua biến `CHROMIUM`). Tự mở server chỉ trên `127.0.0.1`, không công bố ra Internet. Đặt `QA_OUTPUT` nếu muốn đổi thư mục bằng chứng. Bộ parity cần giữ các file baseline ở thư mục cha như trong ZIP bàn giao.

Kết quả v1.2: rules `20/20` PASS, contact `27/27` PASS, browser/integration `30/30` PASS. Browser suite có thêm bộ phân loại swipe thuần và thao tác Pointer Events thật trên canvas; motion contract, các kịch bản luật, Training parity và Match tiếp tục PASS.

Mở `index.html#qa` để dùng `window.__rally`; thêm `?manual=1#qa` để chỉ advance bằng hook, vẫn render. Hook có state, match, config, rules, tick/advance, actors, range/reachable/contact, launch/trajectory, motor, startMatch/startTraining. Chế độ bình thường không phơi hook.

Browser test thao tác WASD/Space cho kịch bản OUT; ca NET dùng fixture quỹ đạo thấp qua hook để đi qua detector/cộng điểm/HUD thật, vì solver gameplay tự hỗ trợ vượt lưới. Mô phỏng trọn trận chủ động bỏ lỡ sau 6 cú mỗi rally để xác minh kết thúc; kết quả không phải benchmark cân bằng AI.

## Giới hạn

Đây vẫn là vertical slice, chưa phải bản nội dung cuối: một kiểu giao cao sâu; chưa mô phỏng đầy đủ serve fault/BWF/đổi sân; chưa có camera shake, hệ particle phong phú, SFX production hoặc benchmark GPU nhiều máy. Arcade 11 là luật riêng: tới 11, cách 2, cap 15. Asset M1 đã qua gate kỹ thuật nhưng GLB runtime chỉ còn là R&D tùy chọn.

Chi tiết chuyển động: `MOTION_M1_REPORT.md` và `../animation_research/README.md`. `OFFICIAL_RELEASE.md`, `STEP4_REPORT.md` và `STEP5_REPORT.md` được giữ làm lịch sử triển khai.
