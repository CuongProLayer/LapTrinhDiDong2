# Hệ thống Chung cư Thông minh IoT (Smart Apartment IoT Backend)

Backend REST API xây dựng bằng **Node.js** và **Express.js**, phục vụ làm trung tâm kết nối giữa phần cứng **ESP32** và ứng dụng di động **Mobile App dành cho Cư dân**.

Sẵn sàng chạy thử nghiệm cục bộ (Local) hoặc triển khai miễn phí 100% lên nền tảng đám mây **Render.com**.

---

## 📑 Mục lục
1. [Tính năng chính](#tính-năng-chính)
2. [Cấu trúc thư mục](#cấu-trúc-thư-mục)
3. [Tài khoản & Dữ liệu mẫu mặc định](#tài-khoản--dữ-liệu-mẫu-mặc-định)
4. [Hướng dẫn cài đặt & Chạy Local](#hướng-dẫn-cài-đặt--chạy-local)
5. [Tài liệu API Contract](#tài-liệu-api-contract)
6. [Hướng dẫn đẩy mã nguồn lên GitHub](#hướng-dẫn-đẩy-mã-nguồn-lên-github)
7. [Hướng dẫn Deploy miễn phí lên Render.com](#hướng-dẫn-deploy-miễn-phí-lên-rendercom)

---

## 🚀 Tính năng chính

- **Cầu nối IoT ESP32:** Tiếp nhận dữ liệu cảm biến nhiệt độ, độ ẩm, nồng độ khí Gas gửi lên mỗi 3 giây.
- **Cơ chế chống spam cảnh báo:** Thiết lập bộ đệm Cooldown 15 giây đối với các cảnh báo khẩn cấp (rò rỉ gas, nhiệt độ vượt 40°C), tự động lưu trữ 50 cảnh báo mới nhất có gắn mốc thời gian Việt Nam (`Asia/Ho_Chi_Minh`).
- **Điều khiển thiết bị 2 chiều:** Mobile App gửi lệnh bật/tắt đèn và khóa cửa; ESP32 đọc trạng thái tức thời để điều khiển Relay và Servo.
- **Tự động cấp phát căn hộ:** Cơ chế `getOrCreateApartment` cho phép kiểm thử với bất kỳ mã căn hộ nào mà không lo gặp lỗi 404.
- **Khả năng chống crash:** Middleware chặn lỗi cú pháp JSON bất thường do phần cứng gửi lên.

---

## 📁 Cấu trúc thư mục

```text
smart-apartment-backend/
├── package.json        # Định nghĩa dependencies (express, cors) & scripts
├── server.js           # Mã nguồn máy chủ Node.js & toàn bộ REST API
├── .gitignore          # Loại trừ node_modules và file nhạy cảm
├── test-api.http       # Bộ kịch bản kiểm thử API (REST Client / Postman)
└── README.md           # Hướng dẫn chi tiết
```

---

## 👤 Tài khoản & Dữ liệu mẫu mặc định

Hệ thống đã nạp sẵn dữ liệu của căn hộ mẫu **`A-1204`**:

| Thông tin | Giá trị |
| :--- | :--- |
| **Mã căn hộ** | `A-1204` |
| **Tên cư dân** | Nguyễn Văn An |
| **Tên đăng nhập** | `cudan1204` |
| **Mật khẩu** | `123456` |
| **Số điện thoại** | `0905 123 456` |
| **Cảm biến ban đầu** | Nhiệt độ: 28.5°C \| Độ ẩm: 65% \| Khí Gas: 150 ppm |
| **Thiết bị ban đầu** | Đèn khách: `TẮT` \| Đèn ngủ: `TẮT` \| Khóa cửa: `ĐÓNG` |

*(Lưu ý: Nếu truy vấn căn hộ mới ví dụ `B-501`, hệ thống sẽ tự sinh tài khoản `username: "cudan_b501"`, `password: "123456"`).*

---

## 💻 Hướng dẫn cài đặt & Chạy Local

### Yêu cầu tiên quyết
- Đã cài đặt **Node.js** phiên bản 18 trở lên (`node -v`).

### Các bước thực hiện
```bash
# 1. Chuyển vào thư mục dự án
cd smart-apartment-backend

# 2. Cài đặt các thư viện cần thiết
npm install

# 3. Khởi chạy máy chủ
npm start

# Hoặc chế độ tự động reload khi sửa code (Node 18+)
npm run dev
```

Server sẽ lắng nghe tại: `http://localhost:3000`

---

## 📡 Tài liệu API Contract

| STT | Phương thức | Đường dẫn API | Mục đích | Dữ liệu gửi lên (Body) | Dữ liệu trả về mẫu |
| :---: | :---: | :--- | :--- | :--- | :--- |
| **1** | `GET` | `/` | Health check hệ thống | *Trống* | `{ status: "ONLINE", project: "...", time: "..." }` |
| **2** | `POST` | `/api/auth/login` | Mobile App đăng nhập | `{"username": "cudan1204", "password": "123456"}` | `{ success: true, token: "...", user: {...} }` |
| **3** | `POST` | `/api/sensors` | ESP32 gửi dữ liệu cảm biến | `{"apartmentId": "A-1204", "temperature": 29.5, "humidity": 65, "gasPpm": 180, "gasAlert": false, "tempAlert": false}` | `{ success: true, data: {...} }` |
| **4** | `GET` | `/api/sensors/:apartmentId` | Mobile App đọc cảm biến | *Trống* | Trả thẳng đối tượng `{ apartmentId, temperature, humidity, gasPpm, ... }` |
| **5** | `GET` | `/api/devices/:apartmentId` | ESP32 & App đọc thiết bị | *Trống* | Trả thẳng đối tượng `{ livingRoomLight, bedroomLight, doorUnlocked }` |
| **6** | `PUT` | `/api/devices/:apartmentId` | Mobile App điều khiển thiết bị | `{"livingRoomLight": true, "doorUnlocked": true}` | `{ success: true, devices: {...} }` |
| **7** | `GET` | `/api/alerts/:apartmentId` | Mobile App xem cảnh báo | *Trống* | Trả thẳng mảng danh sách `[ { id, type, title, message, timestamp }, ... ]` |
| **8** | `DELETE` | `/api/alerts/:apartmentId` | Mobile App xóa cảnh báo | *Trống* | `{ success: true, message: "Đã xóa lịch sử cảnh báo" }` |

---

## 🐙 Hướng dẫn đẩy mã nguồn lên GitHub

Mở terminal tại thư mục `smart-apartment-backend`:

```bash
# 1. Khởi tạo Git repository
git init

# 2. Thêm tất cả file vào staging
git add .

# 3. Tạo commit đầu tiên
git commit -m "feat: initial smart apartment iot backend"

# 4. Đổi tên nhánh chính thành main
git branch -M main

# 5. Liên kết tới repository GitHub của bạn (thay bằng link của bạn)
git remote add origin https://github.com/<USERNAME_CUA_BAN>/smart-apartment-backend.git

# 6. Đẩy mã nguồn lên GitHub
git push -u origin main
```

---

## ☁️ Hướng dẫn Deploy miễn phí lên Render.com

1. Truy cập vào **[https://dashboard.render.com](https://dashboard.render.com)** và đăng nhập bằng tài khoản GitHub.
2. Nhấn nút **New +** ở góc trên bên phải, chọn **Web Service**.
3. Chọn tùy chọn **Build and deploy from a Git repository**, chọn repository `smart-apartment-backend` vừa push.
4. Điền các thông tin cấu hình như sau:
   - **Name:** `smart-apartment-backend` (hoặc tên tùy ý)
   - **Region:** `Singapore` (để độ trễ về Việt Nam thấp nhất cho ESP32)
   - **Branch:** `main`
   - **Root Directory:** Để trống (hoặc `smart-apartment-backend` nếu repo của bạn chứa cả thư mục cha)
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance Type:** `Free`
5. Nhấn **Create Web Service**.
6. Chờ Render tiến hành build và xuất hiện log `🚀 SMART APARTMENT IOT BACKEND IS RUNNING`. Render sẽ cung cấp một đường link công khai dạng:
   ```text
   https://smart-apartment-backend-xxxx.onrender.com
   ```
7. Cập nhật URL công khai này vào code trên phần cứng **ESP32** và ứng dụng **Mobile App** (thay cho `http://localhost:3000`).
