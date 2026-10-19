# Software Requirements Specification - Danh sách thiết bị

## 1. Thông tin màn hình

| Field | Value |
| --- | --- |
| Screen | Device List |
| Role | Administrator |
| Design status | Implemented; dedicated Figma frame planned |
| Figma frame | Not available; existing Admin shell and tokens reused |
| FBS reference | FBS-1.2 |

## 2. Mục đích

Cho phép Administrator tìm thiết bị và xem sức khỏe, kết nối, nguồn dữ liệu và last seen.

## 3. Điều kiện tiên quyết

- Ứng dụng Node.js và cơ sở dữ liệu SQLite hoạt động.
- Tạm giả định ngữ cảnh Administrator đến khi có access management; áp dụng xác thực hosted preview.

## 4. Yêu cầu màn hình

| ID | Requirement | Related RS |
| --- | --- | --- |
| SRS-DEVLIST-01 | Hiển thị ID/tên, sức khỏe, kết nối, nguồn, last seen và trạng thái cần chú ý. | RS-01-DEVICE-INVENTORY.md |
| SRS-DEVLIST-02 | Tìm theo ID/tên và kết hợp lọc health, connection, source và Needs attention. | RS-02-SEARCH-AND-FILTERS.md |
| SRS-DEVLIST-03 | Cung cấp sắp xếp ổn định và phân trang ở server. | RS-03-SORTING-AND-PAGINATION.md |
| SRS-DEVLIST-04 | Cho phép chọn thiết bị trên trang hiện tại, chưa thực thi bulk actions dự kiến. | RS-04-PAGE-SELECTION.md |

## 5. Trạng thái màn hình

| State | Expected behavior |
| --- | --- |
| Loading | Hiện thông báo tải; không giả lập số đếm bằng 0. |
| Ready | Hiện dữ liệu API đã kiểm tra và thời điểm cập nhật. |
| Empty fleet | Hiện No devices registered yet. |
| No matches | Hiện No devices match your search and filters. |
| Error / Offline | Hiện unavailable và Retry; chỉ giữ snapshot có nhãn stale nếu cùng truy vấn. |
| Unauthorized | Thông báo cần đăng nhập; không coi lỗi xác thực là fleet rỗng. |

## 6. Dữ liệu và tương tác

- Devices trên Overview mở devices.html; View all của Devices to Watch mở devices.html?attention=true.
- Truy vấn lưu trên URL và giữ khi reload. Tìm bằng Search/Enter; chọn bộ lọc áp dụng ngay.
- Refresh mỗi 30 giây khi hiển thị và khi quay lại/kết nối lại; timeout request 10 giây. Request cũ không ghi đè kết quả mới.
- Đổi bộ lọc/trang xóa lựa chọn và kết quả cũ. Refresh chỉ giữ ID còn trên trang hiện tại.
- Add new device bị disable; Device Detail và bulk actions hiện rõ là dự kiến.

## 7. Yêu cầu phi chức năng

- UI tiếng Anh; trạng thái có nhãn; form, bảng và phân trang dùng được bằng bàn phím.
- Sử dụng được ở 1440 x 1024 và chiều rộng 1024px; bảng có thể cuộn ngang.
- API chỉ đọc; bind tham số tìm kiếm và allowlist bộ lọc/sort; số đếm và dữ liệu cùng read transaction.

## 8. Tóm tắt nghiệm thu

- Tìm kiếm, bộ lọc kết hợp, sắp xếp và phân trang phản ánh dữ liệu đã lưu.
- Needs attention khớp quy tắc Overview; thiết bị phục hồi rời danh sách nếu không còn điều kiện khác.
- Không dẫn tới route Device Detail hoặc đăng ký chưa có.
