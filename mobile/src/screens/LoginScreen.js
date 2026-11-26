import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apartmentApi, BASE_URL } from '../services/api';

export default function LoginScreen({ onLoginSuccess }) {
  const [username, setUsername] = useState('cudan1204');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState('CHECKING'); // CHECKING | ONLINE | OFFLINE

  const checkServer = async () => {
    setServerStatus('CHECKING');
    try {
      const res = await apartmentApi.checkHealth();
      setServerStatus(res.status === 'ONLINE' ? 'ONLINE' : 'OFFLINE');
    } catch {
      setServerStatus('OFFLINE');
    }
  };

  useEffect(() => {
    checkServer();
  }, []);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tài khoản và mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      const res = await apartmentApi.login(username.trim(), password);
      if (res.success && res.user) {
        onLoginSuccess(res.user, res.token);
      } else {
        Alert.alert('Đăng nhập thất bại', res.message || 'Kiểm tra lại thông tin.');
      }
    } catch (err) {
      Alert.alert('Lỗi kết nối', err.message);
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = {
    CHECKING: { text: 'Đang kết nối Cloud API...', color: '#D97706', bg: '#FEF3C7' },
    ONLINE: { text: 'Cloud API: ONLINE', color: '#059669', bg: '#D1FAE5' },
    OFFLINE: { text: 'Không kết nối được Server (Chạm để thử lại)', color: '#DC2626', bg: '#FEE2E2' },
  }[serverStatus];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <View style={styles.iconBadge}>
          <Ionicons name="business" size={36} color="#2563EB" />
        </View>

        <Text style={styles.title}>Smart Apartment IoT</Text>
        <Text style={styles.subtitle}>Hệ thống quản lý & điều khiển căn hộ thông minh</Text>

        <TouchableOpacity
          style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}
          onPress={checkServer}
        >
          <View style={[styles.dot, { backgroundColor: statusConfig.color }]} />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.text}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Tài khoản cư dân</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Nhập username (VD: cudan1204)"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Mật khẩu</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Nhập mật khẩu"
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Đăng nhập</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>
          Tài khoản mẫu: cudan1204 / 123456{'\n'}
          API: {BASE_URL}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  iconBadge: {
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 14,
    backgroundColor: '#F8FAFC',
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  hint: {
    marginTop: 16,
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
});
