import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Bot, MessageSquareText } from 'lucide-react'

export const AIChatButton = ({ onClick, isOpen }) => {
  if (isOpen) return null

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      whileHover={{ scale: 1.06, y: -2 }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className="fixed bottom-20 md:bottom-8 right-6 z-50 flex items-center gap-3 px-4 sm:px-5 py-3.5 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white font-bold text-xs sm:text-sm shadow-[0_10px_25px_-5px_rgba(124,58,237,0.6),0_8px_10px_-6px_rgba(124,58,237,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(124,58,237,0.8)] transition-all border border-white/30 group cursor-pointer"
      title="AI Assistant (Ctrl + /)"
      aria-label="Open LevelUP AI Assistant Chatbot"
    >
      <div className="relative flex items-center justify-center">
        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-white transition-transform group-hover:rotate-12 group-hover:scale-110" />
        </div>
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white/60" />
      </div>

      <div className="flex items-center gap-1.5">
        <span className="tracking-tight text-white font-semibold whitespace-nowrap">
          Ask AI Assistant
        </span>
        <span className="hidden lg:inline-flex px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-black/25 text-white/90 border border-white/10">
          Ctrl + /
        </span>
      </div>
    </motion.button>
  )
}

export default AIChatButton
