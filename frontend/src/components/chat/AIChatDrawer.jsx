import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Send, X, RotateCcw, Bot, User, ArrowRight,
  CheckCircle2, ListTodo, Layers3, Flame, Clock, AlertCircle,
  HelpCircle, ChevronRight, Zap, RefreshCw, Compass
} from 'lucide-react'
import { useTasks } from '../../contexts/TaskContext'
import { useSkills } from '../../contexts/SkillContext'
import { useRoadmap } from '../../contexts/RoadmapContext'
import { sendChatMessage } from '../../services/aiService'

const STARTER_PROMPTS = [
  { label: '🚀 What should I learn next?', prompt: 'Based on my active skills and roadmaps, what should I learn next to level up my career?' },
  { label: '📋 Plan today\'s high-priority tasks', prompt: 'Look at my current tasks and suggest the top 2 tasks I should focus on today, and help me create them if needed.' },
  { label: '🎯 Create a task for tomorrow', prompt: 'Add a high priority task for me: "Study System Design Scalability" due tomorrow at 6:00 PM.' },
  { label: '🎙️ Mock Interview Question', prompt: 'Give me 1 challenging interview question based on my top tracked skills, and review my answer when I reply.' },
]

export const AIChatDrawer = ({ isOpen, onClose }) => {
  const { tasks, createTask, moveToStatus, setTaskPriority, deleteTask } = useTasks()
  const { skills, createSkill, updateSkill } = useSkills()
  const { roadmap, activeRoadmapId } = useRoadmap()

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: '👋 Hi! I am your **LevelUP AI Career & Study Assistant** powered by MiniMax-M3. I have live access to your skills, tasks, and roadmaps.\n\nYou can ask me anything, practice interview questions, or ask me to **create, organize, and edit your tasks and skills** directly!',
      suggestedFollowUps: [
        'What should I learn next?',
        'Add a task: Review React hooks tomorrow',
        'Give me a mock interview question'
      ],
      actionsExecuted: []
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
        scrollToBottom()
      }, 150)
    }
  }, [isOpen, messages])

  // Handle action execution on client contexts
  const executeActions = async (actions) => {
    if (!Array.isArray(actions) || actions.length === 0) return []

    const executed = []
    for (const act of actions) {
      try {
        if (act.type === 'CREATE_TASK' && act.data?.title) {
          const item = await createTask({
            title: act.data.title,
            priority: act.data.priority || 'MEDIUM',
            status: act.data.status || 'NOT_STARTED',
            deadline: act.data.deadline || '',
            notes: act.data.notes || ''
          })
          executed.push({
            type: 'CREATE_TASK',
            label: `Created task: "${act.data.title}"`,
            details: `${act.data.priority || 'MEDIUM'} Priority • ${act.data.status === 'IN_PROGRESS' ? 'Current' : 'To Do'}`
          })
        } else if (act.type === 'UPDATE_TASK_STATUS') {
          // Find matching task by ID or title
          const targetTask = tasks.find(t => t.id === act.data.taskId || t.title?.toLowerCase() === act.data.taskTitle?.toLowerCase())
          if (targetTask) {
            await moveToStatus(targetTask.id, act.data.status || 'IN_PROGRESS')
            executed.push({
              type: 'UPDATE_TASK_STATUS',
              label: `Moved "${targetTask.title}" to ${act.data.status === 'COMPLETED' ? 'Past' : act.data.status === 'IN_PROGRESS' ? 'Current' : 'To Do'}`
            })
          }
        } else if (act.type === 'UPDATE_TASK_PRIORITY') {
          const targetTask = tasks.find(t => t.id === act.data.taskId || t.title?.toLowerCase() === act.data.taskTitle?.toLowerCase())
          if (targetTask) {
            await setTaskPriority(targetTask.id, act.data.priority || 'HIGH')
            executed.push({
              type: 'UPDATE_TASK_PRIORITY',
              label: `Updated "${targetTask.title}" priority to ${act.data.priority}`
            })
          }
        } else if (act.type === 'DELETE_TASK') {
          const targetTask = tasks.find(t => t.id === act.data.taskId || t.title?.toLowerCase() === act.data.taskTitle?.toLowerCase())
          if (targetTask) {
            await deleteTask(targetTask.id)
            executed.push({
              type: 'DELETE_TASK',
              label: `Deleted task: "${targetTask.title}"`
            })
          }
        } else if (act.type === 'UPDATE_SKILL_PROGRESS') {
          const targetSkill = skills.find(s => s.id === act.data.skillId || s.name?.toLowerCase() === act.data.skillName?.toLowerCase() || s.title?.toLowerCase() === act.data.skillName?.toLowerCase())
          if (targetSkill) {
            await updateSkill(targetSkill.id, { progress: Math.min(100, Math.max(0, act.data.progress || 0)) })
            executed.push({
              type: 'UPDATE_SKILL_PROGRESS',
              label: `Updated "${targetSkill.name || targetSkill.title}" progress to ${act.data.progress}%`
            })
          }
        } else if (act.type === 'CREATE_SKILL' && act.data?.title) {
          await createSkill({
            title: act.data.title,
            category: act.data.categoryName || 'General',
            priority: act.data.priority || 'MEDIUM',
            progress: act.data.progress || 0
          })
          executed.push({
            type: 'CREATE_SKILL',
            label: `Added new skill: "${act.data.title}"`
          })
        }
      } catch (err) {
        console.warn('Action execution error:', err)
      }
    }
    return executed
  }

  const handleSendMessage = async (textToSend) => {
    const queryText = (textToSend || input).trim()
    if (!queryText || loading) return

    const userMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content: queryText
    }

    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    // Build context payload
    const context = {
      trackedSkills: skills.map(s => ({ id: s.id, name: s.name || s.title, progress: s.progress, status: s.status })),
      tasks: tasks.map(t => ({ id: t.id, title: t.title, priority: t.priority, status: t.status, deadline: t.deadline })),
      activeRoadmap: roadmap ? { title: roadmap.title, phasesCount: roadmap.phases?.length } : null
    }

    try {
      const response = await sendChatMessage({
        messages: nextMessages.map(m => ({ role: m.role, content: m.content })),
        context
      })

      // Execute any returned actionable changes
      const executed = await executeActions(response.actions || [])

      const aiMessage = {
        id: 'ai_' + Date.now(),
        role: 'assistant',
        content: response.reply || 'Here is what I found for you!',
        suggestedFollowUps: response.suggestedFollowUps || [],
        actionsExecuted: executed
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (err) {
      console.error('Chat request failed:', err)
      setMessages(prev => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'assistant',
          content: '⚠️ I encountered an issue connecting to the AI engine. Please check your network or try again in a moment.',
          suggestedFollowUps: ['Retry', 'Check my tasks']
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome_reset',
        role: 'assistant',
        content: '🔄 Conversation reset. How can I help you level up today?',
        suggestedFollowUps: [
          'What should I learn next?',
          'Plan today\'s tasks',
          'Practice interview questions'
        ],
        actionsExecuted: []
      }
    ])
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        className="relative w-full max-w-lg bg-card shadow-2xl h-full flex flex-col z-10 border-l border-border"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-chat-title"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="ai-chat-title" className="text-sm font-bold text-foreground">
                  LevelUP AI Assistant
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Voice & text AI tutor • DSA, system design & tasks editor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleResetChat}
              title="Reset chat"
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
          {messages.map((msg) => {
            const isUser = msg.role === 'user'
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[85%] space-y-2`}>
                  {/* Bubble Content */}
                  <div
                    className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-orange-600 text-white font-medium rounded-tr-xs shadow-2xs'
                        : 'bg-card border border-border text-foreground shadow-2xs rounded-tl-xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans">
                      {msg.content}
                    </div>
                  </div>

                  {/* Actions Executed Banner */}
                  {msg.actionsExecuted && msg.actionsExecuted.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {msg.actionsExecuted.map((act, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[11px]"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <div>
                            <div className="font-bold">{act.label}</div>
                            {act.details && <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">{act.details}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Suggested Follow-Ups */}
                  {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.suggestedFollowUps.map((chip, idx) => (
                        <button
                          key={idx}
                          disabled={loading}
                          onClick={() => handleSendMessage(chip)}
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-card text-foreground border border-border hover:border-orange-500/50 hover:text-orange-600 dark:hover:text-orange-400 transition-all text-left flex items-center gap-1 shadow-2xs"
                        >
                          <span>{chip}</span>
                          <ChevronRight className="w-3 h-3 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-secondary border border-border text-foreground flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            )
          })}

          {loading && (
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div className="p-3 rounded-2xl bg-card border border-border flex items-center gap-2 text-xs text-muted-foreground">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-600" />
                <span>Thinking & analyzing context...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Starter Prompts (if chat is fresh) */}
        {messages.length === 1 && (
          <div className="px-4 py-2 border-t border-border bg-card/80">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Quick Suggestions
            </div>
            <div className="grid grid-cols-2 gap-2">
              {STARTER_PROMPTS.map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(item.prompt)}
                  className="p-2.5 rounded-2xl text-left bg-secondary/50 border border-border hover:border-orange-500/50 hover:bg-orange-500/10 transition-all text-[11px] font-medium text-foreground line-clamp-2"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Footer */}
        <div className="p-4 border-t border-border bg-card shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask anything, practice interview questions, or manage tasks..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 input-base py-2.5 text-xs font-medium rounded-2xl"
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="py-2.5 px-4 rounded-2xl shrink-0 inline-flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold transition-all shadow-xs disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

export default AIChatDrawer
