import React from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/lib/auth';
import { FollowProvider } from '@/lib/followContext';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';

function AuthGate() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === '(auth)';

    if (!session && !inAuth) {
      router.replace('/(auth)/login');
    } else if (session && inAuth) {
      router.replace('/(tabs)');
    }
  }, [session, loading, segments]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#7b2d4e" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  // Pretendard — 한국 모던 앱 표준 (토스/당근/트레바리 톤). minimal redesign B.
  const [fontsLoaded] = useFonts({
    'Pretendard-Regular':    require('@/assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-Medium':     require('@/assets/fonts/Pretendard-Medium.otf'),
    'Pretendard-SemiBold':   require('@/assets/fonts/Pretendard-SemiBold.otf'),
    'Pretendard-Bold':       require('@/assets/fonts/Pretendard-Bold.otf'),
    'Pretendard-ExtraBold':  require('@/assets/fonts/Pretendard-ExtraBold.otf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#7b2d4e" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <FollowProvider>
        <View style={styles.container}>
          <StatusBar style="dark" />
          <AuthGate />
        </View>
      </FollowProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
});
