import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'
import { router } from 'expo-router'
import { supabase } from '../../utils/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Colors, Radius, FontSize, Spacing } from '../../utils/theme'
import { Neighborhood, PostType } from '../../types'

const POST_TYPES: { key: PostType; label: string }[] = [
  { key: 'video', label: 'video' },
  { key: 'photo', label: 'photo' },
  { key: 'text', label: 'text' },
]

export default function PostScreen() {
  const { user, profile } = useAuth()
  const [type, setType] = useState<PostType>('text')
  const [caption, setCaption] = useState('')
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([])
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Neighborhood | null>(null)
  const [showAreaPicker, setShowAreaPicker] = useState(false)
  const [mediaUri, setMediaUri] = useState<string | null>(null)
  const [nearbyNeighborhoods, setNearbyNeighborhoods] = useState<Neighborhood[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [userLat, setUserLat] = useState<number | null>(null)
  const [userLng, setUserLng] = useState<number | null>(null)

  useEffect(() => {
    // Load all neighborhoods
    supabase
      .from('neighborhoods')
      .select('*, cities(name)')
      .eq('is_active', true)
      .then(({ data }) => setNeighborhoods(data || []))

    // Get location + suggest nearby neighborhoods
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status !== 'granted') return
      Location.getCurrentPositionAsync({}).then(loc => {
        setUserLat(loc.coords.latitude)
        setUserLng(loc.coords.longitude)

        // Find neighborhoods within radius
        supabase
          .from('neighborhoods')
          .select('*')
          .eq('is_active', true)
          .then(({ data }) => {
            const nearby = (data || []).filter(n => {
              const dist = getDistanceMeters(
                loc.coords.latitude, loc.coords.longitude,
                n.lat, n.lng
              )
              return dist <= n.radius_m * 2 // 2x radius for suggestions
            }).sort((a, b) => {
              const dA = getDistanceMeters(loc.coords.latitude, loc.coords.longitude, a.lat, a.lng)
              const dB = getDistanceMeters(loc.coords.latitude, loc.coords.longitude, b.lat, b.lng)
              return dA - dB
            })
            setNearbyNeighborhoods(nearby)
            if (nearby.length > 0 && !selectedNeighborhood) {
              setSelectedNeighborhood(nearby[0])
            }
          })
      })
    })
  }, [])

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: type === 'video'
        ? ImagePicker.MediaTypeOptions.Videos
        : ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      videoMaxDuration: 10,
    })
    if (!result.canceled) setMediaUri(result.assets[0].uri)
  }

  const uploadMedia = async (uri: string): Promise<string | null> => {
    const ext = uri.split('.').pop() ?? 'jpg'
    const contentType = type === 'video' ? 'video/mp4' : 'image/jpeg'
    const path = `${user!.id}/${Date.now()}.${ext}`

    const response = await fetch(uri)
    const blob = await response.blob()
    const arrayBuffer = await blob.arrayBuffer()

    const { error } = await supabase.storage
      .from('post-media')
      .upload(path, arrayBuffer, { contentType, upsert: false })

    if (error) { console.error(error); return null }

    const { data } = supabase.storage.from('post-media').getPublicUrl(path)
    return data.publicUrl
  }

  const submit = async () => {
    if (!user) { Alert.alert('Sign in to post'); return }
    if (!selectedNeighborhood) { Alert.alert('Pick an area first'); return }
    if (type !== 'text' && !mediaUri) { Alert.alert(`Select a ${type} first`); return }
    if (!caption.trim() && type === 'text') { Alert.alert('Add a caption'); return }

    setSubmitting(true)
    try {
      let mediaUrl: string | null = null
      if (mediaUri) mediaUrl = await uploadMedia(mediaUri)

      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        neighborhood_id: selectedNeighborhood.id,
        type,
        caption: caption.trim() || null,
        media_url: mediaUrl,
        poster_lat: userLat,
        poster_lng: userLng,
      })

      if (error) throw error

      // Reset and go to feed
      setCaption('')
      setMediaUri(null)
      router.replace('/(tabs)/')
    } catch (err: any) {
      Alert.alert('Error posting', err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.signInPrompt}>
          <Text style={styles.signInEmoji}>👋</Text>
          <Text style={styles.signInTitle}>Sign in to post</Text>
          <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.signInBtnText}>sign in</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancelBtn}>cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>new post</Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

          {/* Type selector */}
          <View style={styles.typeRow}>
            {POST_TYPES.map(t => (
              <TouchableOpacity
                key={t.key}
                style={[styles.typeBtn, type === t.key && styles.typeBtnActive]}
                onPress={() => setType(t.key)}
              >
                <Text style={[styles.typeBtnText, type === t.key && styles.typeBtnTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Media picker for photo/video */}
          {type !== 'text' && (
            <TouchableOpacity style={styles.mediaPicker} onPress={pickMedia}>
              {mediaUri ? (
                <Text style={styles.mediaSelected}>✓ media selected — tap to change</Text>
              ) : (
                <>
                  <Text style={styles.mediaIcon}>{type === 'video' ? '🎥' : '📷'}</Text>
                  <Text style={styles.mediaLabel}>
                    tap to select {type === 'video' ? 'a video (max 10s)' : 'a photo'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Caption */}
          <TextInput
            style={styles.captionInput}
            placeholder={
              type === 'text'
                ? "what's happening? be specific and useful..."
                : 'add a caption...'
            }
            placeholderTextColor={Colors.textHint}
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={280}
          />
          <Text style={styles.charCount}>{caption.length}/280</Text>

          {/* Area picker */}
          <Text style={styles.sectionLabel}>posting to</Text>

          {/* Nearby suggestions */}
          {nearbyNeighborhoods.length > 0 && (
            <View style={styles.nearbySection}>
              <Text style={styles.nearbyLabel}>📍 near you</Text>
              <View style={styles.nearbyRow}>
                {nearbyNeighborhoods.slice(0, 3).map(n => (
                  <TouchableOpacity
                    key={n.id}
                    style={[
                      styles.nearbyChip,
                      selectedNeighborhood?.id === n.id && { backgroundColor: n.color, borderColor: n.color }
                    ]}
                    onPress={() => setSelectedNeighborhood(n)}
                  >
                    <Text style={[
                      styles.nearbyChipText,
                      selectedNeighborhood?.id === n.id && { color: '#fff' }
                    ]}>
                      {n.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* All areas */}
          <TouchableOpacity
            style={styles.areaSelector}
            onPress={() => setShowAreaPicker(!showAreaPicker)}
          >
            <Text style={styles.areaSelectorLeft}>
              {selectedNeighborhood
                ? <Text style={{ color: selectedNeighborhood.color }}>{selectedNeighborhood.name}</Text>
                : <Text style={{ color: Colors.textHint }}>choose an area...</Text>
              }
            </Text>
            <Text style={styles.chevron}>▾</Text>
          </TouchableOpacity>

          {showAreaPicker && (
            <View style={styles.areaList}>
              {neighborhoods.map(n => (
                <TouchableOpacity
                  key={n.id}
                  style={[
                    styles.areaOption,
                    selectedNeighborhood?.id === n.id && styles.areaOptionActive
                  ]}
                  onPress={() => {
                    setSelectedNeighborhood(n)
                    setShowAreaPicker(false)
                  }}
                >
                  <View style={[styles.areaColorDot, { backgroundColor: n.color }]} />
                  <Text style={styles.areaOptionText}>{n.name}</Text>
                  {selectedNeighborhood?.id === n.id && <Text style={{ color: Colors.accent }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Expiry note */}
          <Text style={styles.expiryNote}>⏱ your post disappears in 4 hours</Text>

        </ScrollView>

        {/* Post button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.postBtn, submitting && styles.postBtnDisabled]}
            onPress={submit}
            disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.postBtnText}>post now</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// Haversine distance in meters
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.text,
  },
  cancelBtn: {
    fontSize: FontSize.base,
    color: Colors.textMuted,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, gap: Spacing.md },
  typeRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 3,
    gap: 3,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  typeBtnActive: { backgroundColor: Colors.accent },
  typeBtnText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  typeBtnTextActive: { color: '#fff' },
  mediaPicker: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mediaIcon: { fontSize: 32 },
  mediaLabel: { fontSize: FontSize.sm, color: Colors.textMuted },
  mediaSelected: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: '500' },
  captionInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.text,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  charCount: { fontSize: FontSize.xs, color: Colors.textHint, textAlign: 'right', marginTop: -8 },
  sectionLabel: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  nearbySection: { gap: 6 },
  nearbyLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  nearbyRow: { flexDirection: 'row', gap: 6 },
  nearbyChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  nearbyChipText: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.textSecondary },
  areaSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  areaSelectorLeft: { fontSize: FontSize.base },
  chevron: { fontSize: 12, color: Colors.textMuted },
  areaList: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  areaOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  areaOptionActive: { backgroundColor: Colors.accentLight },
  areaColorDot: { width: 8, height: 8, borderRadius: 4 },
  areaOptionText: { flex: 1, fontSize: FontSize.base, color: Colors.text },
  expiryNote: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  postBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  postBtnDisabled: { backgroundColor: Colors.borderMid },
  postBtnText: { fontSize: FontSize.base, fontWeight: '500', color: '#fff' },
  signInPrompt: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  signInEmoji: { fontSize: 40 },
  signInTitle: { fontSize: FontSize.lg, fontWeight: '500', color: Colors.text },
  signInBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: Radius.pill,
  },
  signInBtnText: { color: '#fff', fontWeight: '500', fontSize: FontSize.base },
})
