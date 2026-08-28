import React, { useMemo, useState } from 'react'
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
  onClose
}) => {
  const today = new Date().toISOString().slice(0, 10)

  // Split deadline into date and time
  const [dueDate, setDueDate] = useState(form.deadline ? form.deadline.slice(0, 10) : '')
  const [dueTime, setDueTime] = useState(form.deadline && form.deadline.length > 11 ? form.deadline.slice(11, 16) : '')

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

  return (
    <>
      <div className="slideover-backdrop" onClick={onClose} />
      <div
        className="slideover-panel"
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
            disabled={!form.title.trim()}
            className="btn-primary flex-1"
          >
            {editingId ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Main Tasks Component ─────────────────────────────────────────────────────
export const Tasks = () => {
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
    if (!form.title.trim()) return
    if (editingId) {
      await updateTask(editingId, form)
    } else {
      await createTask(form)
    }
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-slide-in">
        {/* Page Header */}
        <PageHeader
          title="Task Management Board"
          subtitle="Organize all your learning objectives, coding tasks, and general milestones across To Do, Current, and Past workflows."
          action={
            <button
              onClick={() => handleOpenNewTask('NOT_STARTED')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </button>
          }
        />

        {/* Filter & Search Bar */}
        <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tasks by title, notes, or linked skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9.5 pr-4 py-2 text-xs font-medium bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
            />
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  )
}

export default Tasks
