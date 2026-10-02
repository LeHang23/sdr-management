# RS-05 - Danh sách thiết bị

| Field | Value |
| --- | --- |
| Screen | SDR Simulator Console |
| FBS | FBS-3.1 |
| Priority | Must |

## Mục tiêu

Danh sách thiết bị for virtual devices only.

## Yêu cầu

| ID | Requirement |
| --- | --- |
| RS-SIM-INV-01 | Thêm, sửa và xóa thiết bị ảo với ID SIM-SDR- duy nhất, tên hiển thị, model và vị trí; ID không đổi sau khi tạo. |
| RS-SIM-INV-02 | Validate ID an toàn, tên dài 1–100 ký tự và tối đa 100 thiết bị. Fleet rỗng là hợp lệ. |
| RS-SIM-INV-03 | Lưu cấu hình nguyên tử khi cấu hình file state; báo lỗi thay vì âm thầm thay dữ liệu đã lưu bị hỏng. |
| RS-SIM-INV-04 | Xóa device dừng gửi và hủy request đang chờ; device, telemetry và lịch sử job trên backend được giữ nguyên. |

## Trạng thái và trường hợp biên

Lỗi validation giữ giá trị đã nhập. Backend lỗi giữ lịch sử và báo unavailable. Lỗi lưu trữ từ chối thay đổi.

## Tiêu chí nghiệm thu

Kiểm tra input hợp lệ/không hợp lệ, restart, lỗi backend và nhận lại command; đối chiếu source label và credential.
