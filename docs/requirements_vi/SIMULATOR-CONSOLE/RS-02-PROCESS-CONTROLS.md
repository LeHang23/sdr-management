# RS-02 - Điều khiển process

| Field | Value |
| --- | --- |
| Screen | SDR Simulator Console |
| FBS | FBS-3.1 |
| Priority | Must |

## Mục tiêu

Cho người kiểm thử điều khiển kịch bản mà request cũ không làm sai trạng thái simulator hiện tại.

## Yêu cầu

| ID | Requirement |
| --- | --- |
| RS-SIM-CTRL-01 | Pause dừng batch tương lai và hủy chờ request; Resume gửi sớm, không đổi lịch nếu đang chạy. |
| RS-SIM-CTRL-02 | Reset hủy chờ cũ, xóa counter/history cục bộ, khôi phục mode auto và gửi batch mới; giữ dữ liệu backend. |
| RS-SIM-CTRL-03 | Đổi mode hủy chờ request của thiết bị đó và áp dụng vào batch tiếp theo; thiết bị khác tiếp tục. |
| RS-SIM-CTRL-04 | Kết quả cũ đã hủy không ghi đè trạng thái hiện tại hoặc tính accepted/failed. Nêu rõ hủy request không thu hồi ingest backend. |
| RS-SIM-CTRL-05 | Khi dừng, hủy chờ và đóng Console sớm, không chờ hết heartbeat interval. |

## Trạng thái và trường hợp biên

- Xem trạng thái màn hình trong SRS.md; giữ lỗi và lịch sử để kiểm tra.

## Tiêu chí nghiệm thu

- Thử pause/resume/reset và từng mode, gồm lệnh khi request đang gửi và phục hồi sau mode disconnected.
