# RS-06 - Tạo tái cấu hình mới

| Trường | Giá trị |
| --- | --- |
| Màn hình | Overview |
| FBS | FBS-1.1.6, Reconfiguration action |
| Ưu tiên | Must |

## Mục tiêu

Cung cấp điểm vào rõ ràng để bắt đầu quy trình tái cấu hình từ xa an toàn.

## Yêu cầu

| ID | Yêu cầu |
| --- | --- |
| RS-OVW-NEW-01 | Trang Overview phải có action `New reconfiguration` nổi bật. |
| RS-OVW-NEW-02 | Chọn action phải mở bước đầu của reconfiguration workflow. |
| RS-OVW-NEW-03 | Action phải unavailable khi người dùng thiếu quyền hoặc nền tảng không thể tạo job an toàn. |
| RS-OVW-NEW-04 | Action unavailable phải giải thích lý do. |

## Tiêu chí chấp nhận

- Administrator đủ điều kiện vào new-job workflow bằng một thao tác.
- Disabled state giải thích vì sao workflow không thể bắt đầu.
