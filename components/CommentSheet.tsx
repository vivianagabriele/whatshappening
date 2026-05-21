import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, FlatList, KeyboardAvoidingView, Platform,
  Animated, Dimensions
} from 'react-native'
import { supabase } from '../utils/supabase'
import { Post, Comment } from '../types'
import { Colors, Radius, FontSize, Spacing } from '../utils/theme'
import { useAuth } from '../hooks/useAuth'
import { formatDistanceToNow } from 'date-fns'

const SCREEN_HEIGHT = Dimensions.get('window').height

type Props = {
  post: Post | null
  visible: boolean
  onClose: () => void
}

export default function CommentSheet({ post, visible, onClose }: Props) {
  const { user, profile } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start()
      if (post) fetchComments()
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start()
    }
  }, [visible, post])

  const fetchComments = async () => {
    if (!post) return
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(id, username, avatar_url)')
      .eq('post_id', post.id)
      .eq('is_removed', false)
      .is('parent_id', null)
      .order('created_at', { ascending: true })
    setComments(data || [])
  }

  const submit = async () => {
    if (!body.trim() || !user || !post) return
    setSubmitting(true)
    const { data } = await supabase
      .from('comments')
      .insert({ post_id: post.id, user_id: user.id, body: body.trim() })
      .select('*, profiles(id, username, avatar_url)')
      .single()
    if (data) setComments(prev => [...prev, data])
    setBody('')
    setSubmitting(false)
  }

  const renderComment = ({ item }: { item: Comment }) => {
    const initials = (item.profiles?.username ?? 'U').slice(0, 2).toUpperCase()
    const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true })
      .replace('about ', '').replace(' ago', '')
    const isOP = item.user_id === post?.user_id

    return (
      <View style={styles.comment}>
        <View style={styles.commentAvatar}>
          <Text style={styles.commentAvatarText}>{initials}</Text>
        </View>
        <View style={styles.commentBody}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentUsername}>{item.profiles?.username}</Text>
            {isOP && (
              <View style={styles.opBadge}>
                <Text style={styles.opText}>op</Text>
              </View>
            )}
            <Text style={styles.commentTime}>{timeAgo}</Text>
          </View>
          <Text style={styles.commentText}>{item.body}</Text>
        </View>
      </View>
    )
  }

  if (!visible && slideAnim._value === SCREEN_HEIGHT) return null

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{comments.length} comments</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Comments list */}
        <FlatList
          data={comments}
          keyExtractor={item => item.id}
          renderItem={renderComment}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>no comments yet — be first!</Text>
          }
        />

        {/* Input */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.inputRow}>
            <View style={styles.inputAvatar}>
              <Text style={styles.inputAvatarText}>
                {(profile?.username ?? 'me').slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="add a comment..."
              placeholderTextColor={Colors.textHint}
              value={body}
              onChangeText={setBody}
              multiline
              maxLength={280}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!body.trim() || submitting) && styles.sendBtnDisabled]}
              onPress={submit}
              disabled={!body.trim() || submitting}
            >
              <Text style={styles.sendIcon}>↑</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.75,
    paddingBottom: 24,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.borderMid,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sheetTitle: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.text,
  },
  closeBtn: {
    fontSize: FontSize.base,
    color: Colors.textMuted,
    padding: 4,
  },
  list: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  comment: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  commentAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  commentAvatarText: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  commentBody: { flex: 1 },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  commentUsername: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
  },
  opBadge: {
    backgroundColor: Colors.accentLight,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  opText: {
    fontSize: 9,
    color: Colors.accentDark,
    fontWeight: '600',
  },
  commentTime: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginLeft: 'auto',
  },
  commentText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 32,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  inputAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  inputAvatarText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.text,
    maxHeight: 80,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Colors.borderMid,
  },
  sendIcon: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
})
