# Tài liệu Kiến trúc Hệ thống Chung cư Thông minh IoT

## 1. Tổng quan Kiến trúc

Hệ thống được thiết kế theo mô hình IoT 3 tầng:

```
[ Thiết bị ESP32 (Phần cứng) ]
       ▲                │
       │ (GET devices)  │ (POST telemetry mỗi 3s)
       ▼                ▼
[ Cloud Backend REST API (Node.js/Express) ]
       ▲                ▲
       │ (PUT control)  │ (GET sensors / alerts)
       ▼                ▼
[ Mobile App Cư dân (React Native / Expo) ]
```

---

## 2. Các thành phần chính

### 2.1. Backend (`/backend`)
- **Runtime:** Node.js 18+, Express.js, CORS
- **Chức năng:** Cầu nối trung gian tiếp nhận dữ liệu cảm biến từ ESP32, quản lý trạng thái thiết bị, lưu trữ lịch sử cảnh báo an ninh, cung cấp API cho Mobile App.
- **Hosting:** Render.com (Web Service)

### 2.2. Mobile App (`/mobile`)
- **Framework:** React Native (Expo)
- **Chức năng:**
  - Đăng nhập tài khoản cư dân.
  - Hiển thị thông số cảm biến realtime (cập nhật 3 giây/lần).
  - Điều khiển bật/tắt đèn và đóng/mở khóa cửa.
  - Xem và xóa lịch sử cảnh báo an ninh.
  - Công cụ giả lập tín hiệu ESP32 để kiểm thử nhanh.

### 2.3. Firmware ESP32 (`/firmware`)
- **Nền tảng:** Arduino C++ cho vi điều khiển ESP32
- **Cảm biến:** DHT11/DHT22 (Nhiệt độ & Độ ẩm), MQ-2 (Nồng độ khí Gas / Khói)
- **Thiết bị chấp hành:** Đèn LED / Relay (Phòng khách & Phòng ngủ), Động cơ Servo (Khóa cửa thông minh), Còi Buzzer (Cảnh báo tại chỗ)

---

## 3. Bảng API Contract

| STT | Method | Endpoint | Mô tả |
| :---: | :---: | :--- | :--- |
| 1 | `GET` | `/` | Health check hệ thống |
| 2 | `POST` | `/api/auth/login` | Cư dân đăng nhập |
| 3 | `POST` | `/api/sensors` | ESP32 gửi dữ liệu cảm biến định kỳ mỗi 3s |
| 4 | `GET` | `/api/sensors/:apartmentId` | Mobile App lấy dữ liệu cảm biến realtime |
| 5 | `GET` | `/api/devices/:apartmentId` | ESP32 & Mobile App đọc trạng thái thiết bị |
| 6 | `PUT` | `/api/devices/:apartmentId` | Mobile App điều khiển thiết bị |
| 7 | `GET` | `/api/alerts/:apartmentId` | Mobile App xem lịch sử cảnh báo an ninh |
| 8 | `DELETE` | `/api/alerts/:apartmentId` | Mobile App xóa lịch sử cảnh báo |
