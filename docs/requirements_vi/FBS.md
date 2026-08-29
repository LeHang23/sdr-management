# Cấu trúc phân rã tính năng

## 1. Mục đích

Tài liệu Feature Breakdown Structure này phân rã SDR Management thành khu
vực sản phẩm, module, màn hình và nhóm tính năng. Tài liệu trả lời một capability
thuộc vị trí nào trong sản phẩm. Mỗi màn hình có một folder riêng chứa `SRS.md`
và các file RS chức năng được đánh số.

## 2. Cây phân rã tính năng

```text
SDR Management
|-- 1. Admin Workspace
|   |-- 1.0 Admin Dashboard shell
|   |   |-- Global navigation
|   |   |-- Global search
|   |   |-- Notifications
|   |   `-- Admin profile
|   |-- 1.1 Overview
|   |   |-- Fleet summary
|   |   |-- System performance
|   |   |-- Fleet health
|   |   |-- Devices to watch
|   |   |-- Recent alerts
|   |   `-- New reconfiguration entry point
|   |-- 1.2 Device Management
|   |   |-- Device list
|   |   |-- Add new device entry point
|   |   |-- Device registration and editing
|   |   |-- Device detail
|   |   `-- Simulator controls
|   |-- 1.3 Reconfiguration Management
|   |   |-- Job list
|   |   |-- New job wizard
|   |   |-- Job detail and progress
|   |   |-- Verification and performance comparison
|   |   `-- Retry and rollback
|   |-- 1.4 Firmware Management
|   |   |-- Package library
|   |   |-- Package upload and validation
|   |   `-- Package detail and lifecycle
|   |-- 1.5 Configuration Management
|   |   |-- Profile library
|   |   |-- Profile editor and validation
|   |   `-- Profile detail and version history
|   |-- 1.6 Monitoring and Alerts
|   |   |-- Fleet monitoring
|   |   |-- Alert inbox
|   |   `-- Alert detail and resolution
|   `-- 1.7 Audit
|       |-- Audit event list
|       `-- Audit event detail
|-- 2. Access Management
|   |-- 2.1 Authentication
|   |-- 2.2 Users
|   |-- 2.3 Roles and Permissions
|   `-- 2.4 User Profile
`-- 3. Platform Support
    |-- 3.1 SDR Simulator
    |-- 3.2 Device Gateway
    |-- 3.3 Notifications
    `-- 3.4 System Settings
```

## 3. Phân rã tính năng theo surface

| FBS ID | Khu vực / màn hình | Nhóm tính năng | Tính năng bao gồm | Trạng thái |
| --- | --- | --- | --- | --- |
| FBS-1.0 | Admin Dashboard | Application shell | Sidebar cố định và shared header bao quanh trang Administrator đang active | Đã thiết kế |
| FBS-1.0.1 | Admin Dashboard | Global navigation | Overview, Devices, Reconfiguration, Monitoring, Firmware, Config profiles, Alerts, Audit log | Đã thiết kế |
| FBS-1.0.3 | Admin Dashboard | Global search | Tìm kiếm thiết bị, job, firmware và configuration profile | Đã thiết kế |
| FBS-1.0.4 | Admin Dashboard | Notifications | Unread indicator, thông báo gần đây và mở related record | Đã thiết kế |
| FBS-1.0.5 | Admin Dashboard | Admin profile | Identity của Administrator hiện tại và account menu | Đã thiết kế |
| FBS-1.1 | Overview | Tổng quan trang | Tình trạng fleet, hiệu năng, thiết bị cần chú ý, cảnh báo gần đây và điểm vào reconfiguration | Đã thiết kế |
| FBS-1.1.1 | Overview | Fleet summary | Tổng thiết bị, thiết bị online, thiết bị cần chú ý, active jobs | Đã thiết kế |
| FBS-1.1.2 | Overview | System performance | Xu hướng Throughput và SNR, chọn khoảng thời gian, chú thích biểu đồ | Đã thiết kế |
| FBS-1.1.3 | Overview | Fleet health | Phân bố Online, Warning, Offline và Updating | Đã thiết kế |
| FBS-1.1.4 | Overview | Devices to watch | Danh sách ưu tiên, trạng thái, vấn đề, last seen, mở chi tiết và `View all` đến danh sách Device Management đã lọc | Đã thiết kế |
| FBS-1.1.5 | Overview | Recent alerts | Severity, nội dung, nguồn, thời gian, mở chi tiết cảnh báo và `All` để truy cập Alert inbox đầy đủ | Đã thiết kế |
| FBS-1.1.6 | Overview | Reconfiguration action | Nút bắt đầu New reconfiguration | Đã thiết kế |
| FBS-1.2 | Devices | Device list | Tìm kiếm, lọc, sắp xếp, phân trang, trạng thái, chọn nhiều | Dự kiến |
| FBS-1.2.1 | Device form | Quản trị thiết bị | Đăng ký, sửa, bật, tắt và gắn nhãn thiết bị | Dự kiến |
| FBS-1.2.2 | Device detail | Tổng quan | Identity, model, vị trí, sức khỏe, kết nối, phiên bản, last seen | Dự kiến |
| FBS-1.2.3 | Device detail | Monitoring | Live metrics, biểu đồ lịch sử, khoảng thời gian, active alerts | Dự kiến |
| FBS-1.2.4 | Device detail | Thay đổi và lịch sử | Configuration, firmware, reconfiguration history, audit activity | Dự kiến |
| FBS-1.2.5 | Device Management | Add new device | Primary action mở luồng đăng ký thiết bị trong tương lai cho SDR mô phỏng hoặc vật lý, gồm validation trường bắt buộc, save và cancel | Dự kiến |
| FBS-1.3 | Reconfiguration jobs | Job list | Lọc trạng thái, số target, artifact version, creator, progress, result | Dự kiến |
| FBS-1.3.1 | New reconfiguration | Chọn target | Một hoặc nhiều thiết bị, tìm kiếm, tóm tắt tương thích | Dự kiến |
| FBS-1.3.2 | New reconfiguration | Chọn artifact | Firmware package, configuration profile, version và compatibility | Dự kiến |
| FBS-1.3.3 | New reconfiguration | Kiểm tra và review | Availability, integrity, compatibility, recovery và confirmation | Dự kiến |
| FBS-1.3.4 | Job detail | Tiến trình triển khai | Job state, bước theo thiết bị, timeline, log, quy tắc cancel | Dự kiến |
| FBS-1.3.5 | Job detail | Verification | Metric trước/sau, chênh lệch tuyệt đối và phần trăm | Dự kiến |
| FBS-1.3.6 | Job detail | Recovery | Retry target thất bại và rollback target đủ điều kiện | Dự kiến |
| FBS-1.4 | Firmware | Package library | Tìm kiếm, version, compatibility, lifecycle state, release date | Dự kiến |
| FBS-1.4.1 | Firmware form | Quản lý package | Upload, metadata, checksum, compatibility, validation, release notes | Dự kiến |
| FBS-1.4.2 | Firmware detail | Lịch sử package | Chi tiết version, deployments, results, lifecycle actions | Dự kiến |
| FBS-1.5 | Config profiles | Profile library | Tìm kiếm, version, compatibility, lifecycle state | Dự kiến |
| FBS-1.5.1 | Profile editor | Soạn cấu hình | Tham số theo schema, validation, versioning, change summary | Dự kiến |
| FBS-1.5.2 | Profile detail | Lịch sử profile | Chi tiết version, deployments, results, lifecycle actions | Dự kiến |
| FBS-1.6 | Monitoring | Fleet telemetry | Chọn thiết bị, metric, khoảng thời gian, biểu đồ tổng hợp và từng thiết bị | Dự kiến |
| FBS-1.6.1 | Alerts | Alert inbox | Lọc severity và status, acknowledge, assign, resolve | Dự kiến |
| FBS-1.6.2 | Alert detail | Điều tra | Source, timeline, telemetry context, related job, resolution notes | Dự kiến |
| FBS-1.7 | Audit log | Event list | Tìm kiếm, actor, action, target, outcome, time range, export | Dự kiến |
| FBS-1.7.1 | Audit detail | Kiểm tra event | Before/after values, correlation ID, related records | Dự kiến |
| FBS-2.1 | Login | Authentication | Sign in, session errors, password recovery | Hoãn lại |
| FBS-2.2 | Users | Quản lý người dùng | Invite, edit, activate, deactivate, role assignment | Hoãn lại |
| FBS-2.3 | Roles | Authorization | Roles, permissions, protected action mapping | Hoãn lại |
| FBS-3.1 | Simulator | Điều khiển scenario | Sinh thiết bị, telemetry pattern, thay đổi trạng thái, kết quả job | Dự kiến |
| FBS-3.4 | System settings | Cấu hình nền tảng | Thresholds, retention, notification rules, environments | Dự kiến |

## 4. Các nhóm UI của Admin Dashboard shell và Overview hiện tại

Frame Figma hiện tại hiển thị Admin Dashboard shell với Overview là active
page. Hai phần được tách riêng để requirement trace chính xác.

| Nhóm UI | Mục đích người dùng | Nội dung hoặc thao tác chính | SRS liên quan |
| --- | --- | --- | --- |
| Admin Dashboard / Sidebar | Di chuyển giữa các module quản trị | Navigation links và active page | SRS-DASH-01 |
| Admin Dashboard / Shared header | Dùng control toàn nền tảng | Breadcrumb, search, notifications, profile | SRS-DASH-03 đến SRS-DASH-05 |
| Overview / KPI cards | Đánh giá nhanh đội thiết bị | Tổng thiết bị, online now, needs attention, active jobs | SRS-OVW-01 |
| Overview / System Performance | Theo dõi xu hướng vận hành | Biểu đồ Throughput và SNR theo khoảng thời gian | SRS-OVW-02 |
| Overview / Fleet Health | Hiểu phân bố trạng thái thiết bị | Online, Warning, Offline, Updating | SRS-OVW-03 |
| Overview / Devices to Watch | Ưu tiên điều tra | Trạng thái, vấn đề, last seen, link chi tiết, `View all` đã lọc | SRS-OVW-04 |
| Overview / Recent Alerts | Xem sự cố mới nhất và truy cập inbox đầy đủ | Severity, nội dung, nguồn, thời gian, chi tiết cảnh báo, `All` | SRS-OVW-05 |
| Overview / New Reconfiguration | Bắt đầu thay đổi từ xa | Mở quy trình tạo reconfiguration job | SRS-OVW-06 |

## 5. Quan hệ giữa các tài liệu

| Tài liệu | Câu hỏi chính | Cấp độ |
| --- | --- | --- |
| Folder màn hình / `RS-*.md` | Từng chức năng cần đạt kết quả và cung cấp capability gì? | Chức năng và stakeholder |
| Folder màn hình / `SRS.md` | Màn hình phải cung cấp hành vi và chất lượng có thể kiểm chứng nào? | Màn hình phần mềm |
| `FBS.md` | Capability được phân rã theo module, màn hình và nhóm UI như thế nào? | Cấu trúc tính năng |

Khi thêm màn hình, cập nhật trực tiếp cây và bảng trong tài liệu này, tạo folder
mang tên màn hình rồi đặt `SRS.md` và các file `RS-*.md` trong cùng folder đó.
