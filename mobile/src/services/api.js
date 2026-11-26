// Thay bằng link Render của bạn sau khi deploy
export const BASE_URL = 'https://smart-apartment-backend.onrender.com';

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Lỗi máy chủ (${response.status})`);
  }

  return data;
}

export const apartmentApi = {
  // 1. GET / — Kiểm tra trạng thái Cloud API
  checkHealth: () => request('/'),

  // 2. POST /api/auth/login — Đăng nhập cư dân
  login: (username, password) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  // 3. POST /api/sensors — Giả lập ESP32 gửi dữ liệu cảm biến (để test ngay trên App)
  pushSensors: (payload) =>
    request('/api/sensors', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // 4. GET /api/sensors/:apartmentId — Lấy thông số cảm biến mới nhất
  getSensors: (apartmentId) =>
    request(`/api/sensors/${encodeURIComponent(apartmentId)}`),

  // 5. GET /api/devices/:apartmentId — Lấy trạng thái thiết bị
  getDevices: (apartmentId) =>
    request(`/api/devices/${encodeURIComponent(apartmentId)}`),

  // 6. PUT /api/devices/:apartmentId — Bật/tắt đèn hoặc đóng/mở cửa
  updateDevices: (apartmentId, devicePayload) =>
    request(`/api/devices/${encodeURIComponent(apartmentId)}`, {
      method: 'PUT',
      body: JSON.stringify(devicePayload),
    }),

  // 7. GET /api/alerts/:apartmentId — Lấy lịch sử cảnh báo an ninh
  getAlerts: (apartmentId) =>
    request(`/api/alerts/${encodeURIComponent(apartmentId)}`),

  // 8. DELETE /api/alerts/:apartmentId — Xóa toàn bộ lịch sử cảnh báo
  clearAlerts: (apartmentId) =>
    request(`/api/alerts/${encodeURIComponent(apartmentId)}`, {
      method: 'DELETE',
    }),
};
