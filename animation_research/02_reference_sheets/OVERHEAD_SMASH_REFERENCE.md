# Motion Reference Sheet — Overhead Smash

## Quan sát chính

- Chuẩn bị bằng xoay vai và hông, tay không cầm vợt nâng để giữ thăng bằng/ước lượng cầu.
- Bật nhảy sau pha load; thân mở từ hông → vai → khuỷu → cổ tay, không vung cả cánh tay như một khối cứng.
- Contact nằm cao và hơi trước vai đánh. Vợt tiếp tục đi qua cơ thể sau contact.
- Landing dùng scissor action: chân đổi tương quan trước/sau, gối mềm, sau đó recovery về giữa sân.

## Contact và cửa sổ mẫu

Nguồn `SRC_SMASH_VARIATIONS`:

| Variation | Cửa sổ | Contact ước lượng | Dùng cho |
|---|---:|---:|---|
| Overhead cơ bản | 0,80–3,30 s | 1,97 s | Pose và chuỗi kinetic cơ bản |
| Jump smash mẫu chính | 5,45–7,55 s | 6,67 s | Action đầu tiên để thử rig/runtime |
| Overhead variation | 10,10–13,30 s | 11,27 s | So sánh recovery |
| Scissor smash | 14,10–16,90 s | 15,64 s | Landing và chuyển trọng lượng |

Chu kỳ jump smash chính, tính từ 5,45 s:

| Phase | Thời gian tương đối | Ghi chú |
|---|---:|---|
| Ready/turn | 0,00–0,45 s | Xoay thân, chân vào vị trí |
| Load | 0,45–0,88 s | Gối gập, tay vợt ra sau |
| Takeoff | 0,88–1,08 s | Bật lên; ngực bắt đầu mở |
| Acceleration | 1,08–1,20 s | Khuỷu dẫn, cẳng tay tăng tốc |
| Contact | 1,22 s | Event gameplay/âm thanh, tương ứng 6,67 s nguồn |
| Follow-through | 1,22–1,43 s | Vợt đi xuống qua thân |
| Landing | 1,43–1,60 s | Scissor landing, gối hấp thụ lực |
| Recovery | 1,60–2,10 s | Trở về ready/move |

## Contract animation

- Action đầu tiên: `ANIM_SMASH_OVERHEAD_JUMP`.
- Event bắt buộc: `racket_contact` tại 58–60% clip sau retime; `land` tại 70–76%.
- Root motion: chỉ giữ vertical/root rotation nhỏ phục vụ pose; Character Motor quyết định dịch chuyển sân.
- Tay/vợt: racket socket gắn vào bàn tay thuận; IK chỉ sửa nhỏ ở cổ tay/khuỷu, không kéo cả vai và không dịch chuyển cầu tới vợt.
- QC: contact logic và mặt vợt lệch không quá 80 ms trong gate đầu; hai bàn chân không xuyên sàn; landing không snap hông; clip blend về recovery không giật.

