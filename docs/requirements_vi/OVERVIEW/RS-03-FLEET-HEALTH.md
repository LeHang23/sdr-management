# RS-03 - Sức khỏe đội thiết bị

| Trường | Giá trị |
| --- | --- |
| Màn hình | Overview |
| FBS | FBS-1.1.3, Fleet health |
| Ưu tiên | Must |

## Mục tiêu

Thể hiện phân bố đội thiết bị theo trạng thái vận hành.

## Yêu cầu

| ID | Yêu cầu |
| --- | --- |
| RS-OVW-HLT-01 | Fleet Health phải hiển thị Online, Warning, Offline và Updating. |
| RS-OVW-HLT-02 | Tổng số theo category phải bằng Total devices trong cùng snapshot. |
| RS-OVW-HLT-03 | Mỗi category phải có text label bên cạnh status color. |
| RS-OVW-HLT-04 | Category có giá trị 0 vẫn phải nhận biết được. |

## Tiêu chí chấp nhận

- Thay đổi trạng thái simulator cập nhật đúng category.
- Tổng category khớp Total devices.
