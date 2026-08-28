import React, { useMemo, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ListTodo, Plus, CheckCircle2, Circle, Pencil, Trash2,
  Calendar, ChevronDown, X, Tag, AlertCircle, Clock, Search,
  Flame, LayoutGrid, List, Sparkles, Filter, Check
} from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { PageHeader } from '../components/ui/PageHeader'
import { useSkills } from '../contexts/SkillContext'
import { useTasks } from '../contexts/TaskContext'
import TaskColumnBoard from '../components/tasks/TaskColumnBoard'
import TaskCard, { PRIORITY_CONFIG, formatDeadline } from '../components/tasks/TaskCard'
import { AutoScheduleModal } from '../components/tasks/AutoScheduleModal'

const STATUS_CONFIG = {
  NOT_STARTED: { label: 'To Do', cls: 'badge-not-started' },
  IN_PROGRESS:  { label: 'Current', cls: 'badge-in-progress' },
  COMPLETED:    { label: 'Past', cls: 'badge-completed' },
}

const emptyForm = {
  title: '',
  skillId: '',
  deadline: '',
  priority: 'MEDIUM',
  status: 'NOT_STARTED',
  notes: ''
}

// ─── Slide-Over Task Modal ───────────────────────────────────────────────────
const TaskSlideOver = ({
  form,
  editingId,
  skills,
  onChange,
  onSubmit,
  onClose,
  isSubmitting = false,
}) => {
  const today = new Date().toISOString().slice(0, 10)

  // Split deadline into date and time
  const [dueDate, setDueDate] = useState(form.deadline ? form.deadline.slice(0, 10) : '')
  const [dueTime, setDueTime] = useState(form.deadline && form.deadline.length > 11 ? form.deadline.slice(11, 16) : '')

  useEffect(() => {
    setDueDate(form.deadline ? form.deadline.slice(0, 10) : '')
    setDueTime(form.deadline && form.deadline.length > 11 ? form.deadline.slice(11, 16) : '')
  }, [form.deadline])

  const handleDateChange = (val) => {
    setDueDate(val)
    if (val) {
      const combined = dueTime ? `${val}T${dueTime}:00` : `${val}T00:00:00`
      onChange('deadline', combined)
    } else {
      onChange('deadline', '')
    }
  }

  const handleTimeChange = (val) => {
    setDueTime(val)
    if (dueDate) {
      const combined = val ? `${dueDate}T${val}:00` : `${dueDate}T00:00:00`
      onChange('deadline', combined)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault()
      if (form.title?.trim() && !isSubmitting) {
        onSubmit()
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* SlideOver Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        className="relative w-full max-w-md bg-white dark:bg-card shadow-2xl h-full flex flex-col z-10 border-l border-gray-200 dark:border-border"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-slideover-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <ListTodo className="w-4 h-4" />
            </div>
            <div>
              <h2 id="task-slideover-title" className="text-base font-bold text-gray-900 dark:text-foreground">
                {editingId ? 'Edit Task' : 'Create New Task'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {editingId ? 'Update priority, deadline, or linked skills.' : 'Add to your task board with custom priority & timeline.'}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn-icon" aria-label="Close panel">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Title */}
          <div>
            <label className="label-base">Task Title *</label>
            <input
              autoFocus
              className="input-base text-sm font-medium"
              placeholder="e.g. Build authentication endpoints, Study design patterns..."
              value={form.title}
              onKeyDown={handleKeyDown}
              onChange={(e) => onChange('title', e.target.value)}
            />
          </div>

          {/* Priority Selection */}
          <div>
            <label className="label-base flex items-center justify-between">
              <span>Task Priority Level *</span>
              <span className="text-[10px] text-gray-400 font-normal">Every task has an individual priority</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5 mt-1.5">
              {[
                { key: 'HIGH', label: '🔴 High', desc: 'Critical / Urgent' },
                { key: 'MEDIUM', label: '🟡 Medium', desc: 'Core priority' },
                { key: 'LOW', label: '🔵 Low', desc: 'Low urgency' }
              ].map((p) => {
                const isSelected = form.priority === p.key
                return (
                  <button
                    type="button"
                    key={p.key}
                    onClick={() => onChange('priority', p.key)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-violet-600 dark:border-violet-400 bg-violet-50/70 dark:bg-violet-950/40 ring-2 ring-violet-500/20'
                        : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 bg-white dark:bg-card'
                    }`}
                  >
                    <div className="text-xs font-bold text-gray-900 dark:text-foreground">{p.label}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{p.desc}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Status / Column Selection */}
          <div>
            <label className="label-base">Target Board Column *</label>
            <div className="grid grid-cols-3 gap-2 mt-1.5">
              {[
                { key: 'NOT_STARTED', label: '📋 To Do' },
                { key: 'IN_PROGRESS', label: '⚡ Current' },
                { key: 'COMPLETED', label: '✅ Past' }
              ].map((st) => (
                <button
                  type="button"
                  key={st.key}
                  onClick={() => onChange('status', st.key)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                    form.status === st.key
                      ? 'border-violet-600 bg-violet-50 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-500'
                      : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Deadline: Date + Time */}
          <div>
            <label className="label-base">Deadline & Target Time (Optional)</label>
            <div className="grid grid-cols-2 gap-3 mt-1">
              <div>
                <span className="text-[10px] text-gray-500 mb-1 block">Due Date</span>
                <input
                  type="date"
                  className="input-base"
                  value={dueDate}
                  min={today}
                  onChange={(e) => handleDateChange(e.target.value)}
                />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 mb-1 block">Target Time</span>
                <input
                  type="time"
                  className="input-base"
                  value={dueTime}
                  onChange={(e) => handleTimeChange(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Optional Skill Link */}
          <div>
            <label className="label-base flex items-center justify-between">
              <span>Link to Skill (Optional)</span>
              <span className="text-[10px] text-gray-400">Can be a standalone task</span>
            </label>
            <select
              className="input-base mt-1"
              value={form.skillId || ''}
              onChange={(e) => onChange('skillId', e.target.value)}
            >
              <option value="">No Skill (Standalone Task)</option>
              {skills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || s.title}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="label-base">Notes & Details</label>
            <textarea
              rows={3}
              className="input-base resize-none mt-1 text-xs"
              placeholder="Key sub-steps, reference links, or notes..."
              value={form.notes}
              onChange={(e) => onChange('notes', e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-border flex gap-3 shrink-0 bg-gray-50/50 dark:bg-card/50">
          <button type="button" onClick={onClose} className="btn-outline flex-1">
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!form.title?.trim() || isSubmitting}
            className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </span>
            ) : (
              <span>{editingId ? 'Save Changes' : 'Create Task'}</span>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Main Tasks Component ─────────────────────────────────────────────────────
export const Tasks = () => {
  const location = useLocation()
  const { skills = [], getSkillById } = useSkills()
  const {
    tasks = [],
    createTask,
    updateTask,
    deleteTask,
    moveToStatus,
    setTaskPriority,
    assignSkill
  } = useTasks()

  const [viewMode, setViewMode] = useState('board') // 'board' | 'list'
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('ALL') // ALL | HIGH | MEDIUM | LOW
  const [typeFilter, setTypeFilter] = useState('ALL') // ALL | SKILL | STANDALONE

  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAutoSchedule, setShowAutoSchedule] = useState(false)

  const handleApplySchedule = async (approvedMoves) => {
    for (const m of approvedMoves) {
      if (m.taskId) {
        if (m.targetStatus) await moveToStatus(m.taskId, m.targetStatus)
        if (m.priority) await setTaskPriority(m.taskId, m.priority)
      }
    }
  }

  // Auto-open modal if requested via navigation state
  useEffect(() => {
    if (location.state?.openNewTask) {
      handleOpenNewTask(location.state.column || 'NOT_STARTED')
    }
  }, [location.state])

  // ── Form Handlers ────────────────────────────────────────────────────────
  const handleChange = (key, val) => setForm((prev) => ({ ...prev, [key]: val }))

  const handleOpenNewTask = (preselectedStatus = 'NOT_STARTED') => {
    setForm({
      ...emptyForm,
      status: preselectedStatus,
    })
    setEditingId(null)
    setShowForm(true)
  }

  const handleEdit = (task) => {
    setEditingId(task.id)
    setForm({
      title: task.title || '',
      skillId: task.skillId || '',
      deadline: task.deadline || '',
      priority: task.priority || 'MEDIUM',
      status: task.status || 'NOT_STARTED',
      notes: task.notes || '',
    })
    setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!form.title?.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      if (editingId) {
        await updateTask(editingId, form)
      } else {
        await createTask(form)
      }
      setForm(emptyForm)
      setEditingId(null)
      setShowForm(false)
    } catch (err) {
      console.error('Failed to submit task:', err)
      // Close modal gracefully on local update
      setForm(emptyForm)
      setEditingId(null)
      setShowForm(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
  }

  const handleToggleTask = async (task) => {
    const nextStatus = task.status === 'COMPLETED' ? 'IN_PROGRESS' : 'COMPLETED'
    await moveToStatus(task.id, nextStatus)
  }

  // ── Filtered tasks ───────────────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const titleMatch = (t.title || '').toLowerCase().includes(q)
        const notesMatch = (t.notes || '').toLowerCase().includes(q)
        const skillName = t.skillId ? (getSkillById(t.skillId)?.name || '').toLowerCase() : ''
        if (!titleMatch && !notesMatch && !skillName.includes(q)) return false
      }

      // Priority filter
      if (priorityFilter !== 'ALL') {
        if ((t.priority || 'MEDIUM').toUpperCase() !== priorityFilter) return false
      }

      // Type filter (Skill-linked vs Standalone)
      if (typeFilter === 'SKILL' && !t.skillId) return false
      if (typeFilter === 'STANDALONE' && t.skillId) return false

      return true
    })
  }, [tasks, searchQuery, priorityFilter, typeFilter, getSkillById])

  return (
    <AppShell>
      <div className="page-container space-y-6 animate-fade-slide-in">
        {/* ── Layrs Plans Header (.pk-cycle) ────────────────────────────── */}
        <div className="pk-cycle">
          <div className="pk-stat pr-4 sm:pr-6 sm:border-r border-border min-w-[200px]">
            <div className="flex items-center gap-2">
              <span className="pk-stat-label">YOUR PLANS & TASKS</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <Flame className="w-3 h-3 text-orange-500" />
                WIP
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground font-serif italic mt-0.5">
              Where you <em>left off</em>.
            </h2>
          </div>

          <div className="pk-stat">
            <span className="pk-stat-label">IN PROGRESS</span>
            <div className="pk-stat-val">
              <span>{tasks.filter((t) => t.status === 'IN_PROGRESS').length}</span>
              <span className="pk-stat-unit">tasks</span>
            </div>
          </div>

          <div className="pk-stat">
            <span className="pk-stat-label">TO DO</span>
            <div className="pk-stat-val text-blue-600 dark:text-blue-400">
              <span>{tasks.filter((t) => t.status === 'NOT_STARTED').length}</span>
              <span className="pk-stat-unit">pending</span>
            </div>
          </div>

          <div className="pk-stat">
            <span className="pk-stat-label">COMPLETED</span>
            <div className="pk-stat-val text-emerald-600 dark:text-emerald-400">
              <span>{tasks.filter((t) => t.status === 'COMPLETED').length}</span>
              <span className="pk-stat-unit">done</span>
            </div>
          </div>

          <div className="pk-stat">
            <span className="pk-stat-label">HIGH PRIORITY</span>
            <div className="pk-stat-val text-orange-600 dark:text-orange-400">
              <span>{tasks.filter((t) => t.priority === 'HIGH' && t.status !== 'COMPLETED').length}</span>
              <span className="pk-stat-unit">urgent</span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowAutoSchedule(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl font-bold text-xs bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-all shadow-2xs"
              title="Auto-organize your board into a balanced sprint"
            >
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span className="hidden sm:inline">AI Auto-Schedule</span>
              <span className="sm:hidden">Auto-Schedule</span>
            </button>

            <button
              onClick={() => handleOpenNewTask('NOT_STARTED')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs bg-orange-600 hover:bg-orange-700 text-white transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-card border border-border rounded-3xl p-4 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tasks by title, notes, or linked skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2 text-xs font-medium bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View Mode Toggle: Board vs List */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shrink-0">
              <button
                onClick={() => setViewMode('board')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'board'
                    ? 'bg-white dark:bg-card text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>3-Column Board</span>
              </button>

              <button
                onClick={() => setViewMode('list')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-card text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>List View</span>
              </button>
            </div>
          </div>

          {/* Quick Filters: Priority + Task Types */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100 dark:border-border/60 text-xs">
            {/* Priority Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mr-1">
                Priority:
              </span>
              {[
                { key: 'ALL', label: 'All' },
                { key: 'HIGH', label: '🔴 High' },
                { key: 'MEDIUM', label: '🟡 Medium' },
                { key: 'LOW', label: '🔵 Low' },
              ].map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPriorityFilter(p.key)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                    priorityFilter === p.key
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-transparent shadow-xs'
                      : 'bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-zinc-700 hover:bg-gray-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mr-1">
                Type:
              </span>
              {[
                { key: 'ALL', label: 'All Tasks' },
                { key: 'STANDALONE', label: 'Standalone' },
                { key: 'SKILL', label: '🏷️ Skill-Linked' },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTypeFilter(t.key)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                    typeFilter === t.key
                      ? 'bg-violet-600 text-white dark:bg-violet-500 dark:text-white border-transparent shadow-xs'
                      : 'bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-zinc-700 hover:bg-gray-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main Board or List View ────────────────────────────────────────── */}
        {viewMode === 'board' ? (
          <TaskColumnBoard
            tasks={filteredTasks}
            skills={skills}
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
            getSkillById={getSkillById}
            onToggleTask={handleToggleTask}
            onEditTask={handleEdit}
            onDeleteTask={deleteTask}
            onMoveStatus={moveToStatus}
            onSetPriority={setTaskPriority}
            onAssignSkill={assignSkill}
            onOpenNewTaskModal={handleOpenNewTask}
          />
        ) : (
          /* List View */
          <div className="space-y-4">
            {['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'].map((stKey) => {
              const list = filteredTasks.filter((t) => (t.status || 'NOT_STARTED') === stKey)
              if (list.length === 0) return null
              const stCfg = STATUS_CONFIG[stKey] || STATUS_CONFIG.NOT_STARTED

              return (
                <div key={stKey} className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-border/60">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${stCfg.cls}`}>
                        {stCfg.label}
                      </span>
                      <span className="text-xs text-gray-400 font-semibold">({list.length})</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {list.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        skillName={getSkillById && task.skillId ? getSkillById(task.skillId)?.name : null}
                        skills={skills}
                        onToggle={handleToggleTask}
                        onEdit={handleEdit}
                        onDelete={deleteTask}
                        onMoveStatus={moveToStatus}
                        onSetPriority={setTaskPriority}
                        onAssignSkill={assignSkill}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Slide-Over Modal */}
        <AnimatePresence>
          {showForm && (
            <TaskSlideOver
              form={form}
              editingId={editingId}
              skills={skills}
              onChange={handleChange}
              onSubmit={handleSubmit}
              onClose={handleClose}
              isSubmitting={isSubmitting}
            />
          )}
        </AnimatePresence>

        {/* AI Auto-Schedule Modal with Human Approval */}
        <AnimatePresence>
          {showAutoSchedule && (
            <AutoScheduleModal
              isOpen={showAutoSchedule}
              onClose={() => setShowAutoSchedule(false)}
              tasks={tasks}
              onApplySchedule={handleApplySchedule}
            />
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  )
}

export default Tasks
