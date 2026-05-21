import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useAuth } from '../../hooks/useAuth'
import { Colors, Radius, FontSize, Spacing } from '../../utils/theme'

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth()

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ])
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.signedOut}>
          <Text style={styles.emoji}>👤</Text>
          <Text style={styles.signedOutTitle}>not signed in</Text>
          <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.signInText}>sign in or create account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const initials = (profile?.username ?? user.email ?? 'me').slice(0, 2).toUpperCase()

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>profile</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.username}>@{profile?.username ?? '...'}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleSignOut}>
            <Text style={styles.rowIcon}>🚪</Text>
            <Text style={[styles.rowText, { color: '#e24b4a' }]}>sign out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: FontSize.lg, fontWeight: '500', color: Colors.text },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  avatarSection: { alignItems: 'center', paddingVertical: Spacing.xl, gap: 8 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 24, fontWeight: '500', color: Colors.accentDark },
  username: { fontSize: FontSize.lg, fontWeight: '500', color: Colors.text },
  email: { fontSize: FontSize.sm, color: Colors.textMuted },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  rowIcon: { fontSize: 18 },
  rowText: { fontSize: FontSize.base, color: Colors.text },
  signedOut: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emoji: { fontSize: 48 },
  signedOutTitle: { fontSize: FontSize.lg, fontWeight: '500', color: Colors.text },
  signInBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: Radius.pill,
    marginTop: 4,
  },
  signInText: { color: '#fff', fontWeight: '500', fontSize: FontSize.base },
})
