import React from 'react'

export const PageHeader = ({ title, subtitle, eyebrow = 'LEVELUP • PERSONAL LEARNING OS', actions }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
      <div className="space-y-1.5 max-w-3xl">
        {eyebrow && (
          <p className="text-[10px] font-bold tracking-[0.24em] uppercase text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-normal">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}

export default PageHeader
