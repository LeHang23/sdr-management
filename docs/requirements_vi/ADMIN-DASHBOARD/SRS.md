# Đặc tả yêu cầu phần mềm - Admin Dashboard Shell

## 1. Thông tin màn hình

| Trường | Giá trị |
| --- | --- |
| Màn hình | Admin Dashboard shell |
| Vai trò | Administrator |
| Trạng thái thiết kế | Đã thiết kế |
| Frame Figma | Admin / Overview, vùng shared shell, 1440 x 1024 |
| Tham chiếu FBS | FBS-1.0 đến FBS-1.0.5 |

## 2. Mục đích

Admin Dashboard là application shell dùng chung cho các trang Administrator.
Shell cung cấp navigation cố định, global search, notifications và context tài
khoản Administrator bao quanh trang đang active.

## 3. Điều kiện trước

- Admin workspace đã tải thành công.
- SDR Simulator cung cấp dữ liệu demo cho đến khi tích hợp thiết bị vật lý.
- Authentication đang được hoãn; màn hình hiện giả định context Administrator.

## 4. Yêu cầu màn hình

| ID | Yêu cầu | RS liên quan |
| --- | --- | --- |
| SRS-DASH-01 | Màn hình phải cung cấp điều hướng đến các module quản trị và thể hiện rõ module đang hoạt động. | RS-01-GLOBAL-NAVIGATION.md |
| SRS-DASH-03 | Header phải cung cấp chức năng global search. | RS-03-GLOBAL-SEARCH.md |
| SRS-DASH-04 | Header phải cho phép mở thông báo gần đây và thể hiện số thông báo chưa đọc. | RS-04-NOTIFICATIONS.md |
| SRS-DASH-05 | Header phải nhận diện Administrator hiện tại và cho phép mở profile menu. | RS-05-ADMIN-PROFILE.md |

## 5. Trạng thái màn hình

| Trạng thái | Hành vi mong đợi |
| --- | --- |
| Loading | Hiển thị shell ổn định trong khi active page và dữ liệu account dùng chung đang tải. |
| Ready | Hiển thị active page bên trong navigation và header cố định. |
| Partially unavailable | Giữ các shell control còn khả dụng và đánh dấu rõ shared service bị lỗi. |
| Unauthorized | Không render protected page và chuyển đến access-control flow trong tương lai. |

## 6. Cập nhật dữ liệu và tương tác

- Chọn navigation destination khả dụng phải cập nhật active page và trạng thái
  current page ở mức programmatic.
- Search result và notification phải mở đúng destination khi destination đó khả
  dụng.

## 7. Yêu cầu phi chức năng của màn hình

- Shared shell phải ổn định khi active page thay đổi.
- Desktop shell phải sử dụng được từ viewport 1024px; thiết kế chính là
  1440px.
- Control chính phải sử dụng được bằng bàn phím và có accessible name.
- Giao diện sử dụng tiếng Anh và hỗ trợ bổ sung localization về sau.

## 8. Tóm tắt tiêu chí chấp nhận

- Administrator nhận biết được active page và truy cập được mọi admin
  destination đã khả dụng.
- Shared control không khả dụng được thể hiện rõ mà không thêm global connectivity badge.
- Mỗi nhóm shell dùng chung truy vết được đến một file RS trong folder này.
