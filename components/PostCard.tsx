import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, Pressable, Alert
} from 'react-native'
import { formatDistanceToNow } from 'date-fns'
import { Post, ReactionType, REACTION_EMOJI } from '../types'
import { Colors, Radius, FontSize, Spacing } from '../utils/theme'
import { useAuth } from '../hooks/useAuth'

type Props = {
  post: Post
  onToggleReaction: (postId: string, type: ReactionType) => void
  onCommentPress: (post: Post) => void
  onAreaPress?: (neighborhoodId: string) => void
}

const REACTIONS: ReactionType[] = ['fire', 'eyes', 'lol', 'heads_up']

export default function PostCard({ post, onToggleReaction, onCommentPress, onAreaPress }: Props) {
  const { user } = useAuth()
  const [commentCount] = useState(0)

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
    .replace('about ', '').replace(' ago', '').replace('less than a minute', 'just now')

  const reactionCounts = REACTIONS.reduce((acc, type) => {
    acc[type] = (post.reactions || []).filter((r: any) => r.type === type).length
    return acc
  }, {} as Record<ReactionType, number>)

  const nbColor = post.neighborhoods?.color ?? Colors.accent
  const nbName = post.neighborhoods?.name ?? ''
  const username = post.profiles?.username ?? 'user'
  const initials = username.slice(0, 2).toUpperCase()

  const handleReaction = (type: ReactionType) => {
    if (!user) { Alert.alert('Sign in to react'); return }
    onToggleReaction(post.id, type)
  }

  return (
    <View style={styles.card}>
      {/* Media */}
      {post.type === 'photo' && post.media_url && (
        <Image source={{ uri: post.media_url }} style={styles.media} resizeMode="cover" />
      )}
      {post.type === 'video' && (
        <View style={[styles.media, styles.videoThumb]}>
          {post.media_thumbnail
            ? <Image source={{ uri: post.media_thumbnail }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            : null}
          <View style={styles.playBtn}>
            <Text style={styles.playIcon}>▶</Text>
          </View>
          <View style={styles.durBadge}>
            <Text style={styles.durText}>0:{String(post.duration_sec ?? 9).padStart(2,'0')}</Text>
          </View>
        </View>
      )}

      {/* Area badge — overlaid on media, or shown inline for text posts */}
      {post.type !== 'text' ? (
        <TouchableOpacity
          style={[styles.areaBadgeOverlay, { backgroundColor: nbColor + '22', borderColor: nbColor + '55' }]}
          onPress={() => onAreaPress?.(post.neighborhood_id)}
        >
          <View style={[styles.liveDot, { backgroundColor: nbColor }]} />
          <Text style={[styles.areaBadgeText, { color: nbColor }]}>{nbName}</Text>
        </TouchableOpacity>
      ) : null}

      {/* Body */}
      <View style={styles.body}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.username}>{username}</Text>
          {post.type === 'text' && (
            <TouchableOpacity
              style={[styles.areaBadgeInline, { backgroundColor: nbColor + '18' }]}
              onPress={() => onAreaPress?.(post.neighborhood_id)}
            >
              <Text style={[styles.areaBadgeText, { color: nbColor }]}>{nbName}</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.time}>{timeAgo}</Text>
        </View>

        {/* Caption */}
        {post.caption ? (
          <Text style={styles.caption}>{post.caption}</Text>
        ) : null}

        {/* Actions */}
        <View style={styles.actions}>
          {/* Reactions */}
          <View style={styles.reactionRow}>
            {REACTIONS.map(type => {
              const count = reactionCounts[type]
              const active = post.my_reactions?.includes(type)
              if (count === 0 && !active) return null
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.reactionChip, active && styles.reactionChipActive]}
                  onPress={() => handleReaction(type)}
                >
                  <Text style={styles.reactionEmoji}>{REACTION_EMOJI[type]}</Text>
                  <Text style={[styles.reactionCount, active && { color: Colors.accentDark }]}>
                    {count}
                  </Text>
                </TouchableOpacity>
              )
            })}
            {/* Add reaction button */}
            <TouchableOpacity
              style={styles.addReactionBtn}
              onPress={() => handleReaction('fire')}
            >
              <Text style={styles.addReactionText}>+ react</Text>
            </TouchableOpacity>
          </View>

          {/* Comment */}
          <TouchableOpacity style={styles.commentBtn} onPress={() => onCommentPress(post)}>
            <Text style={styles.commentIcon}>💬</Text>
            <Text style={styles.commentCount}>{commentCount}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  media: {
    width: '100%',
    height: 200,
    backgroundColor: '#e0ede8',
  },
  videoThumb: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 18,
    color: Colors.accent,
    marginLeft: 3,
  },
  durBadge: {
    position: 'absolute',
    bottom: 8,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  durText: {
    fontSize: FontSize.xs,
    color: '#fff',
    fontWeight: '600',
  },
  areaBadgeOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  areaBadgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 4,
  },
  areaBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  body: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.accentDark,
  },
  username: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
  },
  time: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginLeft: 'auto',
  },
  caption: {
    fontSize: FontSize.base,
    color: Colors.text,
    lineHeight: 19,
    marginBottom: Spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  reactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    flexWrap: 'wrap',
  },
  reactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.bg,
    borderRadius: Radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  reactionChipActive: {
    backgroundColor: Colors.accentLight,
  },
  reactionEmoji: {
    fontSize: 12,
  },
  reactionCount: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  addReactionBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  addReactionText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  commentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: Spacing.sm,
  },
  commentIcon: {
    fontSize: 14,
  },
  commentCount: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
})
