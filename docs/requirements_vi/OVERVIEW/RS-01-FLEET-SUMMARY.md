# RS-01 - Tổng quan đội thiết bị

| Trường | Giá trị |
| --- | --- |
| Màn hình | Overview |
| FBS | FBS-1.1.1, Fleet summary |
| Ưu tiên | Must |

## Mục tiêu

Cung cấp tóm tắt bằng số về tình trạng hiện tại của đội thiết bị.

## Yêu cầu

| ID | Yêu cầu |
| --- | --- |
| RS-OVW-SUM-01 | Summary phải hiển thị Total devices, Online now, Needs attention và Active jobs. |
| RS-OVW-SUM-02 | Các giá trị phải dùng cùng Overview snapshot thành công mới nhất. |
| RS-OVW-SUM-03 | Giá trị bị thiếu phải hiển thị unavailable thay vì số 0 không chính xác. |
| RS-OVW-SUM-04 | Summary card phù hợp phải liên kết đến danh sách đã lọc khi màn hình đó khả dụng. |

## Tiêu chí chấp nhận

- Giá trị summary khớp với tập dữ liệu thiết bị và job mô phỏng.
- Fleet trống hiển thị giá trị 0 hợp lệ mà không lỗi layout.
