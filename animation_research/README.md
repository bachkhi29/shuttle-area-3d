# Animation Research — M1 Feasibility

Trạng thái ngày 14/10/2026: **RIG + GLB TECHNICAL PASS / RUNTIME MOTION PREVIEW PASS**.

Ba video do chủ dự án cung cấp đang được dùng làm tư liệu nội bộ cho hai nhóm chuyển động đầu tiên:

- `ANIM_SPLIT_STEP`: nhịp hop–land theo thời điểm đối phương chạm cầu, sau đó mở hướng di chuyển.
- `ANIM_SMASH_OVERHEAD_JUMP`: chuẩn bị, bật nhảy, contact trên cao, scissor landing và recovery.

Video gốc không được đưa lên GitHub. Chưa có xác nhận quyền phân phối lại, nên repository chỉ lưu tên, hash, timestamp và phân tích chuyển động.

M1 hiện có một mannequin tự dựng, armature 19 mesh skinned, racket socket và hai action. GLB đã import ngược thành công. Game v1.1 dùng cùng timing/pose contract cho avatar procedural để người chơi nhìn thấy split-step và smash ngay. Việc thay hẳn hai avatar bằng GLB và blend qua `AnimationMixer` thuộc bước integration tiếp theo.

Avatar stylized v1.4 được bổ sung theo ảnh tham khảo mới: `04_blender/sa3d_stylized_avatar_v1.blend` để chỉnh trong Blender, `05_exports/sa3d_stylized_avatar_v1.glb` để trao đổi asset, ảnh `06_qc/sa3d_stylized_avatar_v1.png`. Asset mới dùng armature M1 với hai action split-step/smash và đã import GLB ngược thành công (xem `06_qc/sa3d_stylized_avatar_validation.json`). Game v1.4 hiển thị phiên bản tạo hình tương ứng bằng mesh Three.js, để pose tiếp xúc vẫn do mô phỏng điều khiển. Dựng lại bằng `blender --background --python animation_research/tools/build_reference_avatar.py`.

Thư mục:

- `00_sources/`: manifest nguồn và tình trạng quyền sử dụng.
- `02_reference_sheets/`: phân tích pose, phase và timestamp.
- `04_blender/`: file rig/action nguồn có thể sửa tiếp.
- `05_exports/`: GLB đã qua re-import validation.
- `06_qc/`: báo cáo máy, ảnh Blender và ảnh runtime.
- `animation_manifest.v1.json`: contract dùng chung cho Blender và runtime.

Tái tạo và kiểm tra:

```bash
blender --background --python animation_research/tools/build_m1_rig.py
blender --background --python animation_research/tools/validate_m1_glb.py
```

