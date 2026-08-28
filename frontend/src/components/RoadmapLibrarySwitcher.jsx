import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Compass,
  Sparkles,
  Zap,
  Plus,
  CheckCircle2,
  Trash2,
  ChevronDown,
  Layers,
  Clock,
  TrendingUp,
} from 'lucide-react'

export const RoadmapLibrarySwitcher = ({
  roadmaps = [],
  activeRoadmapId,
  onSwitchRoadmap,
  onDeleteRoadmap,
  loading = false,
}) => {
  const navigate = useNavigate()
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  if (!roadmaps || roadmaps.length === 0) return null

  return (
    <div className="bg-white dark:bg-card rounded-2xl border border-border dark:border-border p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-foreground dark:text-foreground">
                My Learning Roadmaps
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 border border-orange-500/20/60 dark:border-violet-800/40">
                {roadmaps.length} {roadmaps.length === 1 ? 'Path' : 'Paths'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground">
              Select any saved learning path to focus your dashboard progress.
            </p>
          </div>
        </div>

        {/* Add new path dropdown button */}
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-900 dark:bg-white text-white dark:text-foreground rounded-lg hover:bg-gray-800 dark:hover:bg-secondary transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Roadmap</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showAddMenu ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showAddMenu && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowAddMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-border dark:border-border p-1.5 z-30 space-y-1"
                >
                  <button
                    onClick={() => {
                      setShowAddMenu(false)
                      navigate('/recommend')
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground/90 dark:text-gray-200 hover:bg-secondary dark:hover:bg-zinc-800 rounded-lg transition-colors text-left"
                  >
                    <Sparkles className="w-4 h-4 text-orange-500" />
                    <div>
                      <div className="font-semibold text-foreground dark:text-white">AI Path Recommender</div>
                      <div className="text-[10px] text-muted-foreground">Conversational AI goal mapping</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowAddMenu(false)
                      navigate('/skill-gap')
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground/90 dark:text-gray-200 hover:bg-secondary dark:hover:bg-zinc-800 rounded-lg transition-colors text-left"
                  >
                    <Zap className="w-4 h-4 text-amber-500" />
                    <div>
                      <div className="font-semibold text-foreground dark:text-white">Skill Gap Analyzer</div>
                      <div className="text-[10px] text-muted-foreground">Resume & JD benchmark roadmap</div>
                    </div>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Roadmaps Carousel / Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
        {roadmaps.map((rm) => {
          const rmId = rm.id
          const isActive = rmId === activeRoadmapId || Boolean(rm.is_active)
          const title = rm.title || rm.career_decision?.career || 'Learning Roadmap'
          const phaseCount = rm.learning_roadmap?.roadmap?.length || 0
          const duration = rm.learning_roadmap?.duration_months
            ? `${rm.learning_roadmap.duration_months}mo`
            : rm.career_decision?.time_to_job_ready || '6 weeks'
          const completedPhases = rm.progress?.completed_phases || 0

          return (
            <motion.div
              key={rmId}
              layout
              className={`relative group rounded-xl p-3.5 border transition-all cursor-pointer ${
                isActive
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-foreground border-gray-900 dark:border-white shadow-md'
                  : 'bg-secondary/40 dark:bg-accent/40 text-foreground dark:text-gray-200 border-border dark:border-border hover:border-border dark:hover:border-zinc-600 hover:bg-secondary/70'
              }`}
              onClick={() => {
                if (!isActive && onSwitchRoadmap) {
                  onSwitchRoadmap(rmId)
                }
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 dark:text-emerald-700 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 dark:text-emerald-600" />
                        Active Focus
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-muted-foreground dark:text-muted-foreground">
                        Saved Roadmap
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold truncate leading-tight">
                    {title}
                  </h4>

                  <div className="flex items-center gap-2 mt-2 text-[11px] opacity-80">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {phaseCount} phases
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {duration}
                    </span>
                    {completedPhases > 0 && (
                      <>
                        <span>•</span>
                        <span className="font-semibold text-emerald-400 dark:text-emerald-600">
                          {completedPhases}/{phaseCount} done
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {roadmaps.length > 1 && (
                    <button
                      title="Delete this roadmap"
                      onClick={() => {
                        if (confirmDeleteId === rmId) {
                          onDeleteRoadmap(rmId)
                          setConfirmDeleteId(null)
                        } else {
                          setConfirmDeleteId(rmId)
                          setTimeout(() => setConfirmDeleteId(null), 4000)
                        }
                      }}
                      className={`p-1.5 rounded-lg text-xs transition-colors ${
                        confirmDeleteId === rmId
                          ? 'bg-rose-600 text-white'
                          : isActive
                          ? 'text-muted-foreground hover:text-rose-400 hover:bg-white/10'
                          : 'text-muted-foreground hover:text-rose-600 hover:bg-gray-200 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {confirmDeleteId === rmId && (
                        <span className="text-[10px] ml-1 font-semibold">Confirm?</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default RoadmapLibrarySwitcher
