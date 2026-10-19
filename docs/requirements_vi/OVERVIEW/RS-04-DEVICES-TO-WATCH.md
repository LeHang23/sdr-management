# RS-04 - Thiết bị cần theo dõi

| Trường | Giá trị |
| --- | --- |
| Màn hình | Overview |
| FBS | FBS-1.1.4, Devices to watch |
| Ưu tiên | Must |

## Mục tiêu

Giúp Administrator ưu tiên các thiết bị cần điều tra.

## Yêu cầu

| ID | Yêu cầu |
| --- | --- |
| RS-OVW-WATCH-01 | Panel phải liệt kê thiết bị Warning, Offline và thiết bị có critical issue đang hoạt động. |
| RS-OVW-WATCH-02 | Mỗi item phải có identity, state, issue summary và last-seen time. |
| RS-OVW-WATCH-03 | Item phải ưu tiên critical issue đang hoạt động, tiếp theo Offline rồi Warning; trong mỗi nhóm ưu tiên, thời gian cập nhật issue được chọn (hoặc thời gian cập nhật device khi không có active issue) mới nhất đứng trước, dùng device ID để phân định khi bằng nhau. |
| RS-OVW-WATCH-04 | Chọn item phải mở Device Detail khi màn hình đó khả dụng. |
| RS-OVW-WATCH-05 | Chọn `View all` phải mở Device Management với filter `Needs attention` đã được áp dụng. |
| RS-OVW-WATCH-06 | Danh sách đích đã lọc phải gồm thiết bị Warning, Offline và thiết bị có critical issue đang hoạt động. |
| RS-OVW-WATCH-07 | Cho tới khi màn hình Device List đích được triển khai, `View all` phải hiển thị là chưa khả dụng và không điều hướng đến điểm đến thiếu hoặc gây hiểu nhầm. |
| RS-OVW-WATCH-08 | Preview Overview phải hiển thị tối đa năm thiết bị duy nhất và cho biết tổng số needs-attention khi có nhiều thiết bị hơn. |
| RS-OVW-WATCH-09 | Khi thiết bị có nhiều active issue, hiển thị issue nghiêm trọng nhất, rồi mới nhất trong cùng severity. Resolved issue không được đưa thiết bị vào danh sách hoặc làm issue summary. Khi không có active issue, hiển thị mô tả dựa trên state; thiếu last-seen time phải hiển thị `Never seen`. |
| RS-OVW-WATCH-10 | Danh sách và Fleet Summary phải dùng cùng snapshot và freshness state. Hiển thị loading, thông báo empty cho fleet khỏe, dữ liệu không khả dụng kèm Retry và nhãn cached rõ ràng sau khi refresh lỗi. |

## Tiêu chí chấp nhận

- Thiết bị offline mô phỏng xuất hiện trước item severity thấp hơn.
- Fleet khỏe hiển thị no-devices-to-watch state rõ ràng.
- `View all` mở danh sách needs-attention đầy đủ mà Administrator không cần áp
  dụng lại filter.

## Trạng thái triển khai

`View all` đã mở `devices.html?attention=true`; Device Detail vẫn dự kiến.
