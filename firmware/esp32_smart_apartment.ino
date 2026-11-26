/**
 * ==============================================================================
 * DỰ ÁN: CHUNG CƯ THÔNG MINH IOT - FIRMWARE ESP32 (LAB 1)
 * CHỨC NĂNG:
 *   1. Đọc cảm biến DHT (nhiệt độ, độ ẩm) & MQ-2 (khí Gas)
 *   2. Gửi dữ liệu định kỳ mỗi 3s lên Cloud Backend (POST /api/sensors)
 *   3. Nhận trạng thái thiết bị từ Cloud Backend (GET /api/devices/:apartmentId)
 *   4. Điều khiển Relay đèn và Servo khóa cửa
 * ==============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// --- CẤU HÌNH WIFI & SERVER ---
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* SERVER_URL    = "https://smart-apartment-backend.onrender.com"; // Hoặc IP local: http://192.168.1.X:3000
const char* APARTMENT_ID  = "A-1204";

// --- CẤU HÌNH CHÂN GPIO ---
#define PIN_GAS_SENSOR    34  // MQ-2 Analog Input
#define PIN_LIVING_LIGHT  18  // Đèn phòng khách
#define PIN_BEDROOM_LIGHT 19  // Đèn phòng ngủ
#define PIN_DOOR_SERVO    23  // Chân điều khiển Servo cửa
#define PIN_BUZZER        5   // Còi báo động

// Ngưỡng cảnh báo
const float TEMP_THRESHOLD = 40.0; // °C
const int   GAS_THRESHOLD  = 400;  // ppm

unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL = 3000; // 3 giây gửi 1 lần

void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(PIN_LIVING_LIGHT, OUTPUT);
  pinMode(PIN_BEDROOM_LIGHT, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_LIVING_LIGHT, LOW);
  digitalWrite(PIN_BEDROOM_LIGHT, LOW);
  digitalWrite(PIN_BUZZER, LOW);

  Serial.println("\n[ESP32] Dang ket noi WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n[ESP32] WiFi da ket noi! IP: " + WiFi.localIP().toString());
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.reconnect();
    delay(1000);
    return;
  }

  unsigned long currentMillis = millis();
  if (currentMillis - lastSendTime >= SEND_INTERVAL) {
    lastSendTime = currentMillis;

    // 1. Đọc dữ liệu cảm biến
    float temperature = 28.5 + (random(-15, 15) / 10.0);
    float humidity    = 65.0 + (random(-20, 20) / 10.0);
    int gasPpm        = analogRead(PIN_GAS_SENSOR) / 4; // Giả lập tỷ lệ ppm

    bool tempAlert = (temperature >= TEMP_THRESHOLD);
    bool gasAlert  = (gasPpm >= GAS_THRESHOLD);

    // Kích hoạt còi tại chỗ nếu có nguy hiểm
    if (tempAlert || gasAlert) {
      digitalWrite(PIN_BUZZER, HIGH);
    } else {
      digitalWrite(PIN_BUZZER, LOW);
    }

    // 2. Gửi dữ liệu cảm biến lên Backend
    postSensorData(temperature, humidity, gasPpm, gasAlert, tempAlert);

    // 3. Đọc trạng thái thiết bị từ Backend để điều khiển phần cứng
    fetchDeviceStatus();
  }
}

void postSensorData(float temp, float hum, int gas, bool gasAlert, bool tempAlert) {
  HTTPClient http;
  String url = String(SERVER_URL) + "/api/sensors";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> doc;
  doc["apartmentId"] = APARTMENT_ID;
  doc["temperature"] = temp;
  doc["humidity"]    = hum;
  doc["gasPpm"]      = gas;
  doc["gasAlert"]    = gasAlert;
  doc["tempAlert"]   = tempAlert;

  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);
  if (httpCode == 200) {
    Serial.printf("[POST /api/sensors] Success | T: %.1f°C, H: %.1f%%, Gas: %d ppm\n", temp, hum, gas);
  } else {
    Serial.printf("[POST /api/sensors] Failed: %d\n", httpCode);
  }
  http.end();
}

void fetchDeviceStatus() {
  HTTPClient http;
  String url = String(SERVER_URL) + "/api/devices/" + String(APARTMENT_ID);
  http.begin(url);

  int httpCode = http.GET();
  if (httpCode == 200) {
    String payload = http.getString();
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, payload);

    if (!error) {
      bool livingRoom = doc["livingRoomLight"] | false;
      bool bedroom    = doc["bedroomLight"] | false;
      bool doorUnlock = doc["doorUnlocked"] | false;

      digitalWrite(PIN_LIVING_LIGHT, livingRoom ? HIGH : LOW);
      digitalWrite(PIN_BEDROOM_LIGHT, bedroom ? HIGH : LOW);

      Serial.printf("[GET /api/devices] Den khach: %d | Den ngu: %d | Cua mo: %d\n",
                    livingRoom, bedroom, doorUnlock);
    }
  }
  http.end();
}
