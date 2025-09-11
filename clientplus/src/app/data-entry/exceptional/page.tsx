// src/app/data-entry/exceptional/page.tsx
'use client'

import { useState } from 'react'
import ExceptionalEntryForm from '@/components/data-entry/ExceptionalEntryForm'
import { Calendar, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ExceptionalEntryPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleEntriesUpdated = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8 text-orange-600" />
          <div>
            <h1 className="text-3xl font-bold">Exceptional Entry</h1>
            <p className="text-muted-foreground">
              Add backdated entries for missed work sessions
            </p>
          </div>
        </div>
      </div>

      {/* Warning Alert */}
      <Alert className="border-orange-200 bg-orange-50">
        <AlertCircle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <strong>Exceptional Entry Mode:</strong> Use this form to add entries for previous dates when you forgot to log your work. 
          All entries will be marked with source "Exceptional Entry" for audit purposes.
        </AlertDescription>
      </Alert>

      {/* Exceptional Entry Form */}
      <div className="max-w-4xl">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Add Backdated Entry</h2>
          <ExceptionalEntryForm onEntriesUpdated={handleEntriesUpdated} />
        </div>
      </div>
    </div>
  )
}