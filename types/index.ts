export type City = {
  id: string
  name: string
  slug: string
  lat: number
  lng: number
  is_active: boolean
  created_at: string
}

export type Neighborhood = {
  id: string
  city_id: string
  name: string
  slug: string
  lat: number
  lng: number
  radius_m: number
  color: string
  is_active: boolean
  created_at: string
}

export type NeighborhoodHeat = {
  id: string
  name: string
  slug: string
  city_id: string
  lat: number
  lng: number
  color: string
  radius_m: number
  post_count: number
  total_heat: number
  last_post_at: string | null
}

export type Profile = {
  id: string
  username: string
  avatar_url: string | null
  home_city_id: string | null
  created_at: string
}

export type PostType = 'video' | 'photo' | 'text'
export type ReactionType = 'fire' | 'eyes' | 'lol' | 'heads_up'

export type Post = {
  id: string
  user_id: string
  neighborhood_id: string
  type: PostType
  caption: string | null
  media_url: string | null
  media_thumbnail: string | null
  duration_sec: number | null
  poster_lat: number | null
  poster_lng: number | null
  expires_at: string
  is_removed: boolean
  heat_score: number
  view_count: number
  created_at: string
  // joined
  profiles?: Profile
  neighborhoods?: Neighborhood
  reactions?: Reaction[]
  comments?: Comment[]
  my_reactions?: ReactionType[]
}

export type Reaction = {
  id: string
  post_id: string
  user_id: string
  type: ReactionType
  created_at: string
}

export type Comment = {
  id: string
  post_id: string
  user_id: string
  parent_id: string | null
  body: string
  is_removed: boolean
  created_at: string
  profiles?: Profile
  replies?: Comment[]
}

export const REACTION_EMOJI: Record<ReactionType, string> = {
  fire: '🔥',
  eyes: '👀',
  lol: '😂',
  heads_up: '⚠️',
}

export const REACTION_LABEL: Record<ReactionType, string> = {
  fire: 'fire',
  eyes: 'watching',
  lol: 'lol',
  heads_up: 'heads up',
}
