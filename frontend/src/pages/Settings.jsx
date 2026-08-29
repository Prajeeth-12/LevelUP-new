import React, { useState } from 'react'
import { Database, Download, FileJson } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { useSkills } from '../contexts/SkillContext'
import { useTasks } from '../contexts/TaskContext'
import { exportUserData } from '../services/api'
import { auth } from '../firebase'

const Settings = () => {
  const { categories, skills } = useSkills()
  const { tasks } = useTasks()
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const data = await exportUserData(auth.currentUser?.uid)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'levelup-export.json'
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  return (
    <AppShell>
      <div className="page-container animate-fade-slide-in">
        <PageHeader
          title="Settings"
          subtitle="Manage account-level preferences and portable data exports."
        />

        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="border-border bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4 text-indigo-500" />
                Data Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-secondary/40 p-3">
                  <p className="text-xs text-muted-foreground">Categories</p>
                  <p className="mt-1 text-xl font-bold text-foreground">{categories.length}</p>
                </div>
                <div className="rounded-lg bg-secondary/40 p-3">
                  <p className="text-xs text-muted-foreground">Skills</p>
                  <p className="mt-1 text-xl font-bold text-foreground">{skills.length}</p>
                </div>
                <div className="rounded-lg bg-secondary/40 p-3">
                  <p className="text-xs text-muted-foreground">Tasks</p>
                  <p className="mt-1 text-xl font-bold text-foreground">{tasks.length}</p>
                </div>
              </div>
              <Button className="rounded-lg" onClick={handleExport} disabled={exporting}>
                <Download className="w-4 h-4 mr-2" />
                {exporting ? 'Exporting...' : 'Export JSON'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileJson className="h-4 w-4 text-emerald-500" />
                Export Contents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground leading-relaxed">
              <p>
                Categories, skills with progress and notes, linked tasks, deadlines, statuses,
                and export timestamp are included in the generated JSON file.
              </p>
              <p className="text-xs text-muted-foreground">
                Authentication credentials and private API keys are not exported.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}

export default Settings
