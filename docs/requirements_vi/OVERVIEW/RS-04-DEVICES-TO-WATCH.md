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
| RS-OVW-WATCH-03 | Item phải được sắp theo severity rồi đến recency. |
| RS-OVW-WATCH-04 | Chọn item phải mở Device Detail khi màn hình đó khả dụng. |
| RS-OVW-WATCH-05 | Chọn `View all` phải mở Device Management với filter `Needs attention` đã được áp dụng. |
| RS-OVW-WATCH-06 | Danh sách đích đã lọc phải gồm thiết bị Warning, Offline và thiết bị có critical issue đang hoạt động. |
| RS-OVW-WATCH-07 | Cho tới khi Device Management được triển khai, `View all` phải hiển thị là chưa khả dụng và không điều hướng đến điểm đến thiếu hoặc gây hiểu nhầm. |

## Tiêu chí chấp nhận

- Thiết bị offline mô phỏng xuất hiện trước item severity thấp hơn.
- Fleet khỏe hiển thị no-devices-to-watch state rõ ràng.
- `View all` mở danh sách needs-attention đầy đủ mà Administrator không cần áp
  dụng lại filter.
