# Firmware ESP32 - Hệ thống Chung cư Thông minh IoT

Thư mục chứa mã nguồn Arduino C++ nạp cho kit vi điều khiển **ESP32** (Lab 1).

---

## 🔌 Sơ đồ kết nối phần cứng (Pinout)

| Linh kiện | Chân ESP32 | Chú thích |
| :--- | :--- | :--- |
| **DHT11 / DHT22** (Data) | `GPIO 4` | Cảm biến Nhiệt độ & Độ ẩm |
| **MQ-2 Gas Sensor** (Analog A0) | `GPIO 34` | Cảm biến nồng độ khí Gas |
| **Đèn phòng khách** (LED / Relay 1) | `GPIO 18` | Output điều khiển đèn |
| **Đèn phòng ngủ** (LED / Relay 2) | `GPIO 19` | Output điều khiển đèn |
| **Khóa cửa** (Servo Motor SG90) | `GPIO 23` | Điều khiển đóng/mở chốt cửa |
| **Còi Buzzer** | `GPIO 5` | Báo động tại chỗ khi rò rỉ Gas |

---

## 📦 Thư viện Arduino cần cài đặt

1. **ArduinoJson** (phiên bản 6.x hoặc 7.x) của Benoit Blanchon
2. **DHT sensor library** của Adafruit
3. **ESP32Servo** của Kevin Harrington

---

## ⚙️ Cấu hình trước khi nạp code

Mở file `esp32_smart_apartment.ino`, chỉnh sửa các thông số mạng:

```cpp
const char* WIFI_SSID     = "TEN_WIFI_CUA_BAN";
const char* WIFI_PASSWORD = "MAT_KHAU_WIFI";

// Link Cloud API (hoặc IP máy tính nếu chạy local: http://192.168.1.x:3000)
const char* SERVER_URL    = "https://smart-apartment-backend.onrender.com";

const char* APARTMENT_ID  = "A-1204";
```
