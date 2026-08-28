import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'
import { createTask, deleteTask, listTasks, updateTask, subscribeToTasks } from '../services/api'

const TaskContext = createContext(null)

export const TaskProvider = ({ children }) => {
  const [userId, setUserId] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  // Real-time Firestore sync & LocalStorage fallback
  useEffect(() => {
    let unsubscribeSnapshot = null

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      const uid = user?.uid || localStorage.getItem('levelup_guest_user_id') || 'guest_user'
      setUserId(uid)

      // 1. Immediately hydrate from cache so tasks appear instantaneously
      try {
        const cached = localStorage.getItem(`levelup_cached_tasks_${uid}`)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTasks(parsed)
            setLoading(false)
          }
        }
      } catch (e) {}

      // 2. Clean up previous snapshot listener if any
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot()
      }

      // 3. Connect real-time Firestore listener
      setLoading(true)
      unsubscribeSnapshot = subscribeToTasks(
        uid,
        (syncedTasks) => {
          setTasks(syncedTasks)
          setLoading(false)
        },
        (err) => {
          console.warn('Realtime tasks listener failed, falling back to one-time list:', err)
          listTasks(uid).then((fallbackTasks) => {
            setTasks(fallbackTasks)
            setLoading(false)
          })
        }
      )
    })

    return () => {
      if (unsubscribeAuth) unsubscribeAuth()
      if (unsubscribeSnapshot) unsubscribeSnapshot()
    }
  }, [])

  const refreshTasks = useCallback(async () => {
    const uid = userId || auth.currentUser?.uid || localStorage.getItem('levelup_guest_user_id') || 'guest_user'
    setLoading(true)
    try {
      const nextTasks = await listTasks(uid)
      setTasks(nextTasks)
    } finally {
      setLoading(false)
    }
  }, [userId])

  const createNewTask = useCallback(async (data) => {
    const uid = userId || auth.currentUser?.uid || localStorage.getItem('levelup_guest_user_id') || 'guest_user'
    const item = await createTask(data, uid)
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === item.id)
      const next = exists ? prev.map((t) => (t.id === item.id ? item : t)) : [...prev, item]
      try {
        localStorage.setItem(`levelup_cached_tasks_${uid}`, JSON.stringify(next))
      } catch (e) {}
      return next
    })
    return item
  }, [userId])

  const editTask = useCallback(async (id, data) => {
    const uid = userId || auth.currentUser?.uid || localStorage.getItem('levelup_guest_user_id') || 'guest_user'
    // Optimistic UI update immediately
    setTasks((prev) => {
      const next = prev.map((task) => (task.id === id ? { ...task, ...data, updatedAt: new Date().toISOString() } : task))
      try {
        localStorage.setItem(`levelup_cached_tasks_${uid}`, JSON.stringify(next))
      } catch (e) {}
      return next
    })

    const item = await updateTask(id, data, uid)
    setTasks((prev) => {
      const next = prev.map((task) => (task.id === id ? { ...task, ...item } : task))
      try {
        localStorage.setItem(`levelup_cached_tasks_${uid}`, JSON.stringify(next))
      } catch (e) {}
      return next
    })
    return item
  }, [userId])

  const removeTask = useCallback(async (id) => {
    const uid = userId || auth.currentUser?.uid || localStorage.getItem('levelup_guest_user_id') || 'guest_user'
    // Optimistic removal
    setTasks((prev) => {
      const next = prev.filter((task) => task.id !== id)
      try {
        localStorage.setItem(`levelup_cached_tasks_${uid}`, JSON.stringify(next))
      } catch (e) {}
      return next
    })

    await deleteTask(id, uid)
    return true
  }, [userId])

  const moveToStatus = useCallback(async (id, status) => {
    const existing = tasks.find(t => t.id === id)
    if (!existing) return null
    return editTask(id, { ...existing, status })
  }, [editTask, tasks])

  const setTaskPriority = useCallback(async (id, priority) => {
    const existing = tasks.find(t => t.id === id)
    if (!existing) return null
    return editTask(id, { ...existing, priority })
  }, [editTask, tasks])

  const assignSkill = useCallback(async (id, skillId) => {
    const existing = tasks.find(t => t.id === id)
    if (!existing) return null
    return editTask(id, { ...existing, skillId: skillId || '' })
  }, [editTask, tasks])

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const todayTasks = tasks.filter((task) => (task.deadline || '').slice(0, 10) === today)
    const completedTasks = tasks.filter((task) => task.status === 'COMPLETED')
    const pendingTasks = tasks.filter((task) => task.status !== 'COMPLETED')
    const inProgressTasks = tasks.filter((task) => task.status === 'IN_PROGRESS')
    const toDoTasks = tasks.filter((task) => task.status === 'NOT_STARTED')

    return {
      todayTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      toDoTasks,
      completionRate: tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
      total: tasks.length,
    }
  }, [tasks])

  const value = {
    userId,
    loading,
    tasks,
    stats,
    refreshTasks,
    createTask: createNewTask,
    updateTask: editTask,
    deleteTask: removeTask,
    moveToStatus,
    setTaskPriority,
    assignSkill,
  }

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
}

export const useTasks = () => {
  const context = useContext(TaskContext)
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider')
  }
  return context
}
