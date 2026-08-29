import React, { useState } from 'react'
import { FastForward, ArrowDownCircle, Check } from 'lucide-react'

export const AdaptiveRoadmapControls = ({ milestone, onAdapt, isCompleted }) => {
  const [loadingAction, setLoadingAction] = useState(null)

  const handleAction = async (actionType) => {
    setLoadingAction(actionType)
    try {
      await onAdapt(actionType, milestone.id)
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/40">
      <button
        onClick={() => handleAction('already_known')}
        disabled={loadingAction !== null}
        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors flex items-center gap-1 ${
          isCompleted
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
            : 'bg-card hover:bg-accent border-border text-muted-foreground hover:text-foreground'
        }`}
        title="Mark this milestone as previously mastered"
      >
        <Check className="w-3 h-3 text-emerald-500" />
        {isCompleted ? 'Completed' : 'Already Know This'}
      </button>

      <button
        onClick={() => handleAction('too_hard')}
        disabled={loadingAction !== null}
        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-card hover:bg-accent border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        title="Inject prerequisite foundation mini-lessons"
      >
        <ArrowDownCircle className="w-3 h-3 text-amber-500" />
        Need Foundations
      </button>

      <button
        onClick={() => handleAction('accelerate')}
        disabled={loadingAction !== null}
        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-card hover:bg-accent border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        title="Accelerate timeline and jump straight to advanced capstones"
      >
        <FastForward className="w-3 h-3 text-orange-500" />
        Accelerate
      </button>
    </div>
  )
}
export default AdaptiveRoadmapControls
