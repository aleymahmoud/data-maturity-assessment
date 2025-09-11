// src/components/data-entry/ExceptionalEntryForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, X, Save, Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface Domain {
  id: number
  domainName: string
}

interface Subdomain {
  id: number
  subdomainName: string
  leadConsultant: string
}

interface Scope {
  id: number
  scopeName: string
  createdBy: string
}

interface TimeEntry {
  id: number
  date: string
  domainId: number
  domainName: string
  subdomainId: number
  subdomainName: string
  scopeId: number
  scopeName: string
  hours: number
  notes: string
}

interface EntryFormData {
  date: string
  domainId: number
  domainName: string
  subdomainId: number
  subdomainName: string
  scopeId: number
  scopeName: string
  hours: number
  notes: string
}

export default function ExceptionalEntryForm({ onEntriesUpdated }: { onEntriesUpdated?: () => void }) {
  const [entries, setEntries] = useState<TimeEntry[]>([
    {
      id: 1,
      date: new Date().toISOString().split('T')[0],
      domainId: 0,
      domainName: '',
      subdomainId: 0,
      subdomainName: '',
      scopeId: 0,
      scopeName: '',
      hours: 0,
      notes: ''
    }
  ])
  const [nextId, setNextId] = useState(2)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Dropdown data
  const [domains, setDomains] = useState<Domain[]>([])
  const [subdomainsMap, setSubdomainsMap] = useState<Record<number, Subdomain[]>>({})
  const [scopesMap, setScopesMap] = useState<Record<number, Scope[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserDomains()
  }, [])

  const fetchUserDomains = async () => {
    try {
      setLoading(true)
      // CHANGED: Use user-specific domains endpoint instead of global
      const response = await fetch('/api/user/domains')
      if (response.ok) {
        const data = await response.json()
        setDomains(data)
        console.log('Loaded user domains for exceptional entries:', data.length)
      } else {
        if (response.status === 401) {
          toast.error('Please log in to access domains')
        } else {
          toast.error('Failed to load your assigned domains')
        }
      }
    } catch (error) {
      console.error('Error fetching user domains:', error)
      toast.error('Error loading your assigned domains')
    } finally {
      setLoading(false)
    }
  }

  const fetchSubdomains = async (domainId: number) => {
    try {
      const response = await fetch(`/api/subdomains/${domainId}`)
      if (response.ok) {
        const data = await response.json()
        setSubdomainsMap(prev => ({
          ...prev,
          [domainId]: data
        }))
      } else {
        toast.error('Failed to load subdomains')
      }
    } catch (error) {
      console.error('Error fetching subdomains:', error)
      toast.error('Error loading subdomains')
    }
  }

  const fetchScopes = async (subdomainId: number) => {
    try {
      const response = await fetch(`/api/scopes/${subdomainId}`)
      if (response.ok) {
        const data = await response.json()
        setScopesMap(prev => ({
          ...prev,
          [subdomainId]: data
        }))
      } else {
        toast.error('Failed to load scopes')
      }
    } catch (error) {
      console.error('Error fetching scopes:', error)
      toast.error('Error loading scopes')
    }
  }

  const addEntry = () => {
    const newEntry: TimeEntry = {
      id: nextId,
      date: new Date().toISOString().split('T')[0],
      domainId: 0,
      domainName: '',
      subdomainId: 0,
      subdomainName: '',
      scopeId: 0,
      scopeName: '',
      hours: 0,
      notes: ''
    }
    setNextId(nextId + 1)
    setEntries([newEntry, ...entries])
    toast.success('New entry added')
  }

  const deleteEntry = (id: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter(entry => entry.id !== id))
      toast.success('Entry removed')
    } else {
      toast.warning('Cannot delete the last entry')
    }
  }

  const updateEntry = (id: number, field: keyof EntryFormData, value: string | number) => {
    setEntries(entries.map(entry => {
      if (entry.id === id) {
        const updated = { ...entry }
        
        if (field === 'domainId') {
          const domain = domains.find(d => d.id === value)
          updated.domainId = value as number
          updated.domainName = domain?.domainName || ''
          updated.subdomainId = 0
          updated.subdomainName = ''
          updated.scopeId = 0
          updated.scopeName = ''
          fetchSubdomains(value as number)
        } else if (field === 'subdomainId') {
          const subdomain = subdomainsMap[updated.domainId]?.find(s => s.id === value)
          updated.subdomainId = value as number
          updated.subdomainName = subdomain?.subdomainName || ''
          updated.scopeId = 0
          updated.scopeName = ''
          fetchScopes(value as number)
        } else if (field === 'scopeId') {
          const scope = scopesMap[updated.subdomainId]?.find(s => s.id === value)
          updated.scopeId = value as number
          updated.scopeName = scope?.scopeName || ''
        } else {
          (updated as any)[field] = value
        }
        
        return updated
      }
      return entry
    }))
  }

  const validateEntries = (): boolean => {
    for (const entry of entries) {
      if (!entry.date) {
        toast.error('Please select a date for all entries')
        return false
      }
      if (!entry.domainId || entry.domainId === 0) {
        toast.error('Please select a domain for all entries')
        return false
      }
      if (!entry.subdomainId || entry.subdomainId === 0) {
        toast.error('Please select a subdomain for all entries')
        return false
      }
      if (!entry.scopeId || entry.scopeId === 0) {
        toast.error('Please select a scope for all entries')
        return false
      }
      if (!entry.hours || entry.hours <= 0) {
        toast.error('Please enter valid hours for all entries')
        return false
      }
      if (!entry.notes.trim()) {
        toast.error('Please add notes for all entries')
        return false
      }
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateEntries()) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/entries/exceptional', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entries }),
      })

      if (response.ok) {
        toast.success('Exceptional entries submitted successfully!')
        // Reset form
        setEntries([{
          id: 1,
          date: new Date().toISOString().split('T')[0],
          domainId: 0,
          domainName: '',
          subdomainId: 0,
          subdomainName: '',
          scopeId: 0,
          scopeName: '',
          hours: 0,
          notes: ''
        }])
        setNextId(2)
        setSubdomainsMap({})
        setScopesMap({})
        onEntriesUpdated?.()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to submit exceptional entries')
        
        if (errorData.allowedDomains) {
          toast.info(`You have access to: ${errorData.allowedDomains.join(', ')}`)
        }
      }
    } catch (error) {
      console.error('Error submitting exceptional entries:', error)
      toast.error('Error submitting exceptional entries')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">Loading your assigned domains...</div>
        </CardContent>
      </Card>
    )
  }

  // Show message if user has no assigned domains
  if (domains.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Domains Assigned</h3>
            <p className="text-gray-500">
              You don't have any domains assigned to you yet. Please contact your administrator to get domain access.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-orange-600" />
          <CardTitle className="text-orange-900">Exceptional Time Entry</CardTitle>
        </div>
        <div className="flex gap-2">
          <Button onClick={addEntry} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Submitting...' : 'Submit All'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {entries.map((entry, index) => (
          <div key={entry.id} className="space-y-4 p-4 border rounded-lg border-orange-200 bg-orange-50/30">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-orange-900">Exceptional Entry {index + 1}</h4>
              {entries.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteEntry(entry.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Date Selection - First and prominent */}
            <div className="space-y-2">
              <Label className="font-medium">Entry Date *</Label>
              <Input
                type="date"
                value={entry.date}
                max={new Date().toISOString().split('T')[0]} // Prevent future dates
                onChange={(e) => updateEntry(entry.id, 'date', e.target.value)}
                className="w-48"
              />
            </div>

            {/* Domain Selection - Button Group (KEEPING ORIGINAL LAYOUT) */}
            <div className="space-y-2">
              <Label className="text-orange-900">Domain *</Label>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(domains) && domains.map((domain) => (
                  <Button
                    key={domain.id}
                    variant={entry.domainId === domain.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateEntry(entry.id, 'domainId', domain.id)}
                    className={entry.domainId === domain.id ? "bg-orange-600 hover:bg-orange-700" : ""}
                  >
                    {domain.domainName}
                  </Button>
                ))}
                {!Array.isArray(domains) && (
                  <div className="text-sm text-red-500">Error loading domains</div>
                )}
              </div>
            </div>

            {/* Client/Subdomain Dropdown - KEEPING ORIGINAL DROPDOWN */}
            <div className="space-y-2">
              <Label className="text-orange-900">Client/Subdomain *</Label>
              <Select
                value={entry.subdomainId.toString()}
                onValueChange={(value) => updateEntry(entry.id, 'subdomainId', parseInt(value))}
                disabled={!entry.domainId}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder={entry.domainId ? "Select client/subdomain..." : "Select domain first"} />
                </SelectTrigger>
                <SelectContent>
                  {entry.domainId && Array.isArray(subdomainsMap[entry.domainId]) && subdomainsMap[entry.domainId].map((subdomain) => (
                    <SelectItem key={subdomain.id} value={subdomain.id.toString()}>
                      {subdomain.subdomainName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Scope Dropdown - KEEPING ORIGINAL DROPDOWN */}
            <div className="space-y-2">
              <Label className="text-orange-900">Scope *</Label>
              <Select
                value={entry.scopeId.toString()}
                onValueChange={(value) => updateEntry(entry.id, 'scopeId', parseInt(value))}
                disabled={!entry.subdomainId}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder={entry.subdomainId ? "Select scope..." : "Select subdomain first"} />
                </SelectTrigger>
                <SelectContent>
                  {entry.subdomainId && Array.isArray(scopesMap[entry.subdomainId]) && scopesMap[entry.subdomainId].map((scope) => (
                    <SelectItem key={scope.id} value={scope.id.toString()}>
                      {scope.scopeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Hours and Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-orange-900">Hours *</Label>
                <Input
                  type="number"
                  step="0.25"
                  min="0"
                  max="24"
                  value={entry.hours || ''}
                  onChange={(e) => updateEntry(entry.id, 'hours', parseFloat(e.target.value) || 0)}
                  placeholder="e.g., 2.5"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-orange-900">Notes *</Label>
                <Textarea
                  value={entry.notes}
                  onChange={(e) => updateEntry(entry.id, 'notes', e.target.value)}
                  placeholder="Describe the work performed..."
                  rows={2}
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}