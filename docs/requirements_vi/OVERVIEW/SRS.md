# Đặc tả yêu cầu phần mềm - Overview

## 1. Thông tin màn hình

| Trường | Giá trị |
| --- | --- |
| Màn hình | Overview |
| Parent shell | Admin Dashboard |
| Vai trò | Administrator |
| Trạng thái thiết kế | Đã thiết kế |
| Frame Figma | Dashboard, vùng nội dung Overview, 1440 x 1024 |
| Tham chiếu FBS | FBS-1.1 đến FBS-1.1.6 |

## 2. Mục đích

Trang Overview giúp Administrator nắm nhanh tình trạng đội thiết bị, hiệu năng,
công việc đang chạy và sự cố gần đây. Trang cũng cung cấp các điểm vào tập trung
để kiểm tra thiết bị và bắt đầu tái cấu hình từ xa.

## 3. Điều kiện trước

- Admin Dashboard shell đã tải thành công.
- Overview là navigation destination đang active.
- SDR Simulator cung cấp dữ liệu demo cho đến khi tích hợp thiết bị vật lý.
- Remote simulator phải sử dụng contract Device Gateway có xác thực thay vì ghi
  trực tiếp vào database của ứng dụng.

## 4. Yêu cầu màn hình

| ID | Yêu cầu | RS liên quan |
| --- | --- | --- |
| SRS-OVW-01 | Trang phải hiển thị Total devices, Online now, Needs attention và Active jobs. | RS-01-FLEET-SUMMARY.md |
| SRS-OVW-02 | Trang phải hiển thị xu hướng Throughput và SNR theo khoảng thời gian đã chọn. | RS-02-SYSTEM-PERFORMANCE.md |
| SRS-OVW-03 | Trang phải hiển thị phân bố sức khỏe thiết bị theo Healthy, Warning, Offline và Updating, phân biệt với metric kết nối Online now. | RS-03-FLEET-HEALTH.md |
| SRS-OVW-04 | Trang phải hiển thị danh sách ưu tiên các thiết bị cần điều tra và cung cấp `View all` để mở danh sách đã lọc đầy đủ khi Device Management khả dụng. | RS-04-DEVICES-TO-WATCH.md |
| SRS-OVW-05 | Trang phải hiển thị cảnh báo gần đây theo thứ tự mới nhất trước và cung cấp action `All` để truy cập Alert inbox đầy đủ khi khả dụng. | RS-05-RECENT-ALERTS.md |
| SRS-OVW-06 | Trang phải có primary action để bắt đầu quy trình reconfiguration. | RS-06-NEW-RECONFIGURATION.md |

## 5. Trạng thái màn hình

| Trạng thái | Hành vi mong đợi |
| --- | --- |
| Loading | Hiển thị placeholder ổn định cho card, chart và list, không gây layout shift. |
| Ready | Hiển thị Overview snapshot thành công mới nhất và cập nhật live. |
| Empty | Hiển thị giá trị 0 và hướng dẫn empty state thay vì panel trống. |
| Partially unavailable | Giữ các panel còn dữ liệu và hiển thị lỗi inline kèm retry cho nguồn thất bại. |
| Offline | Giữ snapshot thành công cuối và đánh dấu dữ liệu là stale. |
| Unauthorized | Không render dữ liệu Overview và chuyển quyền xử lý cho access-control flow của Admin Dashboard. |

## 6. Cập nhật dữ liệu và tương tác

- Trạng thái thiết bị phải được phản ánh trong vòng năm giây sau khi hệ thống
  nhận dữ liệu khi nền tảng đang kết nối.
- Heartbeat từ simulator phải nhận diện dữ liệu là dữ liệu mô phỏng; khi
  heartbeat hết hạn, thiết bị mô phỏng từ xa tương ứng phải chuyển sang Offline.
- Chu kỳ heartbeat mặc định của simulator phải là 60 giây. Timeout thiết bị
  stale mặc định phải là 180 giây để thiết bị chỉ chuyển Offline sau khi bỏ lỡ
  ba heartbeat dự kiến.
- Đổi khoảng thời gian biểu đồ không được tải lại toàn bộ trang.
- Chọn thiết bị, cảnh báo, `View all`, `All` hoặc primary action phải mở đúng màn hình
  hoặc workflow tương ứng khi khả dụng.
- Trạng thái phải sử dụng text hoặc icon bên cạnh màu sắc.

## 7. Yêu cầu phi chức năng của màn hình

- Nội dung Overview chính phải render trong vòng hai giây với tải demo trên kết
  nối broadband thông thường.
- Trang phải sử dụng được trong Admin Dashboard shell từ viewport 1024px; thiết
  kế chính là 1440px.
- Control chính phải sử dụng được bằng bàn phím và có accessible name.
- Trang sử dụng tiếng Anh và hỗ trợ bổ sung localization về sau.

## 8. Tóm tắt tiêu chí chấp nhận

- Administrator hiểu được tình trạng đội thiết bị mà không mở trang khác.
- Dữ liệu Offline hoặc stale được phân biệt rõ với dữ liệu hiện tại.
- Mỗi nhóm UI của Overview truy vết được đến một file RS trong folder này.
