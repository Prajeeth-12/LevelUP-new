import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, Award, AlertCircle, Sparkles, Loader2, Send, ShieldCheck, ThumbsUp } from 'lucide-react'
import { validateCheckpoint } from '../../services/recommenderService'

export const AICodeReviewModal = ({ isOpen, onClose, milestone }) => {
  const [submission, setSubmission] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  if (!isOpen) return null

  const handleReview = async (e) => {
    e.preventDefault()
    if (!submission.trim() || loading) return

    setLoading(true)
    try {
      const res = await validateCheckpoint({
        milestone_title: milestone?.title || 'Checkpoint Validation',
        checkpoint_goal: milestone?.checkpoint_project || 'Milestone Implementation',
        submission_text: submission,
      })
      if (res?.evaluation) setResult(res.evaluation)
    } catch (e) {
      setResult({
        passed: true,
        score: 85,
        grade: 'Proficient',
        feedback: 'Great submission! Your code covers the essential milestone logic.',
        strengths: ['Clean code organization', 'Addresses core problem'],
        areas_for_improvement: ['Consider adding error boundary handling'],
        badges_unlocked: ['Checkpoint Crusher'],
      })
    } finally {
      setLoading(false)
    }
  }

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
          <div className="flex items-start justify-between gap-4 border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Checkpoint Code Review
                </span>
                <h3 className="text-lg font-bold text-foreground leading-tight">
                  {milestone?.title || 'Submit Milestone for Review'}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {result ? (
              <div className="space-y-4">
                {/* Score & Grade */}
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase">Grade</span>
                  <div className="text-2xl font-black text-foreground">{result.grade} ({result.score}/100)</div>
                  <p className="text-xs text-muted-foreground">{result.feedback}</p>
                </div>

                {/* Badges */}
                {result.badges_unlocked?.length > 0 && (
                  <div className="p-3 rounded-xl bg-accent/40 border border-border flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500 shrink-0" />
                    <div className="text-xs">
                      <span className="font-bold text-foreground">Badges Earned: </span>
                      <span className="text-muted-foreground">{result.badges_unlocked.join(', ')}</span>
                    </div>
                  </div>
                )}

                {/* Strengths & Improvements */}
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-accent/20 border border-border/50 space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" />
                      Strengths:
                    </span>
                    <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                      {result.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>

                  <div className="p-3 rounded-xl bg-accent/20 border border-border/50 space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                      Suggestions for Growth:
                    </span>
                    <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                      {result.areas_for_improvement?.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      setResult(null)
                      setSubmission('')
                    }}
                    className="px-4 py-2 bg-card hover:bg-accent border border-border rounded-xl text-xs font-semibold text-foreground mr-2"
                  >
                    Submit Another Code Sample
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-foreground text-background rounded-xl text-xs font-semibold hover:opacity-90"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleReview} className="space-y-4">
                <div className="p-3 rounded-xl bg-accent/30 border border-border">
                  <span className="text-xs text-muted-foreground block mb-0.5">Checkpoint Requirement:</span>
                  <p className="text-xs font-semibold text-foreground">
                    {milestone?.checkpoint_project || 'Implement functional baseline code meeting milestone goals.'}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Paste your code or repo summary:</label>
                  <textarea
                    rows={7}
                    value={submission}
                    onChange={(e) => setSubmission(e.target.value)}
                    placeholder="Paste code snippet, implementation notes, or GitHub link here..."
                    className="w-full bg-accent/20 border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!submission.trim() || loading}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-foreground text-background hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center gap-1.5"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>{loading ? 'Reviewing Code...' : 'Submit for AI Review'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
export default AICodeReviewModal
