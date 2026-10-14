# Shuttle Arena 3D v0.6 — Shot System + Đối chiếu trung thực với GDD

**File chơi chính:** `Shuttle_Arena_3D_v0.6.html` — mở bằng Chrome/Edge là chơi, offline. Source rời: `game_v06.js`. Các bản cũ giữ nguyên.

## 0. Trả lời thẳng câu hỏi của anh: đây đã là game hoàn chỉnh chưa?

**Chưa. Anh đoán đúng — tất cả những gì có tới lúc này (v0.3 → v0.6) là bản PROTOTYPE chơi được**, và đây là vị trí của nó khi đối chiếu đúng roadmap M0–M6 trong GDD/TDD v1.1:

| Mốc trong doc | Yêu cầu | Trạng thái hiện tại |
|---|---|---|
| M0 – Design Approved | GDD/TDD được duyệt, quyết định còn mở được chốt | **Chưa** — chính doc ghi "chưa phê duyệt lập trình"; quyết định engine (D-09: PlayCanvas + TypeScript) vẫn OPEN. Các bản prototype đang chạy Three.js/JS thuần để kiểm chứng gameplay, không phải nền sản xuất đã khóa |
| M1 – Animation Feasibility | 1 clip rigged chạy được, qua gate G1–G7 | **Chưa qua** — Handoff Pack kết luận G2–G7 NOT TESTED, chưa có .blend/.glb/rig nào; nhân vật hiện tại dựng bằng code. Đây là gate cứng của doc: chưa qua M1 thì chưa nên khóa sản xuất hình ảnh |
| M2 – First Playable | Sân, movement, camera, physics, rally | **Đạt ở mức prototype** — có đủ, vật lý drag + fixed timestep 1/120 đúng hướng TDD B4 |
| M3 – Match MVP | AI 1v1, luật, training, menu, chơi trọn trận | **Đạt ở mức prototype** (v0.4–v0.6): luật 11/15/21, AI 3 cấp, training, menu, shot system |
| M4 – Realistic Polish | PBR, âm thanh, mocap footwork | **Chưa** — bị chặn bởi M1 |
| M5 – Feature P1 | Replay, thống kê, lịch sử trận, graphics presets | **Chưa** |
| M6 – Production | Test, optimize, build, deploy, smoke test | **Chưa** |

Nói cách khác: phần **luật chơi, AI, shot solver, state machine** đang làm là phần "não" mang sang bản chính được nguyên vẹn; phần **hình người/rig/animation realistic** — phần tốn tâm huyết nhất đúng như anh nói — vẫn đang chờ qua gate M1. Em sẽ không gọi bất kỳ bản nào là "game hoàn chỉnh" cho tới khi đối chiếu đủ bảng này.

## 1. v0.6 có gì mới — Shot System theo đúng GDD (A6/A7 + bảng phím)

- **J = Drop / Net:** cầu nhanh vừa qua lưới, rơi gần lưới phía đối thủ (điểm rơi z = 2,5 m), kéo đối thủ chạy lên. Chọn trước khi đánh; HUD hiện cú đang chọn.
- **K = Clear / Lift:** cầu cao, đỉnh quỹ đạo rõ, rơi sát vạch cuối sân (5,95 m) — đẩy đối thủ về sau, giải nguy khi bị ép. **K cũng dùng để giao cầu** ở pha pre-serve, đúng ghi chú trong doc.
- **L = Smash / Drive:** nếu điểm tiếp xúc đủ cao và đủ gần lưới, hệ thống **tự kiểm tra quỹ đạo có qua nổi lưới không** rồi mới cho Smash (bay 0,5 giây, cắm xuống giữa sân); không đủ điều kiện thì tự hạ thành **Drive** (cầu ngang nhanh, sâu 4,7 m) thay vì cho anh cắm lưới oan.
- **Space** giữ nguyên là cú tiêu chuẩn; chọn cú xong tự trở về Tiêu chuẩn sau mỗi lần đánh. Thêm **Esc = tạm dừng** (bên cạnh P) theo đúng bảng phím của doc.
- **AI cũng dùng shot system** (utility rút gọn theo TDD B6): bị ép xa thì Clear giải nguy, thấy anh đứng sâu thì Drop kéo lên, có bóng cao gần lưới thì Smash theo tỉ lệ hiếu chiến của từng cấp độ (Rookie 12% / Thường 22% / Expert 32%). AI dùng chung Shot Resolver và motor như người chơi — không gian lận tọa độ.

## 2. Kiểm chứng (31/31 PASS) — và một lỗi thật bị bắt ngay trong lúc test

- Test quỹ đạo theo đúng "kiểm thử mong đợi" của GDD: Clear qua lưới > 1,95 m và đỉnh > 2,8 m rơi cuối sân; Drop qua lưới thấp, thời gian bay < 1,45 s, rơi gần lưới; Smash bay đúng 0,5 s và qua lưới; Drive phẳng/nhanh; Smash từ cuối sân bị Resolver từ chối → Drive.
- **Lỗi thật đã bị test bắt được:** bản nháp đầu tiên cho AI smash từ cuối sân — mô phỏng cho thấy AI cắm lưới 6 lần/trận (điểm "Cầu chạm lưới" cho người chơi). Đã sửa bằng kiểm tra tính khả thi quỹ đạo trong Shot Resolver như trên; chạy lại: hết cắm lưới, tỉ số cân bằng.
- Mô phỏng trọn trận (người chơi máy có dùng J/K/L luân phiên): Arcade Thường **11–8**, Classic Thường **AI thắng 2–0**, Preview Dễ **15–11**, Arcade Khó **AI thắng 11–8** — hai bên đều thắng được, không còn lệch một chiều.
- Test hồi quy lỗi Space của v0.5: vẫn PASS đủ 6/6. Training parity: nguyên vẹn.

## 3. Còn thiếu so với doc (ghi rõ để anh nắm, chưa làm ở v0.6)

- **M1 Animation** (rig, clip clear/drop/smash dạng ANIM_* theo AF protocol, gate G1–G7) — cần asset và quy trình Blender/mocap, không thay bằng code được.
- M4 polish (PBR/âm thanh/mocap footwork), M5 (Replay snapshot, MatchStats đầy đủ gồm shotAttemptsByType, lịch sử localStorage, graphics presets Low/Medium/High), M6 (build/deploy/smoke test).
- Chi tiết nhỏ theo doc chưa có: **Shift = burst movement**, aim bằng chuột theo thiết kế gốc (hiện dùng Q/C/E + assist), AI dạng FSM đầy đủ 7 trạng thái (hiện là utility rút gọn), collision swept cho smash (hiện kiểm tra tại điểm qua lưới), giao cầu thêm biến thể ngắn (hiện 1 kiểu cao sâu).

Hướng đi tiếp (khi anh bảo làm tiếp): phần **code được ngay** là M5-thống kê/lịch sử + Shift burst; phần **cần anh tham gia quyết định** là M1 — chọn footage và đi theo AF protocol trong Handoff Pack (chọn 1 clip overhead clear + 1 clip split-step trước, như chính doc gợi ý ở phần E).
