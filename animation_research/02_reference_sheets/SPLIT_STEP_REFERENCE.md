# Motion Reference Sheet — Split Step

## Quan sát chính

- Trọng tâm hạ thấp vừa phải; thân trên giữ ổn định và vợt ở trước cơ thể.
- Hai chân gom tương đối gần trong pha hồi vị, hop thấp, sau đó đáp rộng hơn vai.
- Điểm đáp trùng hoặc sát thời điểm đối phương chạm cầu; sau khi đáp mới commit mạnh sang hướng cầu.
- Không dùng một cú nhảy cao. Chuyển động cần ngắn, nhẹ và có thể blend vào mọi hướng chạy.

## Chu kỳ mẫu

Nguồn `SRC_SPLIT_TIMING`, cửa sổ khoảng `2,60–3,30 s`:

| Mốc | Thời gian nguồn | Ý nghĩa |
|---|---:|---|
| Recovery/gather | 2,60–2,72 s | Chân hồi về, thân vẫn hướng lưới |
| Preload | 2,72–2,84 s | Gối gập, trọng tâm bắt đầu hạ |
| Hop | 2,84–2,96 s | Hai chân rời hoặc giảm tải rất nhẹ |
| Land | khoảng 3,02 s | Đáp rộng; trùng peak contact phía đối phương |
| Direction commit | 3,06–3,18 s | Chân ngoài chịu lực, thân mở theo hướng cầu |
| Exit | 3,18–3,30 s | Blend sang run/lunge |

Đối chiếu `SRC_SPLIT_TUTORIAL`: các đoạn quanh `2–5 s`, `12–15 s` và `17–21 s` xác nhận stance rộng, gối mềm và push-off sau landing. Góc trước giúp kiểm tra khoảng cách hai chân; góc sau giúp kiểm tra timing với cầu.

## Contract animation

- Action: `ANIM_SPLIT_STEP`
- Loại: in-place, non-looping, 0,60–0,72 s sau retime.
- Event bắt buộc: `split_land` tại 55–62% clip.
- Blend in ≤ 0,10 s; blend out sang `MOVE_*` hoặc `READY` trong 0,08–0,12 s.
- Root translation ngang gần 0; dịch chuyển thật do Character Motor quyết định.
- QC: hai bàn chân không trượt quá 0,05 m trong pha chịu lực; hông không nhảy cao quá mức; không khóa thẳng gối khi đáp.

