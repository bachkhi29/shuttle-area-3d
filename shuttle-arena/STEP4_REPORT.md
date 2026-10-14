# Shuttle Arena 3D v0.6.1 — Báo cáo Bước 4

Ngày 14/10/2026. Nền: gói `shuttle_area_3d.zip` do ông gửi; runtime lấy nguyên bản `Shuttle_Arena_3D_v0.6_Package/game_v06.js` trước khi chỉnh. Đã đọc Spec v0.4, README v0.6, GDD/TDD v1.1 và các tài liệu bàn giao/reference/AF2/AF3 có trong phiên. Yêu cầu hiện tại của ông cho phép code và tự giải quyết chi tiết còn mở, thay thế các dòng “chưa phê duyệt lập trình” cũ trong hồ sơ.

## Đã cài gì

- Hai bên dùng `applyStretchedError` thuần. Chất lượng chỉ đọc `gap` và `height` ở record vừa ghi vào `S.contacts`: gap ≤ 0,70 và height ≥ 0,90 là sạch; còn lại là cố với. Bỏ hoàn toàn phép xác suất theo quãng đường chạy của v0.6. Không dùng q, travel, thời gian giữ Space hoặc một RNG khác để quyết định chất lượng.
- Hằng số tại `CONFIG.match.errorOffset`: biên +1,10 m; giữa +2,00 m theo chiều sâu sân đối phương. Đích cú tiêu chuẩn ±2,75 / ∓6,90; đối xứng cho AI. Target đầu vào không bị sửa tại chỗ.
- AI Thường trong Match: `CONFIG.match.ai` = speedCap 4,65; reactionDelay 0,22; interceptNoise 0,18. Dùng `rnd()/S.seed` hiện có, giữ một noise trong toàn rally. Hướng trả luân phiên theo rallyId; seed chọn hướng đầu chu kỳ. Không gọi Math.random trong logic này.
- Cùng motor, range, cửa sổ và resolver cho người chơi/AI; không contact cầu chạm đất/quá hạn bay, sai bên hoặc ngoài tầm. Motor không teleport.
- Cải thiện HUD/menu: điểm lớn, chấm lượt giao, lý do điểm, thông tin contact mới nhất, bảng chọn hướng rõ hơn, pause có nội dung riêng và ẩn chọn luật/AI. Giữ sân/nhân vật/camera v0.6.
- Gộp điểm chạy ở `shuttle-arena/index.html`, nạp Three.js/rules/main từ local. Các fragment v0.4 không chạy chuyển vào `legacy/v0.4`; v0.6 và baseline giữ nguyên. Có công cụ tạo HTML một file offline.
- Log điểm có rallyId/reason/winner/hitter/score; ngăn gọi terminal lặp hoặc rallyId cũ. Sửa reset lựa chọn shot và chuyển từ kết quả sang Training để Space vẫn hoạt động.

## Kết quả kiểm tra PASS–FAIL

| Nhóm | Kết quả | Bằng chứng / phạm vi |
|---|---|---|
| Rules cũ | PASS 20/20 | winsMatch, serveBox, singles, chất lượng/offset, idempotency |
| applyStretchedError 7.1.4 | PASS 27/27 | Sạch, ngưỡng đúng bằng, sát hai phía ngưỡng, cao thấp, 3 hướng × 2 bên, không mutate, cấu hình tuning, target J/K/L |
| Chromium/WebGL | PASS 22/22 nhóm | `qa/results.json`, ảnh và `test/browser.py` |
| Kịch bản 7.3 số 2 | PASS | Fixture đầu rally; dùng phím D lệch khỏi marker rồi Space muộn thật qua DOM ở trái/giữa/phải. Cầu rơi OUT, AI được đúng 1 điểm, HUD “Cầu ngoài sân”. Thêm ca đối xứng AI cố với → người chơi được điểm |
| Kịch bản 7.3 số 3 | PASS với fixture | Đưa quỹ đạo thấp qua hook QA, sau đó tick detector lưới/ghi điểm/HUD thật cho cả hai phía. Đúng NET, “Cầu chạm lưới”, bên đối diện người đánh được điểm. Không nhận là cú lỗi lưới tạo tự nhiên bằng phím vì solver thường cố đưa cầu qua lưới |
| Training parity | PASS | 3 bài × 2 nhịp × 60 giây đồng hồ render tương đương; tại nhịp 0,8 mô phỏng 48 giây, nhịp 1 mô phỏng 60 giây. So sánh chính xác cả contacts, vị trí hai actor, seed, hits/drops/feeds giữa v0.3, v0.6 và bản mới. Cú tiêu chuẩn: 13/17 hits tương ứng, 0 drops |
| Motor / phản xạ / noise | PASS | Max Match 4,65 và Training 5,6; biên quãng dịch mỗi tick; chưa đuổi intercept trước 0,22 s; noise không đổi sau nhiều launch trong một rally; lặp seed tái hiện kết quả; tuần hoàn 3 hướng |
| Cửa sổ và chất lượng | PASS | Giữ Space + assist tạo cả contact sạch của người chơi/AI. Không đánh ngoài tầm, sai bên, cầu rơi đất hoặc không có cầu |
| Vòng trận | PASS smoke | Arcade 11 kết thúc 1–11 sau 12 rally, 70 contacts. Script chủ động thả ý định đánh sau 6 cú/rally; không dùng kết quả này để kết luận cân bằng AI. 3 rematch reset; chuyển Training/Match, pause/resume/blur, event trễ không cộng điểm |
| v0.6 Shot System | PASS smoke | Clear sâu/qua lưới, Drop ngắn/nhanh, Smash hợp lệ vẫn khả dụng. Không phải QA toàn bộ mọi loại cú |
| UI | PASS smoke | Đã xem ảnh 1440×1050 và kiểm tra viewport 390 px không tràn ngang. Chưa nghiệm thu điều khiển mobile |
| HTML một file | PASS qua HTTP nội bộ; file:// NOT TESTED | Vòng lặp thật chạy, không tải tài nguyên ngoài, hook QA tắt khi không có #qa. file:// bị chính sách browser quản lý chặn ERR_BLOCKED_BY_ADMINISTRATOR; chưa xác minh đường mở trực tiếp trên máy người dùng |
| JS / Console | PASS | `node --check`, không runtime exception trong kịch bản browser |

Không có FAIL còn mở trong phạm vi test Bước 4. Kết quả unit nằm trong `qa/rules-results.txt`, `qa/contact-results.txt`. Test match cũ tại legacy không được tính vào bằng chứng của bản này.

## Thông số nào đã chỉnh khác Spec và vì sao

1. **Không đổi** các số đã chốt cho Bước 4: 0,70 / 0,90; +1,10 / +2,00; 4,65 / 0,22 / ±0,18. Không đổi DRAG/GRAVITY/FIXED. AI Dễ/Khó giữ thông số v0.6; Thường được sửa từ 0,35 / ±0,25 về đúng Spec.
2. **Điều chỉnh tích hợp Match có chủ đích:** `CONFIG.match.interceptHeight=2.10` thay độ cao tìm điểm đón 1,58 của Training; Match chờ `b.intercept.t` trước contact. Thử nghiệm đầu cho thấy nếu giữ hành vi “đánh ngay khi vừa vào range”, AI đứng đúng marker vẫn contact gap 0,70–0,80 và tự OUT liên tiếp, mô phỏng 11–0 mà người chơi chỉ giao. Điều chỉnh điểm/thời điểm đón chung hai bên giải quyết lỗi này, còn đủ độ cao cho hệ cú trên cao v0.6. Không thêm nguồn đo chất lượng; Training vẫn 1,58 và cửa sổ cũ. Đây là thay đổi đáng báo cáo ngoài các hằng số Bước 4; cần tiếp tục đánh giá cảm giác ở Bước 5.
3. **Xử lý phần Spec chưa có cho J/K/L:** v0.4 chỉ mô tả target tiêu chuẩn 1,65/4,90. Bản nền v0.6 đã có target khác cho Drop/Clear/Drive/Smash. Giữ target sạch và cộng đúng offset vào target đó khi cố với. Vì vậy Drop bên cố với là 1,05+1,10=2,15 (có thể vẫn trong sân), Clear giữa là 5,95+2,00=7,95. Không đổi độ lệch để ép mọi cú v0.6 thành OUT.
4. Giữ 15/21, Dễ/Khó, J/K/L và Esc vì đây là tính năng đã có trong bản nền ông chấp nhận; không hiểu giới hạn lịch sử “chỉ Arcade 11” là yêu cầu xóa chúng. Không mở rộng thêm tính năng mới P1.
5. Sửa thời gian POINT_END 1,25 giây của v0.6 về 1,20 giây như Spec. Còn các đơn giản hóa giao cầu/luật của v0.6 được công bố, không tự nhận đúng toàn bộ BWF.

## Sẵn sàng sang Bước 5 chưa?

**Có — Bước 4 đã có triển khai và bằng chứng chạy.** Nhiều smoke test Bước 5 đã chạy hỗ trợ, nhưng chưa tuyên bố nghiệm thu cả milestone/GDD.

Bước 5 cần hoàn thiện QA trọn gói: thêm phiên chơi thủ công đủ thời lượng trên máy người dùng, đánh giá cảm giác cửa sổ contact mới, đầy đủ ô giao và các tình huống 7.3 còn lại, rà các luật 15/21 và Dễ/Khó đã kế thừa, hiệu năng/GPU và trình duyệt đích. Một rally giữ Space và assist có thể kéo dài khi hai bên luôn chạm sạch; không thêm xác suất lỗi ngầm để ép kết thúc.

Giới hạn: procedural avatar, chưa rig/mocap/GLB/M1; một kiểu giao cao sâu, chưa đầy đủ serve fault/let/đổi sân; không replay/history/presets; chưa deploy hay push lên Git. Bản này là prototype có thể chơi, không phải game hoàn chỉnh theo GDD v1.1.
