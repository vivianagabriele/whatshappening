import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../utils/supabase'
import { Post, ReactionType } from '../types'
import { useAuth } from './useAuth'

export function usePosts(neighborhoodId?: string) {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchPosts = useCallback(async () => {
    let query = supabase
      .from('posts')
      .select(`
        *,
        profiles(id, username, avatar_url),
        neighborhoods(id, name, color),
        reactions(id, user_id, type)
      `)
      .eq('is_removed', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(50)

    if (neighborhoodId) {
      query = query.eq('neighborhood_id', neighborhoodId)
    }

    const { data, error } = await query
    if (error) {
      console.error('fetchPosts error:', JSON.stringify(error))
      return
    }

    const enriched = (data || []).map(post => ({
      ...post,
      my_reactions: user
        ? (post.reactions || [])
            .filter((r: any) => r.user_id === user.id)
            .map((r: any) => r.type as ReactionType)
        : [],
    }))
    setPosts(enriched)
  }, [neighborhoodId, user])

  const refresh = useCallback(async () => {
    setRefreshing(true)
    await fetchPosts()
    setRefreshing(false)
  }, [fetchPosts])

  useEffect(() => {
    setLoading(true)
    fetchPosts().finally(() => setLoading(false))

    // Must add all .on() listeners BEFORE calling .subscribe()
    const channel = supabase
      .channel(`posts:${neighborhoodId ?? 'all'}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'posts',
        ...(neighborhoodId ? { filter: `neighborhood_id=eq.${neighborhoodId}` } : {}),
      }, () => fetchPosts())
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'reactions',
      }, () => fetchPosts())
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'reactions',
      }, () => fetchPosts())

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Realtime connected')
      }
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [neighborhoodId, fetchPosts])

  const toggleReaction = async (postId: string, type: ReactionType) => {
    if (!user) return

    const post = posts.find(p => p.id === postId)
    const hasReaction = post?.my_reactions?.includes(type)

    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      const reactions = p.reactions || []
      const myReactions = p.my_reactions || []
      if (hasReaction) {
        return {
          ...p,
          reactions: reactions.filter((r: any) => !(r.user_id === user.id && r.type === type)),
          my_reactions: myReactions.filter(r => r !== type),
        }
      } else {
        return {
          ...p,
          reactions: [...reactions, { id: 'temp', user_id: user.id, type, post_id: postId }],
          my_reactions: [...myReactions, type],
        }
      }
    }))

    if (hasReaction) {
      await supabase.from('reactions').delete()
        .eq('post_id', postId).eq('user_id', user.id).eq('type', type)
    } else {
      await supabase.from('reactions').insert({ post_id: postId, user_id: user.id, type })
    }
  }

  return { posts, loading, refreshing, refresh, toggleReaction }
}

export function useNeighborhoodHeat(cityId?: string) {
  const [neighborhoods, setNeighborhoods] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      let query = supabase.from('neighborhood_heat').select('*')
      if (cityId) query = query.eq('city_id', cityId)
      const { data, error } = await query
      if (error) console.error('neighborhood_heat error:', JSON.stringify(error))
      setNeighborhoods(data || [])
      setLoading(false)
    }
    fetch()
    const interval = setInterval(fetch, 30000)
    return () => clearInterval(interval)
  }, [cityId])

  return { neighborhoods, loading }
}
