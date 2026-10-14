# Shuttle Arena 3D — Phiên bản v0.4: Quick Match Arcade 11

Trò chơi cầu lông 3D WebGL chạy offline trên nền tảng Three.js và JavaScript thuần.

## 1. Cách chạy trò chơi
- **Cách đơn giản nhất:** Mở trực tiếp file `index.html` bằng trình duyệt web (Google Chrome, Microsoft Edge, Brave,... hỗ trợ WebGL tăng tốc đồ họa).
- **Hoặc chạy qua static server local:**
  ```bash
  npx serve .
  # hoặc: python -m http.server 8000
  ```
- **Chế độ kiểm thử (QA Hook):** Thêm `#qa` vào cuối URL (ví dụ `index.html#qa`) để mở quyền truy cập `window.__rally` (phơi state, rules, match state machine, và hàm `advance(seconds)` phục vụ test tự động).

---

## 2. Các chế độ chơi trong v0.4
1. **Đấu nhanh (Quick Match — MỚI ở v0.4):**
   - Ruleset: **Arcade 11** (luật riêng của game: tới 11 điểm, cách 2 điểm, tối đa 15 điểm).
   - Luật tính điểm Rally Scoring: thắng pha cầu = được 1 điểm và được giao cầu ở pha tiếp theo.
   - Giao cầu chẵn/lẻ: điểm chẵn giao ô phải, điểm lẻ giao ô trái, người nhận đứng ở ô chéo đối diện.
   - Thanh tỉ số truyền hình thể thao: hiển thị điểm hai bên, chấm đèn xác định người đang giao cầu, thông tin rally.
   - Cơ chế đánh lỗi khi cố với (Contact Quality): đứng sai vị trí hoặc vung vợt muộn khiến bóng bay ra ngoài biên (`OUT`).
   - AI Match "Thường": tốc độ di chuyển 4.65 m/s (cân bằng với người chơi), phản xạ trễ 0.22s, có sai số đón cầu ngẫu nhiên có seed.
   - Màn hình kết quả: hiển thị người chiến thắng, tỉ số chung cuộc, số pha rally, và nút Đấu lại (Rematch).

2. **Luyện tập (Training — Giữ nguyên từ v0.3):**
   - Đón và trả cầu liên tục, không tính điểm.
   - 3 bài tập: Cầu giữa sân, Luân phiên hai bên, Di chuyển nhiều vị trí.
   - 2 nhịp cầu: Chậm (0.8x) và Bình thường (1.0x).
   - Thống kê buổi tập: Số cú đánh trúng, số lần để cầu rơi, tỉ lệ đón cầu thành công, chuỗi rally tốt nhất.

---

## 3. Điều khiển (LOCKED — Giữ nguyên trải nghiệm v0.3)
- **Giữ `Space` / Giữ nút `Touch`:** Canh đánh trả hoặc phát cầu khi đến lượt.
- **`W A S D` hoặc các phím mũi tên `↑ ↓ ← →`:** Di chuyển nhân vật (WASD luôn ưu tiên ghi đè chế độ tự động di chuyển).
- **`Q`:** Đổi hướng đánh sang **Trái**.
- **`C`:** Đổi hướng đánh vào **Giữa**.
- **`E`:** Đổi hướng đánh sang **Phải**.
- **`P`:** Tạm dừng / Tiếp tục trận đấu.

---

## 4. Cấu trúc mã nguồn
```
shuttle-arena/
  index.html            ← Khung HTML, canvas 3D, overlay và TV scoreboard
  styles.css            ← Giao diện Dark theme, bảng tỉ số, panel điều khiển
  vendor/
    three.min.js        ← Thư viện Three.js r160 nhúng sẵn
  src/
    rules.js            ← Hàm thuần cho Arcade 11, serveBox, isInSingles, error offset
    match.js            ← State machine trận đấu, giao cầu, phân định điểm, AI Match
    main.js             ← Vòng lặp chính, fixed timestep 1/120, điều phối Training & Match
    court.js            ← Dựng sân đấu, lưới, ghế ngồi khán đài
    actors.js           ← Dựng nhân vật procedural 3D, xương, hoạt ảnh chân
    shuttle.js          ← Vật lý quả cầu (DRAG=0.35, GRAVITY=9.81, trajectory solver)
    training.js         ← Khởi phát bóng và thống kê chế độ Training
    hud.js              ← Cập nhật HUD
    input.js            ← Xử lý bàn phím và cảm ứng
  test/
    rules.test.js       ← Unit test tự động 20/20 PASS cho rules.js (Mục 7.1)
    match.test.js       ← Integration test tự động 5/5 PASS cho match.js
  BASELINE_v0.3_DO_NOT_EDIT.html   ← File gốc đối chiếu v0.3 (không sửa)
  README.md             ← Hướng dẫn sử dụng và tài liệu kỹ thuật
```

---

## 5. Giới hạn đã biết của v0.4 (Known Limitations)
- **Kiểu giao cầu:** v0.4 áp dụng 1 kiểu giao cầu duy nhất là giao cao sâu (flick-style), rơi vào ô nhận chéo hợp lệ.
- **Lỗi giao cầu:** Chưa có luật lỗi giao cầu phức tạp của trọng tài (ngoài lỗi cầu chạm lưới khi giao).
- **Mô hình nhân vật:** Nhân vật được dựng hoàn toàn bằng hình học lập trình (procedural code-built), chưa phải animation 3D mocap/rigging.
- **Mức AI:** Một mức độ khó duy nhất là "Thường" (Intermediate-lite).
- **Ruleset:** Chỉ áp dụng ruleset Arcade 11 (thắng ở 11 điểm, cách 2, trần 15 điểm).
