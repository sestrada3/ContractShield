import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { signInWithEmail, signUpWithEmail, resetPassword } from '../services/auth';
import { setAuthToken } from '../services/api';
import { useStore } from '../services/store';
import { C } from '../theme';

type Mode = 'signin' | 'signup' | 'reset';

const PWD_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter',  test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number',            test: (p: string) => /[0-9]/.test(p) },
];

export default function LoginScreen() {
  const { setUser } = useStore();
  const [mode, setMode]            = useState<Mode>('signin');
  const [email, setEmail]          = useState('');
  const [password, setPass]        = useState('');
  const [showPassword, setShowPwd] = useState(false);
  const [loading, setLoading]      = useState(false);

  const passwordValid = PWD_RULES.every(r => r.test(password));

  const submit = async () => {
    if (!email.trim()) { Alert.alert('Enter your email'); return; }
    if (mode === 'reset') {
      setLoading(true);
      try {
        await resetPassword(email.trim());
        Alert.alert('Check your email', 'A password reset link has been sent.');
        setMode('signin');
      } catch (e: any) {
        Alert.alert('Error', e.message);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (!password) { Alert.alert('Enter your password'); return; }
    if (mode === 'signup' && !passwordValid) {
      Alert.alert('Weak password', 'Please meet all password requirements before continuing.');
      return;
    }
    setLoading(true);
    try {
      const data = mode === 'signin'
        ? await signInWithEmail(email.trim(), password)
        : await signUpWithEmail(email.trim(), password);
      const session = data.session;
      if (!session) {
        Alert.alert(
          'Check your email',
          'We sent you a confirmation link. Tap it, then come back and sign in.',
          [{ text: 'OK' }]
        );
        setMode('signin');
        return;
      }
      setUser(session.user);
      setAuthToken(session.access_token);
    } catch (e: any) {
      if (e.message?.toLowerCase().includes('email not confirmed')) {
        Alert.alert(
          'Email not confirmed',
          'Check your inbox for the confirmation link. If you didn\'t receive it, sign up again to resend.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const title   = mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password';
  const btnText = mode === 'signin' ? 'Sign In →' : mode === 'signup' ? 'Create Account →' : 'Send Reset Link →';

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.kav}>
        <View style={s.center}>
          <Image source={require('../../assets/logo.png')} style={s.logo} resizeMode="contain"/>
          <Text style={s.title}>ContractShield</Text>
          <Text style={s.sub}>AI Legal Document Review</Text>

          <View style={s.card}>
            <Text style={s.cardTitle}>{title}</Text>

            <TextInput
              style={s.input}
              placeholder="Email"
              placeholderTextColor={C.td}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />

            {mode !== 'reset' && (
              <>
                <View style={s.pwdWrap}>
                  <TextInput
                    style={s.pwdInput}
                    placeholder="Password"
                    placeholderTextColor={C.td}
                    value={password}
                    onChangeText={setPass}
                    secureTextEntry={!showPassword}
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPwd(v => !v)} style={s.eyeBtn}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={C.td}
                    />
                  </TouchableOpacity>
                </View>

                {mode === 'signup' && password.length > 0 && (
                  <View style={s.rules}>
                    {PWD_RULES.map(r => {
                      const ok = r.test(password);
                      return (
                        <View key={r.label} style={s.ruleRow}>
                          <Ionicons
                            name={ok ? 'checkmark-circle' : 'ellipse-outline'}
                            size={13}
                            color={ok ? C.green : C.td}
                          />
                          <Text style={[s.ruleText, { color: ok ? C.green : C.td }]}>{r.label}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </>
            )}

            {mode === 'signin' && (
              <TouchableOpacity onPress={() => setMode('reset')} style={s.forgotRow}>
                <Text style={s.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[s.btn, loading && { opacity: 0.6 }]} onPress={submit} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#0b0d12"/>
                : <Text style={s.btnText}>{btnText}</Text>
              }
            </TouchableOpacity>

            {mode === 'reset' ? (
              <TouchableOpacity onPress={() => setMode('signin')}>
                <Text style={s.toggle}>← Back to sign in</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
                <Text style={s.toggle}>
                  {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: C.bg },
  kav:        { flex: 1 },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  logo:       { width: 80, height: 80, marginBottom: 12 },
  title:      { fontSize: 24, fontWeight: '800', color: C.t, marginBottom: 4 },
  sub:        { fontSize: 12, color: C.td, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 32 },
  card:       { width: '100%', backgroundColor: C.surf, borderRadius: 16, padding: 24, gap: 12 },
  cardTitle:  { fontSize: 18, fontWeight: '700', color: C.t, marginBottom: 4 },
  input:      { backgroundColor: '#0b0d12', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 14, color: C.t, fontSize: 14 },
  pwdWrap:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0b0d12', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 10 },
  pwdInput:   { flex: 1, padding: 14, color: C.t, fontSize: 14 },
  eyeBtn:     { padding: 14 },
  rules:      { gap: 6, paddingHorizontal: 2 },
  ruleRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ruleText:   { fontSize: 12 },
  forgotRow:  { alignSelf: 'flex-end', marginTop: -4 },
  forgotText: { fontSize: 12, color: C.gold },
  btn:        { backgroundColor: C.gold, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 4 },
  btnText:    { fontSize: 15, fontWeight: '700', color: '#0b0d12' },
  toggle:     { textAlign: 'center', fontSize: 13, color: C.tm, marginTop: 4 },
});
