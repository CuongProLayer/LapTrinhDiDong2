import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';

export default function App() {
  const [session, setSession] = useState(null); // { user, token }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={session ? 'light-content' : 'dark-content'} />
      {session ? (
        <DashboardScreen
          user={session.user}
          token={session.token}
          onLogout={() => setSession(null)}
        />
      ) : (
        <LoginScreen
          onLoginSuccess={(user, token) => setSession({ user, token })}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1E3A8A',
  },
});
