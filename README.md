# Hệ Thống Chung Cư Thông Minh IoT (Smart Apartment IoT)

Dự án môn học Lập trình di động & IoT — Xây dựng giải pháp giám sát an ninh và điều khiển thiết bị căn hộ thông minh đa nền tảng.

---

## 📂 Cấu trúc Repository (Monorepo)

```text
HETHONGCHUNGCUTHONGMINH/
├── .github/workflows/    # CI/CD tự động kiểm thử cú pháp mã nguồn
├── backend/              # Cloud REST API (Node.js + Express)
├── docs/                 # Tài liệu thiết kế hệ thống, sơ đồ mạch & API
├── firmware/             # Mã nguồn vi điều khiển ESP32 (Arduino C++)
├── mobile/               # Ứng dụng di động Cư dân (React Native / Expo)
├── .gitignore            # Cấu hình bỏ qua tệp rác toàn hệ thống
└── README.md             # Tài liệu hướng dẫn tổng quan dự án
```

---

## 🌟 Thành phần hệ thống

### 1. `backend/` — Cloud REST API
- **Công nghệ:** Node.js, Express, CORS, In-Memory Store.
- **Tính năng:** Tiếp nhận cảm biến từ ESP32 mỗi 3s, cơ chế cooldown 15s chống spam cảnh báo Gas & Quá nhiệt, cung cấp 8 API endpoints cho Mobile App.
- **Deploy:** Sẵn sàng deploy miễn phí lên **Render.com**.
  - *Lưu ý trên Render:* Khi tạo Web Service từ repo này, đặt mục **Root Directory** là `backend`.

### 2. `mobile/` — Mobile App Cư dân
- **Công nghệ:** React Native, Expo SDK 58.
- **Tính năng:** Đăng nhập cư dân, giám sát cảm biến realtime (cập nhật chu kỳ 3s), điều khiển bật/tắt đèn và khóa cửa, xem và xóa cảnh báo an ninh, công cụ giả lập dữ liệu ESP32 trực tiếp trên app.

### 3. `firmware/` — Phần cứng ESP32
- **Công nghệ:** Arduino C++ cho ESP32.
- **Cảm biến & Thiết bị:** DHT11/DHT22 (Nhiệt/Ẩm), MQ-2 (Gas), Relay đèn, Động cơ Servo khóa cửa, Còi Buzzer báo động tại chỗ.

### 4. `docs/` — Tài liệu kỹ thuật
- Sơ đồ kiến trúc 3 tầng, chi tiết kết nối GPIO phần cứng và bảng đặc tả toàn bộ 8 API contract.

---

## 🚀 Hướng dẫn khởi chạy nhanh

### Khởi chạy Backend:
```bash
cd backend
npm install
npm start
# Server chạy tại: http://localhost:3000
```

### Khởi chạy Mobile App:
```bash
cd mobile
npm install
npx expo start
# Quét mã QR bằng ứng dụng Expo Go trên điện thoại
```
