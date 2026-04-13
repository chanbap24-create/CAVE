import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#7b2d4e" />
      </View>
    );
  }

  if (session) return <Redirect href="/(tabs)" />;
  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
});
