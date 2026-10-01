# Đặc tả yêu cầu phần mềm - SDR Simulator Console

## 1. Thông tin màn hình

| Field | Value |
| --- | --- |
| Screen | SDR Simulator Console |
| Role | Developer / tester |
| Design status | Implemented base; further scenarios planned |
| Figma frame | Not available |
| FBS reference | FBS-3.1 |

## 2. Mục đích

Quan sát và điều khiển simulator qua HTTP độc lập với DB ứng dụng.

## 3. Điều kiện trước

- Cấu hình và gateway token hợp lệ; backend truy cập được để chấp nhận heartbeat, nhưng lỗi transport không làm dừng chế độ liên tục.

## 4. Yêu cầu màn hình

| ID | Requirement | Related RS |
| --- | --- | --- |
| SRS-SIM-01 | Độ tin cậy heartbeat | RS-01-HEARTBEAT-RELIABILITY.md |
| SRS-SIM-02 | Điều khiển process | RS-02-PROCESS-CONTROLS.md |
| SRS-SIM-03 | Trạng thái và lịch gửi | RS-03-STATUS-AND-SCHEDULE.md |

## 5. Trạng thái màn hình

| State | Hành vi |
| --- | --- |
| Loading | Connecting đến khi nhận status đầu tiên |
| Ready | Hiện card thiết bị và lịch process |
| Paused | Không gửi batch tiếp; hủy chờ request |
| Error | Hiện lỗi transport/control, giữ history để kiểm tra |
| Disconnected scenario | Bỏ gửi; không xác nhận Offline backend |
| Backend rejects token | Báo HTTP từ chối, không lộ credential |

## 6. Dữ liệu và tương tác

- Console poll status simulator mỗi giây; điều khiển dùng HTTP API cục bộ. Không truy cập DB trực tiếp.
- Reset chỉ đổi trạng thái simulator; mode mới áp dụng ở batch tiếp theo.

## 7. Yêu cầu phi chức năng

- UI tiếng Anh, control semantic, focus rõ và trạng thái có nhãn chữ.
- Token trong process; giữ details của card qua refresh.

## 8. Tóm tắt nghiệm thu

- Có regression test cho timeout HTTP, one-shot exit code, race điều khiển và backend phục hồi.
- Lịch hiển thị khớp trạng thái process, không suy đoán Offline backend.
- Đọc Offline đã xác nhận từ backend, sửa danh sách thiết bị và giả lập command/job vẫn dự kiến.
