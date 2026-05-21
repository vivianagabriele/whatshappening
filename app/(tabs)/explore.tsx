import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { usePosts } from '../../hooks/usePosts'
import { Colors, Radius, FontSize, Spacing } from '../../utils/theme'
import PostCard from '../../components/PostCard'
import CommentSheet from '../../components/CommentSheet'
import { Post } from '../../types'

export default function ExploreScreen() {
  const { posts, toggleReaction } = usePosts()
  const [commentPost, setCommentPost] = useState<Post | null>(null)

  const hotPosts = [...posts].sort((a, b) => b.heat_score - a.heat_score).slice(0, 20)

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>explore</Text>
        <Text style={styles.subtitle}>hottest posts right now</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {hotPosts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            onToggleReaction={toggleReaction}
            onCommentPress={setCommentPost}
          />
        ))}
      </ScrollView>
      <CommentSheet
        post={commentPost}
        visible={!!commentPost}
        onClose={() => setCommentPost(null)}
      />
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
  content: { padding: Spacing.md },
})
