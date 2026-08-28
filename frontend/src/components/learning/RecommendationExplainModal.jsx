import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Target, CheckCircle2, ArrowRight, BookOpen, ShieldCheck, Zap } from 'lucide-react'

export const RecommendationExplainModal = ({ isOpen, onClose, item, goal, explanation, loading }) => {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-card text-card-foreground rounded-2xl border border-border shadow-2xl overflow-hidden p-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                  AI Explainability
                </span>
                <h3 className="text-lg font-bold text-foreground leading-tight font-serif italic">
                  Why this was recommended
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Target Item Pill */}
            <div className="p-3 rounded-2xl bg-secondary/40 border border-border">
              <span className="text-xs text-muted-foreground block mb-0.5">Recommended Item</span>
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-500 shrink-0" />
                {item?.title || item?.name || 'Selected Milestone'}
              </p>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" />
                <p className="text-sm text-muted-foreground">Synthesizing pedagogical rationale...</p>
              </div>
            ) : explanation ? (
              <div className="space-y-4">
                {/* Match Score */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="text-sm font-semibold">Relevance & Match Score</span>
                  </div>
                  <span className="text-lg font-mono font-extrabold">{explanation.relevance_score || 94}%</span>
                </div>

                {/* Why Recommended */}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Core Rationale
                  </h4>
                  <p className="text-sm text-foreground/90 leading-relaxed bg-secondary/20 p-3 rounded-2xl border border-border/50">
                    {explanation.why_recommended}
                  </p>
                </div>

                {/* Skill Gap Closure */}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                    Skill Gap Closed
                  </h4>
                  <p className="text-sm text-foreground/90 leading-relaxed bg-secondary/20 p-3 rounded-2xl border border-border/50">
                    {explanation.skill_gap_closure}
                  </p>
                </div>

                {/* Prerequisite Check */}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-orange-500" />
                    Prerequisites & Readiness
                  </h4>
                  <p className="text-sm text-foreground/90 leading-relaxed bg-secondary/20 p-3 rounded-2xl border border-border/50">
                    {explanation.prerequisite_check}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No explanation data available.</p>
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-border/50 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-foreground text-background hover:opacity-90 transition-opacity"
            >
              Got it
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
export default RecommendationExplainModal
