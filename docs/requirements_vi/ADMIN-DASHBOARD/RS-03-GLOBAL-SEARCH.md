# RS-03 - Tìm kiếm chung

| Trường | Giá trị |
| --- | --- |
| Màn hình | Admin Dashboard |
| FBS | FBS-1.0.3, Global search |
| Ưu tiên | Should |

## Mục tiêu

Cho phép Administrator tìm nhanh các bản ghi vận hành từ header.

## Yêu cầu

| ID | Yêu cầu |
| --- | --- |
| RS-DASH-SRCH-01 | Search phải nhận device name, device ID, job ID, firmware version hoặc configuration profile name. |
| RS-DASH-SRCH-02 | Search phải thể hiện rõ khi không có kết quả phù hợp. |
| RS-DASH-SRCH-03 | Chọn kết quả phải mở đúng màn hình chi tiết. |
| RS-DASH-SRCH-04 | Search input và kết quả phải sử dụng được bằng bàn phím. |

## Tiêu chí chấp nhận

- Tìm được thiết bị mô phỏng đã biết bằng cả tên và ID.
- Từ khóa không tồn tại tạo empty result rõ ràng.
