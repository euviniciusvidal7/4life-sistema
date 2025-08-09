import { Builder } from '@builder.io/react'

// Substitua pela sua chave pública do Builder.io
export const BUILDER_PUBLIC_KEY = process.env.NEXT_PUBLIC_BUILDER_API_KEY || 'YOUR_PUBLIC_KEY'

// Só inicializar se a chave estiver configurada
if (BUILDER_PUBLIC_KEY && BUILDER_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
  try {
    Builder.init(BUILDER_PUBLIC_KEY)
  } catch (error) {
    console.warn('Failed to initialize Builder.io:', error)
  }
}

export const isEditing = () => {
  try {
    return Boolean(Builder.isEditing)
  } catch (error) {
    console.warn('Error checking Builder editing mode:', error)
    return false
  }
}

export const getBuilderSearchParams = (params: URLSearchParams) => {
  try {
    return {
      apiKey: BUILDER_PUBLIC_KEY,
      userAttributes: {
        urlPath: typeof window !== 'undefined' ? window?.location?.pathname || '' : '',
      },
      ...Object.fromEntries(params),
    }
  } catch (error) {
    console.warn('Error getting Builder search params:', error)
    return {
      apiKey: BUILDER_PUBLIC_KEY,
      userAttributes: {
        urlPath: '',
      },
      ...Object.fromEntries(params),
    }
  }
}
