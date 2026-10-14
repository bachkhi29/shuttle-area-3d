# M1 Animation Feasibility Gate

## Kết quả hiện tại

- Reference source và timestamp: **PASS**.
- Phân tích split-step từ hai góc: **PASS**.
- Contact marker smash từ hình + peak âm thanh: **PASS**, sai số dự kiến ±1–2 frame.
- Quyền phân phối video gốc: **NOT CONFIRMED**; chỉ dùng nội bộ.
- Rigged character tự dựng, scale mét, racket socket: **PASS**.
- Hai Blender action, skinning và GLB export: **PASS**.
- Import ngược GLB: **PASS** — 1 armature, 19 skinned mesh, 5 material, đúng 2 action.
- Runtime procedural dùng timing/pose contract: **PASS** — split-step 0,66 s và smash overhead đã có trong v1.1.
- Runtime tải trực tiếp GLB + `AnimationMixer`: **PENDING**.
- Video QC rear/side và đo foot slide/contact bằng marker: **PENDING**.

## Gate cần đạt

1. Một humanoid rig thống nhất scale 1 m, tên xương ổn định, racket socket ở bàn tay thuận.
2. `ANIM_SPLIT_STEP` và `ANIM_SMASH_OVERHEAD_JUMP` chạy trong Blender không gãy mesh.
3. Export GLB rồi import lại vẫn còn đúng action, event timing và material.
4. Runtime Three.js phát clip, blend được READY → SPLIT/MOVE và READY → SMASH → RECOVERY.
5. `racket_contact` gọi Shot Resolver đúng một lần; animation không tự quyết định điểm hay quỹ đạo cầu.
6. Foot slide pha chịu lực ≤ 0,05 m ở clip thử; contact visual lệch logic ≤ 80 ms.
7. Chạy đồng thời hai nhân vật và sân hiện tại không tạo lỗi console hoặc tụt dưới ngưỡng playtest mục tiêu.

## Quyết định gate

**M1 technical asset: PASS. M1 thay nhân vật runtime: CHƯA PASS.**

Rig/GLB đã đủ tốt để tiếp tục integration, còn avatar trong game hiện vẫn là procedural. Không gọi đây là mocap hoặc chuyển động hoàn thiện cho đến khi runtime phát GLB, có blend state, marker contact và video QC rear/side.
