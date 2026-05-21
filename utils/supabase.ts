import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'

const SUPABASE_URL = 'https://xhbalfyxkjjszgbvgefv.supabase.co'
const SUPABASE_KEY = 'sb_publishable_XmCML2Fl17dXWMa7QJMI4A_m2AQKgBK'

// AsyncStorage v3 uses a different import path
const getStorage = () => {
  if (Platform.OS === 'web') return undefined
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default
    return AsyncStorage
  } catch {
    return undefined
  }
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: getStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
