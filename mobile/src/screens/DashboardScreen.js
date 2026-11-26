import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apartmentApi } from '../services/api';

export default function DashboardScreen({ user, onLogout }) {
  const apartmentId = user.apartmentId;

  const [activeTab, setActiveTab] = useState('HOME'); // HOME | ALERTS | PROFILE
  const [sensors, setSensors] = useState({
    temperature: 0,
    humidity: 0,
    gasPpm: 0,
    gasAlert: false,
    tempAlert: false,
    updatedAt: '',
  });
  const [devices, setDevices] = useState({
    livingRoomLight: false,
    bedroomLight: false,
    doorUnlocked: false,
  });
  const [alerts, setAlerts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingDeviceKey, setUpdatingDeviceKey] = useState(null);
  const [syncError, setSyncError] = useState('');

  const fetchAllData = useCallback(async () => {
    try {
      const [sensorData, deviceData, alertData] = await Promise.all([
        apartmentApi.getSensors(apartmentId),
        apartmentApi.getDevices(apartmentId),
        apartmentApi.getAlerts(apartmentId),
      ]);
      setSensors(sensorData);
      setDevices(deviceData);
      setAlerts(Array.isArray(alertData) ? alertData : []);
      setSyncError('');
    } catch (err) {
      setSyncError(err.message || 'Mất kết nối tới Server');
    }
  }, [apartmentId]);

  // Lấy dữ liệu lần đầu và tự cập nhật mỗi 3 giây
  useEffect(() => {
    fetchAllData();
    const timer = setInterval(fetchAllData, 3000);
    return () => clearInterval(timer);
  }, [fetchAllData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  // Gọi PUT /api/devices/:apartmentId
  const toggleDevice = async (key, nextValue) => {
    const previous = devices;
    setDevices((prev) => ({ ...prev, [key]: nextValue }));
    setUpdatingDeviceKey(key);

    try {
      const res = await apartmentApi.updateDevices(apartmentId, { [key]: nextValue });
      if (res.devices) {
        setDevices(res.devices);
      }
    } catch (err) {
      setDevices(previous);
      Alert.alert('Lỗi điều khiển', err.message);
    } finally {
      setUpdatingDeviceKey(null);
    }
  };

  // Gọi DELETE /api/alerts/:apartmentId
  const handleClearAlerts = () => {
    Alert.alert('Xóa lịch sử cảnh báo', 'Bạn chắc chắn muốn xóa toàn bộ cảnh báo?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa hết',
        style: 'destructive',
        onPress: async () => {
          try {
            await apartmentApi.clearAlerts(apartmentId);
            setAlerts([]);
          } catch (err) {
            Alert.alert('Lỗi', err.message);
          }
        },
      },
    ]);
  };

  // Gọi POST /api/sensors để test nhanh luồng ESP32 -> Backend -> App
  const handleSimulateSensor = async (isDanger) => {
    try {
      await apartmentApi.pushSensors({
        apartmentId,
        temperature: isDanger ? 43.5 : 27.8,
        humidity: isDanger ? 48.0 : 64.0,
        gasPpm: isDanger ? 680 : 140,
        gasAlert: isDanger,
        tempAlert: isDanger,
      });
      await fetchAllData();
      Alert.alert(
        'Đã gửi dữ liệu giả lập',
        isDanger ? 'Đã kích hoạt trạng thái cảnh báo Gas & Quá nhiệt.' : 'Đã đưa chỉ số về mức an toàn.'
      );
    } catch (err) {
      Alert.alert('Lỗi gửi cảm biến', err.message);
    }
  };

  const formatTime = (iso) => {
    if (!iso) return '--:--:--';
    try {
      return new Date(iso).toLocaleTimeString('vi-VN');
    } catch {
      return iso;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>Xin chào, {user.fullName}</Text>
          <Text style={styles.headerSub}>
            Căn hộ {apartmentId} • {user.building}
          </Text>
        </View>
        <View style={styles.liveBadge}>
          <View style={[styles.liveDot, { backgroundColor: syncError ? '#EF4444' : '#22C55E' }]} />
          <Text style={styles.liveText}>{syncError ? 'Lỗi mạng' : 'Live 3s'}</Text>
        </View>
      </View>

      {/* Body */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {syncError ? (
          <View style={styles.errorBox}>
            <Ionicons name="cloud-offline" size={18} color="#B91C1C" />
            <Text style={styles.errorText}>{syncError}</Text>
          </View>
        ) : null}

        {/* Banner cảnh báo khẩn cấp nếu Gas hoặc Nhiệt độ vượt ngưỡng */}
        {(sensors.gasAlert || sensors.tempAlert) && (
          <View style={styles.dangerBanner}>
            <Ionicons name="warning" size={24} color="#FFFFFF" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.dangerTitle}>CẢNH BÁO AN NINH CĂN HỘ!</Text>
              <Text style={styles.dangerDesc}>
                {sensors.gasAlert ? `• Rò rỉ khí Gas (${sensors.gasPpm} ppm)\n` : ''}
                {sensors.tempAlert ? `• Nhiệt độ cao (${sensors.temperature}°C)` : ''}
              </Text>
            </View>
          </View>
        )}

        {activeTab === 'HOME' && (
          <>
            {/* Khu vực Cảm biến */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Môi trường căn hộ</Text>
              <Text style={styles.updatedText}>Cập nhật: {formatTime(sensors.updatedAt)}</Text>
            </View>

            <View style={styles.sensorGrid}>
              <View style={[styles.sensorCard, sensors.tempAlert && styles.sensorCardDanger]}>
                <Ionicons
                  name="thermometer"
                  size={24}
                  color={sensors.tempAlert ? '#DC2626' : '#EA580C'}
                />
                <Text style={styles.sensorValue}>{sensors.temperature}°C</Text>
                <Text style={styles.sensorLabel}>Nhiệt độ</Text>
              </View>

              <View style={styles.sensorCard}>
                <Ionicons name="water" size={24} color="#0284C7" />
                <Text style={styles.sensorValue}>{sensors.humidity}%</Text>
                <Text style={styles.sensorLabel}>Độ ẩm</Text>
              </View>

              <View style={[styles.sensorCard, sensors.gasAlert && styles.sensorCardDanger]}>
                <Ionicons
                  name="flame"
                  size={24}
                  color={sensors.gasAlert ? '#DC2626' : '#16A34A'}
                />
                <Text style={styles.sensorValue}>{sensors.gasPpm}</Text>
                <Text style={styles.sensorLabel}>Khí Gas (ppm)</Text>
              </View>
            </View>

            {/* Khu vực Điều khiển thiết bị */}
            <Text style={[styles.sectionTitle, { marginTop: 22, marginBottom: 10 }]}>
              Điều khiển thiết bị
            </Text>

            <DeviceRow
              icon="bulb"
              iconColor={devices.livingRoomLight ? '#EAB308' : '#94A3B8'}
              title="Đèn phòng khách"
              subtitle={devices.livingRoomLight ? 'Đang bật' : 'Đang tắt'}
              value={devices.livingRoomLight}
              loading={updatingDeviceKey === 'livingRoomLight'}
              onValueChange={(val) => toggleDevice('livingRoomLight', val)}
            />

            <DeviceRow
              icon="moon"
              iconColor={devices.bedroomLight ? '#6366F1' : '#94A3B8'}
              title="Đèn phòng ngủ"
              subtitle={devices.bedroomLight ? 'Đang bật' : 'Đang tắt'}
              value={devices.bedroomLight}
              loading={updatingDeviceKey === 'bedroomLight'}
              onValueChange={(val) => toggleDevice('bedroomLight', val)}
            />

            <DeviceRow
              icon={devices.doorUnlocked ? 'lock-open' : 'lock-closed'}
              iconColor={devices.doorUnlocked ? '#16A34A' : '#DC2626'}
              title="Khóa cửa thông minh"
              subtitle={devices.doorUnlocked ? 'Cửa đang MỞ' : 'Cửa đang KHÓA'}
              value={devices.doorUnlocked}
              loading={updatingDeviceKey === 'doorUnlocked'}
              onValueChange={(val) => toggleDevice('doorUnlocked', val)}
            />
          </>
        )}

        {activeTab === 'ALERTS' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Lịch sử cảnh báo ({alerts.length})</Text>
              {alerts.length > 0 && (
                <TouchableOpacity onPress={handleClearAlerts}>
                  <Text style={styles.clearBtnText}>Xóa tất cả</Text>
                </TouchableOpacity>
              )}
            </View>

            {alerts.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="shield-checkmark" size={44} color="#10B981" />
                <Text style={styles.emptyTitle}>Căn hộ an toàn</Text>
                <Text style={styles.emptySub}>Chưa ghi nhận sự cố rò rỉ Gas hoặc quá nhiệt.</Text>
              </View>
            ) : (
              alerts.map((item) => (
                <View key={item.id} style={styles.alertItem}>
                  <View
                    style={[
                      styles.alertIconWrap,
                      { backgroundColor: item.type === 'GAS_LEAK' ? '#FEE2E2' : '#FFEDD5' },
                    ]}
                  >
                    <Ionicons
                      name={item.type === 'GAS_LEAK' ? 'flame' : 'thermometer'}
                      size={20}
                      color={item.type === 'GAS_LEAK' ? '#DC2626' : '#EA580C'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alertTitle}>{item.title}</Text>
                    <Text style={styles.alertMsg}>{item.message}</Text>
                    <Text style={styles.alertTime}>{item.timestamp}</Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {activeTab === 'PROFILE' && (
          <>
            <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Thông tin cư dân</Text>
            <View style={styles.profileCard}>
              <InfoRow label="Họ và tên" value={user.fullName} />
              <InfoRow label="Mã căn hộ" value={user.apartmentId} />
              <InfoRow label="Vị trí" value={user.building} />
              <InfoRow label="Số điện thoại" value={user.phone} />
              <InfoRow label="Tài khoản" value={user.username} />
            </View>

            {/* Công cụ giả lập POST /api/sensors khi chưa cắm mạch ESP32 */}
            <Text style={[styles.sectionTitle, { marginTop: 22, marginBottom: 10 }]}>
              Giả lập tín hiệu ESP32 (Test API)
            </Text>
            <View style={styles.simRow}>
              <TouchableOpacity
                style={[styles.simBtn, { backgroundColor: '#DC2626' }]}
                onPress={() => handleSimulateSensor(true)}
              >
                <Text style={styles.simBtnText}>Báo cháy / Gas</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.simBtn, { backgroundColor: '#059669' }]}
                onPress={() => handleSimulateSensor(false)}
              >
                <Text style={styles.simBtnText}>Mức an toàn</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
              <Ionicons name="log-out-outline" size={20} color="#DC2626" />
              <Text style={styles.logoutText}>Đăng xuất</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TabButton
          icon="home"
          label="Điều khiển"
          active={activeTab === 'HOME'}
          onPress={() => setActiveTab('HOME')}
        />
        <TabButton
          icon="notifications"
          label={`Cảnh báo${alerts.length > 0 ? ` (${alerts.length})` : ''}`}
          active={activeTab === 'ALERTS'}
          onPress={() => setActiveTab('ALERTS')}
        />
        <TabButton
          icon="person"
          label="Cư dân"
          active={activeTab === 'PROFILE'}
          onPress={() => setActiveTab('PROFILE')}
        />
      </View>
    </View>
  );
}

function DeviceRow({ icon, iconColor, title, subtitle, value, loading, onValueChange }) {
  return (
    <View style={styles.deviceCard}>
      <View style={styles.deviceIconBox}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.deviceTitle}>{title}</Text>
        <Text style={styles.deviceSub}>{subtitle}</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="small" color="#2563EB" style={{ marginRight: 10 }} />
      ) : (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
          thumbColor={value ? '#2563EB' : '#F8FAFC'}
        />
      )}
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function TabButton({ icon, label, active, onPress }) {
  return (
    <TouchableOpacity style={styles.tabBtn} onPress={onPress}>
      <Ionicons name={icon} size={22} color={active ? '#2563EB' : '#64748B'} />
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  header: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerGreeting: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  headerSub: { color: '#BFDBFE', fontSize: 13, marginTop: 2 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  liveText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  errorText: { color: '#B91C1C', fontSize: 13, marginLeft: 8, flex: 1 },
  dangerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  dangerTitle: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  dangerDesc: { color: '#FEE2E2', fontSize: 13, marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  updatedText: { fontSize: 12, color: '#64748B' },
  sensorGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  sensorCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  sensorCardDanger: { borderWidth: 1.5, borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  sensorValue: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginTop: 8 },
  sensorLabel: { fontSize: 12, color: '#64748B', marginTop: 2 },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  deviceIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deviceTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  deviceSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  clearBtnText: { color: '#DC2626', fontSize: 13, fontWeight: '600' },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginTop: 10 },
  emptySub: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 4 },
  alertItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  alertIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  alertMsg: { fontSize: 13, color: '#475569', marginTop: 2 },
  alertTime: { fontSize: 11, color: '#94A3B8', marginTop: 6 },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: { fontSize: 13, color: '#64748B' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  simRow: { flexDirection: 'row', gap: 10 },
  simBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  simBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 24,
  },
  logoutText: { color: '#DC2626', fontWeight: '700', fontSize: 15, marginLeft: 8 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 10,
  },
  tabBtn: { flex: 1, alignItems: 'center' },
  tabLabel: { fontSize: 11, color: '#64748B', marginTop: 3, fontWeight: '600' },
  tabLabelActive: { color: '#2563EB' },
});
