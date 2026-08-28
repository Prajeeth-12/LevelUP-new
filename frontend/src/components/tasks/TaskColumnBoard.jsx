import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core'
import {
  ListTodo, Zap, CheckCircle2, Plus, ArrowUpDown,
  Flame, AlertCircle, Circle, Sparkles, Inbox, Clock
} from 'lucide-react'
import { TaskCard, DraggableTaskCard } from './TaskCard'

const COLUMNS = [
  {
    id: 'NOT_STARTED',
    title: 'To Do',
    subtitle: 'Backlog & Planned',
    icon: ListTodo,
    colorCls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    headerBadge: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20',
    columnBorder: 'border-border',
    emptyText: 'No planned tasks. Add your next goal!',
    actionText: 'Add to To Do',
  },
  {
    id: 'IN_PROGRESS',
    title: 'Current',
    subtitle: 'Active Focus & Today',
    icon: Zap,
    colorCls: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    headerBadge: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-500/20',
    columnBorder: 'border-border',
    emptyText: 'Nothing in progress. Promote a task from To Do!',
    actionText: 'Add to Current',
  },
  {
    id: 'COMPLETED',
    title: 'Past',
    subtitle: 'Completed & History',
    icon: CheckCircle2,
    colorCls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    headerBadge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20',
    columnBorder: 'border-border',
    emptyText: 'No completed tasks yet. Finish a task to see history!',
    actionText: 'Record Past Task',
  },
]

const PRIORITY_WEIGHTS = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
}

// ─── Droppable Column Component ──────────────────────────────────────────────
const DroppableColumn = ({
  col,
  colTasks,
  skills,
  getSkillById,
  currentSort,
  onSortChange,
  searchQuery,
  onClearSearch,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onMoveStatus,
  onSetPriority,
  onAssignSkill,
  onOpenNewTaskModal,
  isOverTarget,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: col.id,
    data: {
      columnId: col.id,
    },
  })

  const ColumnIcon = col.icon
  const isHighlighted = isOver || isOverTarget

  // Compute high priority count
  const highCount = colTasks.filter(
    (t) => (t.priority || '').toUpperCase() === 'HIGH'
  ).length

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-3xl p-4 sm:p-5 shadow-2xs min-h-[520px] transition-all duration-200 ${
        isHighlighted
          ? 'bg-orange-500/10 dark:bg-orange-950/20 border-orange-500 ring-2 ring-orange-500/30 scale-[1.008] shadow-sm'
          : `bg-secondary/40 border ${col.columnBorder}`
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-gray-200/80 dark:border-border/60">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center border ${col.colorCls}`}
          >
            <ColumnIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900 dark:text-foreground">
                {col.title}
              </h3>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${col.headerBadge}`}
              >
                {colTasks.length}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {col.subtitle}
            </p>
          </div>
        </div>

        {/* High Priority indicator + Sort selector */}
        <div className="flex items-center gap-1.5">
          {highCount > 0 && (
            <span
              title={`${highCount} High Priority Tasks`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
            >
              <Flame className="w-3 h-3 text-rose-500" />
              <span>{highCount} High</span>
            </span>
          )}

          {/* Sort selector */}
          <div className="relative group/sort">
            <select
              value={currentSort}
              onChange={(e) => onSortChange(col.id, e.target.value)}
              aria-label={`Sort ${col.title} tasks`}
              className="text-[10px] font-semibold bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-zinc-700 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
            >
              <option value="priority">⚡ By Priority</option>
              <option value="deadline">⏰ By Deadline</option>
              <option value="title">🔤 By Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Add Button inside Column */}
      <button
        onClick={() => onOpenNewTaskModal && onOpenNewTaskModal(col.id)}
        className="w-full mb-3 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border border-dashed border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-card/40 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:white hover:border-gray-400 dark:hover:border-zinc-500 hover:bg-white dark:hover:bg-zinc-800/80 transition-all shadow-2xs"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>{col.actionText}</span>
      </button>

      {/* Task Cards List */}
      <div className="space-y-3 flex-1">
        <AnimatePresence mode="popLayout">
          {colTasks.length > 0 ? (
            colTasks.map((task) => (
              <DraggableTaskCard
                key={task.id}
                task={task}
                skillName={getSkillById && task.skillId ? getSkillById(task.skillId)?.name : null}
                skills={skills}
                onToggle={onToggleTask}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onMoveStatus={onMoveStatus}
                onSetPriority={onSetPriority}
                onAssignSkill={onAssignSkill}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-10 px-4 text-center rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800 bg-white/40 dark:bg-card/20 space-y-2"
            >
              <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-gray-400">
                <Inbox className="w-4 h-4" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {searchQuery ? (
                  <span>No tasks in {col.title} matching "{searchQuery}"</span>
                ) : (
                  col.emptyText
                )}
              </p>
              {searchQuery && onClearSearch && (
                <button
                  type="button"
                  onClick={onClearSearch}
                  className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                >
                  Clear search
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Main Column Board with Dnd-Kit ──────────────────────────────────────────
export const TaskColumnBoard = ({
  tasks = [],
  skills = [],
  searchQuery = '',
  onClearSearch,
  getSkillById,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onMoveStatus,
  onSetPriority,
  onAssignSkill,
  onOpenNewTaskModal,
}) => {
  // Sort state per column: 'priority' | 'deadline' | 'title'
  const [columnSorts, setColumnSorts] = useState({
    NOT_STARTED: 'priority',
    IN_PROGRESS: 'priority',
    COMPLETED: 'deadline',
  })

  const [activeTask, setActiveTask] = useState(null)
  const [overColumnId, setOverColumnId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6, // 6px movement allows clicking buttons/3-dots menu cleanly without triggering drag
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150, // 150ms press on touch devices before drag begins
        tolerance: 6,
      },
    }),
    useSensor(KeyboardSensor)
  )

  const setColumnSort = (colId, sortKey) => {
    setColumnSorts((prev) => ({ ...prev, [colId]: sortKey }))
  }

  // Filter tasks into columns and apply per-column sorting
  const columnData = useMemo(() => {
    const map = {
      NOT_STARTED: [],
      IN_PROGRESS: [],
      COMPLETED: [],
    }

    // Partition tasks
    tasks.forEach((t) => {
      const status = t.status === 'COMPLETED'
        ? 'COMPLETED'
        : t.status === 'IN_PROGRESS'
        ? 'IN_PROGRESS'
        : 'NOT_STARTED'
      map[status].push(t)
    })

    // Sort each column
    Object.keys(map).forEach((colId) => {
      const sortMode = columnSorts[colId] || 'priority'
      map[colId].sort((a, b) => {
        if (sortMode === 'priority') {
          const wA = PRIORITY_WEIGHTS[(a.priority || 'MEDIUM').toUpperCase()] || 2
          const wB = PRIORITY_WEIGHTS[(b.priority || 'MEDIUM').toUpperCase()] || 2
          if (wA !== wB) return wB - wA // High first
        }
        if (sortMode === 'deadline') {
          const dA = a.deadline ? new Date(a.deadline).getTime() : Infinity
          const dB = b.deadline ? new Date(b.deadline).getTime() : Infinity
          if (dA !== dB) return dA - dB // Closest deadline first
        }
        return (a.title || '').localeCompare(b.title || '')
      })
    })

    return map
  }, [tasks, columnSorts])

  // ── Drag & Drop Event Handlers ───────────────────────────────────────────
  const handleDragStart = (event) => {
    const { active } = event
    const foundTask = active.data.current?.task || tasks.find((t) => t.id === active.id)
    setActiveTask(foundTask || null)
  }

  const handleDragOver = (event) => {
    const { over } = event
    if (!over) {
      setOverColumnId(null)
      return
    }

    // Direct column hover
    if (['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'].includes(over.id)) {
      setOverColumnId(over.id)
      return
    }

    // Task card hover -> determine which column that card belongs to
    const overTask = tasks.find((t) => t.id === over.id)
    if (overTask) {
      setOverColumnId(overTask.status || 'NOT_STARTED')
    }
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveTask(null)
    setOverColumnId(null)

    if (!over) return

    const activeTaskId = active.id
    const currentTask = tasks.find((t) => t.id === activeTaskId)
    if (!currentTask) return

    let targetColumn = null
    if (['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'].includes(over.id)) {
      targetColumn = over.id
    } else {
      const overTask = tasks.find((t) => t.id === over.id)
      if (overTask) {
        targetColumn = overTask.status || 'NOT_STARTED'
      }
    }

    if (targetColumn && targetColumn !== (currentTask.status || 'NOT_STARTED')) {
      if (onMoveStatus) {
        onMoveStatus(activeTaskId, targetColumn)
      }
    }
  }

  const handleDragCancel = () => {
    setActiveTask(null)
    setOverColumnId(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 items-start">
        {COLUMNS.map((col) => {
          const colTasks = columnData[col.id] || []
          const currentSort = columnSorts[col.id] || 'priority'

          return (
            <DroppableColumn
              key={col.id}
              col={col}
              colTasks={colTasks}
              skills={skills}
              getSkillById={getSkillById}
              currentSort={currentSort}
              onSortChange={setColumnSort}
              searchQuery={searchQuery}
              onClearSearch={onClearSearch}
              onToggleTask={onToggleTask}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              onMoveStatus={onMoveStatus}
              onSetPriority={onSetPriority}
              onAssignSkill={onAssignSkill}
              onOpenNewTaskModal={onOpenNewTaskModal}
              isOverTarget={overColumnId === col.id}
            />
          )
        })}
      </div>

      {/* Drag Overlay Floating Card Preview */}
      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeTask ? (
          <div className="rotate-2 scale-105 shadow-2xl rounded-2xl ring-2 ring-violet-500/50 cursor-grabbing opacity-95">
            <TaskCard
              task={activeTask}
              skillName={getSkillById && activeTask.skillId ? getSkillById(activeTask.skillId)?.name : null}
              skills={skills}
              isOverlay
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export default TaskColumnBoard
