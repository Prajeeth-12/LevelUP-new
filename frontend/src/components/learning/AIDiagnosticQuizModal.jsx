import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Award, CheckCircle2, XCircle, HelpCircle, Loader2, Sparkles, ArrowRight } from 'lucide-react'
import { generateDiagnosticQuiz } from '../../services/recommenderService'

export const AIDiagnosticQuizModal = ({ isOpen, onClose, skillName }) => {
  const [loading, setLoading] = useState(false)
  const [quiz, setQuiz] = useState(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedOpt, setSelectedOpt] = useState(null)
  const [answers, setAnswers] = useState({})
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    if (isOpen && skillName) {
      setLoading(true)
      setCurrentIdx(0)
      setSelectedOpt(null)
      setAnswers({})
      setShowResult(false)
      generateDiagnosticQuiz(skillName)
        .then((res) => {
          if (res?.quiz) setQuiz(res.quiz)
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [isOpen, skillName])

  if (!isOpen) return null

  const questions = quiz?.questions || []
  const currentQ = questions[currentIdx]

  const handleSelect = (optIdx) => {
    if (answers[currentIdx] !== undefined) return
    setSelectedOpt(optIdx)
    const isCorrect = optIdx === currentQ.correct_index
    setAnswers({ ...answers, [currentIdx]: { selected: optIdx, isCorrect } })
  }

  const handleNext = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1)
      setSelectedOpt(null)
    } else {
      setShowResult(true)
    }
  }

  const score = Object.values(answers).filter((a) => a.isCorrect).length
  const total = questions.length
  const pct = total > 0 ? Math.round((score / total) * 100) : 0

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
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  AI Skill Diagnostic
                </span>
                <h3 className="text-lg font-bold text-foreground leading-tight">
                  {skillName} Benchmark
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
          <div className="py-4 max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-sm text-muted-foreground">Generating technical assessment questions...</p>
              </div>
            ) : showResult ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-foreground">Diagnostic Complete!</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your verified readiness score for {skillName}:
                  </p>
                  <div className="text-3xl font-black text-foreground mt-2">{pct}%</div>
                  <span className="inline-block mt-2 px-3 py-1 bg-accent rounded-full text-xs font-semibold text-foreground">
                    {pct >= 75 ? '?? Advanced Mastery' : pct >= 50 ? '? Intermediate Readiness' : '?? Foundational Learner'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  This assessment has been factored into your personalized learning trajectory and recommended milestone sequence.
                </p>
                <div className="pt-4 flex justify-center">
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 bg-foreground text-background rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
                  >
                    Return to Learning Path
                  </button>
                </div>
              </div>
            ) : currentQ ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Question {currentIdx + 1} of {total}</span>
                  <span className="font-semibold text-foreground">{quiz?.difficulty || 'Intermediate'}</span>
                </div>

                <div className="p-4 rounded-xl bg-accent/30 border border-border">
                  <p className="text-sm font-semibold text-foreground leading-snug">
                    {currentQ.question}
                  </p>
                </div>

                <div className="space-y-2">
                  {currentQ.options.map((opt, oIdx) => {
                    const isAnswered = answers[currentIdx] !== undefined
                    const isPicked = selectedOpt === oIdx || answers[currentIdx]?.selected === oIdx
                    const isCorrect = oIdx === currentQ.correct_index

                    let btnCls = 'bg-card hover:bg-accent border-border text-foreground/90'
                    if (isAnswered) {
                      if (isCorrect) btnCls = 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                      else if (isPicked) btnCls = 'bg-red-500/10 border-red-500/40 text-red-700 dark:text-red-300'
                      else btnCls = 'opacity-50 border-border'
                    }

                    return (
                      <button
                        key={oIdx}
                        disabled={isAnswered}
                        onClick={() => handleSelect(oIdx)}
                        className={`w-full p-3 rounded-xl border text-xs text-left transition-all flex items-start gap-2.5 ${btnCls}`}
                      >
                        <span className="w-5 h-5 rounded-md bg-accent flex items-center justify-center font-bold shrink-0 text-[10px]">
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span className="flex-1 mt-0.5">{opt}</span>
                        {isAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                        {isAnswered && isPicked && !isCorrect && <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                      </button>
                    )
                  })}
                </div>

                {answers[currentIdx] !== undefined && (
                  <div className="p-3 rounded-xl bg-accent/40 border border-border text-xs space-y-1">
                    <span className="font-bold text-foreground block">Explanation:</span>
                    <p className="text-muted-foreground leading-relaxed">{currentQ.explanation}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-xs text-muted-foreground py-8">No questions loaded.</p>
            )}
          </div>

          {/* Footer */}
          {!showResult && (
            <div className="pt-3 border-t border-border/50 flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Answer to test mastery</span>
              {answers[currentIdx] !== undefined && (
                <button
                  onClick={handleNext}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-foreground text-background hover:opacity-90 transition-opacity flex items-center gap-1.5"
                >
                  <span>{currentIdx + 1 < total ? 'Next Question' : 'View Results'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
export default AIDiagnosticQuizModal
