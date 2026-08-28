import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { auth } from '../firebase'
import { AppShell } from '../components/layout/AppShell'
import { useSkills } from '../contexts/SkillContext'
import {
  Upload, FileText, Briefcase, Clock, Zap, CheckCircle2,
  XCircle, Target, TrendingUp, BookOpen, ChevronDown, ChevronUp,
  AlertCircle, Loader2, ExternalLink, Play, BookMarked, Code2 as CodeIcon,
  Box, Layers, Cloud, Brain, Cpu, Gamepad2, Monitor, Server,
  BarChart2, Smartphone, GitBranch, Map, ArrowRight, Compass, Sparkles
} from 'lucide-react'
import { useRoadmap } from '../contexts/RoadmapContext'
import { useTasks } from '../contexts/TaskContext'

const API_URL = import.meta.env.VITE_API_URL || ''

// ── Role & Tool presets ───────────────────────────────────────────────────────
const ROLES = [
  { title: 'Game Developer',     icon: Gamepad2,  color: 'violet', jdKey: 'game developer' },
  { title: 'Frontend Developer', icon: Monitor,   color: 'blue',   jdKey: 'frontend developer' },
  { title: 'Backend Developer',  icon: Server,    color: 'green',  jdKey: 'backend developer' },
  { title: 'Data Scientist',     icon: BarChart2, color: 'orange', jdKey: 'data scientist' },
  { title: 'DevOps Engineer',    icon: GitBranch, color: 'red',    jdKey: 'devops' },
  { title: 'Mobile Developer',   icon: Smartphone,color: 'pink',   jdKey: 'mobile developer' },
]

const TOOLS = [
  { title: 'React',            icon: CodeIcon, color: 'blue',   jdKey: 'react developer' },
  { title: 'Docker',           icon: Box,      color: 'sky',    jdKey: 'docker engineer' },
  { title: 'Python',           icon: Cpu,      color: 'yellow', jdKey: 'python developer' },
  { title: 'Kubernetes',       icon: Layers,   color: 'indigo', jdKey: 'kubernetes engineer' },
  { title: 'AWS',              icon: Cloud,    color: 'orange', jdKey: 'aws engineer' },
  { title: 'Machine Learning', icon: Brain,    color: 'purple', jdKey: 'machine learning engineer' },
]

const COLOR_MAP = {
  violet: 'bg-violet-100 text-violet-700 border-violet-300',
  blue:   'bg-blue-100   text-blue-700   border-blue-300',
  green:  'bg-emerald-100 text-emerald-700 border-emerald-300',
  orange: 'bg-orange-100 text-orange-700 border-orange-300',
  red:    'bg-red-100    text-red-700    border-red-300',
  pink:   'bg-pink-100   text-pink-700   border-pink-300',
  sky:    'bg-sky-100    text-sky-700    border-sky-300',
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  indigo: 'bg-indigo-100 text-indigo-700 border-indigo-300',
  purple: 'bg-purple-100 text-purple-700 border-purple-300',
}

// ── Resource type icons / colours ────────────────────────────────────────────
const RESOURCE_META = {
  docs:    { label: 'Docs',    icon: BookMarked, color: 'text-blue-500'   },
  course:  { label: 'Course',  icon: BookOpen,   color: 'text-violet-500' },
  video:   { label: 'Video',   icon: Play,       color: 'text-red-500'    },
  article: { label: 'Article', icon: FileText,   color: 'text-emerald-500'},
  project: { label: 'Project', icon: CodeIcon,   color: 'text-orange-500' },
}

// ── small helpers ────────────────────────────────────────────────────────────
const ScoreRing = ({ value, label, color }) => {
  const r = 28, cx = 36, cy = 36
  const circ = 2 * Math.PI * r
  const dash = (value / 100) * circ
  
  // Color intensity based on percentage
  const getIntensity = (val) => {
    if (val >= 80) return 'ring-emerald-500'
    if (val >= 60) return 'ring-blue-500'
    if (val >= 40) return 'ring-orange-500'
    return 'ring-red-500'
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center gap-2"
    >
      <div className={`relative w-20 h-20 flex items-center justify-center ring-4 ${getIntensity(value)} ring-offset-4 bg-gradient-to-br ${
        value >= 80 ? 'from-emerald-50 to-emerald-100' :
        value >= 60 ? 'from-blue-50 to-blue-100' :
        value >= 40 ? 'from-orange-50 to-orange-100' :
        'from-red-50 to-red-100'
      } rounded-full shadow-lg`}>
        <svg width="72" height="72" className="-rotate-90">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor"
            className="text-gray-200" strokeWidth="6" />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor"
            className={color} strokeWidth="6"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round" 
            style={{ transition: 'stroke-dasharray 0.5s ease' }} />
        </svg>
      </div>
      <div className="text-center">
        <span className="text-2xl font-bold text-gray-900 block">{value}%</span>
        <span className="text-xs text-gray-600 font-medium mt-1">{label}</span>
      </div>
    </motion.div>
  )
}

const SkillBadge = ({ skill, variant = 'matched' }) => {
  const styles = {
    matched: 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm hover:shadow-md hover:scale-105',
    missing: 'bg-red-100 text-red-800 border-red-300 shadow-sm hover:shadow-md hover:scale-105',
  }
  return (
    <motion.span 
      whileHover={{ scale: 1.05, y: -2 }}
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-default ${styles[variant]}`}>
      {variant === 'matched' && <CheckCircle2 className="w-3 h-3 mr-1.5 opacity-70" />}
      {variant === 'missing' && <XCircle className="w-3 h-3 mr-1.5 opacity-70" />}
      {skill}
    </motion.span>
  )
}

const PhaseCard = ({ phase, index }) => {
  const [open, setOpen] = useState(index === 0)
  const [expandedSkill, setExpandedSkill] = useState(null)
  const isImmediate = phase.phase === 'Immediate Gaps'
  const skillDetails = phase.skill_details || []

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Phase header */}
      <button
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors group"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3 flex-1">
          <motion.span 
            animate={{ scale: open ? 1.1 : 1 }}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0
            ${isImmediate
              ? 'bg-gradient-to-br from-orange-400 to-orange-600'
              : 'bg-gradient-to-br from-violet-400 to-violet-600'}`}>
            {index + 1}
          </motion.span>
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-sm group-hover:text-violet-600 transition-colors">{phase.phase}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                <Clock className="w-3 h-3" />{phase.timeline}
              </span>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-md">{phase.estimated_hours}h</span>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-gray-600 font-semibold">{phase.skills.length} skills</span>
            </div>
          </div>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          {open ? <ChevronUp className="w-5 h-5 text-violet-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </motion.div>
      </button>

      {/* Expandable body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-4">
              {skillDetails.length > 0 ? (
                skillDetails.map((sd, si) => {
                  const isExpanded = expandedSkill === si
                  return (
                    <motion.div 
                      key={sd.name} 
                      layout
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: si * 0.03 }}
                      className="rounded-lg border border-gray-200 overflow-hidden hover:border-violet-300 transition-colors"
                    >
                      {/* Skill row */}
                      <button
                        onClick={() => setExpandedSkill(isExpanded ? null : si)}
                        className="w-full flex items-center justify-between px-3 py-3 bg-gray-50 hover:bg-violet-50 transition-colors text-left group"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-sm font-bold text-gray-800 capitalize group-hover:text-violet-600 transition-colors">{sd.name}</span>
                          <span className="text-[10px] px-2 py-1 rounded-full bg-violet-100 text-violet-700 font-bold uppercase flex-shrink-0">{sd.category}</span>
                          <span className="text-[10px] text-gray-500 font-medium flex-shrink-0">~{sd.hours}h</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded">{sd.resources?.length || 0} res.</span>
                          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-violet-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                          </motion.div>
                        </div>
                      </button>

                      {/* Resources list */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }} 
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }} 
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 py-3 space-y-2 bg-gradient-to-br from-gray-50 to-white border-t border-gray-100">
                              {(sd.resources || []).map((res, ri) => {
                                const meta = RESOURCE_META[res.type] || RESOURCE_META.article
                                const Icon = meta.icon
                                return (
                                  <motion.a
                                    key={ri}
                                    initial={{ opacity: 0, x: -4 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: ri * 0.05 }}
                                    href={res.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-start justify-between gap-2 group p-2.5 rounded-lg hover:bg-white hover:shadow-sm hover:border hover:border-violet-200 transition-all border border-transparent"
                                  >
                                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${meta.color} group-hover:scale-110 transition-transform`} />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-gray-800 group-hover:text-violet-600 transition-colors truncate">
                                          {res.title}
                                        </p>
                                        <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-1">
                                          <span className="capitalize inline-block">{meta.label}</span>
                                          {res.duration && res.duration !== 'varies' && (
                                            <><span>•</span><Clock className="w-2.5 h-2.5 inline" />{res.duration}</>
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                    <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-violet-500 transition-all shrink-0 mt-0.5 group-hover:translate-x-0.5" />
                                  </motion.a>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })
              ) : (
                /* Fallback: just show badges if no skill_details (old response) */
                <div className="flex flex-wrap gap-2 p-2">
                  {phase.skills.map(s => <SkillBadge key={s} skill={s} variant="missing" />)}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Preset card (role or tool) ───────────────────────────────────────────────
const PresetCard = ({ item, selected, onSelect }) => {
  const Icon = item.icon
  const colorClass = COLOR_MAP[item.color] || COLOR_MAP.blue
  const isSelected = selected === item.jdKey
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(item.jdKey)}
      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center group
        ${isSelected
          ? `${colorClass} shadow-lg ring-2 ring-offset-2 ring-current`
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
        }`}
    >
      {isSelected && (
        <motion.span 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2">
          <CheckCircle2 className="w-4 h-4 text-current drop-shadow-lg" />
        </motion.span>
      )}
      <motion.div
        animate={{ scale: isSelected ? 1.1 : 1 }}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all
        ${isSelected ? 'bg-white/50 shadow-md' : 'bg-gradient-to-br from-gray-100 to-gray-50'}`}>
        <Icon className={`w-5 h-5 transition-colors ${isSelected ? 'text-current scale-110' : 'text-gray-600 group-hover:text-gray-700'}`} />
      </motion.div>
      <span className={`text-xs font-bold leading-tight transition-colors ${isSelected ? 'text-current' : 'text-gray-700 group-hover:text-gray-900'}`}>
        {item.title}
      </span>
    </motion.button>
  )
}

// ── main page ────────────────────────────────────────────────────────────────
const SkillGapAnalyzer = () => {
  const navigate = useNavigate()
  const { categories, createCategory, createSkill, refreshSkills } = useSkills()
  const { createTask, refreshTasks } = useTasks()
  const { refreshRoadmap } = useRoadmap()
  const [file, setFile] = useState(null)
  const [jdMode, setJdMode] = useState('custom')   // 'custom' | 'role' | 'tool'
  const [jdText, setJdText] = useState('')
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [hoursPerWeek, setHoursPerWeek] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [adoptLoading, setAdoptLoading] = useState(false)
  const [adoptDone, setAdoptDone] = useState(false)
  const [skillsCreatedCount, setSkillsCreatedCount] = useState(0)


  const handleFile = (f) => {
    if (!f) return
    const ok = ['application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'].includes(f.type) ||
      f.name.match(/\.(pdf|docx|txt)$/i)
    if (!ok) { setError('Only PDF, DOCX or TXT files are supported.'); return }
    setFile(f)
    setError('')
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handlePresetSelect = (jdKey) => {
    setSelectedPreset(jdKey)
    setError('')
  }

  const handleModeSwitch = (mode) => {
    setJdMode(mode)
    if (mode === 'custom') setSelectedPreset(null)
    setError('')
  }

  const activeJdText = jdMode === 'custom' ? jdText : (selectedPreset || '')

  const handleAnalyze = async () => {
    if (!file) { setError('Please upload your resume.'); return }
    if (!activeJdText.trim()) {
      setError(jdMode === 'custom' ? 'Please paste a job description.' : 'Please select a role or tool first.')
      return
    }

    const currentUser = auth.currentUser
    if (!currentUser) {
      setError('Please sign in again before running analysis.')
      return
    }

    setLoading(true); setError(''); setResult(null); setAdoptDone(false)
    try {
      const token = await currentUser.getIdToken(true)
      const form = new FormData()
      form.append('resume_file', file)
      form.append('jd_text', activeJdText)
      form.append('hours_per_week', hoursPerWeek)

      const { data } = await axios.post(`${API_URL}/api/v1/analyze-gap`, form, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setResult(data)
    } catch (err) {
      if (err.response?.status === 401) {
        try {
          const retryToken = await auth.currentUser?.getIdToken?.(true)
          if (retryToken) {
            const retryForm = new FormData()
            retryForm.append('resume_file', file)
            retryForm.append('jd_text', activeJdText)
            retryForm.append('hours_per_week', hoursPerWeek)

            const { data } = await axios.post(`${API_URL}/api/v1/analyze-gap`, retryForm, {
              headers: { Authorization: `Bearer ${retryToken}` }
            })
            setResult(data)
            return
          }
        } catch (retryErr) {
          err = retryErr
        }
      }

      let message = 'Analysis failed. Please try again.'
      if (err.message === 'Network Error') {
        message = 'Could not connect to the analysis server. Please ensure the backend is running on port 8000.'
      } else if (err.response?.data?.detail) {
        message = err.response.data.detail
      } else if (err.response?.data?.message) {
        message = err.response.data.message
      } else if (err.message) {
        message = err.message
      }
      
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdoptRoadmap = async () => {
    if (!result) return
    setAdoptLoading(true)
    setError('')
    
    try {
      const currentUser = auth.currentUser
      const token = currentUser ? await currentUser.getIdToken(true) : null
      const fallbackUserId = (() => {
        const existing = localStorage.getItem('levelup_guest_user_id')
        if (existing) return existing
        const generated = `guest_${Math.random().toString(36).slice(2, 12)}`
        localStorage.setItem('levelup_guest_user_id', generated)
        return generated
      })()
      const effectiveUserId = currentUser?.uid || fallbackUserId
      const title = activeJdText
        ? activeJdText.charAt(0).toUpperCase() + activeJdText.slice(1) + ' Roadmap'
        : 'Skill Gap Roadmap'
      
      console.log('🚀 Adopting roadmap:', { title, missingSkills: result.missing_skills?.length, userId: effectiveUserId })

      // ─── STEP 1: Save to Backend (Firestore via backend) ───────────────────
      const adoptResponse = await axios.post(
        `${API_URL}/api/v1/adopt-roadmap`,
        {
          gap_analysis: result,
          roadmap_title: title,
          user_id: effectiveUserId,
        },
        { 
          headers: { 
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      )

      if (adoptResponse.status !== 200 || adoptResponse.data?.status !== 'ok') {
        throw new Error('Backend failed to save roadmap')
      }

      console.log('✅ Backend saved roadmap successfully')

      // ─── STEP 2: Create local skills in frontend context ───────────────────
      const missingSkills = result.missing_skills || []
      let createdCount = 0

      if (missingSkills.length > 0) {
        try {
          // Find or create "Gap Analysis" category
          let gapCategoryId = categories.find(c => c.name === 'Gap Analysis')?.id

          if (!gapCategoryId) {
            console.log('📁 Creating Gap Analysis category...')
            const newCat = await createCategory({
              name: 'Gap Analysis',
              description: 'Skills identified through AI Skill Gap Analyzer'
            })
            gapCategoryId = newCat.id
            console.log('✅ Category created:', gapCategoryId)
          }

          // Create skills from missing_skills (limit to 10)
          if (gapCategoryId) {
            console.log(`📚 Creating ${Math.min(missingSkills.length, 10)} skills...`)
            
            for (const skillName of missingSkills.slice(0, 10)) {
              try {
                await createSkill({
                  name: skillName,
                  categoryId: gapCategoryId,
                  description: `Gap identified: ${title}`,
                  priority: 'HIGH',
                  progress: 0,
                  status: 'NOT_STARTED',
                  notes: `Target: ${title}`,
                  subskills: [],
                })
                createdCount++
                console.log(`✅ Created skill: ${skillName}`)
              } catch (skillErr) {
                console.warn(`⚠️ Skipped skill "${skillName}":`, skillErr.message)
              }
            }
          }
        } catch (contextErr) {
          console.error('⚠️ Error creating skills in context:', contextErr)
          // Don't fail the entire operation if context skills fail
        }
      }

      console.log(`✨ Adoption complete! Created ${createdCount} skills`)
      setSkillsCreatedCount(createdCount)

      // ─── STEP 3: Create tasks for the first phase milestones ───────────────
      try {
        const firstPhase = result.learning_velocity?.roadmap?.[0] || result.learning_roadmap?.roadmap?.[0]
        if (firstPhase) {
          const items = firstPhase.skill_details || firstPhase.milestones || []
          console.log(`📋 Creating tasks for Phase 1: ${firstPhase.phase}...`)
          for (const item of items.slice(0, 4)) {
            const taskTitle = item.name || item.title || item.description
            if (taskTitle) {
              await createTask({
                title: `Master: ${taskTitle}`,
                notes: item.description || `Phase 1 Objective: ${taskTitle}`,
                priority: 'HIGH',
                status: 'NOT_STARTED',
                deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              })
              console.log(`✅ Created task: ${taskTitle}`)
            }
          }
        }
      } catch (taskErr) {
        console.error('❌ Failed to create tasks:', taskErr)
      }

      // Synchronize all contexts with Firestore
      try {
        if (refreshRoadmap) await refreshRoadmap()
        if (refreshSkills) await refreshSkills()
        if (refreshTasks) await refreshTasks()
      } catch (syncErr) {
        console.warn('Context sync error:', syncErr)
      }

      setAdoptDone(true)

      // Show success before navigating to dashboard
      setTimeout(async () => {
        console.log('🎯 Navigating to dashboard')
        if (refreshRoadmap) await refreshRoadmap()
        navigate('/dashboard')
      }, 1200)

    } catch (err) {
      console.error('❌ Adoption failed:', err)
      
      const errorMsg = 
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Failed to adopt roadmap. Please try again.'
      
      setError(errorMsg)
      setAdoptDone(false)
    } finally {
      setAdoptLoading(false)
    }
  }

  return (
    <AppShell>
      <div className="page-container max-w-5xl space-y-6">

        {/* ── Page header ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
              <Zap className="w-5 h-5 text-violet-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Skill Gap Analyzer</h1>
          </div>
          <p className="text-sm text-gray-600 ml-12">
            Upload your resume and compare against a JD, a role, or a specific tool stack.
          </p>
        </motion.div>

        {/* ── Input card ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 space-y-6 shadow-sm">

            {/* Resume upload */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
                <FileText className="w-4 h-4 text-violet-600" /> Resume
                <span className="text-xs font-normal text-gray-500">(Required)</span>
              </label>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('resume-input').click()}
                className={`relative cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 md:py-12 text-center transition-all
                  ${dragOver
                    ? 'border-violet-400 bg-violet-50 scale-[1.01]'
                    : file
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-gray-300 hover:border-violet-400 hover:bg-gray-50'
                  }`}
              >
                <input id="resume-input" type="file" accept=".pdf,.docx,.txt" className="hidden"
                  onChange={e => handleFile(e.target.files[0])} />
                {file ? (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center justify-center gap-3"
                  >
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    <div className="flex items-center gap-2 flex-wrap justify-center">
                      <span className="text-sm font-semibold text-emerald-800 truncate">{file.name}</span>
                      <button onClick={e => { e.stopPropagation(); setFile(null) }}
                        className="text-gray-400 hover:text-red-500 transition-colors hover:scale-110">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Upload className="w-10 h-10 text-violet-400 mx-auto mb-3" />
                    </motion.div>
                    <p className="text-sm text-gray-600">
                      <span className="font-bold text-violet-600">Click to upload</span> or drag & drop
                    </p>
                    <p className="text-xs text-gray-400 mt-2">PDF, DOCX or TXT • Max 10MB</p>
                  </>
                )}
              </div>
            </div>

            {/* ── JD / Role / Tool tabs ── */}
            <div>
              {/* Tab switcher */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1 mb-4 w-full overflow-x-auto">
                {[
                  { key: 'custom', label: 'Custom JD',  Icon: FileText  },
                  { key: 'role',   label: 'By Role',    Icon: Briefcase },
                  { key: 'tool',   label: 'By Tool',    Icon: Zap       },
                ].map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    onClick={() => handleModeSwitch(key)}
                    className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all whitespace-nowrap
                      ${jdMode === key
                        ? 'bg-white text-violet-700 shadow-md'
                        : 'text-gray-600 hover:text-gray-800'}`}
                  >
                    <Icon className="w-4 h-4" />{label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <AnimatePresence mode="wait">
                {jdMode === 'custom' && (
                  <motion.div key="custom"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Job Description</label>
                    <textarea
                      rows={8}
                      value={jdText}
                      onChange={e => setJdText(e.target.value)}
                      placeholder="Paste the full job description here..."
                      className="w-full rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition shadow-sm"
                    />
                  </motion.div>
                )}

                {jdMode === 'role' && (
                  <motion.div key="role"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}>
                    <p className="text-xs text-gray-600 mb-4 font-medium">
                      Select the role you're targeting to match against industry standards.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {ROLES.map(r => (
                        <PresetCard key={r.jdKey} item={r} selected={selectedPreset} onSelect={handlePresetSelect} />
                      ))}
                    </div>
                    {selectedPreset && (
                      <motion.p 
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 text-xs text-violet-700 font-semibold flex items-center gap-2 bg-violet-50 px-3 py-2 rounded-lg"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Target role: <span className="font-bold capitalize ml-1">{selectedPreset}</span>
                      </motion.p>
                    )}
                  </motion.div>
                )}

                {jdMode === 'tool' && (
                  <motion.div key="tool"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}>
                    <p className="text-xs text-gray-600 mb-4 font-medium">
                      Select a tool or technology to evaluate your readiness for that stack.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {TOOLS.map(t => (
                        <PresetCard key={t.jdKey} item={t} selected={selectedPreset} onSelect={handlePresetSelect} />
                      ))}
                    </div>
                    {selectedPreset && (
                      <motion.p 
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 text-xs text-violet-700 font-semibold flex items-center gap-2 bg-violet-50 px-3 py-2 rounded-lg"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Selected stack: <span className="font-bold capitalize ml-1">{selectedPreset}</span>
                      </motion.p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Hours per week */}
            <div className="bg-gradient-to-r from-violet-50 to-blue-50 rounded-xl p-4 space-y-3">
              <label className="flex items-center justify-between text-sm font-bold text-gray-800">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-violet-600" /> Available study hours/week
                </span>
                <span className="text-lg text-violet-600 font-black">{hoursPerWeek}h</span>
              </label>
              <input type="range" min={1} max={40} value={hoursPerWeek}
                onChange={e => setHoursPerWeek(Number(e.target.value))}
                className="w-full accent-violet-600 h-2 rounded-lg" />
              <div className="flex justify-between text-xs text-gray-500"><span>1h (min)</span><span>40h (max)</span></div>
            </div>

            {/* Error */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 text-sm text-red-700 bg-red-50 rounded-lg px-4 py-3 border border-red-200"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Analyze button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 text-white font-bold text-sm hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing your skills...</>
                : <><Zap className="w-4 h-4 group-hover:scale-110 transition-transform" /> Analyze Skill Gap</>
              }
            </motion.button>
          </div>
        </motion.div>

        {/* ── Results ── */}
        <AnimatePresence>
          {result && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              {/* Score summary - Hero section */}
              <motion.div 
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-violet-50 via-blue-50 to-indigo-50 rounded-2xl border border-violet-200 p-6 md:p-8 shadow-lg"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-lg md:text-xl font-black text-gray-900">Match Overview</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
                  <ScoreRing value={Math.round(result.match_percentage)} label="Skill Match" color="text-violet-500" />
                  <ScoreRing value={Math.round(result.job_readiness_score)} label="Job Readiness" color="text-blue-500" />
                  
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-emerald-200"
                  >
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    <span className="text-2xl font-black text-gray-900">{result.matched_skills.length}</span>
                    <span className="text-xs font-bold text-emerald-700 text-center">Matched Skills</span>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg ${result.missing_skills.length > 0 ? 'bg-white/60 backdrop-blur-sm border border-red-200' : 'bg-white/60 backdrop-blur-sm border border-emerald-200'}`}
                  >
                    {result.missing_skills.length > 0 ? (
                      <>
                        <XCircle className="w-6 h-6 text-red-500" />
                        <span className="text-2xl font-black text-gray-900">{result.missing_skills.length}</span>
                        <span className="text-xs font-bold text-red-600 text-center">Gaps Found</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        <span className="text-2xl font-black text-gray-900">0</span>
                        <span className="text-xs font-bold text-emerald-600 text-center">Perfect Match!</span>
                      </>
                    )}
                  </motion.div>
                </div>
              </motion.div>

              {/* Skills side-by-side - Enhanced */}
              <div className="grid sm:grid-cols-2 gap-5">
                {/* Matched */}
                <motion.div 
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl border-2 border-emerald-200 p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    You Already Have ({result.matched_skills.length})
                  </h3>
                  {result.matched_skills.length === 0
                    ? <p className="text-xs text-gray-500 italic py-2">No matching skills detected yet.</p>
                    : <div className="flex flex-wrap gap-2">
                        {result.matched_skills.map(s => <SkillBadge key={s} skill={s} variant="matched" />)}
                      </div>
                  }
                </motion.div>

                {/* Missing */}
                <motion.div 
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className={`rounded-xl border-2 p-6 shadow-sm hover:shadow-md transition-shadow ${
                    result.missing_skills.length > 0 
                      ? 'bg-gradient-to-br from-red-50 to-orange-50/50 border-red-200'
                      : 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200'
                  }`}
                >
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      result.missing_skills.length > 0 ? 'bg-red-500' : 'bg-emerald-500'
                    }`}>
                      {result.missing_skills.length > 0 ? (
                        <XCircle className="w-5 h-5 text-white" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      )}
                    </div>
                    {result.missing_skills.length > 0 ? 'Skills to Learn' : 'All Set!'} ({result.missing_skills.length})
                  </h3>
                  {result.missing_skills.length === 0
                    ? <p className="text-xs text-emerald-700 font-semibold italic py-2 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Perfect match! You're all set for this role.
                      </p>
                    : <div className="flex flex-wrap gap-2">
                        {result.missing_skills.map(s => <SkillBadge key={s} skill={s} variant="missing" />)}
                      </div>
                  }
                </motion.div>
              </div>

              {/* Learning velocity */}
              {result.learning_velocity && result.learning_velocity.roadmap.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                      </div>
                      Your Learning Roadmap
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-700 font-semibold bg-gray-50 px-4 py-2 rounded-lg">
                      <span className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg shadow-sm">
                        <Clock className="w-4 h-4 text-orange-500" />
                        {result.learning_velocity.total_estimated_hours}h total
                      </span>
                      <span className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg shadow-sm">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        ~{result.learning_velocity.weeks_to_readiness} weeks
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {result.learning_velocity.roadmap.map((phase, i) => (
                      <PhaseCard key={phase.phase} phase={phase} index={i} />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── Set as My Roadmap CTA ── */}
              {result.learning_velocity?.roadmap?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className={`rounded-2xl border-2 p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg transition-all
                    ${adoptDone
                      ? 'border-emerald-300 bg-gradient-to-r from-emerald-50 to-emerald-100'
                      : 'border-violet-300 bg-gradient-to-r from-violet-50 to-indigo-50'}`}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md
                      ${adoptDone ? 'bg-emerald-500' : 'bg-violet-500'}`}
                    >
                      {adoptDone
                        ? <CheckCircle2 className="w-7 h-7 text-white" />
                        : <Map className="w-7 h-7 text-white" />}
                    </motion.div>
                    <div>
                      <p className={`text-base font-black ${adoptDone ? 'text-emerald-900' : 'text-gray-900'}`}>
                        {adoptDone ? '✨ Roadmap Successfully Saved!' : 'Make This Your Learning Roadmap'}
                      </p>
                      <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                        {adoptDone
                          ? `${skillsCreatedCount} skills added to your Portfolio. Track progress, mark milestones, and follow your path to mastery on your Dashboard.`
                          : 'Save this personalized roadmap to track progress, mark milestones, and stay motivated on your learning journey.'}
                      </p>
                    </div>
                  </div>
                  {adoptDone ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate('/dashboard')}
                      className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-lg"
                    >
                      Go to Dashboard <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/learning-path', {
                          state: {
                            resumeSkills: result.matched_skills,
                            missingSkills: result.missing_skills,
                            targetRole: selectedRole?.title || 'Target Role',
                          }
                        })}
                        className="shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm transition-all shadow-lg"
                      >
                        <Compass className="w-4 h-4" /> Personalize in AI Recommender
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAdoptRoadmap}
                        disabled={adoptLoading}
                        className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-lg"
                      >
                        {adoptLoading
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                          : <><Map className="w-4 h-4" /> Set as My Roadmap</>}
                      </motion.button>
                    </div>
                  )}

                  {!adoptDone && error && (
                    <div className="w-full sm:w-auto text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {error}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  )
}

export default SkillGapAnalyzer
