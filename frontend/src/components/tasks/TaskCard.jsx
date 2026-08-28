import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDraggable } from '@dnd-kit/core'
import {
  CheckCircle2, Circle, Clock, Flame, AlertCircle,
  MoreVertical, Tag, ArrowRight, ArrowLeft, RotateCcw,
  Pencil, Trash2, Calendar, Check, ShieldAlert, Sparkles, ChevronRight,
  GripVertical
} from 'lucide-react'

export const PRIORITY_CONFIG = {
  HIGH: {
    label: 'High',
    badgeCls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40',
    dotCls: 'bg-rose-500',
    icon: Flame
  },
  MEDIUM: {
    label: 'Medium',
    badgeCls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40',
    dotCls: 'bg-amber-500',
    icon: AlertCircle
  },
  LOW: {
    label: 'Low',
    badgeCls: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-800/40',
    dotCls: 'bg-slate-400',
    icon: Circle
  },
}

export const formatDeadline = (iso) => {
  if (!iso) return null
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const targetDate = new Date(d)
    targetDate.setHours(0, 0, 0, 0)

    const diffDays = Math.floor((targetDate - today) / 86400000)
    
    // Check if time is specified (not default midnight)
    const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0
    const timeStr = hasTime ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''

    if (diffDays < -1) {
      return { text: `${Math.abs(diffDays)}d overdue${timeStr ? ` (${timeStr})` : ''}`, isOverdue: true, cls: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900' }
    }
    if (diffDays === -1) {
      return { text: `Yesterday${timeStr ? ` at ${timeStr}` : ''}`, isOverdue: true, cls: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900' }
    }
    if (diffDays === 0) {
      return { text: `Today${timeStr ? ` by ${timeStr}` : ''}`, isOverdue: false, cls: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900' }
    }
    if (diffDays === 1) {
      return { text: `Tomorrow${timeStr ? ` by ${timeStr}` : ''}`, isOverdue: false, cls: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900' }
    }
    const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return { text: `${formatted}${timeStr ? ` at ${timeStr}` : ''}`, isOverdue: false, cls: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700' }
  } catch (e) {
    return null
  }
}

export const TaskCard = ({
  task,
  skillName,
  skills = [],
  onToggle,
  onEdit,
  onDelete,
  onMoveStatus,
  onSetPriority,
  onAssignSkill,
  isOverlay = false,
  isDragging = false,
  dragHandleProps = {},
}) => {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  const isDone = task.status === 'COMPLETED'
  const isCurrent = task.status === 'IN_PROGRESS'
  const isToDo = task.status === 'NOT_STARTED' || !task.status

  const priorityKey = (task.priority || 'MEDIUM').toUpperCase()
  const pCfg = PRIORITY_CONFIG[priorityKey] || PRIORITY_CONFIG.MEDIUM
  const PriorityIcon = pCfg.icon
  const deadlineInfo = formatDeadline(task.deadline)

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  return (
    <div
      className={`group relative rounded-2xl border p-4 bg-white dark:bg-card shadow-sm transition-all duration-200 ${
        isOverlay
          ? 'shadow-2xl ring-2 ring-violet-500/50 border-violet-400 dark:border-violet-600 bg-white dark:bg-zinc-900 cursor-grabbing select-none'
          : isDragging
          ? 'opacity-30 border-dashed border-gray-300 dark:border-zinc-700 bg-gray-50/40 dark:bg-zinc-900/40'
          : isDone
          ? 'border-gray-200 dark:border-border/60 opacity-80 bg-gray-50/50 dark:bg-card/40 hover:shadow-md'
          : isCurrent
          ? 'border-violet-200/80 dark:border-violet-800/40 ring-1 ring-violet-500/10 hover:shadow-md hover:border-violet-300'
          : 'border-gray-200 dark:border-border hover:border-gray-300 dark:hover:border-zinc-700 hover:shadow-md'
      }`}
    >
      {/* Top Header: Drag Handle + Priority Badge + 3-Dots Settings */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        {/* Drag Handle + Priority Badge */}
        <div className="flex items-center gap-1.5">
          <div
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-gray-300 hover:text-gray-600 dark:text-zinc-600 dark:hover:text-zinc-300 rounded-md transition-colors touch-none select-none"
            title="Drag to transfer between columns"
            aria-label="Drag handle"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>

          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${pCfg.badgeCls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${pCfg.dotCls}`} />
            <PriorityIcon className="w-3 h-3" />
            <span>{pCfg.label}</span>
          </span>
        </div>

        {/* 3-Dots Context Menu Button */}
        {!isOverlay && (
          <div className="relative" ref={menuRef} onPointerDown={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              aria-label="Task settings menu"
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

          {/* Context Dropdown Menu */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 4 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 mt-1 w-56 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-200 dark:border-border p-2 z-30 space-y-2 text-xs"
              >
                {/* 1. Priority Section */}
                <div className="px-2 py-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Set Priority
                  </span>
                  <div className="grid grid-cols-3 gap-1 mt-1.5">
                    {['HIGH', 'MEDIUM', 'LOW'].map((p) => {
                      const cfg = PRIORITY_CONFIG[p]
                      const active = priorityKey === p
                      return (
                        <button
                          key={p}
                          onClick={() => {
                            if (onSetPriority) onSetPriority(task.id, p)
                            setShowMenu(false)
                          }}
                          className={`px-2 py-1 rounded-lg font-semibold text-[10px] text-center border transition-all ${
                            active
                              ? `${cfg.badgeCls} font-bold ring-1 ring-current`
                              : 'bg-gray-50 dark:bg-zinc-800 border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700'
                          }`}
                        >
                          {cfg.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-border/60" />

                {/* 2. Column Shift Section */}
                <div className="px-2 py-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Move Column
                  </span>
                  <div className="space-y-1 mt-1">
                    <button
                      disabled={isToDo}
                      onClick={() => {
                        if (onMoveStatus) onMoveStatus(task.id, 'NOT_STARTED')
                        setShowMenu(false)
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors ${
                        isToDo ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">📋 To Do</span>
                      {isToDo && <Check className="w-3.5 h-3.5 text-violet-500" />}
                    </button>

                    <button
                      disabled={isCurrent}
                      onClick={() => {
                        if (onMoveStatus) onMoveStatus(task.id, 'IN_PROGRESS')
                        setShowMenu(false)
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors ${
                        isCurrent ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">⚡ Current (In Progress)</span>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-violet-500" />}
                    </button>

                    <button
                      disabled={isDone}
                      onClick={() => {
                        if (onMoveStatus) onMoveStatus(task.id, 'COMPLETED')
                        setShowMenu(false)
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors ${
                        isDone ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">✅ Past (Completed)</span>
                      {isDone && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                    </button>
                  </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-border/60" />

                {/* 3. Skill Linking Section */}
                <div className="px-2 py-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Assign Skill (Optional)
                  </span>
                  <select
                    value={task.skillId || ''}
                    onChange={(e) => {
                      if (onAssignSkill) onAssignSkill(task.id, e.target.value)
                      setShowMenu(false)
                    }}
                    className="w-full mt-1 px-2 py-1.5 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    <option value="">No Skill (Standalone Task)</option>
                    {skills.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name || s.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="h-px bg-gray-100 dark:bg-border/60" />

                {/* 4. Edit & Delete */}
                <div className="space-y-0.5 pt-0.5">
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      if (onEdit) onEdit(task)
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 text-left font-medium transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5 text-gray-400" />
                    <span>Edit Task Details</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false)
                      if (onDelete) onDelete(task.id)
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left font-medium transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Task</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>

      {/* Main Task Content */}
      <div className="space-y-2">
        {/* Checkbox + Title */}
        <div className="flex items-start gap-2.5">
          {!isOverlay && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onToggle && onToggle(task)}
              className={`mt-0.5 shrink-0 w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                isDone
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                  : 'border-gray-300 dark:border-zinc-600 hover:border-violet-500 bg-white dark:bg-zinc-800'
              }`}
              role="checkbox"
              aria-checked={isDone}
            >
              {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
            </button>
          )}

          <div className="flex-1 min-w-0">
            <h4
              className={`text-sm font-semibold leading-snug tracking-[-0.01em] ${
                isDone ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-foreground'
              }`}
            >
              {task.title}
            </h4>

            {task.notes && (
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                {task.notes}
              </p>
            )}
          </div>
        </div>

        {/* Metadata Badges: Deadline & Skill Tag */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {deadlineInfo && (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${deadlineInfo.cls}`}
            >
              <Clock className="w-3 h-3" />
              <span>{deadlineInfo.text}</span>
            </span>
          )}

          {skillName ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/40">
              <Tag className="w-2.5 h-2.5" />
              <span className="truncate max-w-[120px]">{skillName}</span>
            </span>
          ) : null}
        </div>
      </div>

      {/* Quick Column Shift Footer Actions */}
      {!isOverlay && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-gray-100 dark:border-border/60 text-xs"
        >
          {isToDo && (
            <button
              onClick={() => onMoveStatus && onMoveStatus(task.id, 'IN_PROGRESS')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-semibold bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors"
            >
              <span>Start Task</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

          {isCurrent && (
            <div className="flex items-center justify-between w-full">
              <button
                onClick={() => onMoveStatus && onMoveStatus(task.id, 'NOT_STARTED')}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>To Do</span>
              </button>

              <button
                onClick={() => onMoveStatus && onMoveStatus(task.id, 'COMPLETED')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
              >
                <Check className="w-3 h-3" />
                <span>Complete</span>
              </button>
            </div>
          )}

          {isDone && (
            <div className="flex items-center justify-between w-full">
              <button
                onClick={() => onMoveStatus && onMoveStatus(task.id, 'IN_PROGRESS')}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reopen</span>
              </button>

              <button
                onClick={() => onDelete && onDelete(task.id)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-rose-500 hover:text-rose-700 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Draggable Task Card Wrapper for Dnd-Kit ──────────────────────────────────
export const DraggableTaskCard = (props) => {
  const { task } = props
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task.id,
    data: {
      task,
      columnId: task.status || 'NOT_STARTED',
    },
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 50 : undefined,
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'opacity-30' : ''}
    >
      <TaskCard
        {...props}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

export default TaskCard
