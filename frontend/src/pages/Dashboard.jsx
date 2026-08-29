import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Layers3, ListTodo, BarChart3, Zap, TrendingUp,
  CheckCircle2, ArrowRight, Plus, Calendar,
  Flame, Target, AlertCircle, ChevronRight, Compass, Sparkles,
} from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { useSkills } from '../contexts/SkillContext'
import { useTasks } from '../contexts/TaskContext'
import { PageHeader } from '../components/ui/PageHeader'
import { getAuth } from 'firebase/auth'
import { useRoadmap } from '../contexts/RoadmapContext'
import CareerMatchCard from '../components/CareerMatchCard'
import RoadmapView from '../components/RoadmapView'
import RoadmapLibrarySwitcher from '../components/RoadmapLibrarySwitcher'
import { Loader2 } from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  NOT_STARTED: { label: 'Not Started', cls: 'badge-not-started' },
  IN_PROGRESS:  { label: 'In Progress', cls: 'badge-in-progress' },
  COMPLETED:    { label: 'Completed',   cls: 'badge-completed' },
}

const PRIORITY_CONFIG = {
  HIGH:   { label: 'High',   cls: 'priority-high'   },
  MEDIUM: { label: 'Medium', cls: 'priority-medium' },
  LOW:    { label: 'Low',    cls: 'priority-low'    },
}

const formatRelativeDate = (iso) => {
  if (!iso) return null
  const d = new Date(iso)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  const diff = Math.floor((d - today) / 86400000)
  if (diff < -1) return { label: `${Math.abs(diff)} days overdue`, cls: 'text-gray-900' }
  if (diff === -1) return { label: 'Yesterday', cls: 'text-gray-900' }
  if (diff === 0)  return { label: 'Today',     cls: 'text-gray-900' }
  if (diff === 1)  return { label: 'Tomorrow',  cls: 'text-gray-900' }
  return { label: `In ${diff} days`, cls: 'text-gray-500' }
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="stat-card text-left group w-full"
    >
      <div className="w-10 h-10 rounded-[16px] flex items-center justify-center mb-4 bg-gray-50 border border-gray-200 transition-transform group-hover:scale-[1.03] duration-200">
        <Icon className="w-5 h-5 text-black" />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="text-xs text-gray-500 mt-1.5">{sub}</div>}
    </button>
  )
}

// ─── Quick Task Row ───────────────────────────────────────────────────────────
const QuickTaskRow = ({ task, onToggle }) => {
  const isDone = task.status === 'COMPLETED'
  const pCfg   = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM
  const date   = formatRelativeDate(task.deadline)

  return (
    <div className={`task-row group ${isDone ? 'completed' : ''}`}>
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task)}
        className={`check-box shrink-0 mt-0.5 ${isDone ? 'checked' : ''}`}
        role="checkbox"
        aria-checked={isDone}
        aria-label={isDone ? 'Mark task incomplete' : 'Mark task complete'}
      >
        {isDone && <CheckCircle2 className="w-3 h-3 text-white" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate tracking-[-0.01em] ${isDone ? 'line-through text-gray-400' : 'text-black'}`}>
          {task.title}
        </p>
        {date && (
          <p className={`text-xs mt-0.5 ${date.cls}`}>{date.label}</p>
        )}
      </div>

      <div className="shrink-0 mt-0.5">
        <span className={pCfg.cls} title={pCfg.label}>{pCfg.label}</span>
      </div>
    </div>
  )
}

// ─── Skill Progress Card ──────────────────────────────────────────────────────
const SkillProgressCard = ({ skill, onClick }) => {
  const pct = Math.round(skill.progress || 0)
  const sCfg = STATUS_CONFIG[skill.status] || STATUS_CONFIG.NOT_STARTED

  return (
    <button
      onClick={onClick}
      className="skill-card text-left"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-black truncate pr-2 tracking-[-0.01em]">{skill.name || skill.title}</p>
        <span className={sCfg.cls} style={{ fontSize: 10, whiteSpace: 'nowrap' }}>{sCfg.label}</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-gray-500 mt-1.5">{pct}% complete</p>
    </button>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const navigate     = useNavigate()
  const firebaseAuth = getAuth()
  const { skills = [], loading: skillsLoading } = useSkills()
  const { tasks = [], updateTask, createTask, loading: tasksLoading } = useTasks()
  const {
    roadmaps = [],
    roadmap,
    activeRoadmapId,
    loading: roadmapLoading,
    refreshRoadmap,
    switchRoadmap,
    deleteRoadmap
  } = useRoadmap()

  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [addingTask, setAddingTask]     = useState(false)

  const userName = firebaseAuth.currentUser?.displayName
    || firebaseAuth.currentUser?.email?.split('@')[0]
    || 'there'

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  // ── Metrics ──────────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const completedSkills   = skills.filter(s => s.status === 'COMPLETED').length
    const inProgressSkills  = skills.filter(s => s.status === 'IN_PROGRESS').length
    const completedTasks    = tasks.filter(t => t.status === 'COMPLETED').length
    const todayTasks = tasks.filter(t => {
      if (!t.deadline) return false
      const d = new Date(t.deadline); d.setHours(0,0,0,0)
      const today = new Date(); today.setHours(0,0,0,0)
      return d.getTime() === today.getTime()
    })
    const overallProgress = skills.length
      ? Math.round(skills.reduce((sum, s) => sum + (s.progress || 0), 0) / skills.length)
      : 0

    return { completedSkills, inProgressSkills, completedTasks, overallProgress, todayTasks }
  }, [skills, tasks])

  // ── Today / Upcoming Tasks ───────────────────────────────────────────────
  const todayStr   = new Date().toISOString().slice(0, 10)
  const todayTasks = tasks
    .filter(t => t.status !== 'COMPLETED' && (t.deadline?.slice(0,10) === todayStr || !t.deadline))
    .slice(0, 6)
  const overdueTasks = tasks.filter(t => {
    if (!t.deadline || t.status === 'COMPLETED') return false
    const d = new Date(t.deadline); d.setHours(0,0,0,0)
    const today = new Date(); today.setHours(0,0,0,0)
    return d < today
  })

  // ── Active Skills (sorted by progress desc) ──────────────────────────────
  const handleToggleTask = async (task) => {
    const next = task.status === 'COMPLETED' ? 'IN_PROGRESS' : 'COMPLETED'
    await updateTask(task.id, { ...task, status: next })
  }

  const handleQuickAdd = async (e) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    setAddingTask(true)
    try {
      await createTask({ title: newTaskTitle.trim(), priority: 'MEDIUM', status: 'NOT_STARTED' })
      setNewTaskTitle('')
    } finally {
      setAddingTask(false)
    }
  }

  const loading = skillsLoading || tasksLoading

  return (
    <AppShell>
      <div className="page-container animate-fade-slide-in space-y-8">
        {/* ── Layrs Signature Hero Section ─────────────────────────────── */}
        <section className="space-y-4 max-w-4xl pt-2 sm:pt-4">
          <div className="layrs-hero-eyebrow">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span>{greeting.toUpperCase()}</span>
          </div>

          <h1 className="layrs-hero-title">
            What do you want to <em>learn</em> today?
          </h1>

          {/* Layrs Interactive Command Prompt Box (.pcx) */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (newTaskTitle.trim()) {
                navigate('/learning-path')
              }
            }}
            className="pcx-card mt-5"
          >
            <textarea
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Ask anything — system design, distributed databases, low-level design, or add a task..."
              className="pcx-textarea"
              rows={2}
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => navigate('/learning-path')}
                  className="pcx-pill active"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Auto</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/skills')}
                  className="pcx-pill"
                >
                  <Layers3 className="w-3.5 h-3.5" />
                  <span>Skills</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/learning-path')}
                  className="pcx-pill"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Roadmap</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/tasks')}
                  className="pcx-pill"
                >
                  <ListTodo className="w-3.5 h-3.5" />
                  <span>Tasks</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/learning-path')}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  title="Voice input"
                >
                  <Sparkles className="w-4 h-4 text-orange-500" />
                </button>
                <button
                  type="submit"
                  disabled={!newTaskTitle.trim()}
                  className="p-2.5 rounded-2xl bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white transition-all shadow-xs"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>

          {/* Layrs Suggestion Chips with Colored Dots */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              onClick={() => setNewTaskTitle('Design Twitter / X at scale with timeline caching')}
              className="home-chip"
            >
              <span className="dot" style={{ backgroundColor: 'var(--cyan, #06b6d4)' }} />
              <span>Design Twitter at scale</span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-1" />
            </button>
            <button
              onClick={() => setNewTaskTitle('How does Google Spanner maintain external consistency with TrueTime?')}
              className="home-chip"
            >
              <span className="dot" style={{ backgroundColor: 'var(--violet, #8b5cf6)' }} />
              <span>How does Spanner stay consistent?</span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-1" />
            </button>
            <button
              onClick={() => setNewTaskTitle('Low Level Design: implement a token bucket rate limiter')}
              className="home-chip"
            >
              <span className="dot" style={{ backgroundColor: 'var(--blue, #3b82f6)' }} />
              <span>LLD: design a rate limiter</span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-1" />
            </button>
            <button
              onClick={() => setNewTaskTitle('Walk me through Raft distributed consensus protocol')}
              className="home-chip"
            >
              <span className="dot" style={{ backgroundColor: 'var(--ok, #10b981)' }} />
              <span>Walk me through Raft</span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-1" />
            </button>
          </div>
        </section>

        {/* ── Layrs Cycle Stats Bar (.pk-cycle) ─────────────────────────── */}
        <div className="pk-cycle">
          <div className="pk-stat pr-4 sm:pr-6 sm:border-r border-border">
            <div className="flex items-center gap-2">
              <span className="pk-stat-label">YOUR CAREER ROADMAP</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400">
                ACTIVE
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-foreground font-serif italic mt-0.5">
              {roadmap?.title || 'Full Stack & AI Engineer'}
            </h3>
          </div>

          <div className="pk-stat">
            <span className="pk-stat-label">IN PROGRESS</span>
            <div className="pk-stat-val">
              <span>{metrics.inProgressSkills}</span>
              <span className="pk-stat-unit">skills</span>
            </div>
          </div>

          <div className="pk-stat">
            <span className="pk-stat-label">TODAY'S TASKS</span>
            <div className="pk-stat-val">
              <span>{metrics.todayTasks.length}</span>
              <span className="pk-stat-unit">active</span>
            </div>
          </div>

          <div className="pk-stat">
            <span className="pk-stat-label">MASTERED</span>
            <div className="pk-stat-val text-emerald-600 dark:text-emerald-400">
              <span>{metrics.completedSkills}</span>
              <span className="pk-stat-unit">skills</span>
            </div>
          </div>

          <div className="pk-stat">
            <span className="pk-stat-label">READINESS</span>
            <div className="pk-stat-val text-orange-600 dark:text-orange-400">
              <span>{metrics.overallProgress}%</span>
              <span className="pk-stat-unit">score</span>
            </div>
          </div>
        </div>

        {/* ── Main Grid ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / Center Column: Roadmap & Career */}
          <div className="lg:col-span-2 space-y-6">
            {roadmapLoading ? (
              <div className="flex items-center justify-center py-20 bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : roadmap || (roadmaps && roadmaps.length > 0) ? (
              <div className="space-y-6 animate-fade-slide-in">
                {/* Multi-Roadmap Library Switcher */}
                <RoadmapLibrarySwitcher
                  roadmaps={roadmaps}
                  activeRoadmapId={activeRoadmapId}
                  onSwitchRoadmap={switchRoadmap}
                  onDeleteRoadmap={deleteRoadmap}
                  loading={roadmapLoading}
                />

                {roadmap?.career_decision && (
                  <CareerMatchCard 
                    careerDecision={roadmap.career_decision} 
                  />
                )}

                {roadmap && (
                  <RoadmapView 
                    roadmap={roadmap} 
                    onRefresh={refreshRoadmap}
                  />
                )}
              </div>
            ) : (
              <div className="empty-state py-16 card-surface">
                <div className="empty-state-icon">
                  <Target className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mt-4">No active roadmap</h3>
                <p className="text-sm text-gray-500 mt-2 max-w-sm mb-6">
                  Ready to level up? Run a skill gap analysis or AI path recommender to build your personalized career roadmap.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button 
                    onClick={() => navigate('/recommend')}
                    className="btn-primary"
                  >
                    <Sparkles className="w-4 h-4" /> AI Path Recommender
                  </button>
                  <button 
                    onClick={() => navigate('/skill-gap')}
                    className="btn-secondary"
                  >
                    <Zap className="w-4 h-4" /> Skill Gap Analyzer
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Today's Tasks */}
            <div className="card-surface p-5">
              <div className="section-header">
                <div>
                  <h2 className="section-title flex items-center gap-2">
                    <Calendar className="text-black" style={{width:18,height:18}} />
                    Today's Tasks
                  </h2>
                  <p className="section-subtitle">{new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}</p>
                </div>
                <button
                  onClick={() => navigate('/tasks')}
                  className="btn-ghost text-xs gap-1"
                >
                  View all <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {/* Quick add */}
              <form onSubmit={handleQuickAdd} className="flex gap-2 mb-4">
                <input
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  placeholder="Quick add a task..."
                  className="input-base flex-1 py-2 text-sm"
                />
                <button type="submit" disabled={addingTask || !newTaskTitle.trim()} className="btn-primary py-2 px-3">
                  <Plus className="w-4 h-4" />
                </button>
              </form>

              {/* Task list */}
              {loading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-14" />)}
                </div>
              ) : todayTasks.length === 0 ? (
                <div className="empty-state py-10">
                  <div className="empty-state-icon">
                    <CheckCircle2 className="w-7 h-7 text-black" />
                  </div>
                  <p className="text-sm font-medium text-black">All clear!</p>
                  <p className="text-xs text-gray-500 mt-1">No tasks for today. Add one above.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {todayTasks.map(task => (
                    <QuickTaskRow key={task.id} task={task} onToggle={handleToggleTask} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

export default Dashboard
