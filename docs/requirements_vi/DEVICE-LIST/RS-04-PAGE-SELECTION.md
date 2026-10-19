# RS-04 - Chọn thiết bị trên trang

| Field | Value |
| --- | --- |
| Screen | Device List |
| FBS | FBS-1.2, Chọn thiết bị trên trang |
| Priority | Must |

## Mục tiêu

Chọn thiết bị trên trang.

## Yêu cầu

| ID | Requirement |
| --- | --- |
| RS-DEVLIST-SELECT-01 | Cho phép chọn từng dòng hoặc toàn bộ trang hiện tại; select-all có trạng thái indeterminate và số đếm. |
| RS-DEVLIST-SELECT-02 | Xóa lựa chọn khi đổi truy vấn/trang; refresh chỉ giữ ID còn hiển thị trên trang hiện tại. |
| RS-DEVLIST-SELECT-03 | Có Clear selection; ghi rõ bulk actions và Device Detail là dự kiến; disable Add new device đến khi có đăng ký. |

## Trạng thái và trường hợp biên

- Dữ liệu rỗng/unavailable không bật control không hợp lệ; stale có nhãn rõ ràng.

## Tiêu chí nghiệm thu

- Kiểm tra các yêu cầu trên với dữ liệu rỗng/có dữ liệu, bàn phím và lỗi refresh.
