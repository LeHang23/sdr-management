# RS-01 - Độ tin cậy heartbeat

| Field | Value |
| --- | --- |
| Screen | SDR Simulator Console |
| FBS | FBS-3.1 |
| Priority | Must |

## Mục tiêu

Gửi heartbeat đáng tin cậy và báo kết quả rõ ràng cho các lần chạy tự động.

## Yêu cầu

| ID | Requirement |
| --- | --- |
| RS-SIM-NET-01 | Giới hạn từng request heartbeat bằng deadline cấu hình được, gồm cả đọc response body. |
| RS-SIM-NET-02 | Chế độ liên tục tiếp tục sau lỗi HTTP/timeout và phục hồi khi heartbeat tiếp theo được chấp nhận. |
| RS-SIM-NET-03 | Chế độ one-shot trả exit code khác 0 nếu có heartbeat cần gửi thất bại; cấu hình sai cũng trả code khác 0. |
| RS-SIM-NET-04 | Kiểm tra số thiết bị nguyên từ 1 đến 100; validate interval, request timeout và control port trước khi chạy. |
| RS-SIM-NET-05 | Lập lịch batch theo khoảng cách giữa các thời điểm bắt đầu, không chồng lấn; bỏ qua slot đã qua khi batch kéo dài hơn interval. |
| RS-SIM-NET-06 | Ghi rõ Offline timeout là chính sách server: ba lần interval chung của simulator cho kịch bản mất ba heartbeat, cộng độ trễ sweep. |

## Trạng thái và trường hợp biên

- Xem trạng thái màn hình trong SRS.md; giữ lỗi và lịch sử để kiểm tra.

## Tiêu chí nghiệm thu

- Kiểm tra request được chấp nhận/từ chối/mất kết nối, header/body treo, phục hồi, cấu hình sai và batch chậm.
