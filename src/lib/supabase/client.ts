import { createClient } from '@supabase/supabase-js'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client for storage operations only
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We don't need auth sessions since we use JWT
  },
})

// Export for storage operations
export { supabase as supabaseStorage }
