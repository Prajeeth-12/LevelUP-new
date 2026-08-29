import React, { useMemo, useState } from 'react'
import { Download, FileJson, FileText, Award, Zap, TrendingUp, Calendar } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { PageHeader } from '../components/ui/PageHeader'
import { useSkills } from '../contexts/SkillContext'
import { motion } from 'framer-motion'

const Portfolio = () => {
  const { categories, skills } = useSkills()
  const [exportFormat, setExportFormat] = useState(null)
  const [filterCategory, setFilterCategory] = useState('all')

  // Group skills by category and status
  const portfolioData = useMemo(() => {
    const grouped = {}
    categories.forEach(cat => {
      grouped[cat.id] = {
        category: cat,
        skills: skills.filter(s => s.categoryId === cat.id),
      }
    })
    return grouped
  }, [categories, skills])

  // Filter skills based on selected category
  const filteredData = useMemo(() => {
    if (filterCategory === 'all') {
      return Object.values(portfolioData)
    }
    return Object.values(portfolioData).filter(g => g.category.id === filterCategory)
  }, [portfolioData, filterCategory])

  // Calculate portfolio stats
  const stats = useMemo(() => {
    const totalSkills = skills.length
    const completedSkills = skills.filter(s => s.status === 'COMPLETED').length
    const inProgressSkills = skills.filter(s => s.status === 'IN_PROGRESS').length
    const avgProgress = totalSkills > 0 ? Math.round(skills.reduce((acc, s) => acc + (s.progress || 0), 0) / totalSkills) : 0

    return { totalSkills, completedSkills, inProgressSkills, avgProgress }
  }, [skills])

  // Export as JSON
  const handleExportJSON = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      stats,
      categories: categories.map(cat => ({
        name: cat.name,
        description: cat.description,
        skills: skills
          .filter(s => s.categoryId === cat.id)
          .map(s => ({
            name: s.name,
            status: s.status,
            progress: s.progress,
            priority: s.priority,
            description: s.description,
            subskills: s.subskills || [],
          })),
      })),
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Portfolio_${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    setExportFormat(null)
  }

  // Export as PDF (simple HTML-based approach)
  const handleExportPDF = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Professional Skills Portfolio</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #000; }
          h1 { font-size: 24px; margin-bottom: 5px; }
          .date { font-size: 12px; color: #666; margin-bottom: 20px; }
          h2 { font-size: 16px; border-bottom: 2px solid #000; padding-bottom: 10px; margin-top: 20px; }
          .stats-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .stats-table th, .stats-table td { padding: 10px; text-align: left; border: 1px solid #ddd; }
          .stats-table th { background: #000; color: white; }
          .skill-item { page-break-inside: avoid; margin-bottom: 15px; padding: 10px; border-left: 3px solid #000; }
          .skill-name { font-weight: bold; font-size: 14px; }
          .skill-meta { font-size: 12px; color: #666; margin-top: 5px; }
          .skill-progress { width: 100%; height: 8px; background: #ddd; margin-top: 5px; border-radius: 4px; overflow: hidden; }
          .skill-progress-bar { height: 100%; background: #000; }
          .category-section { margin-bottom: 30px; }
        </style>
      </head>
      <body>
        <h1>Professional Skills Portfolio</h1>
        <p class="date">Exported on ${new Date().toLocaleDateString()}</p>
        
        <h2>Portfolio Summary</h2>
        <table class="stats-table">
          <tr><th>Metric</th><th>Value</th></tr>
          <tr><td>Total Skills</td><td>${stats.totalSkills}</td></tr>
          <tr><td>Completed Skills</td><td>${stats.completedSkills}</td></tr>
          <tr><td>In Progress</td><td>${stats.inProgressSkills}</td></tr>
          <tr><td>Average Progress</td><td>${stats.avgProgress}%</td></tr>
        </table>

        ${categories.map(category => {
          const categorySkills = skills.filter(s => s.categoryId === category.id)
          if (categorySkills.length === 0) return ''
          return `
            <div class="category-section">
              <h2>${category.name}</h2>
              ${category.description ? `<p>${category.description}</p>` : ''}
              ${categorySkills.map(skill => `
                <div class="skill-item">
                  <div class="skill-name">${skill.name}</div>
                  <div class="skill-meta">
                    Status: ${skill.status.replace('_', ' ')} | Priority: ${skill.priority} | Progress: ${skill.progress || 0}%
                  </div>
                  ${skill.description ? `<p style="font-size: 12px; margin: 5px 0;">${skill.description}</p>` : ''}
                  <div class="skill-progress">
                    <div class="skill-progress-bar" style="width: ${skill.progress || 0}%"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          `
        }).join('')}
      </body>
      </html>
    `

    const element = document.createElement('a')
    element.href = 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent)
    element.download = `Portfolio_${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    setExportFormat(null)
  }

  return (
    <AppShell>
      <div className="page-container space-y-8 animate-fade-slide-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <PageHeader
              title="Career Portfolio"
              subtitle="Showcase your verified skills, track certifications, and monitor your engineering readiness."
            />
          </div>
          <div className="flex gap-2">
            <div className="relative group">
              <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs bg-orange-600 hover:bg-orange-700 text-white transition-all shadow-xs">
                <Download className="w-4 h-4" />
                <span>Export Portfolio</span>
              </button>
              <div className="absolute right-0 mt-2 w-44 bg-card border border-border rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 p-1.5 space-y-1">
                <button
                  onClick={handleExportJSON}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary rounded-xl flex items-center gap-2"
                >
                  <FileJson className="w-4 h-4 text-orange-500" />
                  Export as JSON
                </button>
                <button
                  onClick={handleExportPDF}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary rounded-xl flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-amber-500" />
                  Export as HTML/PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Stats Bar (.pk-cycle) */}
        <div className="pk-cycle">
          <div className="pk-stat pr-4 sm:pr-6 sm:border-r border-border">
            <span className="pk-stat-label">TOTAL SKILLS</span>
            <div className="pk-stat-val">
              <span>{stats.totalSkills}</span>
              <span className="pk-stat-unit">tracked</span>
            </div>
          </div>

          <div className="pk-stat">
            <span className="pk-stat-label">COMPLETED</span>
            <div className="pk-stat-val text-emerald-600 dark:text-emerald-400">
              <span>{stats.completedSkills}</span>
              <span className="pk-stat-unit">mastered</span>
            </div>
          </div>

          <div className="pk-stat">
            <span className="pk-stat-label">IN PROGRESS</span>
            <div className="pk-stat-val text-blue-600 dark:text-blue-400">
              <span>{stats.inProgressSkills}</span>
              <span className="pk-stat-unit">active</span>
            </div>
          </div>

          <div className="pk-stat">
            <span className="pk-stat-label">AVERAGE MASTERY</span>
            <div className="pk-stat-val text-orange-600 dark:text-orange-400">
              <span>{stats.avgProgress}%</span>
              <span className="pk-stat-unit">score</span>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filterCategory === 'all'
                ? 'bg-black text-white'
                : 'bg-secondary text-foreground/90 hover:bg-gray-200'
            }`}
          >
            All Skills
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filterCategory === cat.id
                  ? 'bg-black text-white'
                  : 'bg-secondary text-foreground/90 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Skills Grid by Category */}
        <div className="space-y-8">
          {filteredData.length === 0 ? (
            <div className="empty-state py-16">
              <div className="empty-state-icon bg-secondary text-muted-foreground">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-foreground mt-4">No skills yet</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm mb-6">
                Start building your portfolio by adding skills in the Skills tab or through the AI Skill Gap Analyzer.
              </p>
            </div>
          ) : (
            filteredData.map((group, idx) => (
              <motion.div
                key={group.category.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-black mb-2">{group.category.name}</h2>
                  {group.category.description && (
                    <p className="text-sm text-muted-foreground mb-4">{group.category.description}</p>
                  )}

                  {/* Skills in this category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.skills.map((skill, skillIdx) => (
                      <motion.div
                        key={skill.id}
                        className="bg-white border border-border rounded-[16px] p-4 hover:shadow-md transition-shadow"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: skillIdx * 0.05 }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-black text-sm">{skill.name}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {skill.status.replace('_', ' ')}
                            </p>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            skill.priority === 'HIGH'
                              ? 'bg-red-50 text-red-700'
                              : skill.priority === 'MEDIUM'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-green-50 text-green-700'
                          }`}>
                            {skill.priority}
                          </span>
                        </div>

                        {skill.description && (
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                            {skill.description}
                          </p>
                        )}

                        {/* Progress bar */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-muted-foreground">Progress</span>
                            <span className="text-xs font-bold text-black">{skill.progress || 0}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-black transition-all duration-300"
                              style={{ width: `${skill.progress || 0}%` }}
                            />
                          </div>
                        </div>

                        {/* Subskills count */}
                        {skill.subskills && skill.subskills.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {skill.subskills.filter(s => s.done).length} / {skill.subskills.length} subskills completed
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  )
}

export default Portfolio
