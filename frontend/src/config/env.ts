import { z } from 'zod'
import type { EnvConfig } from '@/types'

const envSchema = z.object({
  VITE_API_URL: z.string().url().optional(),
  VITE_FIREBASE_API_KEY: z.string().min(1),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  VITE_FIREBASE_PROJECT_ID: z.string().min(1),
  VITE_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  VITE_FIREBASE_APP_ID: z.string().min(1),
  VITE_FIREBASE_MEASUREMENT_ID: z.string().optional(),
  VITE_SENTRY_DSN: z.string().optional(),
})

type EnvInput = Record<string, any>

const parseEnv = (env: EnvInput): EnvConfig => {
  const result = envSchema.safeParse(env)

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors
    const errorMessages = Object.entries(errors)
      .map(([key, msgs]) => `${key}: ${msgs?.join(', ')}`)
      .join('\n')

    console.error('Invalid environment variables:\n', errorMessages)
    throw new Error(`Invalid environment configuration:\n${errorMessages}`)
  }

  return {
    apiUrl: result.data.VITE_API_URL || 'https://levelup-new-backend.onrender.com',
    firebaseApiKey: result.data.VITE_FIREBASE_API_KEY,
    firebaseAuthDomain: result.data.VITE_FIREBASE_AUTH_DOMAIN,
    firebaseProjectId: result.data.VITE_FIREBASE_PROJECT_ID,
    firebaseStorageBucket: result.data.VITE_FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId: result.data.VITE_FIREBASE_MESSAGING_SENDER_ID,
    firebaseAppId: result.data.VITE_FIREBASE_APP_ID,
    firebaseMeasurementId: result.data.VITE_FIREBASE_MEASUREMENT_ID || '',
    sentryDsn: result.data.VITE_SENTRY_DSN,
    mode: ((import.meta as any).env.MODE as any) || 'development',
  }
}

export const env = parseEnv((import.meta as any).env)

export const isDevelopment = env.mode === 'development'
export const isProduction = env.mode === 'production'
export const isTest = env.mode === 'test'

export default env
