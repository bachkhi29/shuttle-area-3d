# Shuttle Arena 3D — Đặc tả v0.4: Quick Match Arcade 11

**Phiên bản:** v0.4-spec-1.0 — Ngày 14/10/2026
**Baseline bắt buộc:** `Shuttle_Arena_3D_Rally_Lab_v0.3.html` (Training Court, Three.js, file đơn offline) — bản này chủ dự án đã chơi thử và xác nhận ổn. **Không sửa đè lên file baseline.** Mọi thay đổi làm trên bản sao / project mới.
**Tài liệu gốc phải tôn trọng:** GDD/TDD v1.1 (13/10/2026) và Codex Handoff Pack (14/10/2026). Spec này chỉ cụ thể hoá *một* milestone nhỏ từ các tài liệu đó, không thay thế chúng.
**Cách làm việc:** vibe coding. Agent tự viết, tự chạy, tự kiểm tra và giao bản chơi được. Chủ dự án chỉ chơi và phản hồi cảm giác. Giao **một lần trọn gói** khi xong milestone, không giao bản dở để duyệt từng bước.

---

## 1. Mục tiêu của v0.4 (chỉ một câu)

Biến bản Training v0.3 thành một **vertical slice có trận đấu thật**: thêm chế độ **Quick Match — Arcade 11** chơi được từ đầu đến cuối (giao cầu → rally → ghi điểm → thắng/thua → rematch), trong khi **giữ nguyên 100% cảm giác điều khiển và chế độ Training của v0.3**.

v0.4 thành công = một người mở game, chọn Quick Match, chơi trọn một trận tới khi có người thắng, bấm Rematch chơi tiếp được — không lỗi chặn, không tính sai điểm.

## 2. Quyết định đã khóa cho v0.4

| # | Quyết định | Lý do / nguồn |
|---|---|---|
| K1 | **Giữ Three.js + JavaScript thuần**, không đổi engine ở v0.4 | v0.3 đang chạy ổn trên Three.js. Đổi engine (PlayCanvas vẫn chỉ là *ứng viên* theo GDD D-09/DR-07) và thêm tính năng trong cùng một bản là hai biến số cùng lúc — cấm. Đánh giá lại engine chỉ sau v0.4, bằng benchmark riêng. |
| K2 | Chỉ làm **1 ruleset: Arcade 11** (luật riêng của game, ghi rõ trong UI là luật riêng, không nhận là luật BWF) | GDD E2 đã định nghĩa Arcade 11: thắng 11, cách 2, cap 15. Ruleset 15/21 để v0.5+. |
| K3 | Chỉ làm **1 mức AI: "Thường"** (Intermediate-lite) | 3 cấp Rookie/Intermediate/Expert là P0 của GDD nhưng tách sang v0.5, sau khi vòng trận đấu đã đúng. |
| K4 | Giữ nguyên điều khiển v0.3: giữ **Space** để đánh, **WASD/mũi tên** di chuyển (ghi đè auto-assist), **Q/C/E** hoặc nút bấm chọn hướng Trái/Giữa/Phải, **P** tạm dừng | Đây là phần đã được chủ dự án xác nhận chơi ổn. Không đổi phím, không thêm phím đánh mới ở v0.4. |
| K5 | Giữ nguyên hỗ trợ di chuyển (auto-assist tới điểm đón) và aim assist 3 hướng | Quyết định LOCKED trong GDD (Arcade Aim Assist, DR-02). Người chơi không bị tự động đánh hộ: vẫn phải giữ Space trong cửa sổ tiếp xúc. |
| K6 | Nhân vật vẫn là **model dựng bằng code** như v0.3. Không rig, không GLB, không mocap, không Blender ở v0.4 | Gate animation G2–G7 trong Handoff Pack vẫn NOT TESTED. Đó là milestone riêng, không trộn vào v0.4. Không được tuyên bố v0.4 là "realistic/mocap". |
| K7 | Không deploy, không tạo repository, không mua/đăng ký dịch vụ, không upload video đi đâu | Theo Handoff Pack. Chỉ khi chủ dự án yêu cầu rõ mới làm. |

## 3. Hiện trạng v0.3 — những gì ĐÃ có và phải giữ (đã kiểm chứng từ code)

Đọc kỹ mục này trước khi sửa bất cứ thứ gì. Đây là sự thật từ source v0.3, không phải suy đoán:

- Sân 3D Three.js: mặt sân 6,10 × 13,40 m, vạch đơn ở x = ±2,59, lưới cao 1,55 m ở cột và 1,524 m ở giữa, cột lưới x = ±3,05, vạch giao cầu ngắn z = ±1,98. Hệ toạ độ: **x = ngang sân, y = cao, z = dọc sân, lưới tại z = 0, người chơi ở z > 0, AI ở z < 0**. 1 đơn vị = 1 mét.
- Vật lý cầu: gravity 9,81; drag tuyến tính `DRAG = 0,35`; fixed timestep `1/120`; hàm `trajectory()` giải vận tốc ban đầu để cầu rơi đúng điểm đích đã chọn; `launch()` tăng dần thời gian bay tới khi điểm qua lưới cao trên 1,82 m.
- Tiếp xúc: hàm `range()` — cầu hợp lệ khi cao 0,50–2,65 m, đúng phía sân của người đánh, khoảng cách 3D từ vai tới cầu ≤ 1,13 m. Có `planIntercept()` tính điểm đón và vị trí đứng đón, vòng hiển thị điểm rơi (vàng), vị trí đứng (xanh nhạt), tầm với (xanh lá).
- Điều khiển và nhịp chơi: giữ Space = có ý định đánh (kèm cửa sổ đệm `queuedUntil` 0,85 giây khi vừa bấm), cầu thủ về của người chơi luôn bay tới `(aim × 1,65 ; −4,9)` với aim ∈ {−1, 0, 1}.
- Tốc độ di chuyển tối đa hiện tại: người chơi **4,65 m/s**, AI **5,6 m/s** (xem mục 7 — ở chế độ Match phải sửa điểm này).
- Training: 3 bài tập (`center` cầu giữa sân, `wide` luân phiên hai bên, `mixed` nhiều vị trí), 2 nhịp (`0,8` chậm, `1` bình thường), thống kê hits / drops / accuracy / rally hiện tại / chuỗi tốt nhất, âm thanh bật-tắt (mặc định tắt), toàn màn hình, tạm dừng khi mất focus.
- Đã có sẵn hook kiểm thử xác định: mở file với `#qa` sẽ có `window.__rally` (state, reset, tick, sample, range, reachable, launch, contact, feed...). **Phải giữ hook này và mở rộng thêm ở v0.4 (mục 10).**
- Đã có sẵn phát hiện cầu chạm lưới trong `tick()` (khi cầu đổi phía z mà chiều cao tại lưới < 1,55 m thì `drop()`).

## 4. Phạm vi v0.4 — LÀM

### 4.1. Chọn chế độ (Mode Select)
- Màn hình mở đầu có 2 lựa chọn rõ ràng: **Luyện tập (Training)** — hành vi y hệt v0.3 — và **Đấu nhanh (Quick Match)** — chế độ mới của spec này.
- Chuyển qua lại giữa hai chế độ phải reset sạch trạng thái: không rò điểm số của Match sang Training, không rò thống kê buổi tập sang Match.

### 4.2. Máy trạng thái trận đấu (Match State Machine)
Dùng đúng tên trạng thái sau (theo TDD B3 của GDD), chỉ chuyển trạng thái qua các sự kiện hợp lệ:

`MENU → PRE_SERVE → SERVING → RALLY → POINT_END → (PRE_SERVE | MATCH_END)`, cộng `PAUSED` từ bất kỳ trạng thái đang chơi nào.

- Mỗi rally có `rallyId` tăng dần. Hàm kết thúc điểm nhận `rallyId`; nếu điểm của rally đó đã được xử lý rồi thì **bỏ qua mọi sự kiện tới muộn** (va chạm trễ, cầu chạm đất lần hai...). Không bao giờ tính 2 điểm cho 1 rally (AC-09 của GDD).
- `POINT_END` kéo dài khoảng 1,2 giây để người chơi đọc lý do điểm, rồi tự chuyển sang `PRE_SERVE` của điểm tiếp theo hoặc `MATCH_END`.

### 4.3. Luật tính điểm — Arcade 11
Hàm thuần (không phụ thuộc render), dùng cho cả logic lẫn kiểm thử:

```
winsMatch(my, opp) = (my >= 11 && my - opp >= 2) || my == 15
```

- Điểm theo **rally scoring**: thắng rally = được 1 điểm **và** được giao cầu ở điểm tiếp theo.
- Ví dụ bắt buộc đúng: 11–9 thắng; 11–10 chưa thắng; 12–10 thắng; 14–14 thì điểm tiếp theo (15–14) thắng theo cap.
- Hiển thị trong UI cạnh tên ruleset: "Arcade 11 — luật riêng của game: tới 11, cách 2, tối đa 15".

### 4.4. Giao cầu (Serve)
- Người thắng rally trước giao cầu. Trận bắt đầu: **người chơi giao cầu trước** (điểm 0–0) để chủ dự án được cầm nhịp đầu tiên.
- **Ô giao theo chẵn/lẻ của điểm của chính người giao** (theo GDD A5): điểm chẵn → ô phải, điểm lẻ → ô trái. "Phải/trái" tính theo hướng nhìn của người giao về phía lưới, khớp quy ước của game hiện tại: với người chơi, phải = `x` dương; với AI, phải = `x` âm (đối xứng gương).
- Vị trí đứng giao (điểm đích đặt chân, y = 0): người giao đứng trong ô của mình tại `(x = ±1,30 ; z = ±5,00)`; người nhận đứng ở ô chéo phía đối diện tại `(x = ∓1,30 ; z = ∓4,50)`. Trong `PRE_SERVE`, hai nhân vật **di chuyển bằng motor hiện có** tới vị trí (không dịch chuyển tức thời giữa rally; việc đặt lại vị trí chỉ xảy ra ở bước reset giữa hai điểm, khi cầu không trong sân).
- Cách giao ở v0.4 (giới hạn đã biết, ghi rõ trong báo cáo bàn giao): **một kiểu giao duy nhất, kiểu giao cao sâu (flick-style)**, tái dùng `trajectory()/launch()` hiện có, điểm rơi đích = tâm ô giao chéo hợp lệ: `(x = ∓1,30 ; z = ∓4,34)` (4,34 = trung điểm giữa vạch giao ngắn 1,98 và biên cuối sân 6,70). Cầu giao vẫn phải qua lưới theo kiểm tra hiện có; chạm lưới khi giao = mất điểm như một rally thường.
- Thao tác: người chơi giao bằng cách **giữ Space** như một cú đánh (khi cầu vào cửa sổ giao thì phát cầu). AI giao tự động sau khi vào vị trí, trễ 0,6–1,0 giây. Không có lỗi giao cầu (serve fault) ngoài lỗi chạm lưới ở v0.4 — đây là đơn giản hoá arcade có chủ đích, phải ghi trong báo cáo, không nhận là đúng toàn bộ luật trọng tài.

### 4.5. Kết thúc một rally — lý do điểm (Point Reasons)
Mỗi điểm kết thúc phải có đúng một lý do, hiển thị bằng tiếng Việt ngắn gọn trên HUD và ghi vào log điểm:

| Mã | Điều kiện xác định | Người được điểm | Text hiển thị |
|---|---|---|---|
| `FLOOR_IN` | Cầu chạm đất **trong** sân đơn của phía bị đánh sang và phía đó không trả được | Người vừa đánh | "Cầu rơi trong sân" |
| `OUT` | Cầu chạm đất **ngoài** sân đơn (xem hàm biên ở mục 4.6) | Phía đối diện người vừa đánh | "Cầu ngoài sân" |
| `NET` | Cầu chạm lưới và không qua được (dùng phát hiện sẵn có trong `tick()`) | Phía đối diện người vừa đánh | "Cầu chạm lưới" |
| `WHIFF` | Cầu rơi trong sân vì người nhận không tới kịp / không giữ Space trong cửa sổ (hành vi `drop()` hiện tại phía người chơi) | Người vừa đánh | "Không đón kịp cầu" |

- Cầu thủ về hợp lệ chạm đất trong sân mà đối thủ không chạm được = `FLOOR_IN`. Không cần phân biệt thêm "winner/smash" ở v0.4.

### 4.6. Biên sân và lỗi đánh hỏng do cố với cầu (Contact Quality → Error)
Vì solver hiện tại luôn đưa cầu rơi đúng đích trong sân, nếu không có cơ chế này thì `OUT` không bao giờ xảy ra và trận đấu chỉ kết thúc bằng "không tới kịp". Thêm cơ chế **xác định, không ngẫu nhiên** sau (dùng số liệu tiếp xúc đã có trong `S.contacts`: `gap` = khoảng cách ngang từ vị trí đứng của người đánh tới cầu, và chiều cao cầu lúc chạm):

- Contact **SẠCH**: `gap ≤ 0,70` **và** chiều cao cầu `≥ 0,90` → cầu đi đúng đích đã nhắm, như v0.3.
- Contact **CỐ VỚI**: `gap > 0,70` **hoặc** chiều cao cầu `< 0,90` (nhưng vẫn trong tầm hợp lệ của `range()`) → đích rơi bị lệch có chủ đích (hằng số để trong `CONFIG.match.errorOffset`, chỉnh được khi playtest):
  - Đang nhắm sang biên (aim ≠ 0): lệch thêm **1,10 m ra phía biên đó** → x đích = ±(1,65 + 1,10) = ±2,75, vượt biên đơn 2,59 → `OUT` biên.
  - Đang nhắm giữa (aim = 0): lệch thêm **2,00 m sâu về cuối sân** → z đích = −(4,90 + 2,00) = −6,90, vượt biên cuối 6,70 → `OUT` cuối sân.
  - Quy tắc đối xứng gương cho cú trả của AI.
- Cơ chế này áp dụng cho **cả người chơi và AI như nhau**. Mục đích thiết kế: giữ Space muộn / đứng sai vị trí thì phải trả giá, đứng đúng vị trí đón (vòng xanh nhạt) thì an toàn. Đây là đề xuất riêng của v0.4, không có trong GDD — ghi rõ như vậy trong báo cáo bàn giao.

### 4.7. AI ở chế độ Match — mức "Thường"
AI dùng **cùng** Character Motor, `range()` và Shot Resolver như người chơi (theo TDD B6). Khác biệt độ khó chỉ đến từ 3 thông số sau, để trong `CONFIG.match.ai`:

| Thông số | Giá trị khởi tạo v0.4 | Ý nghĩa |
|---|---|---|
| `speedCap` | **4,65 m/s** (= người chơi) | Sửa bất công hiện tại của bản Training (AI 5,6). Chỉ áp dụng ở Match; Training giữ nguyên v0.3. |
| `reactionDelay` | **0,22 giây** | AI chỉ bắt đầu di chuyển tới điểm đón sau khi cầu bay được 0,22 giây. Trước đó AI đứng ở vị trí hồi vị. |
| `interceptNoise` | **±0,18 m** | Điểm đón AI nhắm tới bị lệch một lượng cố định theo `rallyId` (dùng RNG có seed sẵn có `rnd()` và `S.seed`, không dùng `Math.random()` trong logic trận đấu) — AI thỉnh thoảng đứng lệch và phải cố với, từ đó tự sinh lỗi theo mục 4.6. |

- AI chọn hướng trả cầu: luân phiên / đổi hướng theo `rallyId` bằng RNG có seed (trái/giữa/phải), không cần "chiến thuật" ở v0.4. AI không teleport, không đánh cầu ngoài điều kiện `range()`, không đánh khi cầu đã chạm đất.

### 4.8. HUD và màn hình kết quả của Match
- HUD kiểu truyền hình thể thao (theo GDD A8): tên hai bên + điểm lớn ở trên cùng, **chấm đánh dấu người đang giao cầu**, text lý do điểm gần nhất, số rally hiện tại.
- `MATCH_END`: màn hình kết quả gồm tỉ số cuối, thắng/thua, tổng số rally, rally dài nhất, nút **Đấu lại (Rematch)** (reset về 0–0, người chơi giao trước) và nút **Về menu**.
- Tạm dừng bằng **P** (và nút bấm như v0.3): dừng cả vật lý lẫn đồng hồ trạng thái; mất focus cũng tự tạm dừng như v0.3.

## 5. Phạm vi v0.4 — KHÔNG LÀM (để tránh scope creep)

- Ruleset 15 / 21 điểm, đổi sân giữa trận, nghỉ giữa ván.
- 3 cấp AI; AI chiến thuật (utility evaluator đầy đủ của TDD B6 để v0.5+).
- Các cú đánh riêng biệt ngoài cú trả cao hiện có: clear/drop/smash/lift/drive/net bằng phím J/K/L (GDD A6/A7) — để milestone Shot System riêng.
- Giao cầu thấp, lỗi giao cầu đầy đủ, luật fault/let của trọng tài.
- Replay, thống kê lịch sử lưu `localStorage`, preset đồ hoạ Low/Medium/High (tất cả là P1).
- Model/rig/GLB/mocap/Blender, khán giả/âm thanh nâng cao, online, tài khoản, mobile/tay cầm.
- Đổi engine, đổi phím điều khiển, đổi thông số vật lý `DRAG/GRAVITY/FIXED` (trừ khi có bằng chứng lỗi và báo cáo riêng).

## 6. Cấu trúc code yêu cầu khi chuyển sang project (cho bước Antigravity)

Giữ hành vi, chỉ tách file. Không viết lại từ đầu, không đổi tên hàm nghiệp vụ nếu không cần thiết:

```
shuttle-arena/
  index.html            ← markup + HUD, nạp module chính
  styles.css            ← tách từ <style> của v0.3, giữ nguyên class/id đang dùng
  vendor/three.min.js   ← thư viện Three.js đang nhúng trong v0.3, giữ đúng phiên bản đó
  src/
    main.js             ← vòng lặp, fixed timestep, khởi tạo (phần khung của v0.3)
    court.js            ← dựng sân, lưới, arena
    actors.js           ← actor(), resetFeet(), animateFeet(), renderActor()
    shuttle.js          ← trajectory(), sample(), velocity(), launch(), planIntercept()
    training.js         ← feed(), feedTarget(), thống kê buổi tập (hành vi v0.3)
    rules.js            ← THUẦN, không import Three/DOM: winsMatch(), serveBox(), isInSingles(), pointReason...
    match.js            ← state machine, serve, pointEnd(rallyId,...), AI Match, rematch
    hud.js              ← cập nhật HUD/menu/kết quả
    input.js            ← bàn phím/chạm, aim, pause
  BASELINE_v0.3_DO_NOT_EDIT.html   ← file gốc, chỉ để đối chiếu, không sửa
  README.md             ← cách chạy, phím, giới hạn đã biết của v0.4
```

- `rules.js` phải là module thuần: cùng một đầu vào luôn cho cùng một đầu ra, không đọc giờ hệ thống, không `Math.random()`. Đây là phần bắt buộc có kiểm thử tự động (mục 7).
- Chạy được bằng cách mở trực tiếp / static server đơn giản, **không bắt buộc backend, không bắt buộc build step** ở v0.4. Nếu dùng module `type="module"` thì README phải ghi rõ cách chạy bằng một static server local (ví dụ `npx serve .`) vì trình duyệt chặn module qua `file://` ở một số cấu hình.

## 7. Kiểm thử bắt buộc

### 7.1. Kiểm thử tự động cho `rules.js` (phải PASS hết mới được giao)
1. `winsMatch`: (11,9)=thắng, (11,10)=chưa, (12,10)=thắng, (10,12)=thua theo đối xứng, (14,14)→(15,14)=thắng, (14,13)=chưa thắng, (15,14) là tỉ số cuối duy nhất chạm cap.
2. `serveBox`: điểm người giao 0,2,4 → ô phải; 1,3,5 → ô trái; ô của người nhận luôn chéo đối diện ô của người giao, cho cả hai phía (người chơi giao và AI giao).
3. `isInSingles(x, z)`: (±2,59 ; ±6,70) là trong (chạm vạch = trong, theo GDD A5); (±2,60 ; 4,0) ngoài; (0 ; 6,71) ngoài; điểm rơi phía z sai sân thì không tính là rơi trong sân của phía đó.
4. Lệch cố với (mục 4.6): contact sạch → đích không đổi; cố với + nhắm biên → đích x = ±2,75 (ngoài); cố với + nhắm giữa → đích z = ∓6,90 (ngoài); đối xứng cho AI.
5. `pointEnd` gọi hai lần với cùng `rallyId` → điểm chỉ tăng một lần.

### 7.2. Kiểm thử parity với v0.3 (trước khi tin tính năng mới)
- Training ở project mới phải chơi giống hệt v0.3: cùng 3 bài tập, 2 nhịp, giữ Space đánh được, thống kê chạy, `#qa` hook còn hoạt động.
- Mở rộng `#qa`: phơi thêm `match` (state, tỉ số, server, rallyId), `rules` (các hàm thuần) và hàm `advance(seconds)` như hook cũ, để kiểm thử tự động lái được một trận tới `MATCH_END` mà không cần người bấm.

### 7.3. Kịch bản chơi tay (chủ dự án hoặc agent tự chạy, ~15 phút)
1. Chơi trọn 1 trận tới thắng/thua, không treo, có màn hình kết quả.
2. Cố tình đứng sai vị trí rồi giữ Space muộn vài lần → thấy cầu `OUT` và mất điểm đúng lý do.
3. Đánh cầu vào lưới → điểm và text "Cầu chạm lưới" đúng phía.
4. Để AI thắng vài rally liên tiếp → quyền giao cầu chuyển đúng, ô giao đổi theo chẵn/lẻ.
5. Pause giữa rally → cầu đứng yên; tiếp tục → rally chạy tiếp, không mất điểm.
6. Rematch 3 lần liên tiếp → tỉ số reset sạch, không rò thống kê cũ.
7. Qua lại Training ↔ Quick Match mỗi chế độ 1 lần → không chế độ nào bị ảnh hưởng.

## 8. Tiêu chí nghiệm thu v0.4 (Acceptance Criteria)

| ID | Tiêu chí | Trạng thái cần đạt |
|---|---|---|
| V4-AC01 | Chọn được Training / Quick Match từ menu, quay lại được | PASS |
| V4-AC02 | Training giống v0.3 (mục 7.2) | PASS |
| V4-AC03 | Chơi trọn trận Arcade 11 tới `MATCH_END`, có Rematch | PASS |
| V4-AC04 | Tính điểm đúng mọi ví dụ ở mục 7.1.1, không tính 2 điểm/rally | PASS (có test tự động) |
| V4-AC05 | Giao cầu đúng ô chẵn/lẻ, người nhận đứng ô chéo, thắng rally = được giao | PASS |
| V4-AC06 | Cả 4 lý do điểm (`FLOOR_IN/OUT/NET/WHIFF`) đều xuất hiện đúng điều kiện và đúng text | PASS |
| V4-AC07 | Contact cố với sinh `OUT` theo đúng quy tắc mục 4.6, contact sạch thì không | PASS (có test tự động) |
| V4-AC08 | AI dùng cùng speed cap 4,65 ở Match, có reaction delay và intercept noise theo cấu hình; AI không teleport/không đánh ngoài `range()` | PASS |
| V4-AC09 | Pause/mất focus dừng đúng vật lý và trạng thái | PASS |
| V4-AC10 | Không có lỗi console chặn chơi; cú pháp JS kiểm tra qua (`node --check` hoặc tương đương) | PASS |
| V4-AC11 | Báo cáo bàn giao ghi rõ giới hạn: 1 kiểu giao cao sâu, không serve fault ngoài chạm lưới, nhân vật code-built (không mocap), 1 mức AI, chỉ ruleset 11 | PASS |

Chỉ giao khi V4-AC01 → V4-AC11 đều PASS hoặc ghi rõ FAIL/NOT TESTED kèm lý do — không đánh PASS theo cảm tính.

## 9. Thứ tự làm việc bắt buộc (để không vỡ baseline)

1. **Bước 1 — Tách file, giữ nguyên hành vi (parity):** dựng project theo mục 6 từ v0.3, chưa thêm tính năng. Kiểm thử mục 7.2. Xong bước này game vẫn chỉ là Training v0.3.
2. **Bước 2 — `rules.js` thuần + test tự động:** viết các hàm thuần và test ở mục 7.1, chưa nối vào game.
3. **Bước 3 — Match mode:** state machine, serve, point reasons, HUD, kết quả, rematch. Nối `rules.js` vào.
4. **Bước 4 — Contact quality + AI Match:** cơ chế cố với/`OUT` và 3 thông số AI ở mục 4.7.
5. **Bước 5 — QA trọn gói:** chạy 7.1 + 7.2 + 7.3, sửa lỗi, viết README và báo cáo bàn giao theo mẫu ở Prompt Pack. Giao một lần.

Không nhảy bước. Không làm Bước 3 khi Bước 1 chưa parity.

## 10. Sau v0.4 (chỉ để biết hướng, không làm bây giờ)

v0.5: ruleset 15/21 + 3 cấp AI. Milestone riêng: Shot System (J/K/L, clear/drop/smash...). Milestone riêng nữa: Animation Feasibility trên rig thật (gate G2–G7). P1 (Replay/Presets/History) chỉ sau khi Match MVP ổn định.
