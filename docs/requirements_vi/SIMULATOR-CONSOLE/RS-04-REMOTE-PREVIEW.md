# RS-04 - Truy cập preview từ xa có bảo vệ

| Field | Value |
| --- | --- |
| Screen | SDR Simulator Console |
| FBS | FBS-3.1 |
| Priority | Must |

## Mục tiêu

Xem và điều khiển demo từ thiết bị khác khi máy cá nhân đã tắt.

## Yêu cầu

| ID | Requirement |
| --- | --- |
| RS-SIM-REMOTE-01 | Yêu cầu xác thực preview cho Dashboard hosted và mọi trang/API Console; từ chối khởi động nếu thiếu mật khẩu đủ mạnh. |
| RS-SIM-REMOTE-02 | Dùng cùng credential preview cho hai giao diện; gateway token riêng và chỉ nằm phía server. |
| RS-SIM-REMOTE-03 | Từ chối request từ website khác làm thay đổi điều khiển simulator. |
| RS-SIM-REMOTE-04 | Hỗ trợ Console ở /simulator/ và / độc lập; điều khiển và polling dùng đúng prefix hiện tại. |
| RS-SIM-REMOTE-05 | Link điều hướng Dashboard dùng URL hosting public độc lập với địa chỉ heartbeat nội bộ. |
| RS-SIM-REMOTE-06 | Chỉ trả health tối thiểu không cần credential preview; bảo vệ dữ liệu thiết bị bằng xác thực. |
| RS-SIM-REMOTE-07 | Startup hosted chạy backend và simulator cùng nhau, không cần máy cá nhân; shutdown đóng cả hai. |
| RS-SIM-REMOTE-08 | Ghi rõ service miễn phí có thể ngủ và storage demo tạm thời; không cam kết giả lập liên tục hoặc history bền vững. |

## Trạng thái và trường hợp biên

- Credential thiếu/sai trả 401; mật khẩu hosted không hợp lệ làm startup thất bại.
- Render Free có thể ngủ và mất dữ liệu demo sau restart/deploy.

## Tiêu chí nghiệm thu

- Kiểm tra hai trang/API qua cùng port, auth, mode/control và URL Dashboard public.
- Chỉ tick kiểm tra HTTPS thực tế sau khi deploy thành công.
