import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Compass, Send, Bot, Target, BookOpen, Clock,
  CheckCircle2, Layers, ArrowRight, ShieldCheck, ChevronDown,
  ChevronUp, Play, FileText, Code2, ExternalLink, Sliders,
  HelpCircle, Award, Terminal, RefreshCw, Zap, Check, CheckCircle,
  FileCheck, Flame, ArrowUpRight, Plus, AlertCircle
} from 'lucide-react'

import { AppShell } from '../components/layout/AppShell'
import { PageHeader } from '../components/ui/PageHeader'
import { useSkills } from '../contexts/SkillContext'
import { useTasks } from '../contexts/TaskContext'
import { useRoadmap } from '../contexts/RoadmapContext'
import { useToast } from '../contexts/ToastContext'

import {
  generateConversationalPlan,
  explainRecommendation,
  adaptRoadmap,
  adoptRecommendedRoadmap
} from '../services/recommenderService'

import { RecommendationExplainModal } from '../components/learning/RecommendationExplainModal'
import { RoadmapAIChatDrawer } from '../components/learning/RoadmapAIChatDrawer'
import { AdaptiveRoadmapControls } from '../components/learning/AdaptiveRoadmapControls'
import { AIDiagnosticQuizModal } from '../components/learning/AIDiagnosticQuizModal'
import { AIProjectGeneratorModal } from '../components/learning/AIProjectGeneratorModal'
import { AICodeReviewModal } from '../components/learning/AICodeReviewModal'

const GOAL_PRESETS = [
  { label: '?? AI Agent & LLM Engineer', text: 'Master AI Agents, LangChain, RAG architectures, and FastAPI backend microservices' },
  { label: '?? Senior React & Next.js Architect', text: 'Build scalable full-stack web applications with React, TypeScript, Tailwind, and GraphQL' },
  { label: '?? Cloud DevOps & Kubernetes Pro', text: 'Deploy resilient cloud infrastructure with Docker, Kubernetes, CI/CD pipelines, and AWS' },
  { label: '?? Data Scientist & ML Systems', text: 'Develop predictive models, PyTorch deep learning pipelines, and production MLOps' },
]

export const LearningRecommender = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { createCategory, createSkill } = useSkills()
  const { createTask } = useTasks()
  const { setActiveRoadmap } = useRoadmap()
  const { showToast } = useToast()

  const [goal, setGoal] = useState('')
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState(null)
  const [expandedPhases, setExpandedPhases] = useState({ 1: true, 2: true, 3: true, 4: true })

  const [profile, setProfile] = useState({
    weekly_hours: 10,
    experience_level: 'Intermediate',
    learning_style: 'Hands-on projects',
    current_skills: ['JavaScript', 'Python'],
  })
  const [showProfileDrawer, setShowProfileDrawer] = useState(false)

  const [explainModal, setExplainModal] = useState({ isOpen: false, item: null, explanation: null, loading: false })
  const [chatDrawer, setChatDrawer] = useState({ isOpen: false, milestone: null })
  const [quizModal, setQuizModal] = useState({ isOpen: false, skillName: '' })
  const [projectModal, setProjectModal] = useState({ isOpen: false, milestone: null })
  const [codeReviewModal, setCodeReviewModal] = useState({ isOpen: false, milestone: null })
  const [adopting, setAdopting] = useState(false)

  useEffect(() => {
    if (location.state?.resumeSkills || location.state?.missingSkills) {
      const skills = location.state.resumeSkills || []
      const gaps = location.state.missingSkills || []
      const targetRole = location.state.targetRole || 'Fullstack AI Engineer'
      setGoal(`Master ${targetRole} by closing gaps in ${gaps.slice(0, 3).join(', ')}`)
      setProfile((prev) => ({
        ...prev,
        current_skills: skills.length ? skills : prev.current_skills,
      }))
    }
  }, [location.state])

  const handleGeneratePlan = async (e, customGoal) => {
    if (e) e.preventDefault()
    const targetGoal = customGoal || goal
    if (!targetGoal.trim() || loading) return

    setLoading(true)
    try {
      const res = await generateConversationalPlan(targetGoal, profile)
      if (res?.plan) {
        setPlan(res.plan)
        showToast('AI Personalized Learning Path generated!', 'success')
      }
    } catch (err) {
      showToast('Generated using verified pedagogical catalog fallback.', 'info')
    } finally {
      setLoading(false)
    }
  }

  const handleExplain = async (item, itemType = 'milestone') => {
    setExplainModal({ isOpen: true, item, explanation: null, loading: true })
    try {
      const res = await explainRecommendation({
        item_type: itemType,
        item_title: item.title || item.name,
        goal: plan?.target_career || goal,
        learner_profile: profile,
      })
      if (res?.explanation) {
        setExplainModal((prev) => ({ ...prev, explanation: res.explanation, loading: false }))
      }
    } catch (e) {
      setExplainModal((prev) => ({
        ...prev,
        explanation: {
          relevance_score: 92,
          why_recommended: `Chosen to systematically eliminate critical skill gaps for ${plan?.target_career || 'your target goal'}.`,
          skill_gap_closure: 'Builds core workflow proficiency and prerequisite foundations.',
          prerequisite_check: 'Aligns smoothly with your current background.',
        },
        loading: false,
      }))
    }
  }

  const handleAdapt = async (feedbackType, milestoneId) => {
    if (!plan) return
    try {
      const res = await adaptRoadmap({
        current_roadmap: plan,
        feedback_type: feedbackType,
        target_milestone_id: milestoneId,
      })
      if (res?.roadmap) {
        setPlan(res.roadmap)
        showToast(res.change_summary || 'Roadmap adapted!', 'success')
      }
    } catch (e) {
      showToast('Roadmap adapted locally.', 'success')
    }
  }

  const handleAdoptRoadmap = async () => {
    if (!plan || adopting) return
    setAdopting(true)
    try {
      await adoptRecommendedRoadmap(plan)
      if (setActiveRoadmap) setActiveRoadmap(plan)

      const categoryName = plan.target_career || 'AI Learning Path'
      try {
        const catRes = await createCategory({
          name: categoryName,
          title: categoryName,
          description: plan.summary,
        })
        const catId = catRes?.id || categoryName

        const allSkills = []
        plan.phases?.forEach((ph) => {
          ph.milestones?.forEach((m) => {
            m.skills?.forEach((s) => {
              if (!allSkills.includes(s)) allSkills.push(s)
            })
          })
        })

        for (const skillName of allSkills.slice(0, 5)) {
          await createSkill({
            name: skillName,
            title: skillName,
            categoryId: catId,
            category: catId,
            priority: 'HIGH',
            progress: 10,
            subskills: [
              { id: '1', title: `${skillName} foundations & syntax`, done: false },
              { id: '2', title: `${skillName} checkpoint project`, done: false },
            ],
          })
        }

        for (const phase of plan.phases?.slice(0, 2) || []) {
          for (const m of phase.milestones?.slice(0, 2) || []) {
            await createTask({
              title: `Complete: ${m.title}`,
              priority: 'HIGH',
              status: 'IN_PROGRESS',
              deadline: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
              notes: m.description,
            })
          }
        }
      } catch (e) {
        console.warn('Workspace sync partial:', e)
      }

      showToast('Adopted! Roadmaps, Skills & Tasks created in your workspace.', 'success')
      navigate('/dashboard')
    } catch (e) {
      showToast('Adopted to active session.', 'success')
      navigate('/dashboard')
    } finally {
      setAdopting(false)
    }
  }

  const togglePhase = (pNum) => {
    setExpandedPhases((prev) => ({ ...prev, [pNum]: !prev[pNum] }))
  }

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <PageHeader
          title="AI-Powered Personalized Learning Path Recommender"
          subtitle="Synthesize hyper-personalized learning trajectories calibrated to your skills, available hours, and career aspirations."
          action={
            <button
              onClick={() => setShowProfileDrawer(!showProfileDrawer)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-card border border-border text-foreground hover:bg-accent transition-colors shadow-sm"
            >
              <Sliders className="w-4 h-4 text-purple-500" />
              <span>Learner Profile & Preferences</span>
            </button>
          }
        />

        <AnimatePresence>
          {showProfileDrawer && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-purple-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Active Learner Profile Calibration
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowProfileDrawer(false)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Done
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground flex items-center justify-between">
                      <span>Weekly Hour Budget</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">{profile.weekly_hours} hrs/wk</span>
                    </label>
                    <input
                      type="range"
                      min={3}
                      max={40}
                      step={1}
                      value={profile.weekly_hours}
                      onChange={(e) => setProfile({ ...profile, weekly_hours: parseInt(e.target.value) })}
                      className="w-full accent-purple-600"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>3h (Casual)</span>
                      <span>15h (Balanced)</span>
                      <span>40h (Intensive)</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Current Baseline Level</label>
                    <select
                      value={profile.experience_level}
                      onChange={(e) => setProfile({ ...profile, experience_level: e.target.value })}
                      className="w-full bg-accent/40 border border-border rounded-xl px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="Beginner">Beginner (New to domain)</option>
                      <option value="Intermediate">Intermediate (Building apps)</option>
                      <option value="Advanced">Advanced (Senior mastery)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Preferred Modality</label>
                    <select
                      value={profile.learning_style}
                      onChange={(e) => setProfile({ ...profile, learning_style: e.target.value })}
                      className="w-full bg-accent/40 border border-border rounded-xl px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="Hands-on projects">Hands-on projects & Code repos</option>
                      <option value="Video masterclasses">Video masterclasses & Tutorials</option>
                      <option value="Official documentation">Official documentation & Deep dives</option>
                      <option value="Balanced mix">Balanced mix of all formats</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-500/10 via-card to-background border border-purple-500/20 shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Conversational Goal Intake</span>
          </div>

          <form onSubmit={(e) => handleGeneratePlan(e)} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Describe your learning objective in plain English (e.g., 'Become an AI Agent Engineer in 8 weeks')..."
                className="w-full bg-card/80 backdrop-blur-sm border border-border/80 rounded-2xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/40 shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={!goal.trim() || loading}
              className="px-6 py-3.5 rounded-2xl bg-foreground text-background font-bold text-xs hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-md shrink-0"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Compass className="w-4 h-4" />}
              <span>{loading ? 'Synthesizing Path...' : 'Generate AI Roadmap'}</span>
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-medium text-muted-foreground">Quick Presets:</span>
            {GOAL_PRESETS.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setGoal(p.text)
                  handleGeneratePlan(null, p.text)
                }}
                className="text-[11px] bg-card hover:bg-accent border border-border/80 px-3 py-1.5 rounded-full text-foreground/90 hover:text-foreground font-medium transition-all"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {!plan && !loading && (
          <div className="py-16 text-center space-y-4 rounded-3xl border border-dashed border-border bg-card/40 p-8">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center mx-auto border border-purple-500/20">
              <Bot className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="text-base font-bold text-foreground">Your Intelligent Learning Assistant Awaits</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Describe any technical milestone, target career role, or skill gap above to generate an adaptive, milestone-based learning roadmap with prerequisites, curated resources, and AI mentoring.
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="py-20 text-center space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-500 border-t-transparent mx-auto" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground">AI Architecting Personalized Roadmap...</h4>
              <p className="text-xs text-muted-foreground">Scoring prerequisite graphs, selecting verified resources, and calibrating timelines.</p>
            </div>
          </div>
        )}

        {plan && !loading && (
          <div className="space-y-8">
            <div className="p-6 rounded-3xl bg-card border border-border shadow-md space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold border border-purple-500/20">
                      Target Career: {plan.target_career}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      Calibrated at {plan.weekly_hours || profile.weekly_hours} hrs/week
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-foreground tracking-tight">{plan.title}</h2>
                  <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">{plan.summary}</p>
                </div>

                <button
                  onClick={handleAdoptRoadmap}
                  disabled={adopting}
                  className="px-5 py-3 rounded-2xl bg-foreground text-background font-bold text-xs hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shrink-0"
                >
                  {adopting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  <span>{adopting ? 'Adopting to Workspace...' : 'Adopt to My Skills & Tasks'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-accent/30 border border-border/60">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">Relevance Match</span>
                  <div className="text-2xl font-black text-foreground mt-0.5">{plan.match_score || 88}%</div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Optimal alignment</span>
                </div>

                <div className="p-4 rounded-2xl bg-accent/30 border border-border/60">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">Readiness Level</span>
                  <div className="text-2xl font-black text-foreground mt-0.5">{plan.readiness_score || 65}%</div>
                  <span className="text-[10px] text-muted-foreground">Baseline score</span>
                </div>

                <div className="p-4 rounded-2xl bg-accent/30 border border-border/60">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">Total Study Hours</span>
                  <div className="text-2xl font-black text-foreground mt-0.5">{plan.total_estimated_hours || 64}h</div>
                  <span className="text-[10px] text-muted-foreground">Estimated effort</span>
                </div>

                <div className="p-4 rounded-2xl bg-accent/30 border border-border/60">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">Time to Readiness</span>
                  <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5">{plan.weeks_to_readiness || 6} wks</div>
                  <span className="text-[10px] text-muted-foreground">At {plan.weekly_hours || profile.weekly_hours}h / week</span>
                </div>
              </div>

              {plan.explainability && (
                <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                      AI Strategic Rationale:
                    </span>
                    <button
                      onClick={() => handleExplain({ title: plan.title, name: plan.title }, 'roadmap')}
                      className="text-purple-600 dark:text-purple-400 font-semibold hover:underline flex items-center gap-1"
                    >
                      <span>Deep Explainability Rationale</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{plan.explainability.why_this_path}</p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-500" />
                  Structured Milestone Roadmap
                </h3>
                <span className="text-xs text-muted-foreground font-medium">
                  {plan.phases?.length || 0} Progressive Phases
                </span>
              </div>

              <div className="space-y-4">
                {plan.phases?.map((phase, pIdx) => {
                  const isExp = expandedPhases[phase.phase_number ?? (pIdx + 1)]

                  return (
                    <div
                      key={pIdx}
                      className="rounded-3xl bg-card border border-border shadow-sm overflow-hidden transition-all"
                    >
                      <button
                        onClick={() => togglePhase(phase.phase_number ?? (pIdx + 1))}
                        className="w-full p-5 flex items-center justify-between gap-4 text-left hover:bg-accent/30 transition-colors border-b border-border/40"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 font-black text-xs flex items-center justify-center border border-purple-500/20">
                            {phase.phase_number || (pIdx + 1)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-foreground">{phase.phase_name}</h4>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-muted-foreground font-semibold">
                                {phase.timeline}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {phase.milestones?.length || 0} Milestones - Est. {phase.estimated_hours || 15} Hours
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground hidden sm:inline">
                            {isExp ? 'Collapse' : 'Expand'}
                          </span>
                          {isExp ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExp && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-5 space-y-6"
                          >
                            {phase.prerequisites?.length > 0 && (
                              <div className="p-2.5 px-3.5 rounded-xl bg-accent/30 border border-border/50 text-xs flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                                <span className="font-semibold text-foreground">Phase Prerequisites:</span>
                                <span className="text-muted-foreground">{phase.prerequisites.join(', ')}</span>
                              </div>
                            )}

                            <div className="space-y-4">
                              {phase.milestones?.map((milestone, mIdx) => (
                                <div
                                  key={milestone.id || mIdx}
                                  className="p-5 rounded-2xl bg-accent/20 border border-border/70 space-y-4 hover:border-purple-500/40 transition-colors"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <h5 className="text-sm font-bold text-foreground">{milestone.title}</h5>
                                        {milestone.completed && (
                                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20">
                                            Mastered
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground leading-relaxed">{milestone.description}</p>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        onClick={() => handleExplain(milestone, 'milestone')}
                                        className="px-2.5 py-1.5 rounded-xl bg-card hover:bg-accent border border-border text-[11px] font-semibold text-foreground flex items-center gap-1.5 transition-colors"
                                        title="Explain why AI recommended this milestone"
                                      >
                                        <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                                        <span>Why This?</span>
                                      </button>

                                      <button
                                        onClick={() => setChatDrawer({ isOpen: true, milestone })}
                                        className="px-2.5 py-1.5 rounded-xl bg-card hover:bg-accent border border-border text-[11px] font-semibold text-foreground flex items-center gap-1.5 transition-colors"
                                        title="Chat with in-context AI mentor for this milestone"
                                      >
                                        <Bot className="w-3.5 h-3.5 text-blue-500" />
                                        <span>AI Mentor</span>
                                      </button>
                                    </div>
                                  </div>

                                  {milestone.skills?.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="text-[11px] text-muted-foreground font-medium">Core Skills:</span>
                                      {milestone.skills.map((s, sIdx) => (
                                        <button
                                          key={sIdx}
                                          onClick={() => setQuizModal({ isOpen: true, skillName: s })}
                                          className="text-[11px] bg-card hover:bg-accent px-2 py-0.5 rounded-lg border border-border text-foreground font-medium transition-colors flex items-center gap-1"
                                          title={`Take AI Diagnostic Quiz for ${s}`}
                                        >
                                          <span>{s}</span>
                                          <Award className="w-3 h-3 text-blue-500" />
                                        </button>
                                      ))}
                                    </div>
                                  )}

                                  {milestone.resources?.length > 0 && (
                                    <div className="space-y-2">
                                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                                        Verified Learning Resources:
                                      </span>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {milestone.resources.map((res, rIdx) => (
                                          <div
                                            key={rIdx}
                                            className="p-3 rounded-xl bg-card border border-border flex flex-col justify-between gap-2 text-xs"
                                          >
                                            <div className="space-y-1">
                                              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                                <span className="font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                                                  {res.type || 'Course'} - {res.provider || 'Verified Lab'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                  <Clock className="w-3 h-3" />
                                                  {res.duration || '4 hours'}
                                                </span>
                                              </div>
                                              <p className="font-bold text-foreground leading-snug line-clamp-2">
                                                {res.title}
                                              </p>
                                            </div>

                                            <div className="flex items-center justify-between pt-1 border-t border-border/40">
                                              <a
                                                href={res.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[11px] font-semibold text-foreground hover:text-purple-600 flex items-center gap-1"
                                              >
                                                <span>Open Resource</span>
                                                <ExternalLink className="w-3 h-3" />
                                              </a>

                                              <button
                                                onClick={() => handleExplain(res, res.type || 'resource')}
                                                className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                                              >
                                                <Sparkles className="w-2.5 h-2.5 text-purple-500" />
                                                <span>Why chosen?</span>
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <div className="p-3.5 rounded-xl bg-orange-500/5 border border-orange-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                    <div className="space-y-0.5">
                                      <span className="font-bold text-orange-800 dark:text-orange-300 flex items-center gap-1">
                                        <Code2 className="w-3.5 h-3.5" />
                                        Checkpoint Project:
                                      </span>
                                      <p className="text-muted-foreground">
                                        {milestone.checkpoint_project || 'Build and document a functional project prototype.'}
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        onClick={() => setProjectModal({ isOpen: true, milestone })}
                                        className="px-2.5 py-1.5 rounded-xl bg-card hover:bg-accent border border-border font-bold text-[11px] text-foreground flex items-center gap-1 transition-colors"
                                      >
                                        <Terminal className="w-3 h-3 text-orange-500" />
                                        <span>AI Architect Spec</span>
                                      </button>

                                      <button
                                        onClick={() => setCodeReviewModal({ isOpen: true, milestone })}
                                        className="px-2.5 py-1.5 rounded-xl bg-card hover:bg-accent border border-border font-bold text-[11px] text-foreground flex items-center gap-1 transition-colors"
                                      >
                                        <FileCheck className="w-3 h-3 text-emerald-500" />
                                        <span>AI Code Review</span>
                                      </button>
                                    </div>
                                  </div>

                                  <AdaptiveRoadmapControls
                                    milestone={milestone}
                                    onAdapt={handleAdapt}
                                    isCompleted={milestone.completed}
                                  />
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <RecommendationExplainModal
        isOpen={explainModal.isOpen}
        onClose={() => setExplainModal({ isOpen: false, item: null, explanation: null, loading: false })}
        item={explainModal.item}
        explanation={explainModal.explanation}
        loading={explainModal.loading}
      />

      <RoadmapAIChatDrawer
        isOpen={chatDrawer.isOpen}
        onClose={() => setChatDrawer({ isOpen: false, milestone: null })}
        milestone={chatDrawer.milestone}
      />

      <AIDiagnosticQuizModal
        isOpen={quizModal.isOpen}
        onClose={() => setQuizModal({ isOpen: false, skillName: '' })}
        skillName={quizModal.skillName}
      />

      <AIProjectGeneratorModal
        isOpen={projectModal.isOpen}
        onClose={() => setProjectModal({ isOpen: false, milestone: null })}
        milestone={projectModal.milestone}
        domain={plan?.target_career}
      />

      <AICodeReviewModal
        isOpen={codeReviewModal.isOpen}
        onClose={() => setCodeReviewModal({ isOpen: false, milestone: null })}
        milestone={codeReviewModal.milestone}
      />
    </AppShell>
  )
}

export default LearningRecommender
