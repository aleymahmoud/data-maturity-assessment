// src/components/data-entry/TodaysEntries.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2, Clock, Save, X } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner'

interface TodayEntry {
  id: number
  client: string
  domain: string
  subdomain: string
  scope: string
  hours: number
  notes: string
  createdAt: string
}

export default function TodaysEntries() {
  const [entries, setEntries] = useState<TodayEntry[]>([])
  const [loading, setLoading] = useState(true)

  // State variables for inline editing
  const [savingEntryId, setSavingEntryId] = useState<number | null>(null)
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null)
  const [editForms, setEditForms] = useState<Record<number, any>>({})

  // Dropdown data for editing
  const [domains, setDomains] = useState<any[]>([])
  const [subdomains, setSubdomains] = useState<any[]>([])
  const [scopes, setScopes] = useState<any[]>([])
  const [loadingDropdowns, setLoadingDropdowns] = useState(false)

  useEffect(() => {
    fetchTodaysEntries()
  }, [])

  const fetchTodaysEntries = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/today')
      
      if (response.ok) {
        const data = await response.json()
        setEntries(data)
      } else {
        console.error('Failed to fetch today\'s entries')
      }
    } catch (error) {
      console.error('Error fetching today\'s entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserDomains = async () => {
    try {
      // CHANGED: Use user-specific domains endpoint instead of global
      const response = await fetch('/api/user/domains')
      if (response.ok) {
        const data = await response.json()
        setDomains(data)
        return data
      } else {
        toast.error('Failed to load your assigned domains')
        return []
      }
    } catch (error) {
      console.error('Error fetching user domains:', error)
      toast.error('Error loading your assigned domains')
      return []
    }
  }

  const fetchSubdomains = async (domainId: number) => {
    try {
      const response = await fetch(`/api/subdomains/${domainId}`)
      if (response.ok) {
        const data = await response.json()
        setSubdomains(data)
        return data
      }
    } catch (error) {
      console.error('Error fetching subdomains:', error)
    }
    return []
  }

  const fetchScopes = async (subdomainId: number) => {
    try {
      const response = await fetch(`/api/scopes/${subdomainId}`)
      if (response.ok) {
        const data = await response.json()
        setScopes(data)
        return data
      }
    } catch (error) {
      console.error('Error fetching scopes:', error)
    }
    return []
  }

  const handleStartInlineEdit = async (entry: TodayEntry) => {
    setLoadingDropdowns(true)
    
    // Load user's assigned domains first
    const domainsData = await fetchUserDomains()
    
    // Find the current domain to load its subdomains
    const currentDomain = domainsData.find((d: any) => d.domainName === entry.domain)
    
    if (currentDomain) {
      // Load subdomains for current domain
      const subdomainsData = await fetchSubdomains(currentDomain.id)
      
      // Find current subdomain to load scopes
      const currentSubdomain = subdomainsData.find((s: any) => s.subdomainName === entry.subdomain)
      
      if (currentSubdomain) {
        // Load scopes for current subdomain
        await fetchScopes(currentSubdomain.id)
      }
    }

    setLoadingDropdowns(false)
    
    // Now set editing state with preloaded data
    setEditingEntryId(entry.id)
    setEditForms({
      ...editForms,
      [entry.id]: {
        hours: entry.hours,
        notes: entry.notes,
        domainName: entry.domain,
        subdomainName: entry.subdomain,
        scopeName: entry.scope,
      }
    })
  }

  const handleCancelInlineEdit = (entryId: number) => {
    setEditingEntryId(null)
    const newForms = {...editForms}
    delete newForms[entryId]
    setEditForms(newForms)
    setSubdomains([])
    setScopes([])
  }

  const updateInlineForm = (entryId: number, field: string, value: any) => {
    const newForms = {
      ...editForms,
      [entryId]: {
        ...editForms[entryId],
        [field]: value
      }
    }
    setEditForms(newForms)
  }

  const handleSaveInlineEdit = async (entryId: number) => {
    const editForm = editForms[entryId]
    if (!editForm) return

    // Validation
    if (!editForm.hours || editForm.hours <= 0) {
      toast.error('Please enter valid hours')
      return
    }
    if (!editForm.notes?.trim()) {
      toast.error('Please enter notes')
      return
    }
    if (!editForm.domainName || !editForm.subdomainName || !editForm.scopeName) {
      toast.error('Please select domain, subdomain, and scope')
      return
    }

    setSavingEntryId(entryId)
    try {
      const response = await fetch(`/api/entries/${entryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hours: editForm.hours,
          notes: editForm.notes,
          domain: editForm.domainName,
          subdomain: editForm.subdomainName,
          scope: editForm.scopeName
        })
      })

      if (response.ok) {
        toast.success('Entry updated successfully!')
        // Update local state
        setEntries(entries.map(entry => 
          entry.id === entryId 
            ? {
                ...entry,
                hours: editForm.hours,
                notes: editForm.notes,
                domain: editForm.domainName,
                subdomain: editForm.subdomainName,
                scope: editForm.scopeName
              }
            : entry
        ))
        handleCancelInlineEdit(entryId)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to update entry')
      }
    } catch (error) {
      console.error('Error updating entry:', error)
      toast.error('Error updating entry')
    } finally {
      setSavingEntryId(null)
    }
  }

  const handleDelete = async (entryId: number) => {
    if (!confirm('Are you sure you want to delete this entry?')) {
      return
    }

    try {
      const response = await fetch(`/api/entries/${entryId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Entry deleted successfully!')
        setEntries(entries.filter(entry => entry.id !== entryId))
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to delete entry')
      }
    } catch (error) {
      console.error('Error deleting entry:', error)
      toast.error('Error deleting entry')
    }
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Today's Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Loading today's entries...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Today's Entries ({entries.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No entries for today yet.</p>
            <p className="text-sm">Add your first entry using the form.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => {
              const isEditing = editingEntryId === entry.id
              const editForm = editForms[entry.id] || {}
              
              return (
                <div
                  key={entry.id}
                  className={`border rounded-lg p-4 space-y-3 transition-colors ${
                    isEditing ? 'bg-blue-50 border-blue-200' : 'hover:bg-muted/50'
                  }`}
                >
                  {isEditing ? (
                    // EDITING MODE - Full Inline Form with User Domain Filtering
                    <div className="space-y-4">
                      {/* Domain Selection */}
                      <div className="space-y-2">
                        <Label>Domain</Label>
                        {loadingDropdowns ? (
                          <div className="text-sm text-muted-foreground">Loading your assigned domains...</div>
                        ) : (
                          <Select
                            value={editForm.domainName || ''}
                            onValueChange={async (domainName) => {
                              const domain = domains.find(d => d.domainName === domainName)
                              updateInlineForm(entry.id, 'domainName', domainName)
                              updateInlineForm(entry.id, 'subdomainName', '')
                              updateInlineForm(entry.id, 'scopeName', '')
                              setSubdomains([])
                              setScopes([])
                              if (domain) {
                                await fetchSubdomains(domain.id)
                              }
                            }}
                          >
                            <SelectTrigger className="max-w-48">
                              <SelectValue placeholder={`Select domain (current: ${editForm.domainName || 'none'})`} />
                            </SelectTrigger>
                            <SelectContent>
                              {domains.map((domain) => (
                                <SelectItem key={domain.id} value={domain.domainName}>
                                  {domain.domainName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      {/* Subdomain Selection */}
                      <div className="space-y-2">
                        <Label>Subdomain</Label>
                        <Select
                          value={editForm.subdomainName || ''}
                          onValueChange={async (subdomainName) => {
                            const subdomain = subdomains.find(s => s.subdomainName === subdomainName)
                            updateInlineForm(entry.id, 'subdomainName', subdomainName)
                            updateInlineForm(entry.id, 'scopeName', '')
                            setScopes([])
                            if (subdomain) {
                              await fetchScopes(subdomain.id)
                            }
                          }}
                          disabled={!editForm.domainName}
                        >
                          <SelectTrigger className="max-w-48">
                            <SelectValue placeholder={editForm.domainName ? 
                              `Select subdomain (current: ${editForm.subdomainName || 'none'})` : 
                              "Select domain first"} />
                          </SelectTrigger>
                          <SelectContent>
                            {subdomains.map((subdomain) => (
                              <SelectItem key={subdomain.id} value={subdomain.subdomainName}>
                                {subdomain.subdomainName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Scope Selection */}
                      <div className="space-y-2">
                        <Label>Scope</Label>
                        <Select
                          value={editForm.scopeName || ''}
                          onValueChange={(scopeName) => updateInlineForm(entry.id, 'scopeName', scopeName)}
                          disabled={!editForm.subdomainName}
                        >
                          <SelectTrigger className="max-w-48">
                            <SelectValue placeholder={editForm.subdomainName ? 
                              `Select scope (current: ${editForm.scopeName || 'none'})` : 
                              "Select subdomain first"} />
                          </SelectTrigger>
                          <SelectContent>
                            {scopes.map((scope) => (
                              <SelectItem key={scope.id} value={scope.scopeName}>
                                {scope.scopeName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Hours and Notes */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Hours</Label>
                          <Input
                            type="number"
                            step="0.25"
                            min="0"
                            max="24"
                            value={editForm.hours || ''}
                            onChange={(e) => updateInlineForm(entry.id, 'hours', parseFloat(e.target.value) || 0)}
                            placeholder="e.g., 2.5"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Notes</Label>
                          <Textarea
                            value={editForm.notes || ''}
                            onChange={(e) => updateInlineForm(entry.id, 'notes', e.target.value)}
                            placeholder="Describe the work performed..."
                            rows={2}
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => handleSaveInlineEdit(entry.id)}
                          disabled={savingEntryId === entry.id}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          {savingEntryId === entry.id ? 'Saving...' : 'Save'}
                        </Button>
                        <Button
                          onClick={() => handleCancelInlineEdit(entry.id)}
                          variant="outline"
                          size="sm"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // VIEW MODE - Display entry details
                    <>
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{entry.domain}</Badge>
                            <span className="text-sm text-muted-foreground">→</span>
                            <Badge variant="secondary">{entry.subdomain}</Badge>
                            <span className="text-sm text-muted-foreground">→</span>
                            <Badge>{entry.scope}</Badge>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-semibold text-lg">{entry.hours}h</span>
                            <span className="text-sm text-muted-foreground">
                              Added at {new Date(entry.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          {entry.notes && (
                            <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                              {entry.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            onClick={() => handleStartInlineEdit(entry)}
                            variant="outline"
                            size="sm"
                            disabled={loadingDropdowns}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(entry.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}