import axios from 'axios'
import { auth } from '../firebase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const client = axios.create({
  baseURL: API_URL,
})

const withAuth = async () => {
  const token = await auth.currentUser?.getIdToken()
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
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
