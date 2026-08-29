import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { auth } from '../firebase'
import { AppShell } from '../components/layout/AppShell'
import { useSkills } from '../contexts/SkillContext'
import { useRoadmap } from '../contexts/RoadmapContext'
import { useTasks } from '../contexts/TaskContext'
import {
  Upload, FileText, Briefcase, Clock, Zap, CheckCircle2,
  XCircle, Target, BookOpen, ChevronDown, ChevronUp,
  AlertCircle, Loader2, ExternalLink, Play, BookMarked, Code2,
  Box, Layers, Cloud, Brain, Cpu, Monitor, Server,
  Smartphone, GitBranch, Map, ArrowRight, Compass, Sparkles, X, Check
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || ''

// ── Role & Tool Presets ───────────────────────────────────────────────────────
const ROLES = [
  { title: 'Frontend Engineer',  icon: Monitor,    jdKey: 'frontend developer' },
  { title: 'Backend Engineer',   icon: Server,     jdKey: 'backend developer' },
  { title: 'Full-Stack Engineer',icon: Layers,     jdKey: 'full stack developer' },
  { title: 'AI / ML Engineer',   icon: Brain,      jdKey: 'machine learning engineer' },
  { title: 'DevOps / Cloud',     icon: GitBranch,  jdKey: 'devops engineer' },
  { title: 'Mobile Developer',   icon: Smartphone, jdKey: 'mobile developer' },
]

const TOOLS = [
  { title: 'React & Next.js',   icon: Code2,   jdKey: 'react developer' },
  { title: 'Python & FastAPI',  icon: Cpu,     jdKey: 'python developer' },
  { title: 'Docker & K8s',      icon: Box,     jdKey: 'docker kubernetes' },
  { title: 'AWS Cloud Stack',   icon: Cloud,   jdKey: 'aws cloud engineer' },
  { title: 'PostgreSQL & SQL',  icon: Server,  jdKey: 'postgresql database' },
  { title: 'LLMs & AI Agents',  icon: Brain,   jdKey: 'ai agent engineer' },
]

const SAMPLE_JD = `Senior Full-Stack AI Engineer
We are seeking an engineer experienced in React, TypeScript, Python, FastAPI, and Cloud infrastructure. 
Key Requirements:
- 3+ years experience with React 18+, modern state management, and Tailwind CSS.
- Strong backend experience with Python, FastAPI, asynchronous programming, and REST APIs.
- Experience with Cloud Architecture (Docker, Kubernetes, AWS/GCP).
- Knowledge of Vector Databases, LangChain, or LLM application engineering is a strong plus.`

// ── Resource Metadata ────────────────────────────────────────────────────────
const RESOURCE_META = {
  docs:    { label: 'Docs',    icon: BookMarked, color: 'text-blue-500' },
  course:  { label: 'Course',  icon: BookOpen,   color: 'text-orange-500' },
  video:   { label: 'Video',   icon: Play,       color: 'text-red-500' },
  article: { label: 'Article', icon: FileText,   color: 'text-emerald-500' },
  project: { label: 'Project', icon: Code2,      color: 'text-amber-500' },
}

// ── Phase Roadmap Card ────────────────────────────────────────────────────────
const PhaseCard = ({ phase, index }) => {
  const [open, setOpen] = useState(index === 0)
  const [expandedSkill, setExpandedSkill] = useState(null)
  const skillDetails = phase.skill_details || []

  return (
    <div className="card-surface overflow-hidden transition-all duration-200 hover:border-orange-500/30">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left transition-colors hover:bg-secondary/30"
      >
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 font-mono font-bold text-xs flex items-center justify-center border border-orange-500/20 shrink-0">
            0{index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-sm text-foreground truncate">{phase.phase}</h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary font-semibold text-muted-foreground border border-border">
                {phase.timeline}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 font-mono">
              <span>{phase.estimated_hours}h estimated</span>
              <span>•</span>
              <span>{phase.skills?.length || 0} skills</span>
            </div>
          </div>
        </div>
        <div className="p-1 rounded-lg text-muted-foreground">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border/60"
          >
            <div className="p-4 sm:p-5 space-y-3 bg-secondary/10">
              {skillDetails.length > 0 ? (
                skillDetails.map((sd, si) => {
                  const isExp = expandedSkill === si
                  return (
                    <div key={sd.name || si} className="rounded-2xl border border-border bg-card overflow-hidden">
                      <button
                        onClick={() => setExpandedSkill(isExp ? null : si)}
                        className="w-full flex items-center justify-between p-3.5 text-left hover:bg-secondary/40 transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xs font-bold text-foreground capitalize truncate">{sd.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20 shrink-0">
                            {sd.category || 'Skill'}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground shrink-0">~{sd.hours}h</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-semibold shrink-0 ml-2">
                          {sd.resources?.length || 0} resources
                        </span>
                      </button>

                      {isExp && sd.resources?.length > 0 && (
                        <div className="px-3.5 pb-3.5 pt-2 border-t border-border/40 space-y-2">
                          {sd.resources.map((res, ri) => {
                            const meta = RESOURCE_META[res.type] || RESOURCE_META.article
                            const Icon = meta.icon
                            return (
                              <a
                                key={ri}
                                href={res.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-secondary/30 hover:bg-secondary/60 transition-all text-xs group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <Icon className={`w-3.5 h-3.5 shrink-0 ${meta.color}`} />
                                  <span className="font-semibold text-foreground truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                    {res.title}
                                  </span>
                                </div>
                                <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-foreground shrink-0" />
                              </a>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {phase.skills.map((s, si) => (
                    <span key={si} className="text-xs px-3 py-1 rounded-full bg-card border border-border text-foreground font-semibold">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main SkillGapAnalyzer Component ───────────────────────────────────────────
const SkillGapAnalyzer = () => {
  const navigate = useNavigate()
  const { createSkill, refreshSkills } = useSkills()
  const { createTask, refreshTasks } = useTasks()
  const { refreshRoadmap } = useRoadmap()

  const [file, setFile] = useState(null)
  const [jdMode, setJdMode] = useState('custom') // 'custom' | 'role' | 'tool'
  const [jdText, setJdText] = useState('')
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [hoursPerWeek, setHoursPerWeek] = useState(12)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [adoptLoading, setAdoptLoading] = useState(false)
  const [adoptDone, setAdoptDone] = useState(false)

  const handleFile = (f) => {
    if (!f) return
    const valid = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(f.type) ||
      f.name.match(/\.(pdf|docx|txt)$/i)
    if (!valid) {
      setError('Please upload a valid PDF, DOCX, or TXT resume file.')
      return
    }
    setFile(f)
    setError('')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  const activeJdText = jdMode === 'custom' ? jdText : (selectedPreset || '')

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please upload your resume first.')
      return
    }
    if (!activeJdText.trim()) {
      setError(jdMode === 'custom' ? 'Please paste a Job Description.' : 'Please choose a target role or stack preset.')
      return
    }

    const currentUser = auth.currentUser
    if (!currentUser) {
      setError('Please sign in to run the AI Job Description Tutor.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)
    setAdoptDone(false)

    try {
      const token = await currentUser.getIdToken(true)
      const form = new FormData()
      form.append('resume_file', file)
      form.append('jd_text', activeJdText)
      form.append('hours_per_week', hoursPerWeek)

      const { data } = await axios.post(`${API_URL}/api/v1/analyze-gap`, form, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setResult(data)
    } catch (err) {
      if (err.response?.status === 401) {
        try {
          const retryToken = await auth.currentUser?.getIdToken?.(true)
          if (retryToken) {
            const retryForm = new FormData()
            retryForm.append('resume_file', file)
            retryForm.append('jd_text', activeJdText)
            retryForm.append('hours_per_week', hoursPerWeek)

            const { data } = await axios.post(`${API_URL}/api/v1/analyze-gap`, retryForm, {
              headers: { Authorization: `Bearer ${retryToken}` }
            })
            setResult(data)
            return
          }
        } catch (retryErr) {
          err = retryErr
        }
      }
      setError(err.response?.data?.detail || err.response?.data?.message || err.message || 'Analysis failed. Please ensure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const handleAdoptRoadmap = async () => {
    if (!result) return
    setAdoptLoading(true)
    setError('')

    try {
      const currentUser = auth.currentUser
      const fallbackUserId = `user_${Date.now()}`
      const effectiveUserId = currentUser?.uid || fallbackUserId
      const title = activeJdText
        ? activeJdText.charAt(0).toUpperCase() + activeJdText.slice(1) + ' Roadmap'
        : 'Skill Gap Roadmap'

      // 1. Post to backend
      await axios.post(`${API_URL}/api/v1/adopt-roadmap`, {
        gap_analysis: result,
        roadmap_title: title,
        user_id: effectiveUserId,
      })

      // 2. Add missing skills to local context
      const missingSkills = result.missing_skills || []
      for (const skillName of missingSkills.slice(0, 8)) {
        try {
          await createSkill({
            name: skillName,
            category: 'Skill Gap',
            priority: 'HIGH',
            status: 'NOT_STARTED',
            progress: 0,
            description: `Target skill required for: ${title}`,
            subskills: [],
          })
        } catch (e) {
          console.warn('Skipped skill:', e.message)
        }
      }

      // 3. Create initial tasks
      const firstPhase = result.learning_velocity?.roadmap?.[0]
      if (firstPhase) {
        const items = firstPhase.skill_details || []
        for (const item of items.slice(0, 3)) {
          if (item.name) {
            await createTask({
              title: `Master: ${item.name}`,
              notes: `Phase 1 Objective: ${item.name}`,
              priority: 'HIGH',
              status: 'NOT_STARTED',
              deadline: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
            })
          }
        }
      }

      if (refreshRoadmap) await refreshRoadmap()
      if (refreshSkills) await refreshSkills()
      if (refreshTasks) await refreshTasks()

      setAdoptDone(true)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to adopt roadmap.')
    } finally {
      setAdoptLoading(false)
    }
  }

  return (
    <AppShell>
      <div className="page-container space-y-8 animate-fade-slide-in max-w-5xl">
        
        {/* Header */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold tracking-[0.24em] uppercase text-muted-foreground">
            AI TUTOR • JD & RESUME MATCH
          </p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Match your resume to any <span className="font-serif italic font-normal text-orange-600 dark:text-orange-400">job description</span>.
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Upload your resume to discover verified proficiencies, identify missing gaps, and generate a step-by-step learning tutor plan.
          </p>
        </div>

        {/* ── 2-Step Intake Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Step 1: Resume Upload Box */}
          <div className="lg:col-span-5 card-surface p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-5 h-5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-mono text-[11px] font-bold flex items-center justify-center">
                  1
                </span>
                <h3 className="font-bold text-sm text-foreground">Upload Resume</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Attach your latest CV in PDF, DOCX, or TXT.
              </p>

              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('resume-file-input').click()}
                className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                  dragOver
                    ? 'border-orange-500 bg-orange-500/5'
                    : file
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : 'border-border hover:border-orange-500/40 hover:bg-secondary/40'
                }`}
              >
                <input
                  id="resume-file-input"
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])}
                />

                {file ? (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-foreground truncate max-w-[200px]">
                      {file.name}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null) }}
                      className="text-[11px] font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 mt-1"
                    >
                      <X className="w-3 h-3" /> Remove & re-upload
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-foreground">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-foreground">
                      Click to choose file <span className="font-normal text-muted-foreground">or drag & drop</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      PDF, DOCX, TXT • Max 10MB
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Study hours budget */}
            <div className="pt-3 border-t border-border/60">
              <div className="flex items-center justify-between text-xs font-bold text-foreground mb-2">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-orange-500" /> Study Bandwidth
                </span>
                <span className="font-mono text-orange-600 dark:text-orange-400">{hoursPerWeek} hrs/week</span>
              </div>
              <input
                type="range"
                min={4}
                max={40}
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                className="w-full accent-orange-600 h-1.5 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>4h casual</span>
                <span>15h balanced</span>
                <span>40h bootcamp</span>
              </div>
            </div>
          </div>

          {/* Step 2: Target Criteria Box */}
          <div className="lg:col-span-7 card-surface p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-mono text-[11px] font-bold flex items-center justify-center">
                    2
                  </span>
                  <h3 className="font-bold text-sm text-foreground">Target Role or Criteria</h3>
                </div>

                {jdMode === 'custom' && (
                  <button
                    type="button"
                    onClick={() => setJdText(SAMPLE_JD)}
                    className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Load Sample JD
                  </button>
                )}
              </div>

              {/* Mode Pills */}
              <div className="flex items-center gap-1.5 p-1 bg-secondary/80 rounded-2xl border border-border mb-4">
                {[
                  { key: 'custom', label: 'Custom JD', icon: FileText },
                  { key: 'role',   label: 'By Role',   icon: Briefcase },
                  { key: 'tool',   label: 'By Stack',  icon: Zap },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { setJdMode(key); if (key === 'custom') setSelectedPreset(null); setError('') }}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      jdMode === key
                        ? 'bg-card text-foreground border border-border shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              {jdMode === 'custom' && (
                <div>
                  <textarea
                    rows={6}
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    placeholder="Paste full job description, required qualifications, and technical responsibilities here..."
                    className="w-full rounded-2xl border border-border bg-secondary/30 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground p-3.5 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                  />
                </div>
              )}

              {jdMode === 'role' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {ROLES.map((r) => {
                    const Icon = r.icon
                    const isSel = selectedPreset === r.jdKey
                    return (
                      <button
                        key={r.jdKey}
                        type="button"
                        onClick={() => { setSelectedPreset(r.jdKey); setError('') }}
                        className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 ${
                          isSel
                            ? 'bg-orange-500/10 border-orange-500/40 ring-1 ring-orange-500/20'
                            : 'bg-secondary/30 border-border hover:bg-secondary hover:border-orange-500/30'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSel ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'}`} />
                        <span className="text-xs font-bold text-foreground leading-tight">
                          {r.title}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {jdMode === 'tool' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {TOOLS.map((t) => {
                    const Icon = t.icon
                    const isSel = selectedPreset === t.jdKey
                    return (
                      <button
                        key={t.jdKey}
                        type="button"
                        onClick={() => { setSelectedPreset(t.jdKey); setError('') }}
                        className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 ${
                          isSel
                            ? 'bg-orange-500/10 border-orange-500/40 ring-1 ring-orange-500/20'
                            : 'bg-secondary/30 border-border hover:bg-secondary hover:border-orange-500/30'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSel ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'}`} />
                        <span className="text-xs font-bold text-foreground leading-tight">
                          {t.title}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Error banner */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing Match & Gaps...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-white" />
                  <span>Analyze Skill Gap & Tutor Plan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Match Results Section ── */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6 pt-4"
            >
              {/* Match Stat Cycle Bar */}
              <div className="pk-cycle">
                <div className="pk-stat pr-4 sm:pr-6 sm:border-r border-border">
                  <span className="pk-stat-label">MATCH SCORE</span>
                  <div className="pk-stat-val text-orange-600 dark:text-orange-400 font-mono">
                    <span>{Math.round(result.match_percentage)}%</span>
                    <span className="pk-stat-unit">match</span>
                  </div>
                </div>

                <div className="pk-stat pr-4 sm:pr-6 sm:border-r border-border">
                  <span className="pk-stat-label">JOB READINESS</span>
                  <div className="pk-stat-val text-emerald-600 dark:text-emerald-400 font-mono">
                    <span>{Math.round(result.job_readiness_score)}%</span>
                    <span className="pk-stat-unit">score</span>
                  </div>
                </div>

                <div className="pk-stat pr-4 sm:pr-6 sm:border-r border-border">
                  <span className="pk-stat-label">VERIFIED IN RESUME</span>
                  <div className="pk-stat-val text-blue-600 dark:text-blue-400 font-mono">
                    <span>{result.matched_skills?.length || 0}</span>
                    <span className="pk-stat-unit">skills</span>
                  </div>
                </div>

                <div className="pk-stat">
                  <span className="pk-stat-label">GAPS TO MASTER</span>
                  <div className="pk-stat-val text-amber-600 dark:text-amber-400 font-mono">
                    <span>{result.missing_skills?.length || 0}</span>
                    <span className="pk-stat-unit">gaps</span>
                  </div>
                </div>
              </div>

              {/* Verified vs Gaps Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Verified Skills */}
                <div className="card-surface p-5 sm:p-6 space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-border">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <h3 className="font-bold text-sm text-foreground">
                      Verified in Your Resume ({result.matched_skills?.length || 0})
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.matched_skills?.length > 0 ? (
                      result.matched_skills.map((s, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                        >
                          <Check className="w-3 h-3 text-emerald-500" />
                          {s}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No matching skills detected in CV.</p>
                    )}
                  </div>
                </div>

                {/* Missing Skills */}
                <div className="card-surface p-5 sm:p-6 space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-border">
                    <XCircle className="w-5 h-5 text-orange-500" />
                    <h3 className="font-bold text-sm text-foreground">
                      Identified Gaps to Learn ({result.missing_skills?.length || 0})
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.missing_skills?.length > 0 ? (
                      result.missing_skills.map((s, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-500/20"
                        >
                          <Target className="w-3 h-3 text-orange-500" />
                          {s}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                        🎉 Perfect 100% match! You meet all requirements for this JD.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Tutor Structured Learning Roadmap ── */}
              {result.learning_velocity?.roadmap?.length > 0 && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-lg text-foreground font-serif italic">
                        Tailored Tutor Roadmap
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Step-by-step trajectory to close your {result.missing_skills?.length || 0} gaps in ~{result.learning_velocity.weeks_to_readiness || 6} weeks.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-foreground bg-secondary px-3 py-1.5 rounded-xl border border-border">
                        {result.learning_velocity.total_estimated_hours}h total study
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {result.learning_velocity.roadmap.map((phase, idx) => (
                      <PhaseCard key={idx} phase={phase} index={idx} />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Bottom Action Bar ── */}
              <div className="card-surface p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-foreground">
                    {adoptDone ? '✨ Roadmap Saved to Workspace!' : 'Save as Active Learning Roadmap'}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 max-w-md">
                    {adoptDone
                      ? 'Your skills and phase milestone tasks are now active in your Tasks & Skills tabs.'
                      : 'Automatically adds missing skills to your Portfolio and schedules Phase 1 tasks on your board.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => navigate('/learning-path', {
                      state: {
                        resumeSkills: result.matched_skills,
                        missingSkills: result.missing_skills,
                        targetRole: selectedPreset || 'Target Role',
                      }
                    })}
                    className="px-4 py-2.5 rounded-2xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs border border-border transition-all flex items-center gap-1.5"
                  >
                    <Compass className="w-4 h-4 text-orange-500" />
                    <span>Personalize in Recommender</span>
                  </button>

                  <button
                    type="button"
                    onClick={adoptDone ? () => navigate('/tasks') : handleAdoptRoadmap}
                    disabled={adoptLoading}
                    className="px-5 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {adoptLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : adoptDone ? (
                      <>
                        <span>View Tasks Board</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <Map className="w-4 h-4" />
                        <span>Set as My Roadmap</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  )
}

export default SkillGapAnalyzer
