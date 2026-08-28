import React, { useMemo, useState } from 'react'
import {
  BarChart3, CalendarDays, CheckCircle2, Clock3,
  Sparkles, TrendingUp, Target, Zap, ChevronDown
} from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { PageHeader } from '../components/ui/PageHeader'
import { useSkills } from '../contexts/SkillContext'
import { useTasks } from '../contexts/TaskContext'
import { weeklyReport } from '../services/aiService'

// ─── Status/Priority helpers ──────────────────────────────────────────────────
const STATUS_CONFIG = {
  NOT_STARTED: { label: 'Not Started', bg: '#e5e7eb', fill: '#9ca3af' },
  IN_PROGRESS:  { label: 'In Progress',  bg: '#dbeafe', fill: '#3b82f6' },
  COMPLETED:    { label: 'Completed',    bg: '#d1fae5', fill: '#10b981' },
}

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────
const MiniBar = ({ label, value, max, color }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs">
      <span className="text-gray-600 dark:text-gray-400 truncate max-w-[140px]">{label}</span>
      <span className="font-bold text-gray-900 dark:text-foreground ml-2">{value}%</span>
    </div>
    <div className="progress-track">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
  </div>
)

// ─── Donut Chart (SVG) ────────────────────────────────────────────────────────
const DonutChart = ({ segments, size = 120, thickness = 20 }) => {
  const r    = (size - thickness) / 2
  const circ = 2 * Math.PI * r
  const total = segments.reduce((s, x) => s + x.value, 0)
  let offset = 0

  return (
    <svg width={size} height={size} className="-rotate-90">
      {segments.map((seg, i) => {
        const pct  = total ? seg.value / total : 0
        const dash = pct * circ
        const el = (
          <circle key={i}
            cx={size/2} cy={size/2} r={r}
            fill="none" stroke={seg.color} strokeWidth={thickness}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
          />
        )
        offset += dash
        return el
      })}
    </svg>
  )
}

// ─── Stat Widget ──────────────────────────────────────────────────────────────
const StatWidget = ({ icon: Icon, label, value, color = 'indigo' }) => {
  const colors = {
    indigo:  'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    amber:   'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
    violet:  'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400',
  }
  return (
    <div className="card-surface p-5 flex flex-col gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900 dark:text-foreground">{value}</div>
        <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-muted-foreground mt-0.5">{label}</div>
      </div>
    </div>
  )
}

// ─── Analytics Page ───────────────────────────────────────────────────────────
const Analytics = () => {
  const { skills } = useSkills()
  const { tasks  } = useTasks()
  const [result, setResult]     = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const metrics = useMemo(() => {
    const completedTasks    = tasks.filter(t => t.status === 'COMPLETED').length
    const inProgressTasks   = tasks.filter(t => t.status === 'IN_PROGRESS').length
    const completedSkills   = skills.filter(s => s.status === 'COMPLETED').length
    const inProgressSkills  = skills.filter(s => s.status === 'IN_PROGRESS').length
    const efficiency        = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0
    const avgProgress       = skills.length
      ? Math.round(skills.reduce((sum, s) => sum + (s.progress || 0), 0) / skills.length)
      : 0

    // Skills by progress buckets
    const buckets = {
      '0%':    skills.filter(s => (s.progress||0) === 0).length,
      '1-33%': skills.filter(s => (s.progress||0) > 0  && (s.progress||0) <= 33).length,
      '34-66%':skills.filter(s => (s.progress||0) > 33 && (s.progress||0) <= 66).length,
      '67-99%':skills.filter(s => (s.progress||0) > 66 && (s.progress||0) < 100).length,
      '100%':  skills.filter(s => (s.progress||0) === 100).length,
    }

    return { completedTasks, inProgressTasks, completedSkills, inProgressSkills, efficiency, avgProgress, buckets }
  }, [skills, tasks])

  const donutSegments = [
    { label: 'Completed',   value: metrics.completedSkills,                                                   color: '#10b981' },
    { label: 'In Progress', value: metrics.inProgressSkills,                                                  color: '#6366f1' },
    { label: 'Not Started', value: skills.length - metrics.completedSkills - metrics.inProgressSkills, color: '#e5e7eb' },
  ]

  const topSkills = [...skills]
    .filter(s => (s.progress||0) > 0)
    .sort((a, b) => (b.progress||0) - (a.progress||0))
    .slice(0, 8)

  const runWeeklyReport = async () => {
    setAiLoading(true)
    try {
      const data = await weeklyReport({ tasks, skills })
      setResult(data)
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <AppShell>
      <div className="page-container space-y-8 animate-fade-slide-in">
        <PageHeader 
          title="Engineering Analytics" 
          subtitle="Track your learning velocity, task completion efficiency, and competency breakdowns." 
        />

        {/* ── Layrs Stats Bar (.pk-cycle) ─────────────────────────────────── */}
        <div className="pk-cycle">
          <div className="pk-stat pr-4 sm:pr-6 sm:border-r border-border">
            <span className="pk-stat-label">TOTAL TASKS</span>
            <div className="pk-stat-val">
              <span>{tasks.length}</span>
              <span className="pk-stat-unit">logged</span>
            </div>
          </div>

          <div className="pk-stat">
            <span className="pk-stat-label">COMPLETED</span>
            <div className="pk-stat-val text-emerald-600 dark:text-emerald-400">
              <span>{metrics.completedTasks}</span>
              <span className="pk-stat-unit">tasks</span>
            </div>
          </div>

          <div className="pk-stat">
            <span className="pk-stat-label">IN PROGRESS</span>
            <div className="pk-stat-val text-blue-600 dark:text-blue-400">
              <span>{metrics.inProgressSkills}</span>
              <span className="pk-stat-unit">skills</span>
            </div>
          </div>

          <div className="pk-stat">
            <span className="pk-stat-label">TASK EFFICIENCY</span>
            <div className="pk-stat-val text-orange-600 dark:text-orange-400">
              <span>{metrics.efficiency}%</span>
              <span className="pk-stat-unit">rate</span>
            </div>
          </div>
        </div>

        {/* ── Charts row ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1fr_1fr_0.8fr] gap-5">

          {/* Skills by Progress (bar chart) */}
          <div className="card-surface p-5">
            <h2 className="section-title mb-4">Top Skills by Progress</h2>
            {topSkills.length === 0 ? (
              <div className="empty-state py-8">
                <div className="empty-state-icon"><BarChart3 className="w-6 h-6 text-gray-400" /></div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">No skill progress yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topSkills.map(s => {
                  const pct = Math.round(s.progress || 0)
                  const col = pct >= 100 ? '#10b981' : pct >= 60 ? '#6366f1' : '#f59e0b'
                  return (
                    <MiniBar
                      key={s.id}
                      label={s.name || s.title}
                      value={pct}
                      max={100}
                      color={col}
                    />
                  )
                })}
              </div>
            )}
          </div>

          {/* Skills by Status (donut) */}
          <div className="card-surface p-5">
            <h2 className="section-title mb-4">Skills by Status</h2>
            {skills.length === 0 ? (
              <div className="empty-state py-8">
                <div className="empty-state-icon"><Target className="w-6 h-6 text-gray-400" /></div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Add skills to see breakdown</p>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <div className="relative shrink-0">
                  <DonutChart segments={donutSegments} size={120} thickness={20} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-gray-900 dark:text-foreground">{skills.length}</span>
                    <span className="text-[10px] text-gray-400">total</span>
                  </div>
                </div>
                <div className="space-y-3 flex-1">
                  {donutSegments.map(seg => (
                    <div key={seg.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: seg.color }} />
                        <span className="text-xs text-gray-600 dark:text-gray-400">{seg.label}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-foreground">{seg.value}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-200 dark:border-border">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Avg Progress</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{metrics.avgProgress}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Progress Buckets */}
          <div className="card-surface p-5">
            <h2 className="section-title mb-4">Progress Buckets</h2>
            <div className="space-y-3">
              {Object.entries(metrics.buckets).map(([range, count]) => (
                <div key={range} className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{range}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full bg-gray-100 dark:bg-accent overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all duration-700"
                        style={{ width: skills.length ? `${(count/skills.length)*100}%` : '0%' }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-900 dark:text-foreground w-4 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Task breakdown row ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Not Started', value: tasks.filter(t=>t.status==='NOT_STARTED').length,  color: '#9ca3af', total: tasks.length },
            { label: 'In Progress', value: metrics.inProgressTasks,                           color: '#6366f1', total: tasks.length },
            { label: 'Completed',   value: metrics.completedTasks,                             color: '#10b981', total: tasks.length },
          ].map(item => (
            <div key={item.label} className="card-surface p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{item.label}</span>
                <span className="text-xl font-bold text-gray-900 dark:text-foreground">{item.value}</span>
              </div>
              <div className="progress-track">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: item.total ? `${(item.value/item.total)*100}%` : '0%', background: item.color }} />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                {item.total ? `${Math.round((item.value/item.total)*100)}%` : '0%'} of all tasks
              </p>
            </div>
          ))}
        </div>

        {/* ── AI Weekly Review ─────────────────────────────────────────── */}
        <div className="card-surface p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title flex items-center gap-2">
              <Sparkles className="text-violet-500" style={{width:18,height:18}} />
              AI Weekly Review
            </h2>
            <button
              onClick={runWeeklyReport}
              disabled={aiLoading}
              className="btn-primary text-xs py-2 px-4"
            >
              {aiLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Generating...
                </span>
              ) : 'Generate Report'}
            </button>
          </div>

          {result ? (
            <div className="bg-gray-50 dark:bg-accent rounded-xl p-4">
              <div className={`text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap ${!expanded ? 'line-clamp-6' : ''}`}>
                {result}
              </div>
              <button
                onClick={() => setExpanded(e => !e)}
                className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-2"
              >
                {expanded ? 'Show less' : 'Show more'}
                <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Click "Generate Report" to get an AI-powered summary of your week, what you completed, what you missed, and where to improve.
            </p>
          )}
        </div>
      </div>
    </AppShell>
  )
}

export default Analytics
