import React from 'react'

export const ProgressBar = ({ value = 0, className = '' }) => {
  const safeValue = Math.max(0, Math.min(100, Number(value)))

  return (
    <div className={`h-2.5 w-full rounded-full bg-gray-100 dark:bg-accent overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 transition-all"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  )
}
