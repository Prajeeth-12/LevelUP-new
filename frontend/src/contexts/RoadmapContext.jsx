import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'
import {
  getActiveRoadmap,
  listRoadmaps,
  switchActiveRoadmap,
  deleteRoadmap,
  updateActiveRoadmap
} from '../services/api'

const RoadmapContext = createContext(null)

export const RoadmapProvider = ({ children }) => {
  const [userId, setUserId] = useState(null)
  const [roadmaps, setRoadmaps] = useState([])
  const [roadmap, setRoadmap] = useState(null)
  const [activeRoadmapId, setActiveRoadmapId] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadAllRoadmaps = useCallback(async (uid) => {
    if (!uid) {
      setRoadmaps([])
      setRoadmap(null)
      setActiveRoadmapId(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const all = await listRoadmaps(uid)
      setRoadmaps(all || [])
      
      const active = all?.find(r => r.is_active) || all?.[0] || await getActiveRoadmap(uid)
      setRoadmap(active || null)
      setActiveRoadmapId(active?.id || null)
    } catch (err) {
      console.error('Failed to load roadmaps:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => onAuthStateChanged(auth, (user) => {
    const uid = user?.uid || null
    setUserId(uid)
    loadAllRoadmaps(uid)
  }), [loadAllRoadmaps])

  const refreshRoadmap = useCallback(() => loadAllRoadmaps(userId), [loadAllRoadmaps, userId])
  const refreshRoadmaps = refreshRoadmap

  const switchRoadmap = useCallback(async (roadmapId) => {
    if (!roadmapId) return null
    setLoading(true)
    try {
      const updated = await switchActiveRoadmap(roadmapId, userId)
      if (updated) {
        setRoadmap(updated)
        setActiveRoadmapId(roadmapId)
        setRoadmaps(prev => prev.map(r => ({ ...r, is_active: r.id === roadmapId })))
      } else {
        await loadAllRoadmaps(userId)
      }
      return updated
    } catch (e) {
      console.error('Error switching roadmap:', e)
    } finally {
      setLoading(false)
    }
  }, [loadAllRoadmaps, userId])

  const removeRoadmap = useCallback(async (roadmapId) => {
    if (!roadmapId) return false
    try {
      await deleteRoadmap(roadmapId, userId)
      await loadAllRoadmaps(userId)
      return true
    } catch (e) {
      console.error('Error removing roadmap:', e)
      return false
    }
  }, [loadAllRoadmaps, userId])

  const updateRoadmap = useCallback(async (data) => {
    await updateActiveRoadmap(data, userId)
    setRoadmap(prev => ({ ...prev, ...data }))
    setRoadmaps(prev => prev.map(r => (r.id === activeRoadmapId ? { ...r, ...data } : r)))
  }, [activeRoadmapId, userId])

  const value = {
    roadmaps,
    roadmap,
    activeRoadmapId,
    loading,
    refreshRoadmap,
    refreshRoadmaps,
    switchRoadmap,
    deleteRoadmap: removeRoadmap,
    updateRoadmap,
  }

  return <RoadmapContext.Provider value={value}>{children}</RoadmapContext.Provider>
}

export const useRoadmap = () => {
  const context = useContext(RoadmapContext)
  if (!context) {
    throw new Error('useRoadmap must be used within a RoadmapProvider')
  }
  return context
}
