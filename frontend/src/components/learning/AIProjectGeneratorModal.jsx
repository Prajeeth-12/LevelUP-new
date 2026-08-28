import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Code2, Sparkles, Copy, Check, Terminal, Layers, CheckCircle2, Loader2, ArrowRight } from 'lucide-react'
import { generateProjectSpec } from '../../services/recommenderService'

export const AIProjectGeneratorModal = ({ isOpen, onClose, milestone, domain }) => {
  const [loading, setLoading] = useState(false)
  const [spec, setSpec] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isOpen && milestone) {
      setLoading(true)
      setCopied(false)
      generateProjectSpec({
        domain: domain || 'Modern Fullstack AI',
        milestone_title: milestone.title,
        skills: milestone.skills || [],
        experience_level: 'Intermediate',
      })
        .then((res) => {
          if (res?.project) setSpec(res.project)
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [isOpen, milestone, domain])

  if (!isOpen) return null

  const handleCopy = () => {
    if (spec?.starter_boilerplate_code) {
      navigator.clipboard.writeText(spec.starter_boilerplate_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-card text-card-foreground rounded-2xl border border-border shadow-2xl overflow-hidden p-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-500/20">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                  AI Project Architect
                </span>
                <h3 className="text-lg font-bold text-foreground leading-tight">
                  {spec?.project_title || 'Project Blueprint & Starter Code'}
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
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                <p className="text-sm text-muted-foreground">Architecting production project blueprint & starter code...</p>
              </div>
            ) : spec ? (
              <div className="space-y-4">
                {/* Tagline & Hours */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <p className="text-xs font-medium text-orange-800 dark:text-orange-300">
                    {spec.tagline}
                  </p>
                  <span className="text-xs font-bold bg-card px-2.5 py-1 rounded-lg border border-border shrink-0">
                    Est. {spec.estimated_hours} Hours
                  </span>
                </div>

                {/* Architecture Overview */}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                    Architecture Overview
                  </h4>
                  <p className="text-xs text-foreground leading-relaxed bg-accent/20 p-3 rounded-xl border border-border/50">
                    {spec.architecture_overview}
                  </p>
                </div>

                {/* Key Features & Tech Stack */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-accent/20 border border-border/50 space-y-2">
                    <h5 className="text-xs font-bold text-foreground">Key Deliverables:</h5>
                    <ul className="space-y-1.5">
                      {spec.key_features?.map((f, i) => (
                        <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-xl bg-accent/20 border border-border/50 space-y-2">
                    <h5 className="text-xs font-bold text-foreground">Tech Stack:</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {spec.tech_stack?.map((t, i) => (
                        <span key={i} className="text-[11px] font-medium bg-card px-2.5 py-1 rounded-lg border border-border text-foreground">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Boilerplate Code */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-purple-500" />
                      Starter Boilerplate Template
                    </h4>
                    <button
                      onClick={handleCopy}
                      className="px-2.5 py-1 rounded-lg bg-card hover:bg-accent border border-border text-[11px] font-semibold text-foreground flex items-center gap-1 transition-colors"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                    </button>
                  </div>
                  <pre className="p-3.5 rounded-xl bg-gray-950 text-gray-100 font-mono text-[11px] overflow-x-auto border border-gray-800 leading-relaxed">
                    {spec.starter_boilerplate_code}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="text-center text-xs text-muted-foreground py-8">No spec available.</p>
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-border/50 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-foreground text-background hover:opacity-90 transition-opacity"
            >
              Close Spec
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
export default AIProjectGeneratorModal
