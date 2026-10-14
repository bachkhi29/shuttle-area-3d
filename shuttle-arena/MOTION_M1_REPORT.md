# Báo cáo v1.1 Motion M1

## Đã cài gì

- Phân tích ba video reference do chủ dự án cung cấp; ghi timestamp, hash và phase cho split-step và overhead smash. Video gốc chỉ dùng nội bộ.
- Dựng mannequin/armature/racket tự sở hữu trong Blender, có hai action `ANIM_SPLIT_STEP` và `ANIM_SMASH_OVERHEAD_JUMP`.
- Xuất `m1_split_smash_rig.glb`; thêm script build và script import ngược để kiểm tra contract tự động.
- Đưa chuyển động vào avatar game hiện tại: split-step 0,66 giây gồm preload, hop thấp, đáp chân rộng và hạ trọng tâm; smash gồm contact trên đầu, lift hai chân, xoay thân và follow-through qua người.
- Giữ Character Motor và luật cầu làm nguồn quyết định vị trí, điểm số và quỹ đạo. Animation chỉ thay pose hiển thị.

## Kết quả kiểm tra PASS–FAIL

| Kiểm tra | Kết quả |
|---|---|
| GLB import ngược | **PASS** — 1 armature, 19 skinned mesh, 5 material |
| Tên action trong GLB | **PASS** — đúng 2 tên trong manifest |
| Thời lượng action | **PASS** — split 20 frame, smash 41 frame |
| Pose runtime M1 | **PASS** — landing span 0,633 m; racket contact cao 2,249 m |
| Rules/contact Node | **PASS** — không có test fail |
| Browser/integration | **PASS 28/28** |
| Training parity v0.3/v0.6 | **PASS** — 3 drill × 2 pace × 60 giây |
| Runtime phát trực tiếp GLB | **PENDING** — game đang dùng pose procedural cùng contract |
| Video QC rear/side + foot slide | **PENDING** |

## Thông số chỉnh khác tài liệu

- Không đổi luật Match, AI, contact, motor hay Training.
- Split-step runtime dùng đúng `0,66 s`, nằm trong dải 0,60–0,72 s của reference sheet.
- Biên độ hop giới hạn 0,075 m và độ mở chân tại landing khoảng 0,633 m để nhân vật hiện tại không xuyên sàn hoặc giật camera. Đây là thông số hiển thị, không thay range/contact.
- Lift sau contact smash giới hạn 0,11 m vì runtime hiện chỉ có pha từ contact trở đi; Blender action vẫn giữ đủ load/takeoff/contact/landing/recovery.

## Sẵn sàng bước tiếp theo chưa

**Sẵn sàng.** Bước kế tiếp là đưa GLB vào runtime bằng loader offline, thay avatar procedural theo từng lớp, thêm marker `racket_contact` và blend READY → SPLIT/MOVE, READY → SMASH → RECOVERY. Gameplay v1.1 hiện có thể chơi và kiểm tra độc lập trong lúc làm integration này.
