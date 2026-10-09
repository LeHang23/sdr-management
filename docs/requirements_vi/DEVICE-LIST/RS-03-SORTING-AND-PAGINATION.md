# RS-03 - Sắp xếp và phân trang

| Field | Value |
| --- | --- |
| Screen | Device List |
| FBS | FBS-1.2, Sắp xếp và phân trang |
| Priority | Must |

## Mục tiêu

Sắp xếp và phân trang.

## Yêu cầu

| ID | Requirement |
| --- | --- |
| RS-DEVLIST-PAGE-01 | Mặc định tên tăng dần; hỗ trợ ID, tên, health priority, connection và last seen hai chiều. Health tăng dần là Offline, Warning, Updating, Healthy. |
| RS-DEVLIST-PAGE-02 | Phá hòa bằng device ID tăng dần. Last seen null luôn ở cuối trong cả hai chiều. |
| RS-DEVLIST-PAGE-03 | Có 10/25/50/100 dòng mỗi trang, mặc định 25; số đếm và dòng cùng snapshot DB. Trang vượt giới hạn về trang cuối hiện tại. |
| RS-DEVLIST-PAGE-04 | Hiện khoảng dòng, tổng và số trang. Disable previous/next không hợp lệ; đổi page size về trang một. |

## Trạng thái và trường hợp biên

- Dữ liệu rỗng/unavailable không bật control không hợp lệ; stale có nhãn rõ ràng.

## Tiêu chí nghiệm thu

- Kiểm tra các yêu cầu trên với dữ liệu rỗng/có dữ liệu, bàn phím và lỗi refresh.
