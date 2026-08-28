import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Bot, User, Sparkles, Loader2 } from 'lucide-react'
import { sendMilestoneChatMessage } from '../../services/recommenderService'

export const RoadmapAIChatDrawer = ({ isOpen, onClose, milestone }) => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([
    'Can you give me starter code for this checkpoint?',
    'What are the most common pitfalls with this milestone?',
    'How do I test that I completed this milestone correctly?'
  ])
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (milestone && isOpen) {
      setMessages([
        {
          role: 'assistant',
          content: `Hi! I'm your AI Mentor for **${milestone.title}**.\n\n` +
                   `Goal: ${milestone.description}\n` +
                   `Checkpoint: ${milestone.checkpoint_project || 'Hands-on practice'}\n\n` +
                   `How can I guide you today? Ask for code examples, architecture breakdowns, or debugging help!`
        }
      ])
    }
  }, [milestone, isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async (textToSend) => {
    const query = textToSend || input
    if (!query.trim() || loading) return

    const newMsgs = [...messages, { role: 'user', content: query }]
    setMessages(newMsgs)
    setInput('')
    setLoading(true)

    try {
      const res = await sendMilestoneChatMessage({
        milestone_context: milestone || {},
        chat_history: newMsgs,
        user_query: query,
      })

      if (res?.reply) {
        setMessages([...newMsgs, { role: 'assistant', content: res.reply }])
        if (res.suggestions?.length) {
          setSuggestions(res.suggestions)
        }
      }
    } catch (e) {
      setMessages([
        ...newMsgs,
        {
          role: 'assistant',
          content: 'I had trouble connecting to the mentor service. Here is a general tip: break down the milestone into 3 small modules and implement tests first!'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden bg-black/30 backdrop-blur-sm flex justify-end">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="relative w-full max-w-md bg-card text-card-foreground border-l border-border h-full shadow-2xl flex flex-col"
        >
          <div className="p-4 border-b border-border flex items-center justify-between bg-accent/20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">AI Milestone Mentor</h3>
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {milestone?.title || 'Interactive Q&A'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`p-3.5 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-foreground text-background font-medium rounded-tr-sm'
                      : 'bg-accent/40 text-foreground border border-border/60 rounded-tl-sm'
                  }`}
                  style={{ whiteSpace: 'pre-line' }}
                >
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-accent text-foreground flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs p-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                <span>AI Mentor is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {suggestions.length > 0 && !loading && (
            <div className="p-2 px-4 border-t border-border/40 bg-accent/10 flex flex-wrap gap-1.5">
              {suggestions.slice(0, 2).map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(sug)}
                  className="text-[11px] bg-card hover:bg-accent border border-border px-2.5 py-1 rounded-full text-foreground/80 hover:text-foreground text-left transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-purple-500 shrink-0" />
                  <span className="truncate max-w-[280px]">{sug}</span>
                </button>
              ))}
            </div>
          )}

          <div className="p-3 border-t border-border bg-card">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about this milestone, code examples, concepts..."
                className="flex-1 bg-accent/40 border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2 bg-foreground text-background rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
export default RoadmapAIChatDrawer
