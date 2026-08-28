import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Send, X, RotateCcw, Bot, User, ArrowRight,
  CheckCircle2, ListTodo, Layers3, Flame, Clock, AlertCircle,
  HelpCircle, ChevronRight, Zap, RefreshCw, Compass, Mic, MicOff,
  Volume2, VolumeX, Image as ImageIcon, Check, Paperclip, ShieldCheck, Play, Square
} from 'lucide-react'
import { useTasks } from '../../contexts/TaskContext'
import { useSkills } from '../../contexts/SkillContext'
import { useRoadmap } from '../../contexts/RoadmapContext'
import { sendChatMessage } from '../../services/aiService'
import { ChatMessageRenderer } from './ChatMessageRenderer'

const STARTER_PROMPTS = [
  { label: '🚀 What should I learn next?', prompt: 'Based on my active skills and roadmaps, what should I learn next to level up my career?' },
  { label: "📋 Plan today's high-priority tasks", prompt: 'Look at my current tasks and suggest the top 2 tasks I should focus on today, and help me create them.' },
  { label: '🔍 Inspect GitHub Repo', prompt: 'Here is my GitHub repository: https://github.com/facebook/react. Please analyze the architecture and suggest 3 skill tasks.' },
  { label: '🎙️ Mock Interview Question', prompt: 'Give me 1 challenging technical interview question based on my top tracked skills, and critique my answer.' },
]

export const AIChatDrawer = ({ isOpen, onClose }) => {
  const { tasks, createTask, moveToStatus, setTaskPriority, deleteTask } = useTasks()
  const { skills, createSkill, updateSkill } = useSkills()
  const { roadmap, activeRoadmapId } = useRoadmap()

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: '👋 Hi! I am your **LevelUP AI Career & Study Assistant** powered by MiniMax-M3.\n\nI can help you:\n- **Voice-first tutoring & interview practice**\n- **Inspect architecture diagrams & GitHub repos**\n- **Suggest & organize your Kanban tasks & skills** (with your approval)\n\nWhat would you like to level up today?',
      suggestedFollowUps: [
        'What should I learn next?',
        'Add a task: Review React hooks tomorrow',
        'Inspect an architecture diagram'
      ],
      pendingActions: [],
      actionsExecuted: []
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [imageAttachment, setImageAttachment] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)
  const recognitionRef = useRef(null)

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

  // Speech Synthesis Helper
  const speakText = (text) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    
    // Clean markdown symbols for natural speech
    const cleanSpeech = text
      .replace(/[*#`_~]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\n+/g, '. ')

    const utterance = new SpeechSynthesisUtterance(cleanSpeech)
    utterance.rate = 1.05
    utterance.pitch = 1.0
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  // Speech Recognition (Voice Input)
  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.')
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => setIsRecording(true)
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(r => r[0].transcript)
          .join('')
        setInput(transcript)
      }
      recognition.onerror = (e) => {
        console.warn('Speech recognition error:', e)
        setIsRecording(false)
      }
      recognition.onend = () => {
        setIsRecording(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (e) {
      console.warn('Recognition start failed:', e)
      setIsRecording(false)
    }
  }

  // Image Upload Handling
  const handleImageFile = (f) => {
    if (!f || !f.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      setImageAttachment(e.target.result)
    }
    reader.readAsDataURL(f)
  }

  // Handle action execution with Human Approval
  const executeApprovedActions = async (msgId, actionsToRun) => {
    if (!Array.isArray(actionsToRun) || actionsToRun.length === 0) return

    const executed = []
    for (const act of actionsToRun) {
      try {
        if (act.type === 'CREATE_TASK' && act.data?.title) {
          await createTask({
            title: act.data.title,
            priority: act.data.priority || 'MEDIUM',
            status: act.data.status || 'NOT_STARTED',
            deadline: act.data.deadline || '',
            notes: act.data.notes || ''
          })
          executed.push({
            type: 'CREATE_TASK',
            label: `Added Task: "${act.data.title}"`,
            details: `${act.data.priority || 'MEDIUM'} Priority • ${act.data.status === 'IN_PROGRESS' ? 'Current' : 'To Do'}`
          })
        } else if (act.type === 'UPDATE_TASK_STATUS') {
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
            name: act.data.title,
            category: act.data.categoryName || 'Skill Gap',
            priority: act.data.priority || 'MEDIUM',
            status: 'NOT_STARTED',
            progress: 0,
            description: act.data.description || 'Added from AI recommendations',
            subskills: act.data.subskills || []
          })
          executed.push({
            type: 'CREATE_SKILL',
            label: `Added Skill to Portfolio: "${act.data.title}"`
          })
        }
      } catch (err) {
        console.warn('Action execution error:', err)
      }
    }

    // Update message state to show executed status and remove pending
    setMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        return {
          ...m,
          pendingActions: [],
          actionsExecuted: [...(m.actionsExecuted || []), ...executed]
        }
      }
      return m
    }))
  }

  const dismissPendingActions = (msgId) => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        return { ...m, pendingActions: [] }
      }
      return m
    }))
  }

  const handleSendMessage = async (textToSend) => {
    const queryText = (textToSend || input).trim()
    const attachedImg = imageAttachment
    if ((!queryText && !attachedImg) || loading) return

    const userMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content: queryText,
      image: attachedImg
    }

    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setImageAttachment(null)
    setLoading(true)

    // Build context payload
    const context = {
      trackedSkills: skills.map(s => ({ id: s.id, name: s.name || s.title, progress: s.progress, status: s.status })),
      tasks: tasks.map(t => ({ id: t.id, title: t.title, priority: t.priority, status: t.status, deadline: t.deadline })),
      activeRoadmap: roadmap ? { title: roadmap.title, phasesCount: roadmap.phases?.length } : null
    }

    try {
      const response = await sendChatMessage({
        messages: nextMessages.map(m => ({
          role: m.role,
          content: m.content,
          image: m.image
        })),
        context
      })

      // Extract reply, actions, and follow-ups
      let replyText = response?.reply || response?.content || ''
      let actions = response?.actions || []
      let followUps = response?.suggestedFollowUps || []

      if (typeof response === 'string') {
        try {
          const p = JSON.parse(response)
          if (p.reply) {
            replyText = p.reply
            actions = p.actions || actions
            followUps = p.suggestedFollowUps || followUps
          } else {
            replyText = response
          }
        } catch {
          replyText = response
        }
      }

      if (typeof replyText === 'string' && replyText.trim().startsWith('{')) {
        try {
          const p = JSON.parse(replyText.trim())
          if (p.reply) {
            replyText = p.reply
            if (Array.isArray(p.actions)) actions = p.actions
            if (Array.isArray(p.suggestedFollowUps)) followUps = p.suggestedFollowUps
          }
        } catch {
          // not json
        }
      }

      const aiMessage = {
        id: 'ai_' + Date.now(),
        role: 'assistant',
        content: replyText || 'Here is what I found for you!',
        suggestedFollowUps: followUps,
        pendingActions: actions, // REQUIRES HUMAN APPROVAL
        actionsExecuted: []
      }

      setMessages(prev => [...prev, aiMessage])
      speakText(aiMessage.content)
    } catch (err) {
      console.error('Chat request failed:', err)
      setMessages(prev => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'assistant',
          content: '⚠️ I encountered an issue connecting to the AI engine. Please check your network or try again.',
          suggestedFollowUps: ['Retry', 'Check my tasks'],
          pendingActions: [],
          actionsExecuted: []
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleResetChat = () => {
    stopSpeaking()
    setMessages([
      {
        id: 'welcome_reset',
        role: 'assistant',
        content: '🔄 Conversation reset. How can I help you level up today?',
        suggestedFollowUps: [
          'What should I learn next?',
          "Plan today's tasks",
          'Practice interview questions'
        ],
        pendingActions: [],
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
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (e.dataTransfer.files?.[0]) handleImageFile(e.dataTransfer.files[0])
        }}
        className={`relative w-full max-w-lg bg-card shadow-2xl h-full flex flex-col z-10 border-l border-border ${
          dragOver ? 'ring-2 ring-orange-500 bg-orange-500/5' : ''
        }`}
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
                Voice & text AI tutor • DSA, vision inspector & tasks scheduler
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Voice Toggle */}
            <button
              onClick={() => {
                if (voiceEnabled) stopSpeaking()
                setVoiceEnabled(!voiceEnabled)
              }}
              title={voiceEnabled ? 'Voice Tutor: ON (Click to mute)' : 'Voice Tutor: OFF (Click to unmute)'}
              className={`p-2 rounded-xl transition-colors ${
                voiceEnabled
                  ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={handleResetChat}
              title="Reset chat"
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => { stopSpeaking(); onClose() }}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Speaking Indicator Banner */}
        {isSpeaking && (
          <div className="px-4 py-1.5 bg-orange-500/10 border-b border-orange-500/20 flex items-center justify-between text-xs text-orange-600 dark:text-orange-400">
            <span className="flex items-center gap-2 font-medium">
              <Volume2 className="w-3.5 h-3.5 animate-pulse" />
              <span>Speaking audio response...</span>
            </span>
            <button onClick={stopSpeaking} className="text-[10px] font-bold hover:underline">
              Stop
            </button>
          </div>
        )}

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
                  {/* User Image Attachment */}
                  {msg.image && (
                    <div className="rounded-2xl overflow-hidden border border-border max-w-[240px] shadow-xs">
                      <img src={msg.image} alt="Uploaded attachment" className="w-full h-auto object-cover max-h-[160px]" />
                    </div>
                  )}

                  {/* Bubble Content */}
                  <div
                    className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-orange-600 text-white font-medium rounded-tr-xs shadow-2xs'
                        : 'bg-card border border-border text-foreground shadow-2xs rounded-tl-xs'
                    }`}
                  >
                    {isUser ? (
                      <div className="whitespace-pre-wrap font-sans">
                        {msg.content}
                      </div>
                    ) : (
                      <ChatMessageRenderer content={msg.content} />
                    )}
                  </div>

                  {/* ✋ HUMAN-IN-THE-LOOP PROPOSED ACTION CARD */}
                  {msg.pendingActions && msg.pendingActions.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-orange-500/5 border border-orange-500/20 space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                          <ShieldCheck className="w-4 h-4 text-orange-500" />
                          <span>Proposed Workspace Changes ({msg.pendingActions.length})</span>
                        </div>
                        <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400">
                          Requires Approval
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {msg.pendingActions.map((act, i) => (
                          <div
                            key={i}
                            className="p-2 rounded-xl bg-card border border-border text-[11px] flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-foreground truncate block">
                                {act.type === 'CREATE_TASK' ? `➕ Task: ${act.data?.title}` :
                                 act.type === 'CREATE_SKILL' ? `🌟 Skill: ${act.data?.title}` :
                                 act.type === 'UPDATE_TASK_STATUS' ? `🔄 Move: ${act.data?.taskTitle} → ${act.data?.status}` :
                                 act.data?.title || 'Proposed Change'}
                              </span>
                              {act.data?.priority && (
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  {act.data.priority} Priority
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => executeApprovedActions(msg.id, msg.pendingActions)}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Approve & Save ({msg.pendingActions.length})</span>
                        </button>
                        <button
                          onClick={() => dismissPendingActions(msg.id)}
                          className="py-1.5 px-3 rounded-xl bg-secondary hover:bg-secondary/80 text-muted-foreground font-semibold text-xs transition-all"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}

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

        {/* Image Attachment Preview */}
        {imageAttachment && (
          <div className="px-4 pt-2 pb-0 bg-card border-t border-border flex items-center gap-2">
            <div className="relative rounded-xl overflow-hidden border border-border w-14 h-14 shrink-0 shadow-2xs">
              <img src={imageAttachment} alt="Attachment" className="w-full h-full object-cover" />
              <button
                onClick={() => setImageAttachment(null)}
                className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/70 text-white hover:bg-black"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <span className="text-xs text-muted-foreground font-medium truncate">
              Architecture image attached • Ready to inspect
            </span>
          </div>
        )}

        {/* Input Footer */}
        <div className="p-4 border-t border-border bg-card shrink-0 space-y-2">
          {isRecording && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
              <span className="flex items-center gap-2 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                Listening... Speak your prompt aloud
              </span>
              <button onClick={toggleRecording} className="text-[11px] font-bold underline">
                Done Speaking
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="flex items-center gap-2"
          >
            {/* Hidden file input for images */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleImageFile(e.target.files[0])
              }}
            />

            {/* Attach Image / Architecture Diagram button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach architecture diagram or code screenshot"
              className="p-2.5 rounded-2xl bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Voice Microphone button */}
            <button
              type="button"
              onClick={toggleRecording}
              title={isRecording ? 'Stop recording' : 'Speak with Voice Tutor'}
              className={`p-2.5 rounded-2xl transition-all ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
              }`}
            >
              <Mic className="w-4 h-4" />
            </button>

            <input
              ref={inputRef}
              type="text"
              placeholder={isRecording ? 'Listening...' : 'Ask anything, paste GitHub link, or manage tasks...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 input-base py-2.5 text-xs font-medium rounded-2xl"
            />

            <button
              type="submit"
              disabled={(!input.trim() && !imageAttachment) || loading}
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
