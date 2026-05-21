import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xhbalfyxkjjszgbvgefv.supabase.co'
const SUPABASE_KEY = 'sb_publishable_XmCML2Fl17dXWMa7QJMI4A_m2AQKgBK'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
