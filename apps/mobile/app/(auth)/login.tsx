import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import Svg, { Path } from 'react-native-svg';

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'main' | 'login' | 'signup'>('main');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('', 'Please enter email and password');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert('Login Failed', error.message);
    else router.replace('/(tabs)');
  };

  const handleSignUp = async () => {
    if (!email || !password) return Alert.alert('', 'Please enter email and password');
    if (password.length < 6) return Alert.alert('', 'Password must be at least 6 characters');
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('Sign Up Failed', error.message);
    } else if (data.user) {
      // Create profile
      await supabase.from('profiles').insert({
        id: data.user.id,
        username: email.split('@')[0] + '_' + Math.floor(Math.random() * 1000),
        display_name: email.split('@')[0],
      });
      Alert.alert('Welcome!', 'Account created successfully', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    }
  };

  if (mode === 'main') {
    return (
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.logo}>Cave</Text>
          <Text style={styles.sub}>나만의 주류 취향을 공유하세요</Text>
        </View>
        <View style={styles.actions}>
          <Pressable style={styles.emailBtn} onPress={() => setMode('login')}>
            <Text style={styles.emailBtnText}>이메일 로그인</Text>
          </Pressable>
          <Pressable style={styles.signupLink} onPress={() => setMode('signup')}>
            <Text style={styles.signupLinkText}>계정이 없으신가요? <Text style={styles.signupLinkBold}>가입하기</Text></Text>
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>또는</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable style={styles.googleBtn} onPress={() => Alert.alert('준비 중', 'Google 로그인은 곧 지원됩니다')}>
            <Svg width={20} height={20} viewBox="0 0 24 24">
              <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </Svg>
            <Text style={styles.googleText}>Google</Text>
          </Pressable>

          <Pressable style={styles.appleBtn} onPress={() => Alert.alert('준비 중', 'Apple 로그인은 곧 지원됩니다')}>
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill="white" />
            </Svg>
            <Text style={styles.appleText}>Apple</Text>
          </Pressable>

          <Text style={styles.terms}>
            계속 진행하면 이용약관 및{'\n'}개인정보처리방침에 동의하게 됩니다.
          </Text>
        </View>
      </View>
    );
  }

  // Login / Signup Form
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.hero}>
        <Text style={styles.logo}>Cave</Text>
        <Text style={styles.sub}>{mode === 'login' ? '다시 오신 것을 환영해요' : '계정 만들기'}</Text>
      </View>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="이메일"
          placeholderTextColor="#bbb"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="비밀번호"
          placeholderTextColor="#bbb"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Pressable
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          onPress={mode === 'login' ? handleLogin : handleSignUp}
          disabled={loading}
        >
          <Text style={styles.submitBtnText}>
            {loading ? '로그인 중...' : mode === 'login' ? '로그인' : '가입하기'}
          </Text>
        </Pressable>
        <Pressable onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
          <Text style={styles.switchText}>
            {mode === 'login' ? '계정이 없으신가요? ' : '이미 계정이 있으신가요? '}
            <Text style={styles.switchBold}>{mode === 'login' ? '가입하기' : '로그인'}</Text>
          </Text>
        </Pressable>
        <Pressable onPress={() => setMode('main')} style={{ marginTop: 12 }}>
          <Text style={[styles.switchText, { color: '#bbb' }]}>뒤로</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'space-between' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { fontFamily: 'PlayfairDisplay_700Bold_Italic', fontSize: 48, color: '#7b2d4e', marginBottom: 10 },
  sub: { fontSize: 15, color: '#999' },
  actions: { paddingHorizontal: 28, paddingBottom: 50 },
  form: { paddingHorizontal: 28, paddingBottom: 50 },

  emailBtn: {
    backgroundColor: '#7b2d4e', padding: 14, borderRadius: 10, alignItems: 'center',
  },
  emailBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  signupLink: { alignItems: 'center', marginTop: 14 },
  signupLinkText: { fontSize: 13, color: '#999' },
  signupLinkBold: { color: '#7b2d4e', fontWeight: '600' },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 16, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#eee' },
  dividerText: { fontSize: 12, color: '#ccc' },

  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd',
    padding: 14, borderRadius: 10,
  },
  googleText: { fontSize: 15, fontWeight: '500', color: '#333' },

  appleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#000', padding: 14, borderRadius: 10, marginTop: 10,
  },
  appleText: { fontSize: 15, fontWeight: '500', color: '#fff' },

  terms: { fontSize: 11, color: '#bbb', textAlign: 'center', marginTop: 20, lineHeight: 16 },

  input: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 10,
    padding: 14, fontSize: 15, marginBottom: 12, backgroundColor: '#fafafa',
  },
  submitBtn: {
    backgroundColor: '#7b2d4e', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 4,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  switchText: { fontSize: 13, color: '#999', textAlign: 'center', marginTop: 16 },
  switchBold: { color: '#7b2d4e', fontWeight: '600' },
});
