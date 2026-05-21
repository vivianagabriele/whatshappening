import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useNeighborhoodHeat } from '../../hooks/usePosts'
import { Colors, Radius, FontSize, Spacing } from '../../utils/theme'

export default function MapScreen() {
  const { neighborhoods, loading } = useNeighborhoodHeat()

  const sorted = [...neighborhoods].sort((a, b) => b.total_heat - a.total_heat)

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>what's <Text style={{ color: Colors.accent }}>happening</Text></Text>
        <Text style={styles.subtitle}>city heat map</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {sorted.map((n, i) => {
          const isHot = n.total_heat > 20
          const isWarm = n.total_heat > 5
          return (
            <TouchableOpacity key={n.id} style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={[styles.rank, { backgroundColor: i === 0 ? Colors.accentLight : Colors.bg }]}>
                  <Text style={[styles.rankText, { color: i === 0 ? Colors.accentDark : Colors.textMuted }]}>
                    {i + 1}
                  </Text>
                </View>
                <View style={[styles.colorDot, { backgroundColor: n.color }]} />
                <View>
                  <Text style={styles.nName}>{n.name}</Text>
                  <Text style={styles.nMeta}>{n.post_count} posts active</Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                {isHot && <Text style={styles.hotBadge}>🔥 buzzing</Text>}
                {isWarm && !isHot && <Text style={styles.warmBadge}>active</Text>}
                <View style={styles.heatBar}>
                  <View
                    style={[
                      styles.heatFill,
                      {
                        width: `${Math.min(100, (n.total_heat / 50) * 100)}%`,
                        backgroundColor: n.color,
                      }
                    ]}
                  />
                </View>
              </View>
            </TouchableOpacity>
          )
        })}

        {neighborhoods.length === 0 && !loading && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>loading neighborhoods...</Text>
          </View>
        )}
      </ScrollView>
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
  subtitle: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  content: { padding: Spacing.md, gap: Spacing.sm },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  rank: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { fontSize: FontSize.sm, fontWeight: '600' },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  nName: { fontSize: FontSize.base, fontWeight: '500', color: Colors.text },
  nMeta: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 5, minWidth: 100 },
  hotBadge: { fontSize: FontSize.xs, color: Colors.accentDark, fontWeight: '500' },
  warmBadge: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    backgroundColor: Colors.bg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  heatBar: {
    width: 80,
    height: 4,
    backgroundColor: Colors.bg,
    borderRadius: 2,
    overflow: 'hidden',
  },
  heatFill: {
    height: '100%',
    borderRadius: 2,
  },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.sm },
})
