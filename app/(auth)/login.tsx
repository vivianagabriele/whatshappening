import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { supabase } from '../../utils/supabase'
import { Colors, Radius, FontSize, Spacing } from '../../utils/theme'

export default function LoginScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!email || !password) { Alert.alert('Fill in all fields'); return }
    if (mode === 'signup' && !username) { Alert.alert('Choose a username'); return }

    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.replace('/(tabs)/')
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } },
        })
        if (error) throw error
        Alert.alert('Check your email', 'Click the confirmation link then come back to sign in.', [
          { text: 'OK', onPress: () => setMode('login') }
        ])
      }
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Logo */}
        <View style={styles.logoSection}>
          <Text style={styles.logo}>
            what's <Text style={styles.logoAccent}>happening</Text>
          </Text>
          <Text style={styles.tagline}>real-time neighborhood updates</Text>
        </View>

        {/* Mode toggle */}
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'login' && styles.modeBtnActive]}
            onPress={() => setMode('login')}
          >
            <Text style={[styles.modeBtnText, mode === 'login' && styles.modeBtnTextActive]}>
              sign in
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'signup' && styles.modeBtnActive]}
            onPress={() => setMode('signup')}
          >
            <Text style={[styles.modeBtnText, mode === 'signup' && styles.modeBtnTextActive]}>
              create account
            </Text>
          </TouchableOpacity>
        </View>

        {/* Fields */}
        <View style={styles.fields}>
          {mode === 'signup' && (
            <TextInput
              style={styles.input}
              placeholder="username"
              placeholderTextColor={Colors.textHint}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="email"
            placeholderTextColor={Colors.textHint}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <TextInput
            style={styles.input}
            placeholder="password"
            placeholderTextColor={Colors.textHint}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={submit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>
                {mode === 'login' ? 'sign in' : 'create account'}
              </Text>
          }
        </TouchableOpacity>

        {/* Skip */}
        <TouchableOpacity onPress={() => router.replace('/(tabs)/')}>
          <Text style={styles.skipText}>browse without signing in →</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  logoSection: { alignItems: 'center', gap: 6, marginBottom: Spacing.xl },
  logo: {
    fontSize: 28,
    fontWeight: '500',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  logoAccent: { color: Colors.accent },
  tagline: { fontSize: FontSize.sm, color: Colors.textMuted },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 3,
    gap: 3,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  modeBtnActive: { backgroundColor: Colors.accent },
  modeBtnText: { fontSize: FontSize.base, color: Colors.textSecondary, fontWeight: '500' },
  modeBtnTextActive: { color: '#fff' },
  fields: { gap: Spacing.sm },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontSize: FontSize.base,
    color: Colors.text,
  },
  submitBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: { backgroundColor: Colors.borderMid },
  submitBtnText: { fontSize: FontSize.base, fontWeight: '500', color: '#fff' },
  skipText: {
    textAlign: 'center',
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: -4,
  },
})
