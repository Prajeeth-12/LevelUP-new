import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'
import { createTask, deleteTask, listTasks, updateTask } from '../services/api'

const TaskContext = createContext(null)

export const TaskProvider = ({ children }) => {
  const [userId, setUserId] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const loadTasks = useCallback(async (uid) => {
    if (!uid) {
      setTasks([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const nextTasks = await listTasks(uid)
      setTasks(nextTasks)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => onAuthStateChanged(auth, (user) => {
    const uid = user?.uid || null
    setUserId(uid)
    loadTasks(uid)
  }), [loadTasks])

  const refreshTasks = useCallback(() => loadTasks(userId), [loadTasks, userId])

  const createNewTask = useCallback(async (data) => {
    const item = await createTask(data, userId)
    setTasks((prev) => [...prev, item])
    return item
  }, [userId])

  const editTask = useCallback(async (id, data) => {
    const item = await updateTask(id, data, userId)
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, ...item } : task)))
    return item
  }, [userId])

  const removeTask = useCallback(async (id) => {
    await deleteTask(id, userId)
    setTasks((prev) => prev.filter((task) => task.id !== id))
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
