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
| RS-OVW-ALT-08 | Preview phải hiển thị tối đa ba cảnh báo thuộc mọi severity và resolution state, sắp theo occurrence mới nhất rồi alert ID khi trùng thời gian; hiển thị tổng unresolved và tổng số cảnh báo nếu preview bị giới hạn. |
| RS-OVW-ALT-09 | Gateway báo health Warning/Offline hợp lệ hoặc backend xác nhận heartbeat hết hạn phải mở incident. Health không đổi không được tạo trùng hoặc đổi thứ tự. Phục hồi Healthy/Updating chỉ resolve incident tự sinh; chuyển sang trạng thái lỗi khác hoặc lỗi tái diễn phải mở incident mới và giữ lịch sử cũ. |
| RS-OVW-ALT-10 | Recent Alerts phải dùng chung snapshot và freshness với Fleet Summary, Fleet Health và Devices to Watch, có loading, empty, unavailable/Retry, cached/stale và recovery. Nguồn không khả dụng không được hiển thị số cảnh báo bằng không giả tạo. |
| RS-OVW-ALT-11 | Mỗi item phải có identity thiết bị và nguồn dữ liệu manual input, remote simulator hoặc SDR Gateway, trạng thái Active/Resolved và thời gian occurrence tuyệt đối; resolve không được đưa occurrence cũ lên đầu. |
| RS-OVW-ALT-12 | Incident health tự sinh dùng severity Warning cho health Warning và Critical cho health Offline. Finding nhập thủ công giữ severity và lifecycle riêng, không được tự resolve bởi heartbeat. |

## Tiêu chí chấp nhận

- Alert mới từ simulator xuất hiện trên cùng.
- Tập alert trống hiển thị empty state rõ ràng.
- Khi Alert inbox khả dụng, chọn `All` mở danh sách cảnh báo đầy đủ mà không ngầm áp dụng filter severity hoặc resolution status.
- Trước khi Alert inbox khả dụng, `All` không thể kích hoạt bằng pointer hoặc bàn phím và được thông báo là không khả dụng.
- Warning/Offline lặp lại chỉ tạo một incident; expiry/recovery và tái diễn giữ đúng lịch sử và tổng unresolved.
- Lỗi refresh giữ snapshot cuối với nhãn stale; Retry khôi phục dữ liệu mới mà không gọi fetch riêng cho section.
