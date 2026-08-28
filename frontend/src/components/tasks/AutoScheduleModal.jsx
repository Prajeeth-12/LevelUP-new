import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, X, CheckCircle2, ArrowRight, Clock, AlertCircle,
  Loader2, Check, Sliders, Calendar, ShieldCheck, Zap
} from 'lucide-react'
import { autoOrganizeTasks } from '../../services/aiService'

export const AutoScheduleModal = ({ isOpen, onClose, tasks, onApplySchedule }) => {
  const [hoursBudget, setHoursBudget] = useState(12)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [plan, setPlan] = useState(null)
  const [selectedMoves, setSelectedMoves] = useState({})
  const [applied, setApplied] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    setPlan(null)
    setApplied(false)

    try {
      const data = await autoOrganizeTasks({
        tasks: tasks.map(t => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          deadline: t.deadline
        })),
        hoursBudget
      })

      setPlan(data)
      // By default, pre-select all moves
      const initialSelection = {}
      ;(data.moves || []).forEach((m, idx) => {
        initialSelection[m.taskId || idx] = true
      })
      setSelectedMoves(initialSelection)
    } catch (err) {
      console.error('Auto-schedule failed:', err)
      setError(err.response?.data?.detail || err.message || 'Failed to generate schedule.')
    } finally {
      setLoading(false)
    }
  }

  const toggleMove = (id) => {
    setSelectedMoves(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const handleApply = async () => {
    if (!plan || !plan.moves) return
    const approvedMoves = plan.moves.filter((m, idx) => selectedMoves[m.taskId || idx])
    await onApplySchedule(approvedMoves)
    setApplied(true)
    setTimeout(() => {
      onClose()
      setPlan(null)
      setApplied(false)
    }, 1200)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Modal Card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="relative w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-border/80 flex items-center justify-between shrink-0 bg-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground font-serif italic">
                  AI Kanban Auto-Scheduler
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20">
                  Sprint Optimizer
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Reorganize your 3 boards into balanced daily sprints to prevent burnout.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Bandwidth Setting */}
          {!plan && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-secondary/40 border border-border space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    Target Weekly Study Budget
                  </span>
                  <span className="font-mono text-sm text-orange-600 dark:text-orange-400">{hoursBudget} hrs/week</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={40}
                  step={2}
                  value={hoursBudget}
                  onChange={(e) => setHoursBudget(Number(e.target.value))}
                  className="w-full accent-orange-600 h-2 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>4h (Casual)</span>
                  <span>12h (Balanced)</span>
                  <span>40h (Bootcamp)</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/20 text-xs text-muted-foreground space-y-1.5">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-orange-500" />
                  How Auto-Scheduler works:
                </div>
                <p>
                  1. Examines all <strong>{tasks.length} tasks</strong> across your To Do, Current, and Past boards.
                </p>
                <p>
                  2. Selects the highest leverage tasks for today's active sprint (~2-4h daily).
                </p>
                <p>
                  3. <strong>Requires your human approval</strong> before applying any changes to your database.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {/* Generated Plan with Human Review Checkboxes */}
          {plan && (
            <div className="space-y-4">
              {/* Rationale Card */}
              <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <ShieldCheck className="w-4 h-4 text-orange-500" />
                    <span>AI Sprint Strategy</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
                    ~{plan.todaySprintHours || 4}h Today Focus
                  </span>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed font-sans">
                  {plan.rationale}
                </p>
              </div>

              {/* Proposed Actions List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-foreground px-1">
                  <span>Proposed Board Adjustments ({plan.moves?.length || 0})</span>
                  <span className="text-[11px] text-muted-foreground font-normal">Select items to approve</span>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {plan.moves?.map((m, idx) => {
                    const id = m.taskId || idx
                    const isChecked = !!selectedMoves[id]
                    const statusLabel = m.targetStatus === 'IN_PROGRESS'
                      ? 'Current (Today)'
                      : m.targetStatus === 'COMPLETED'
                        ? 'Past (Done)'
                        : 'To Do (Backlog)'
                    const statusBadgeColor = m.targetStatus === 'IN_PROGRESS'
                      ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20'
                      : m.targetStatus === 'COMPLETED'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-secondary text-muted-foreground border-border'

                    return (
                      <div
                        key={id}
                        onClick={() => toggleMove(id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isChecked
                            ? 'bg-card border-orange-500/40 ring-1 ring-orange-500/20'
                            : 'bg-secondary/30 border-border opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                            isChecked ? 'bg-orange-600 border-orange-600 text-white' : 'border-border bg-card'
                          }`}>
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-foreground truncate">
                              {m.taskTitle}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                              {m.reason}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadgeColor}`}>
                            {statusLabel}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {m.priority}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-border/80 bg-card flex items-center justify-between shrink-0">
          {!plan ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || tasks.length === 0}
                className="px-6 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing Board...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Optimized Schedule</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setPlan(null)}
                className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                ← Back to Budget
              </button>

              <button
                type="button"
                onClick={handleApply}
                disabled={applied || Object.values(selectedMoves).filter(Boolean).length === 0}
                className="px-6 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {applied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Schedule Applied!</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Approve & Apply ({Object.values(selectedMoves).filter(Boolean).length} tasks)</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
