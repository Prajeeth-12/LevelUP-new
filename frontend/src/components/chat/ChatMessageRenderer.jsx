import React, { useState } from 'react'
import { Check, Copy, Code2, ExternalLink } from 'lucide-react'

// Code block with copy button
const CodeBlock = ({ code, language }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-2 rounded-xl overflow-hidden border border-border bg-gray-950 text-gray-100 text-[11px]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-900 border-b border-gray-800 text-[10px] text-gray-400 font-mono">
        <span>{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-3 overflow-x-auto font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}

// Inline formatting helper (handles **bold**, *italic*, `code`, and links)
const renderInlineText = (text) => {
  if (!text) return ''

  // Split by bold (**...**) and inline code (`...`)
  const parts = []
  let remaining = text

  // Regex to match **bold** or `code` or *italic*
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g
  let lastIndex = 0
  let match

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index))
    }

    const token = match[0]
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-bold text-foreground">
          {token.slice(2, -2)}
        </strong>
      )
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded-md bg-secondary text-orange-600 dark:text-orange-400 font-mono text-[11px] font-semibold border border-border/60"
        >
          {token.slice(1, -1)}
        </code>
      )
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={match.index} className="italic text-foreground/90">
          {token.slice(1, -1)}
        </em>
      )
    } else if (token.startsWith('[') && token.includes('](')) {
      const labelMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/)
      if (labelMatch) {
        parts.push(
          <a
            key={match.index}
            href={labelMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-600 dark:text-orange-400 underline font-semibold inline-flex items-center gap-0.5"
          >
            {labelMatch[1]}
            <ExternalLink className="w-2.5 h-2.5 inline" />
          </a>
        )
      }
    }

    lastIndex = pattern.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return parts.length > 0 ? parts : text
}

export const ChatMessageRenderer = ({ content }) => {
  if (!content) return null

  // 1. JSON Auto-Recovery: if the content is a stringified JSON object with "reply"
  let cleanContent = content
  if (typeof content === 'string' && content.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(content.trim())
      if (parsed && typeof parsed.reply === 'string') {
        cleanContent = parsed.reply
      }
    } catch {
      // Not JSON, continue with markdown rendering
    }
  }

  // 2. Parse Code Blocks
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\r?\n([\s\S]*?)```/g
  const sections = []
  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(cleanContent)) !== null) {
    if (match.index > lastIndex) {
      sections.push({
        type: 'text',
        content: cleanContent.substring(lastIndex, match.index)
      })
    }

    sections.push({
      type: 'code',
      language: match[1] || 'plaintext',
      code: match[2].trimEnd()
    })

    lastIndex = codeBlockRegex.lastIndex
  }

  if (lastIndex < cleanContent.length) {
    sections.push({
      type: 'text',
      content: cleanContent.substring(lastIndex)
    })
  }

  return (
    <div className="space-y-2 text-xs leading-relaxed text-foreground">
      {sections.map((sec, secIdx) => {
        if (sec.type === 'code') {
          return <CodeBlock key={secIdx} code={sec.code} language={sec.language} />
        }

        // Split text section into lines
        const lines = sec.content.split('\n')
        const elements = []
        let currentList = []
        let listType = null // 'ordered' | 'unordered'

        const flushList = () => {
          if (currentList.length > 0) {
            if (listType === 'ordered') {
              elements.push(
                <ol key={`ol-${elements.length}`} className="my-1.5 space-y-1.5 pl-1">
                  {currentList.map((item, li) => (
                    <li key={li} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-orange-500/20">
                        {li + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        {renderInlineText(item)}
                      </div>
                    </li>
                  ))}
                </ol>
              )
            } else {
              elements.push(
                <ul key={`ul-${elements.length}`} className="my-1.5 space-y-1 pl-1">
                  {currentList.map((item, li) => (
                    <li key={li} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 mt-1.5" />
                      <div className="flex-1 min-w-0">
                        {renderInlineText(item)}
                      </div>
                    </li>
                  ))}
                </ul>
              )
            }
            currentList = []
            listType = null
          }
        }

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) {
            flushList()
            continue
          }

          // Check numbered list: "1. item", "2. item"
          const orderedMatch = line.match(/^(\d+)[.)]\s+(.+)$/)
          if (orderedMatch) {
            if (listType !== 'ordered') flushList()
            listType = 'ordered'
            currentList.push(orderedMatch[2])
            continue
          }

          // Check unordered list: "- item", "* item", "• item"
          const unorderedMatch = line.match(/^[-*•]\s+(.+)$/)
          if (unorderedMatch) {
            if (listType !== 'unordered') flushList()
            listType = 'unordered'
            currentList.push(unorderedMatch[1])
            continue
          }

          // Not a list item
          flushList()

          // Check headings
          if (line.startsWith('### ')) {
            elements.push(
              <h4 key={`h3-${i}`} className="font-bold text-sm text-foreground mt-2 mb-1">
                {renderInlineText(line.replace(/^###\s+/, ''))}
              </h4>
            )
          } else if (line.startsWith('## ')) {
            elements.push(
              <h3 key={`h2-${i}`} className="font-bold text-base text-foreground font-serif italic mt-2.5 mb-1">
                {renderInlineText(line.replace(/^##\s+/, ''))}
              </h3>
            )
          } else if (line.startsWith('# ')) {
            elements.push(
              <h2 key={`h1-${i}`} className="font-bold text-base text-foreground font-serif italic mt-3 mb-1">
                {renderInlineText(line.replace(/^#\s+/, ''))}
              </h2>
            )
          } else {
            // Normal paragraph
            elements.push(
              <p key={`p-${i}`} className="leading-relaxed">
                {renderInlineText(line)}
              </p>
            )
          }
        }

        flushList()

        return <React.Fragment key={secIdx}>{elements}</React.Fragment>
      })}
    </div>
  )
}
