import React, { useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { PageHeader } from '../components/ui/PageHeader'
import { AIActionPanel } from '../components/learning/AIActionPanel'
import { Target, Zap, Briefcase, Map, ArrowRight } from 'lucide-react'
import { skillGap, pathOptimize } from '../services/aiService'
import { useSkills } from '../contexts/SkillContext'
import { useNavigate } from 'react-router-dom'

const Goals = () => {
  const { skills } = useSkills()
  const navigate = useNavigate()
  const [targetRole, setTargetRole] = useState('')
  const [result, setResult] = useState(null)
  const [loadingType, setLoadingType] = useState(null)

  const runSkillGap = async () => {
    if (!targetRole.trim()) return
    setLoadingType('gap')
    try {
      const data = await skillGap({ targetRole, skills })
      setResult({ type: 'gap', data })
    } finally {
      setLoadingType(null)
    }
  }

  const runPathOptimize = async () => {
    setLoadingType('optimize')
    try {
      const data = await pathOptimize({ selectedSkills: skills.filter(s => s.status !== 'COMPLETED') })
      setResult({ type: 'optimize', data })
    } finally {
      setLoadingType(null)
    }
  }

  return (
    <AppShell>
      <div className="page-container animate-fade-slide-in">
        <PageHeader 
          title="Goals & Career Path" 
          subtitle="Define your target role and let AI map out the exact skills you need to learn to get there." 
        />
      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        
        {/* Left Panel: Inputs */}
        <div className="space-y-6">
          <div className="card-surface p-6">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-5 border border-orange-500/20">
              <Target className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            
            <h2 className="text-xl font-bold text-foreground mb-2 font-serif italic">Target Role</h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              What role are you aiming for? We'll compare your current {skills.length} tracked skills against the industry standard for this role.
            </p>

            <div className="space-y-4">
              <div>
                <label className="label-base">Role Title</label>
                <div className="relative">
                  <Briefcase className="w-5 h-5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    className="input-base pl-10 rounded-2xl"
                    placeholder="e.g. Senior Frontend Engineer"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                  />
                </div>
              </div>
              
              <button 
                onClick={runSkillGap} 
                disabled={!targetRole.trim() || loadingType !== null}
                className="w-full py-3 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm transition-all shadow-xs disabled:opacity-40"
              >
                {loadingType === 'gap' ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Analyzing gap...
                  </span>
                ) : 'Analyze Skill Gap'}
              </button>
            </div>
          </div>

          <div className="card-surface p-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-5 border border-amber-500/20">
              <Map className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            
            <h2 className="text-xl font-bold text-foreground mb-2 font-serif italic">Optimize Path</h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Already know what you need to learn? Let AI analyze your {skills.filter(s => s.status !== 'COMPLETED').length} active skills and suggest the most efficient order to tackle them.
            </p>

            <button 
              onClick={runPathOptimize} 
              disabled={skills.length === 0 || loadingType !== null}
              className="w-full py-3 rounded-2xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-sm border border-border transition-all"
            >
              {loadingType === 'optimize' ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-border border-t-orange-600 animate-spin" />
                  Generating optimized schedule...
                </span>
              ) : 'Optimize Learning Path'}
            </button>
          </div>

          {/* Upsell for full resume scanner */}
          <div className="relative overflow-hidden rounded-xl p-6 bg-zinc-950 border border-zinc-800">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2 text-white">
                <Zap className="w-5 h-5 text-violet-400" />
                <h3 className="font-bold">Deep Resume Analysis</h3>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Upload your resume and a specific Job Description for a highly tailored skill gap report.
              </p>
              <button 
                onClick={() => navigate('/skill-gap')}
                className="text-sm font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
              >
                Go to Analyzer <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Results */}
        <div className="h-full">
          {result ? (
            <div className="card-surface p-6 h-full border-indigo-200 dark:border-indigo-900/50 shadow-lg shadow-indigo-500/5">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100 dark:border-border">
                {result.type === 'gap' ? (
                  <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                ) : (
                  <Map className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                )}
                <h2 className="text-lg font-bold text-gray-900 dark:text-foreground">
                  {result.type === 'gap' ? `Gap Analysis: ${targetRole}` : 'Optimized Learning Path'}
                </h2>
              </div>
              
              <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {result.data}
              </div>
            </div>
          ) : (
            <div className="card-surface h-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 dark:bg-card/50 border-dashed border-2">
              <div className="w-16 h-16 rounded-xl bg-white dark:bg-accent shadow-sm flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-foreground mb-2">Awaiting Instructions</h3>
              <p className="text-sm text-gray-500 dark:text-muted-foreground max-w-sm">
                Enter a target role on the left or click "Optimize Learning Path" to generate your AI-powered career roadmap.
              </p>
            </div>
          )}
        </div>
        
      </div>
      </div>
    </AppShell>
  )
}

export default Goals
