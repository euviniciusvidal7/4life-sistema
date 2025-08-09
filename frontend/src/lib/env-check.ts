export function isSupabaseConfigured(): boolean {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    return !!(url && key && 
              url.trim() !== '' && 
              key.trim() !== '' && 
              !url.includes('placeholder') && 
              !key.includes('placeholder') &&
              url !== 'your-project.supabase.co' &&
              key !== 'your-anon-key-here')
  } catch (error) {
    console.warn('Error checking Supabase configuration:', error)
    return false
  }
}

export function getEnvStatus() {
  try {
    return {
      supabaseConfigured: isSupabaseConfigured(),
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'not-set',
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'not-set'
    }
  } catch (error) {
    console.warn('Error getting environment status:', error)
    return {
      supabaseConfigured: false,
      hasUrl: false,
      hasKey: false,
      url: 'error',
      key: 'error'
    }
  }
}
