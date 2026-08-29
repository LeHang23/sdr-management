# RS-05 - Cảnh báo gần đây

| Trường | Giá trị |
| --- | --- |
| Màn hình | Overview |
| FBS | FBS-1.1.5, Recent alerts |
| Ưu tiên | Must |

## Mục tiêu

Cung cấp nhận biết tức thời về các sự cố đội thiết bị gần nhất.

## Yêu cầu

| ID | Yêu cầu |
| --- | --- |
| RS-OVW-ALT-01 | Panel phải liệt kê cảnh báo từ mới nhất đến cũ nhất. |
| RS-OVW-ALT-02 | Mỗi cảnh báo phải có severity, summary, source và occurrence time. |
| RS-OVW-ALT-03 | Severity phải được biểu thị bằng text hoặc icon bên cạnh màu sắc. |
| RS-OVW-ALT-04 | Chọn cảnh báo phải mở Alert Detail khi màn hình đó khả dụng. |
| RS-OVW-ALT-05 | Header của panel phải có action mang nhãn `All` để truy cập Alert inbox đầy đủ. |
| RS-OVW-ALT-06 | Khi Alert inbox khả dụng, chọn `All` phải mở toàn bộ cảnh báo theo thứ tự từ mới nhất đến cũ nhất. |
| RS-OVW-ALT-07 | Trước khi Alert inbox khả dụng, `All` phải hiển thị rõ trạng thái disabled, truyền đạt trạng thái không khả dụng cho công nghệ hỗ trợ và không được điều hướng đến destination không liên quan hoặc link lỗi. |

## Tiêu chí chấp nhận

- Alert mới từ simulator xuất hiện trên cùng.
- Tập alert trống hiển thị empty state rõ ràng.
- Khi Alert inbox khả dụng, chọn `All` mở danh sách cảnh báo đầy đủ mà không ngầm áp dụng filter severity hoặc resolution status.
- Trước khi Alert inbox khả dụng, `All` không thể kích hoạt bằng pointer hoặc bàn phím và được thông báo là không khả dụng.
