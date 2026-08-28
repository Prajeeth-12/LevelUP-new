import axios from 'axios'
import { auth, db } from '../firebase'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'

const nowIso = () => new Date().toISOString()
const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const getUserId = () => auth.currentUser?.uid

const getUserCollection = (userId, name) => collection(db, 'users', userId, name)

const ensureUserId = (userId = getUserId()) => {
  if (!userId) {
    throw new Error('Authentication required')
  }
  return userId
}

const mapDocs = (snapshot) =>
  snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))

const normalizeItem = (item) => ({
  ...item,
  createdAt: item.createdAt || nowIso(),
  updatedAt: nowIso(),
})

const normalizeCategoryDoc = (doc) => ({
  ...doc,
  name: doc.name || doc.title || '',
  title: doc.title || doc.name || '',
  key: doc.key || slugify(doc.name || doc.title || doc.id),
  description: doc.description || '',
  userId: doc.userId || getUserId() || '',
})

const normalizeSubskill = (subskill, index = 0) => {
  if (typeof subskill === 'string') {
    return {
      id: `${index}-${subskill}`,
      title: subskill,
      done: false,
    }
  }

  return {
    id: subskill?.id || `${index}-${subskill?.title || 'subskill'}`,
    title: subskill?.title || '',
    done: Boolean(subskill?.done),
  }
}

const normalizeSkillDoc = (doc) => ({
  ...doc,
  title: doc.title || doc.name || '',
  name: doc.name || doc.title || '',
  category: doc.category || doc.categoryKey || doc.categoryId || '',
  categoryId: doc.categoryId || doc.category || doc.categoryKey || '',
  userId: doc.userId || getUserId() || '',
  order: Number(doc.order || 0),
  priority: doc.priority || 'MEDIUM',
  progress: Number(doc.progress || 0),
  status: doc.status || 'NOT_STARTED',
  description: doc.description || '',
  notes: doc.notes || '',
  subskills: Array.isArray(doc.subskills) ? doc.subskills.map(normalizeSubskill) : [],
  lastActiveAt: doc.lastActiveAt || null,
})

const normalizeTaskDoc = (doc) => ({
  ...doc,
  skillId: doc.skillId || '',
  priority: doc.priority || 'MEDIUM',
  status: doc.status || 'NOT_STARTED',
  notes: doc.notes || '',
  deadline: doc.deadline || '',
  completedAt: doc.completedAt || null,
})

const toExportable = (items) =>
  items.map(({ id, ...rest }) => rest)

export const listCategories = async (userId) => {
  const uid = ensureUserId(userId)
  const snapshot = await getDocs(getUserCollection(uid, 'categories'))
  return mapDocs(snapshot).map(normalizeCategoryDoc)
}

export const createCategory = async (category, userId) => {
  const uid = ensureUserId(userId)
  const name = (category.name || category.title || '').trim()
  const payload = normalizeItem({
    name,
    title: name,
    key: category.key || slugify(name),
    description: category.description?.trim() || '',
    userId: uid,
  })
  const ref = await addDoc(getUserCollection(uid, 'categories'), payload)
  return normalizeCategoryDoc({ id: ref.id, ...payload })
}

export const updateCategory = async (categoryId, category, userId) => {
  const uid = ensureUserId(userId)
  const ref = doc(db, 'users', uid, 'categories', categoryId)
  const name = (category.name || category.title || '').trim()
  const payload = {
    name,
    title: name,
    key: category.key || slugify(name),
    description: category.description?.trim() || '',
    userId: uid,
    updatedAt: nowIso(),
  }
  await updateDoc(ref, payload)
  return normalizeCategoryDoc({ id: categoryId, ...payload })
}

export const deleteCategory = async (categoryId, userId) => {
  const uid = ensureUserId(userId)
  const categoryRef = doc(db, 'users', uid, 'categories', categoryId)
  const skillsSnapshot = await getDocs(query(getUserCollection(uid, 'skills'), where('categoryId', '==', categoryId)))
  const batch = writeBatch(db)

  for (const item of skillsSnapshot.docs) {
    const taskSnapshot = await getDocs(query(getUserCollection(uid, 'tasks'), where('skillId', '==', item.id)))
    taskSnapshot.docs.forEach((task) => {
      batch.update(doc(db, 'users', uid, 'tasks', task.id), { skillId: '', updatedAt: nowIso() })
    })
    batch.delete(doc(db, 'users', uid, 'skills', item.id))
  }

  batch.delete(categoryRef)
  await batch.commit()
  return true
}

export const listSkills = async (userId) => {
  const uid = ensureUserId(userId)
  const snapshot = await getDocs(getUserCollection(uid, 'skills'))
  return mapDocs(snapshot).map(normalizeSkillDoc).sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
}

export const createSkill = async (skill, userId) => {
  const uid = ensureUserId(userId)
  const title = (skill.title || skill.name || '').trim()
  const category = skill.category || skill.categoryKey || skill.categoryId || ''
  const categoryId = skill.categoryId || skill.category || skill.categoryKey || ''
  const payload = normalizeItem({
    name: title,
    title,
    category,
    categoryId,
    description: skill.description?.trim() || '',
    priority: skill.priority || 'MEDIUM',
    progress: Number(skill.progress ?? 0),
    status: skill.status || 'NOT_STARTED',
    subskills: Array.isArray(skill.subskills) ? skill.subskills.map(normalizeSubskill) : [],
    notes: skill.notes || '',
    lastActiveAt: skill.lastActiveAt || null,
    order: Number(skill.order ?? 0),
    userId: uid,
  })
  const ref = await addDoc(getUserCollection(uid, 'skills'), payload)
  return normalizeSkillDoc({ id: ref.id, ...payload })
}

export const updateSkill = async (skillId, skill, userId) => {
  const uid = ensureUserId(userId)
  const ref = doc(db, 'users', uid, 'skills', skillId)
  const title = (skill.title || skill.name || '').trim()
  const category = skill.category || skill.categoryKey || skill.categoryId || ''
  const categoryId = skill.categoryId || skill.category || skill.categoryKey || ''
  const payload = {
    name: title,
    title,
    category,
    categoryId,
    description: skill.description?.trim() || '',
    priority: skill.priority || 'MEDIUM',
    progress: Math.max(0, Math.min(100, Number(skill.progress ?? 0))),
    status: skill.status || 'NOT_STARTED',
    subskills: Array.isArray(skill.subskills) ? skill.subskills.map(normalizeSubskill) : [],
    notes: skill.notes || '',
    lastActiveAt: skill.lastActiveAt || null,
    order: Number(skill.order ?? 0),
    userId: uid,
    updatedAt: nowIso(),
  }
  await updateDoc(ref, payload)
  return normalizeSkillDoc({ id: skillId, ...payload })
}

export const deleteSkill = async (skillId, userId) => {
  const uid = ensureUserId(userId)
  await deleteDoc(doc(db, 'users', uid, 'skills', skillId))
  const tasksSnapshot = await getDocs(query(getUserCollection(uid, 'tasks'), where('skillId', '==', skillId)))
  const batch = writeBatch(db)
  tasksSnapshot.docs.forEach((item) => {
    batch.update(doc(db, 'users', uid, 'tasks', item.id), { skillId: '', updatedAt: nowIso() })
  })
  await batch.commit()
  return true
}

export const listTasks = async (userId) => {
  const uid = ensureUserId(userId)
  const snapshot = await getDocs(getUserCollection(uid, 'tasks'))
  return mapDocs(snapshot).map(normalizeTaskDoc)
}

export const createTask = async (task, userId) => {
  const uid = ensureUserId(userId)
  const payload = normalizeItem({
    title: task.title.trim(),
    skillId: task.skillId || '',
    deadline: task.deadline || '',
    priority: task.priority || 'MEDIUM',
    status: task.status || 'NOT_STARTED',
    notes: task.notes || '',
    completedAt: task.status === 'COMPLETED' ? nowIso() : null,
  })
  const ref = await addDoc(getUserCollection(uid, 'tasks'), payload)
  return normalizeTaskDoc({ id: ref.id, ...payload })
}

export const updateTask = async (taskId, task, userId) => {
  const uid = ensureUserId(userId)
  const ref = doc(db, 'users', uid, 'tasks', taskId)
  const payload = {
    title: task.title.trim(),
    skillId: task.skillId || '',
    deadline: task.deadline || '',
    priority: task.priority || 'MEDIUM',
    status: task.status || 'NOT_STARTED',
    notes: task.notes || '',
    completedAt: task.status === 'COMPLETED' ? task.completedAt || nowIso() : null,
    updatedAt: nowIso(),
  }
  await updateDoc(ref, payload)
  return normalizeTaskDoc({ id: taskId, ...payload })
}

export const deleteTask = async (taskId, userId) => {
  const uid = ensureUserId(userId)
  await deleteDoc(doc(db, 'users', uid, 'tasks', taskId))
  return true
}

export const saveSkillsBatch = async (skills, userId) => {
  const uid = ensureUserId(userId)
  const updates = Array.isArray(skills) ? skills : []
  const chunkSize = 400

  for (let i = 0; i < updates.length; i += chunkSize) {
    const batch = writeBatch(db)
    const chunk = updates.slice(i, i + chunkSize)

    chunk.forEach((skill) => {
      if (!skill?.id) return
      const ref = doc(db, 'users', uid, 'skills', skill.id)
      batch.update(ref, {
        title: skill.title || skill.name || '',
        name: skill.title || skill.name || '',
        category: skill.category || skill.categoryKey || skill.categoryId || '',
        categoryId: skill.categoryId || skill.category || skill.categoryKey || '',
        priority: skill.priority || 'MEDIUM',
        order: Number(skill.order ?? 0),
        updatedAt: nowIso(),
      })
    })

    await batch.commit()
  }

  return true
}

export const linkTaskToSkill = async (taskId, skillId, userId) => {
  const uid = ensureUserId(userId)
  await updateDoc(doc(db, 'users', uid, 'tasks', taskId), {
    skillId: skillId || '',
    updatedAt: nowIso(),
  })
  return true
}

export const exportUserData = async (userId) => {
  const uid = ensureUserId(userId)
  const [categories, skills, tasks] = await Promise.all([
    listCategories(uid),
    listSkills(uid),
    listTasks(uid),
  ])

  return {
    exportedAt: nowIso(),
    categories: toExportable(categories),
    skills: toExportable(skills),
    tasks: toExportable(tasks),
  }
}

export const saveSkillProgress = async (skillId, progress, userId) => {
  const uid = ensureUserId(userId)
  const skillRef = doc(db, 'users', uid, 'skills', skillId)
  const nextProgress = Math.max(0, Math.min(100, Number(progress)))
  const nextStatus = nextProgress >= 100 ? 'COMPLETED' : nextProgress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED'
  await updateDoc(skillRef, {
    progress: nextProgress,
    status: nextStatus,
    lastActiveAt: nowIso(),
    updatedAt: nowIso(),
  })
  return true
}

export const saveSkillNotes = async (skillId, notes, userId) => {
  const uid = ensureUserId(userId)
  await updateDoc(doc(db, 'users', uid, 'skills', skillId), {
    notes,
    lastActiveAt: nowIso(),
    updatedAt: nowIso(),
  })
  return true
}

export const saveSkillSubskills = async (skillId, subskills, userId) => {
  const uid = ensureUserId(userId)
  await updateDoc(doc(db, 'users', uid, 'skills', skillId), {
    subskills,
    lastActiveAt: nowIso(),
    updatedAt: nowIso(),
  })
  return true
}

export const getActiveRoadmap = async (userId) => {
  const uid = userId || auth.currentUser?.uid || localStorage.getItem('levelup_guest_user_id')
  if (!uid) return null

  // 1. Direct Firestore document fetch
  try {
    const docRef = doc(db, 'users', uid, 'active_roadmap', 'current')
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() }
    }
  } catch (err) {
    console.warn('Firestore direct getDoc failed, attempting backend fallback:', err)
  }

  // 2. Fallback to Backend Admin API
  try {
    const token = await auth.currentUser?.getIdToken?.()
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    const res = await axios.get(`${API_URL}/api/career/roadmap?uid=${uid}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    if (res.data && !res.data.message && (res.data.learning_roadmap || res.data.career_decision)) {
      return res.data
    }
  } catch (err) {
    console.warn('Backend active roadmap fallback error:', err)
  }

  return null
}

export const updateActiveRoadmap = async (data, userId) => {
  const uid = userId || auth.currentUser?.uid || localStorage.getItem('levelup_guest_user_id')
  if (!uid) return false

  try {
    const ref = doc(db, 'users', uid, 'active_roadmap', 'current')
    await setDoc(ref, {
      ...data,
      updatedAt: nowIso(),
    }, { merge: true })
    return true
  } catch (err) {
    console.error('Error updating active roadmap:', err)
    return false
  }
}
