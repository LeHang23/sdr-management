# RS-07 - Cấu hình từ xa giả lập

| Field | Value |
| --- | --- |
| Screen | SDR Simulator Console |
| FBS | FBS-3.1 |
| Priority | Must |

## Mục tiêu

Cấu hình từ xa giả lập for virtual devices only.

## Yêu cầu

| ID | Requirement |
| --- | --- |
| RS-SIM-JOB-01 | Tạo command có xác thực cho target SIM-SDR- đã gửi heartbeat với tham số throughput/SNR; từ chối target vật lý hoặc không tồn tại. |
| RS-SIM-JOB-02 | Gắn command/result với job và device ID, hiển thị trạng thái từng target và tổng hợp vòng đời job reconfiguration bền vững. |
| RS-SIM-JOB-03 | Hỗ trợ success, failure và timeout không có result. Success lưu override telemetry; failure/timeout không áp dụng. Device pause/disconnected/fault không thực thi command. |
| RS-SIM-JOB-04 | Chống tạo trùng bằng job ID và từ chối target/cấu hình xung đột. Lưu receipt nguyên tử cùng cấu hình; nhận lại/restart chỉ gửi lại result, không áp dụng lại. |
| RS-SIM-JOB-05 | Timeout job là 1000–300000 ms tính từ lúc tạo, gồm thời gian queue/pause. Target timeout là terminal; job tổng hợp là failed. |
| RS-SIM-JOB-06 | Giữ Bearer credential phía server, bảo vệ ghi Console khỏi cross-site và gắn nhãn simulated cho mọi job. Không tuyên bố đổi SDR vật lý hoặc firmware. |

## Trạng thái và trường hợp biên

Lỗi validation giữ giá trị đã nhập. Backend lỗi giữ lịch sử và báo unavailable. Lỗi lưu trữ từ chối thay đổi.

## Tiêu chí nghiệm thu

Kiểm tra input hợp lệ/không hợp lệ, restart, lỗi backend và nhận lại command; đối chiếu source label và credential.
