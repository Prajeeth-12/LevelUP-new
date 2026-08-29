import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MinusCircle, Plus, Sparkles, Trash2 } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { PageHeader } from '../components/ui/PageHeader'
import ConfirmModal from '../components/ConfirmModal'
import { PriorityBadge } from '../components/learning/PriorityBadge'
import { ProgressBar } from '../components/learning/ProgressBar'
import { AIActionPanel } from '../components/learning/AIActionPanel'
import { Button } from '../components/ui/button'
import { Textarea } from '../components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { useSkills } from '../contexts/SkillContext'
import { useTasks } from '../contexts/TaskContext'
import { generateSubskills, timeEstimate } from '../services/aiService'

const SkillDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    loading,
    getSkillById,
    getCategoryById,
    updateSkillProgress,
    updateSkillNotes,
    updateSkillSubskills,
    deleteSkill,
  } = useSkills()
  const { tasks } = useTasks()
  const skill = getSkillById(id)
  const category = skill ? getCategoryById(skill.categoryId) : null
  const [progress, setProgress] = useState(skill?.progress || 0)
  const [noteValue, setNoteValue] = useState(skill?.notes || '')
  const [newSubskillInput, setNewSubskillInput] = useState('')
  const [subskillItems, setSubskillItems] = useState([])
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const linkedTasks = useMemo(() => tasks.filter((task) => task.skillId === id), [id, tasks])

  useEffect(() => {
    setProgress(skill?.progress || 0)
    setNoteValue(skill?.notes || '')
    setSubskillItems((skill?.subskills || []).map((item, index) => ({
      id: item.id || `${skill.id}-${index}`,
      title: item.title || item,
      done: Boolean(item.done),
    })))
  }, [skill])

  const handleSaveProgress = async () => {
    await updateSkillProgress(skill.id, progress)
  }

  const handleSaveNotes = async () => {
    await updateSkillNotes(skill.id, noteValue)
  }

  const handleSaveSubskills = async () => {
    await updateSkillSubskills(skill.id, subskillItems)
  }

  const handleDeleteSkill = async () => {
    await deleteSkill(skill.id)
    setConfirmDelete(false)
    navigate('/skills')
  }

  const handleAddSubskills = () => {
    const additions = newSubskillInput
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((title, index) => ({
        id: `${Date.now()}-${index}-${title}`,
        title,
        done: false,
      }))

    if (additions.length) {
      setSubskillItems((prev) => [...prev, ...additions])
      setNewSubskillInput('')
    }
  }

  const toggleSubskill = (index) => {
    setSubskillItems((prev) => prev.map((item, itemIndex) => (
      itemIndex === index ? { ...item, done: !item.done } : item
    )))
  }

  const removeSubskill = (index) => {
    setSubskillItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
  }

  const handleGenerateSubskills = async () => {
    setAiLoading(true)
    try {
      const result = await generateSubskills({
        skillName: skill.name,
        courseLink: '',
      })
      setAiResult(result)
      if (Array.isArray(result?.subskills)) {
        setNewSubskillInput(result.subskills.join('\n'))
      }
    } finally {
      setAiLoading(false)
    }
  }

  const handleEstimate = async () => {
    setAiLoading(true)
    try {
      const result = await timeEstimate({ skillName: skill.name, difficulty: skill.priority })
      setAiResult(result)
    } finally {
      setAiLoading(false)
    }
  }

  if (loading && !skill) {
    return (
      <AppShell>
        <div className="page-container animate-fade-slide-in">
          <PageHeader title="Skill Detail" subtitle="Loading skill controls." />
          <div className="card-surface p-6 text-sm text-muted-foreground">Loading...</div>
        </div>
      </AppShell>
    )
  }

  if (!skill) {
    return (
      <AppShell>
        <div className="page-container animate-fade-slide-in">
          <PageHeader title="Skill Detail" subtitle="This skill could not be found." />
          <div className="card-surface p-6">
            <p className="text-sm text-muted-foreground">Skill not found.</p>
            <Button variant="outline" className="rounded-lg mt-4" onClick={() => navigate('/skills')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to skills
            </Button>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="page-container animate-fade-slide-in">
        <PageHeader
          title={skill.name}
          subtitle={`${category?.name || 'Uncategorized'} - ${skill.description || 'Skill detail and learning controls.'}`}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" className="rounded-lg" onClick={() => navigate('/skills')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <PriorityBadge value={skill.priority} />
            </div>
          }
        />

        <div className="grid gap-5 xl:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-5">
            <Card className="border-border bg-white shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">{skill.name}</CardTitle>
                  <p className="mt-2 text-sm text-muted-foreground">{skill.description || 'No description yet.'}</p>
                </div>
                <Button variant="destructive" className="rounded-lg" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <ProgressBar value={progress} />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <Button className="rounded-lg" onClick={handleSaveProgress}>Update progress</Button>
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-semibold text-foreground">Subskills / Modules</div>
                  <div className="space-y-2">
                    {subskillItems.length > 0 ? subskillItems.map((item, index) => (
                      <div key={item.id || `${item.title}-${index}`} className="flex items-center gap-3 rounded-lg border border-border p-3">
                        <input
                          type="checkbox"
                          checked={Boolean(item.done)}
                          onChange={() => toggleSubskill(index)}
                          className="h-4 w-4 rounded border-border"
                        />
                        <input
                          value={item.title}
                          onChange={(e) => setSubskillItems((prev) => prev.map((current, itemIndex) => (
                            itemIndex === index ? { ...current, title: e.target.value } : current
                          )))}
                          className="flex-1 bg-transparent text-sm text-foreground outline-none"
                        />
                        <button type="button" onClick={() => removeSubskill(index)} className="btn-icon h-8 w-8 text-muted-foreground hover:text-red-500" aria-label="Remove subskill">
                          <MinusCircle className="h-4 w-4" />
                        </button>
                      </div>
                    )) : <p className="text-sm text-muted-foreground">No subskills yet.</p>}
                  </div>
                  <Textarea
                    rows={5}
                    placeholder="Add subskills, one per line"
                    value={newSubskillInput}
                    onChange={(e) => setNewSubskillInput(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" className="rounded-lg" onClick={handleAddSubskills}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add to checklist
                    </Button>
                    <Button type="button" className="rounded-lg" onClick={handleSaveSubskills}>
                      Save subskills
                    </Button>
                    <Button type="button" variant="outline" className="rounded-lg" onClick={handleGenerateSubskills} disabled={aiLoading}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate with AI
                    </Button>
                    <Button type="button" variant="outline" className="rounded-lg" onClick={handleEstimate} disabled={aiLoading}>
                      Estimate time
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  rows={8}
                  placeholder="Write markdown-style notes here..."
                  value={noteValue}
                  onChange={(e) => setNoteValue(e.target.value)}
                />
                <Button className="rounded-lg" onClick={handleSaveNotes}>Save notes</Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5">
            <Card className="border-border bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Linked Tasks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {linkedTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tasks linked to this skill yet.</p>
                ) : linkedTasks.map((task) => (
                  <div key={task.id} className="rounded-lg border border-border p-3">
                    <p className="font-semibold text-foreground text-sm">{task.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{task.priority} - {task.status}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <AIActionPanel
              title="AI Actions"
              actions={[
                { key: 'subskills', label: 'Generate subskills', onClick: handleGenerateSubskills },
                { key: 'estimate', label: 'Estimate time', onClick: handleEstimate },
              ]}
              result={aiResult}
            />
          </div>
        </div>

        <ConfirmModal
          isOpen={confirmDelete}
          title="Delete skill?"
          message="This removes the skill and its saved progress from your learning map."
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
          onConfirm={handleDeleteSkill}
          onCancel={() => setConfirmDelete(false)}
        />
      </div>
    </AppShell>
  )
}

export default SkillDetail
