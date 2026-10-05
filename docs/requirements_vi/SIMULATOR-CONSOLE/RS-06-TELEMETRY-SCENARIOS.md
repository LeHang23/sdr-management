# RS-06 - Telemetry và kịch bản transport

| Field | Value |
| --- | --- |
| Screen | SDR Simulator Console |
| FBS | FBS-3.1 |
| Priority | Must |

## Mục tiêu

Telemetry và kịch bản transport for virtual devices only.

## Yêu cầu

| ID | Requirement |
| --- | --- |
| RS-SIM-SCN-01 | Cho phép override throughput hữu hạn từ 0 đến 100000 Mbps và SNR từ -200 đến 200 dB. Giá trị trống dùng telemetry tự động. |
| RS-SIM-SCN-02 | Kịch bản mất mạng và timeout không gửi request đến backend, hiển thị lỗi mô phỏng và phục hồi khi chọn Normal. |
| RS-SIM-SCN-03 | Lưu override và fault cùng cấu hình device. Reset xóa counter, phục hồi auto/normal và xóa override nhưng giữ inventory và receipt command. |

## Trạng thái và trường hợp biên

Lỗi validation giữ giá trị đã nhập. Backend lỗi giữ lịch sử và báo unavailable. Lỗi lưu trữ từ chối thay đổi.

## Tiêu chí nghiệm thu

Kiểm tra input hợp lệ/không hợp lệ, restart, lỗi backend và nhận lại command; đối chiếu source label và credential.
