# RS-03 - Trạng thái và lịch gửi

| Field | Value |
| --- | --- |
| Screen | SDR Simulator Console |
| FBS | FBS-3.1 |
| Priority | Must |

## Mục tiêu

Cho người kiểm thử quan sát transport và thời gian thực tế, không nhầm với connectivity backend.

## Yêu cầu

| ID | Requirement |
| --- | --- |
| RS-SIM-STATUS-01 | Hiện trạng thái transport, health dự định gần nhất, payload/response, lỗi, thời điểm accepted và counter, không lộ gateway token. |
| RS-SIM-STATUS-02 | Transport skipped/failed không được ghi là Offline đã xác nhận từ backend. Poll trạng thái backend có xác thực độc lập với heartbeat, kể cả khi pause. Hiện connectivity/health đã xác nhận, updatedAt và checkedAt; đọc lỗi báo Unknown, xác nhận cũ là stale. |
| RS-SIM-STATUS-03 | Hiện thời điểm/countdown batch tiếp theo thực tế hoặc Sending/Paused, cùng interval, request timeout và timeout backend đề xuất. |
| RS-SIM-STATUS-04 | Refresh card tại chỗ, giữ payload details đang mở, scroll và lựa chọn mode đang thao tác. |

## Trạng thái và trường hợp biên

- Xem trạng thái màn hình trong SRS.md; giữ lỗi và lịch sử để kiểm tra.

## Tiêu chí nghiệm thu

- Console phản ánh lịch process và điều khiển, không suy đoán connectivity backend; transport lỗi có nhãn chữ cùng màu.
