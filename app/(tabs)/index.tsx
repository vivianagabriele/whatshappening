import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, ScrollView
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { supabase } from '../../utils/supabase'
import { usePosts } from '../../hooks/usePosts'
import { useAuth } from '../../hooks/useAuth'
import { Colors, Radius, FontSize, Spacing } from '../../utils/theme'
import { City, Neighborhood, Post } from '../../types'
import PostCard from '../../components/PostCard'
import CommentSheet from '../../components/CommentSheet'

export default function FeedScreen() {
  const { user } = useAuth()
  const [cities, setCities] = useState<City[]>([])
  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([])
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Neighborhood | null>(null)
  const [commentPost, setCommentPost] = useState<Post | null>(null)
  const [showCityPicker, setShowCityPicker] = useState(false)

  const { posts, loading, refreshing, refresh, toggleReaction } = usePosts(
    selectedNeighborhood?.id
  )

  // Load cities on mount
  useEffect(() => {
    supabase.from('cities').select('*').eq('is_active', true).then(({ data }) => {
      if (data?.length) {
        setCities(data)
        setSelectedCity(data[0])
      }
    })
  }, [])

  // Load neighborhoods when city changes
  useEffect(() => {
    if (!selectedCity) return
    supabase
      .from('neighborhoods')
      .select('*')
      .eq('city_id', selectedCity.id)
      .eq('is_active', true)
      .then(({ data }) => {
        setNeighborhoods(data || [])
        setSelectedNeighborhood(null)
      })
  }, [selectedCity])

  const activeNeighborhoods = selectedNeighborhood
    ? [selectedNeighborhood]
    : neighborhoods

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.logo}>
          what's <Text style={styles.logoAccent}>happening</Text>
        </Text>
        <TouchableOpacity style={styles.cityBtn} onPress={() => setShowCityPicker(!showCityPicker)}>
          <Text style={styles.cityBtnText}>📍 {selectedCity?.name ?? '...'}</Text>
          <Text style={styles.chevron}>▾</Text>
        </TouchableOpacity>
      </View>

      {/* City picker dropdown */}
      {showCityPicker && (
        <View style={styles.cityDropdown}>
          {cities.map(city => (
            <TouchableOpacity
              key={city.id}
              style={[styles.cityOption, selectedCity?.id === city.id && styles.cityOptionActive]}
              onPress={() => { setSelectedCity(city); setShowCityPicker(false) }}
            >
              <Text style={[styles.cityOptionText, selectedCity?.id === city.id && { color: Colors.accent }]}>
                {city.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Neighborhood chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsContent}
      >
        <TouchableOpacity
          style={[styles.chip, !selectedNeighborhood && styles.chipActive]}
          onPress={() => setSelectedNeighborhood(null)}
        >
          <Text style={[styles.chipText, !selectedNeighborhood && styles.chipTextActive]}>
            All areas
          </Text>
        </TouchableOpacity>
        {neighborhoods.map(n => (
          <TouchableOpacity
            key={n.id}
            style={[
              styles.chip,
              selectedNeighborhood?.id === n.id && { backgroundColor: n.color, borderColor: n.color }
            ]}
            onPress={() => setSelectedNeighborhood(selectedNeighborhood?.id === n.id ? null : n)}
          >
            <Text style={[
              styles.chipText,
              selectedNeighborhood?.id === n.id && { color: '#fff' }
            ]}>
              {n.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Feed */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onToggleReaction={toggleReaction}
              onCommentPress={setCommentPost}
              onAreaPress={id => {
                const n = neighborhoods.find(n => n.id === id)
                if (n) setSelectedNeighborhood(n)
              }}
            />
          )}
          contentContainerStyle={styles.feedContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={Colors.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>👀</Text>
              <Text style={styles.emptyTitle}>Nothing happening yet</Text>
              <Text style={styles.emptySubtitle}>Be the first to post something in this area</Text>
            </View>
          }
        />
      )}

      {/* Comment sheet */}
      <CommentSheet
        post={commentPost}
        visible={!!commentPost}
        onClose={() => setCommentPost(null)}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  logo: {
    fontSize: FontSize.lg,
    fontWeight: '500',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  logoAccent: {
    color: Colors.accent,
  },
  cityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.bg,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  cityBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
  },
  chevron: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  cityDropdown: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 4,
  },
  cityOption: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  cityOptionActive: {
    backgroundColor: Colors.accentLight,
  },
  cityOptionText: {
    fontSize: FontSize.base,
    color: Colors.text,
  },
  chipsScroll: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    maxHeight: 48,
  },
  chipsContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  chipText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: '#fff',
  },
  feedContent: {
    padding: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 8,
  },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
})
