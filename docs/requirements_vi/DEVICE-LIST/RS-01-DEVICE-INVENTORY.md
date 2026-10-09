# RS-01 - Danh sách thiết bị

| Field | Value |
| --- | --- |
| Screen | Device List |
| FBS | FBS-1.2, Danh sách thiết bị |
| Priority | Must |

## Mục tiêu

Danh sách thiết bị.

## Yêu cầu

| ID | Requirement |
| --- | --- |
| RS-DEVLIST-INV-01 | Hiện mỗi thiết bị một lần với ID, tên, sức khỏe, kết nối, nguồn từng record, last seen và attention. |
| RS-DEVLIST-INV-02 | Hiện health online là Healthy, phân biệt connection Online. Last seen null là Never seen. |
| RS-DEVLIST-INV-03 | Gắn nhãn record manual là Manual input; record gateway tiền tố SIM-SDR- là Simulator; gateway khác là SDR Gateway. |
| RS-DEVLIST-INV-04 | Có loading, fleet rỗng, unavailable/Retry và stale có nhãn; không giả lập dữ liệu; chuỗi DB hiển thị dạng text. |

## Trạng thái và trường hợp biên

- Dữ liệu rỗng/unavailable không bật control không hợp lệ; stale có nhãn rõ ràng.

## Tiêu chí nghiệm thu

- Kiểm tra các yêu cầu trên với dữ liệu rỗng/có dữ liệu, bàn phím và lỗi refresh.
