// src/app/data-entry/page.tsx
'use client'

import { useState } from 'react'
import DataEntryForm from '@/components/data-entry/DataEntryForm'
import TodaysEntries from '@/components/data-entry/TodaysEntries'

export default function DataEntryPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleEntriesUpdated = () => {
    // Force refresh of TodaysEntries component
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">New Entry</h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Data Entry Form */}
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Add New Entry</h2>
          <DataEntryForm onEntriesUpdated={handleEntriesUpdated} />
        </div>

        {/* Today's Entries */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Today's Entries</h2>
          <TodaysEntries key={refreshKey} />
        </div>
      </div>
    </div>
  )
}