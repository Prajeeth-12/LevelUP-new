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
      <div className="page-container animate-fade-slide-in">
        <PageHeader 
          title={<>{greeting}, <span className="capitalize">{userName}</span></>}
          subtitle={metrics.inProgressSkills > 0
            ? `You've mastered ${metrics.completedSkills} skills. Keep going!`
            : 'Ready to level up your career? Start by adding a skill.'}
          actions={
            <>
              {overdueTasks.length > 0 && (
                <button
                  onClick={() => navigate('/tasks')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[18px] text-xs font-medium
                    bg-white text-black border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  {overdueTasks.length} overdue
                </button>
              )}
              <button
                onClick={() => navigate('/learning-path')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[18px] text-xs font-semibold
                  bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors shadow-sm"
              >
                <Compass className="w-3.5 h-3.5" />
                AI Learning Path
              </button>
              <button onClick={() => navigate('/skill-gap')} className="btn-primary gap-1.5">
                <Zap className="w-4 h-4" />
                Analyze Skill Gap
              </button>
            </>
          }
        />

        {/* ── Stat Grid ──────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={Layers3}
              label="Total Skills"
              value={skills.length}
              sub={`${metrics.completedSkills} completed`}
              onClick={() => navigate('/skills')}
            />
            <StatCard
              icon={Target}
              label="Overall Progress"
              value={`${metrics.overallProgress}%`}
              sub={`${metrics.inProgressSkills} in progress`}
              onClick={() => navigate('/skills')}
            />
            <StatCard
              icon={ListTodo}
              label="Tasks Today"
              value={metrics.todayTasks.length}
              sub={`${metrics.completedTasks} done total`}
              onClick={() => navigate('/tasks')}
            />
            <StatCard
              icon={Flame}
              label="Active Streak"
              value="N/A"
              sub="Daily streak coming soon"
              onClick={() => navigate('/analytics')}
            />
          </div>
        )}

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
