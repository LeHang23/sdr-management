# RS-04 - Thông báo

| Trường | Giá trị |
| --- | --- |
| Màn hình | Admin Dashboard |
| FBS | FBS-1.0.4, Notifications |
| Ưu tiên | Should |

## Mục tiêu

Giúp Administrator nhận biết sự kiện vận hành gần đây cần chú ý.

## Yêu cầu

| ID | Yêu cầu |
| --- | --- |
| RS-DASH-NOT-01 | Header phải có control để mở danh sách thông báo gần đây. |
| RS-DASH-NOT-02 | Control phải thể hiện có hay không thông báo chưa đọc. |
| RS-DASH-NOT-03 | Mỗi thông báo phải có loại, nội dung tóm tắt, nguồn và timestamp. |
| RS-DASH-NOT-04 | Chọn thông báo phải mở bản ghi liên quan nếu có. |

## Tiêu chí chấp nhận

- Simulator event có thể tạo thông báo chưa đọc.
- Mở thông báo có liên kết sẽ điều hướng đến bản ghi tương ứng.
