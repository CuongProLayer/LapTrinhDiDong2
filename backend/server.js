const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Bắt lỗi khi ESP32 hoặc Client gửi JSON sai cú pháp (tránh crash server)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu JSON gửi lên không hợp lệ'
    });
  }
  next();
});

// ================= CƠ SỞ DỮ LIỆU TẠM THỜI TRÊN SERVER =================
// Khởi tạo sẵn dữ liệu mẫu cho căn hộ A-1204
const apartmentsData = {
  'A-1204': {
    resident: {
      username: 'cudan1204',
      password: '123456',
      fullName: 'Nguyễn Văn An',
      apartmentId: 'A-1204',
      building: 'Tòa A - Tầng 12',
      phone: '0905 123 456'
    },
    sensors: {
      apartmentId: 'A-1204',
      temperature: 28.5,
      humidity: 65.0,
      gasPpm: 150,
      gasAlert: false,
      tempAlert: false,
      updatedAt: new Date().toISOString()
    },
    devices: {
      livingRoomLight: false,
      bedroomLight: false,
      doorUnlocked: false
    },
    alerts: [],
    lastAlertTime: {
      gas: 0,
      temp: 0
    }
  }
};

function getOrCreateApartment(apartmentId) {
  const normalizedId = String(apartmentId || 'A-1204').trim();

  if (!apartmentsData[normalizedId]) {
    apartmentsData[normalizedId] = {
      resident: {
        username: `cudan_${normalizedId}`,
        password: '123456',
        fullName: `Cư dân ${normalizedId}`,
        apartmentId: normalizedId,
        building: 'Khu Chung cư Thông minh',
        phone: '0900 000 000'
      },
      sensors: {
        apartmentId: normalizedId,
        temperature: 28.0,
        humidity: 60.0,
        gasPpm: 120,
        gasAlert: false,
        tempAlert: false,
        updatedAt: new Date().toISOString()
      },
      devices: {
        livingRoomLight: false,
        bedroomLight: false,
        doorUnlocked: false
      },
      alerts: [],
      lastAlertTime: {
        gas: 0,
        temp: 0
      }
    };
  }

  return apartmentsData[normalizedId];
}

// ================= CÁC ROUTE API CHÍNH =================

// 1. Kiểm tra trạng thái Cloud API (mở trực tiếp trên trình duyệt)
app.get('/', (req, res) => {
  res.json({
    status: 'ONLINE',
    project: 'Hệ thống Chung cư Thông minh IoT - Cloud API',
    time: new Date().toISOString(),
    endpoints: [
      'POST   /api/auth/login',
      'POST   /api/sensors',
      'GET    /api/sensors/:apartmentId',
      'GET    /api/devices/:apartmentId',
      'PUT    /api/devices/:apartmentId',
      'GET    /api/alerts/:apartmentId',
      'DELETE /api/alerts/:apartmentId'
    ]
  });
});

// 2. Đăng nhập tài khoản cư dân (Mobile App gọi)
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng nhập tài khoản và mật khẩu'
    });
  }

  const foundApt = Object.values(apartmentsData).find(
    (item) =>
      item.resident.username === username &&
      item.resident.password === password
  );

  if (!foundApt) {
    return res.status(401).json({
      success: false,
      message: 'Sai tên đăng nhập hoặc mật khẩu'
    });
  }

  const { password: _, ...userWithoutPass } = foundApt.resident;
  console.log(`[AUTH] Dang nhap thanh cong: ${userWithoutPass.username} (${userWithoutPass.apartmentId})`);

  res.json({
    success: true,
    token: `demo-token-${userWithoutPass.apartmentId}`,
    user: userWithoutPass
  });
});

// 3. Nhận dữ liệu cảm biến từ ESP32 (Lab 1 gọi định kỳ mỗi 3 giây)
app.post('/api/sensors', (req, res) => {
  const {
    apartmentId = 'A-1204',
    temperature,
    humidity,
    gasPpm,
    gasAlert,
    tempAlert
  } = req.body || {};

  const apt = getOrCreateApartment(apartmentId);

  apt.sensors = {
    apartmentId: apt.resident.apartmentId,
    temperature: Number(temperature) || 0,
    humidity: Number(humidity) || 0,
    gasPpm: Number(gasPpm) || 0,
    gasAlert: Boolean(gasAlert),
    tempAlert: Boolean(tempAlert),
    updatedAt: new Date().toISOString()
  };

  const now = Date.now();
  const vnTime = new Date().toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh'
  });

  // Ghi nhận lịch sử cảnh báo rò rỉ Gas (giãn cách 15 giây để tránh spam)
  if (apt.sensors.gasAlert && now - apt.lastAlertTime.gas > 15000) {
    apt.lastAlertTime.gas = now;
    apt.alerts.unshift({
      id: `GAS-${now}`,
      type: 'GAS_LEAK',
      title: 'Cảnh báo rò rỉ khí Gas!',
      message: `Phát hiện nồng độ khí Gas vượt ngưỡng an toàn: ${apt.sensors.gasPpm} ppm`,
      timestamp: vnTime
    });
    console.log(`[ALERT] ${apt.resident.apartmentId} - Ro ri Gas: ${apt.sensors.gasPpm} ppm`);
  }

  // Ghi nhận lịch sử cảnh báo Quá nhiệt >= 40°C (giãn cách 15 giây)
  if (apt.sensors.tempAlert && now - apt.lastAlertTime.temp > 15000) {
    apt.lastAlertTime.temp = now;
    apt.alerts.unshift({
      id: `TEMP-${now}`,
      type: 'HIGH_TEMP',
      title: 'Cảnh báo nhiệt độ phòng cao!',
      message: `Nhiệt độ căn hộ vượt ngưỡng 40°C (Đo được: ${apt.sensors.temperature}°C)`,
      timestamp: vnTime
    });
    console.log(`[ALERT] ${apt.resident.apartmentId} - Nhiet do cao: ${apt.sensors.temperature}°C`);
  }

  // Giữ tối đa 50 cảnh báo gần nhất
  if (apt.alerts.length > 50) {
    apt.alerts = apt.alerts.slice(0, 50);
  }

  res.status(200).json({
    success: true,
    data: apt.sensors
  });
});

// 4. Lấy thông số cảm biến mới nhất của căn hộ (Mobile App gọi)
app.get('/api/sensors/:apartmentId', (req, res) => {
  const apt = getOrCreateApartment(req.params.apartmentId);
  res.json(apt.sensors);
});

// 5. Lấy trạng thái thiết bị (ESP32 & Mobile App đều gọi)
app.get('/api/devices/:apartmentId', (req, res) => {
  const apt = getOrCreateApartment(req.params.apartmentId);
  res.json(apt.devices);
});

// 6. Cập nhật trạng thái bật/tắt đèn hoặc mở khóa cửa (Mobile App gọi)
app.put('/api/devices/:apartmentId', (req, res) => {
  const apt = getOrCreateApartment(req.params.apartmentId);
  const { livingRoomLight, bedroomLight, doorUnlocked } = req.body || {};

  if (typeof livingRoomLight === 'boolean') {
    apt.devices.livingRoomLight = livingRoomLight;
  }
  if (typeof bedroomLight === 'boolean') {
    apt.devices.bedroomLight = bedroomLight;
  }
  if (typeof doorUnlocked === 'boolean') {
    apt.devices.doorUnlocked = doorUnlocked;
  }

  console.log(`[DEVICE] ${apt.resident.apartmentId} cap nhat:`, apt.devices);

  res.json({
    success: true,
    devices: apt.devices
  });
});

// 7. Lấy lịch sử cảnh báo an ninh (Mobile App gọi)
app.get('/api/alerts/:apartmentId', (req, res) => {
  const apt = getOrCreateApartment(req.params.apartmentId);
  res.json(apt.alerts);
});

// 8. Xóa toàn bộ lịch sử cảnh báo an ninh (Mobile App gọi)
app.delete('/api/alerts/:apartmentId', (req, res) => {
  const apt = getOrCreateApartment(req.params.apartmentId);
  apt.alerts = [];
  console.log(`[ALERT] ${apt.resident.apartmentId} da xoa lich su canh bao`);

  res.json({
    success: true,
    message: 'Đã xóa lịch sử cảnh báo'
  });
});

// Bắt các route không tồn tại
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy endpoint: ${req.method} ${req.originalUrl}`
  });
});

app.listen(PORT, () => {
  console.log(`Server Smart Apartment API dang chay tai cong ${PORT}`);
});
