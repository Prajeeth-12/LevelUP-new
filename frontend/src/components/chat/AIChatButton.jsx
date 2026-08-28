import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Bot, MessageSquare } from 'lucide-react'

export const AIChatButton = ({ onClick, isOpen }) => {
  if (isOpen) return null

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-linear-to-r from-violet-600 to-indigo-600 text-white font-semibold text-xs shadow-xl shadow-violet-600/30 hover:shadow-violet-600/50 transition-all border border-white/20 group cursor-pointer"
      title="AI Assistant (Ctrl + /)"
      aria-label="Open AI Assistant Chatbot"
    >
      <div className="relative">
        <Sparkles className="w-4 h-4 transition-transform group-hover:rotate-12" />
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
      </div>
      <span className="tracking-tight hidden sm:inline">Ask AI Assistant</span>
      <span className="hidden md:inline px-1.5 py-0.5 rounded text-[10px] bg-white/20 text-white/90 font-mono">
        Ctrl + /
      </span>
    </motion.button>
  )
}

export default AIChatButton
