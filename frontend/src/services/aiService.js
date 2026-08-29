import axios from 'axios'
import { auth } from '../firebase'

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:8000'
  }
  return 'https://levelup-new-backend.onrender.com'
}

const client = axios.create({
  baseURL: getBaseUrl(),
})


const withAuth = async () => {
  try {
    const token = await auth.currentUser?.getIdToken()
    if (token) {
      return {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    }
  } catch (e) {
    console.warn('Could not fetch token:', e)
  }
  return { headers: {} }
}

const post = async (path, payload) => {
  const config = await withAuth()
  const { data } = await client.post(path, payload, config)
  return data
}

export const generateSubskills = (payload) => post('/ai/generate-subskills', payload)
export const progressInsights = (payload) => post('/ai/progress-insights', payload)
export const prioritySuggestions = (payload) => post('/ai/priority-suggestions', payload)
export const taskPlan = (payload) => post('/ai/task-plan', payload)
export const skillGap = (payload) => post('/ai/skill-gap', payload)
export const pathOptimize = (payload) => post('/ai/path-optimize', payload)
export const timeEstimate = (payload) => post('/ai/time-estimate', payload)
export const weeklyReport = (payload) => post('/ai/weekly-report', payload)
export const sendChatMessage = (payload) => post('/ai/chat', payload)
export const autoOrganizeTasks = (payload) => post('/ai/auto-organize-tasks', payload)
