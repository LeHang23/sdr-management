# RS-02 - Tìm kiếm và bộ lọc

| Field | Value |
| --- | --- |
| Screen | Device List |
| FBS | FBS-1.2, Tìm kiếm và bộ lọc |
| Priority | Must |

## Mục tiêu

Tìm kiếm và bộ lọc.

## Yêu cầu

| ID | Requirement |
| --- | --- |
| RS-DEVLIST-FILTER-01 | Tìm chuỗi con nguyên văn trong ID hoặc tên, không phân biệt hoa/thường ASCII; bỏ khoảng trắng hai đầu, giới hạn 100 ký tự. |
| RS-DEVLIST-FILTER-02 | Kết hợp health, connection, source và Needs attention theo AND. All bỏ điều kiện của từng bộ lọc. |
| RS-DEVLIST-FILTER-03 | Needs attention gồm health Warning/Offline hoặc issue critical active, kể cả Healthy/Updating; bỏ issue resolved và đếm mỗi thiết bị một lần. |
| RS-DEVLIST-FILTER-04 | Áp dụng bộ lọc về trang một và xóa lựa chọn. Clear filters về mặc định. Giữ truy vấn trên URL; View all từ Overview áp dụng attention=true. |

## Trạng thái và trường hợp biên

- Dữ liệu rỗng/unavailable không bật control không hợp lệ; stale có nhãn rõ ràng.

## Tiêu chí nghiệm thu

- Kiểm tra các yêu cầu trên với dữ liệu rỗng/có dữ liệu, bàn phím và lỗi refresh.
