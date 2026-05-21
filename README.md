# what's happening

Real-time neighborhood app — see what's happening around you right now.

Built with **Expo** (React Native) + **Supabase**.

## Stack
- Expo SDK 54 + expo-router (file-based navigation)
- Supabase (Postgres + Auth + Realtime + Storage)
- TypeScript throughout

## Features
- 📍 Neighborhood-filtered feed (Seattle, St. Louis — easily add more cities)
- 📸 Text, photo, and 10-second video posts
- 🔥 Reactions: fire, eyes, lol, heads-up
- 💬 Comments with slide-up sheet
- ⏱ Posts auto-expire in 4 hours
- ⚡ Realtime — new posts appear instantly
- 🗺 Heat map showing which neighborhoods are buzzing

## Getting started

### 1. Run the database schema
Go to your Supabase SQL editor and run `whats_happening_schema.sql` (in repo root).

### 2. Install & run
```bash
npm install
npx expo start
```
Scan the QR code with Expo Go on your phone.

## Project structure
```
app/
  (tabs)/index.tsx     ← main feed
  (tabs)/post.tsx      ← create a post
  (tabs)/map.tsx       ← neighborhood heat map
  (tabs)/explore.tsx   ← trending posts
  (tabs)/profile.tsx   ← user profile
  (auth)/login.tsx     ← sign in / sign up
components/
  PostCard.tsx         ← post card (video/photo/text)
  CommentSheet.tsx     ← slide-up comment thread
hooks/
  useAuth.tsx          ← auth state + session
  usePosts.ts          ← feed + realtime + reactions
utils/
  supabase.ts          ← Supabase client
  theme.ts             ← design tokens
types/index.ts         ← all TypeScript types
```

## Supabase project
`https://xhbalfyxkjjszgbvgefv.supabase.co`
