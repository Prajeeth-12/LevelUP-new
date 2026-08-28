import React, { useMemo, useState } from 'react'
import { Plus, X, Layers3, Target, ArrowRight, BookOpen, Trash2, Zap } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { PageHeader } from '../components/ui/PageHeader'
import { SkillCard } from '../components/learning/SkillCard'
import ConfirmModal from '../components/ConfirmModal'
import { useSkills } from '../contexts/SkillContext'
import { AnimatePresence, motion } from 'framer-motion'

const emptyCategory = { name: '', description: '' }
const emptySkill = {
  name: '', categoryId: '', description: '',
  priority: 'MEDIUM', progress: 0, status: 'NOT_STARTED',
  notes: '', subskills: [],
}

// ─── Slide-Over Panel ──────────────────────────────────────────────────────────
const SlideOver = ({ title, isOpen, onClose, onSubmit, children, actions }) => {
  if (!isOpen) return null
  return (
    <>
      <div className="slideover-backdrop" onClick={onClose} />
      <div className="slideover-panel" role="dialog" aria-modal="true" aria-labelledby="skills-slideover-title">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 id="skills-slideover-title" className="text-base font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="btn-icon" aria-label="Close panel"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {children}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 shrink-0">
          <button onClick={onClose} className="btn-outline flex-1">Cancel</button>
          {actions}
        </div>
      </div>
    </>
  )
}

// ─── Skills Page ─────────────────────────────────────────────────────────────
const Skills = () => {
  const { categories, skills, loading, createCategory, updateCategory, deleteCategory, createSkill, updateSkill, deleteSkill } = useSkills()
  
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showSkillForm, setShowSkillForm]       = useState(false)
  
  const [categoryForm, setCategoryForm]         = useState(emptyCategory)
  const [skillForm, setSkillForm]               = useState(emptySkill)
  
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [editingSkillId, setEditingSkillId]       = useState(null)
  const [subskillText, setSubskillText]           = useState('')
  const [confirmDelete, setConfirmDelete]         = useState(null)

  const skillsByCategory = useMemo(() => {
    return categories.map((cat) => ({
      ...cat,
      items: skills.filter((s) => s.categoryId === cat.id),
    }))
  }, [categories, skills])

  // ── Category Handlers ──
  const handleEditCategory = (cat) => {
    setEditingCategoryId(cat.id)
    setCategoryForm({ name: cat.name || '', description: cat.description || '' })
    setShowCategoryForm(true)
  }

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) return
    if (editingCategoryId) await updateCategory(editingCategoryId, categoryForm)
    else await createCategory(categoryForm)
    setShowCategoryForm(false)
  }

  const handleDeleteCategory = async () => {
    if (!editingCategoryId) return
    await deleteCategory(editingCategoryId)
    setConfirmDelete(null)
    setShowCategoryForm(false)
  }

  // ── Skill Handlers ──
  const handleEditSkill = (skill) => {
    setEditingSkillId(skill.id)
    setSkillForm({
      name: skill.name || '', categoryId: skill.categoryId || '',
      description: skill.description || '', priority: skill.priority || 'MEDIUM',
      progress: skill.progress || 0, status: skill.status || 'NOT_STARTED',
      notes: skill.notes || '', subskills: skill.subskills || [],
    })
    setSubskillText((skill.subskills || []).map(i => i.title || i).join('\n'))
    setShowSkillForm(true)
  }

  const handleSaveSkill = async () => {
    if (!skillForm.name.trim() || !skillForm.categoryId) return
    const payload = {
      ...skillForm,
      subskills: subskillText ? subskillText.split('\n').map(i => i.trim()).filter(Boolean) : skillForm.subskills || [],
    }
    if (editingSkillId) await updateSkill(editingSkillId, payload)
    else await createSkill(payload)
    setShowSkillForm(false)
  }

  const handleDeleteSkill = async () => {
    if (!editingSkillId) return
    await deleteSkill(editingSkillId)
    setConfirmDelete(null)
    setShowSkillForm(false)
  }

  return (
    <AppShell>
      <div className="page-container animate-fade-slide-in">
        <PageHeader 
          title="Skills" 
          subtitle="Map out your knowledge base. Group skills by categories and track your mastery." 
          actions={
            <>
              <button 
                onClick={() => { setEditingCategoryId(null); setCategoryForm(emptyCategory); setShowCategoryForm(true) }}
                className="btn-outline text-xs"
              >
                <Layers3 className="w-4 h-4" /> New Category
              </button>
              <button 
                onClick={() => { setEditingSkillId(null); setSkillForm(emptySkill); setSubskillText(''); setShowSkillForm(true) }}
                className="btn-primary text-xs"
              >
                <Plus className="w-4 h-4" /> Add Skill
              </button>
            </>
          }
        />
      
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-black" />
        </div>
      ) : categories.length === 0 ? (
        <div className="empty-state py-16">
          <div className="empty-state-icon bg-gray-100 text-gray-600">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mt-4">Start your learning map</h3>
          <p className="text-sm text-gray-600 mt-2 max-w-sm mb-6">
            Create categories like "Frontend", "Backend", or "Soft Skills" to organize what you want to learn.
          </p>
          <button onClick={() => setShowCategoryForm(true)} className="btn-primary">
            Create First Category
          </button>
        </div>
      ) : (
        <div className="space-y-12">
          {skillsByCategory.map(cat => (
            <div key={cat.id}>
              {/* Category Header */}
              <div className="flex items-center justify-between mb-5 group">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    {cat.name}
                    <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {cat.items.length}
                    </span>
                  </h2>
                  {cat.description && <p className="text-sm text-gray-600 mt-1">{cat.description}</p>}
                </div>
                <button 
                  onClick={() => handleEditCategory(cat)}
                  className="btn-ghost text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Edit Category
                </button>
              </div>

              {/* Grid of skills */}
              {cat.items.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center bg-gray-50">
                  <p className="text-sm text-gray-500">No skills in this category yet.</p>
                  <button 
                    onClick={() => { setEditingSkillId(null); setSkillForm({ ...emptySkill, categoryId: cat.id }); setSubskillText(''); setShowSkillForm(true) }}
                    className="mt-3 text-sm font-semibold text-black hover:text-gray-700"
                  >
                    + Add a skill
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cat.items.map(skill => (
                    <SkillCard key={skill.id} skill={skill} onEdit={handleEditSkill} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Forms ── */}
      <AnimatePresence>
        {/* Category Form */}
        <SlideOver
          key="category-slideover"
          isOpen={showCategoryForm}
          onClose={() => setShowCategoryForm(false)}
          title={editingCategoryId ? 'Edit Category' : 'New Category'}
          actions={
            <>
              {editingCategoryId && (
                <button onClick={() => setConfirmDelete('category')} className="btn-icon w-auto px-3 text-red-500 hover:bg-red-50" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button onClick={handleSaveCategory} disabled={!categoryForm.name.trim()} className="btn-primary flex-[2]">
                {editingCategoryId ? 'Save Changes' : 'Create Category'}
              </button>
            </>
          }
        >
          <div>
            <label className="label-base">Category Name</label>
            <input autoFocus className="input-base" value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} placeholder="e.g. Frontend Development" />
          </div>
          <div>
            <label className="label-base">Description (Optional)</label>
            <textarea className="input-base resize-none" rows={3} value={categoryForm.description} onChange={e => setCategoryForm({...categoryForm, description: e.target.value})} placeholder="What kind of skills live here?" />
          </div>
        </SlideOver>

        {/* Skill Form */}
        <SlideOver
          key="skill-slideover"
          isOpen={showSkillForm}
          onClose={() => setShowSkillForm(false)}
          title={editingSkillId ? 'Edit Skill' : 'New Skill'}
          actions={
            <>
              {editingSkillId && (
                <button onClick={() => setConfirmDelete('skill')} className="btn-icon w-auto px-3 text-red-500 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button onClick={handleSaveSkill} disabled={!skillForm.name.trim() || !skillForm.categoryId} className="btn-primary flex-[2]">
                {editingSkillId ? 'Save Skill' : 'Add Skill'}
              </button>
            </>
          }
        >
          <div>
            <label className="label-base">Skill Name</label>
            <input autoFocus className="input-base" value={skillForm.name} onChange={e => setSkillForm({...skillForm, name: e.target.value})} placeholder="e.g. React.js" />
          </div>
          
          <div>
            <label className="label-base">Category</label>
            <select className="input-base" value={skillForm.categoryId} onChange={e => setSkillForm({...skillForm, categoryId: e.target.value})}>
              <option value="">Select a category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="label-base">Description</label>
            <textarea className="input-base resize-none" rows={2} value={skillForm.description} onChange={e => setSkillForm({...skillForm, description: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-base">Status</label>
              <select className="input-base" value={skillForm.status} onChange={e => setSkillForm({...skillForm, status: e.target.value})}>
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            <div>
              <label className="label-base">Priority</label>
              <select className="input-base" value={skillForm.priority} onChange={e => setSkillForm({...skillForm, priority: e.target.value})}>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <label className="label-base mb-0">Progress</label>
              <span className="text-xs font-bold text-black">{skillForm.progress}%</span>
            </div>
            <input type="range" min="0" max="100" value={skillForm.progress} onChange={e => setSkillForm({...skillForm, progress: Number(e.target.value)})} className="w-full accent-indigo-600" />
          </div>

          <div>
            <label className="label-base">Key Topics / Modules</label>
            <textarea className="input-base resize-none" rows={3} value={subskillText} onChange={e => setSubskillText(e.target.value)} placeholder="Hooks&#10;Context API&#10;Redux" />
            <p className="text-[10px] text-gray-500 mt-1">One item per line</p>
          </div>
        </SlideOver>
      </AnimatePresence>

      <ConfirmModal
        isOpen={Boolean(confirmDelete)}
        title={confirmDelete === 'category' ? 'Delete category?' : 'Delete skill?'}
        message={
          confirmDelete === 'category'
            ? 'This removes the category. Skills inside may become uncategorized.'
            : 'This removes the skill and its progress from your learning map.'
        }
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmDelete === 'category' ? handleDeleteCategory : handleDeleteSkill}
        onCancel={() => setConfirmDelete(null)}
      />

      </div>
    </AppShell>
  )
}

export default Skills
