// src/components/dashboard/EntryModals.tsx
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
import { Badge } from '@/components/ui/badge'
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

interface EntryModalProps {
  entry: TodayEntry | null
  isOpen: boolean
  mode: 'view' | 'edit'
  onClose: () => void
  onSave?: (updatedEntry: TodayEntry) => void
  onRefresh?: () => void
}

export default function EntryModal({ 
  entry, 
  isOpen, 
  mode, 
  onClose, 
  onSave, 
  onRefresh 
}: EntryModalProps) {
  const [editedEntry, setEditedEntry] = useState<TodayEntry | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [domains, setDomains] = useState<any[]>([])
  const [subdomains, setSubdomains] = useState<any[]>([])
  const [scopes, setScopes] = useState<any[]>([])
  const [loadingDropdowns, setLoadingDropdowns] = useState(false)

  // Initialize edited entry when entry changes
  useEffect(() => {
    if (entry) {
      setEditedEntry({ ...entry })
    }
  }, [entry])

  // Load dropdown data for edit mode
  useEffect(() => {
    if (mode === 'edit' && isOpen) {
      loadDropdownData()
    }
  }, [mode, isOpen])

  const loadDropdownData = async () => {
    try {
      setLoadingDropdowns(true)
      
      // CHANGED: Load user's assigned domains instead of all domains
      const domainsRes = await fetch('/api/user/domains')
      if (domainsRes.ok) {
        const domainsData = await domainsRes.json()
        setDomains(domainsData)

        // Find current domain and load subdomains
        const currentDomain = domainsData.find((d: any) => d.domainName === entry?.domain)
        if (currentDomain) {
          const subdomainsRes = await fetch(`/api/subdomains/${currentDomain.id}`)
          if (subdomainsRes.ok) {
            const subdomainsData = await subdomainsRes.json()
            setSubdomains(subdomainsData)

            // Find current subdomain and load scopes
            const currentSubdomain = subdomainsData.find((s: any) => s.subdomainName === entry?.subdomain)
            if (currentSubdomain) {
              const scopesRes = await fetch(`/api/scopes/${currentSubdomain.id}`)
              if (scopesRes.ok) {
                const scopesData = await scopesRes.json()
                setScopes(scopesData)
              }
            }
          }
        }
      } else {
        toast.error('Failed to load your assigned domains')
      }
    } catch (error) {
      console.error('Error loading dropdown data:', error)
      toast.error('Failed to load form data')
    } finally {
      setLoadingDropdowns(false)
    }
  }

  const handleDomainChange = async (domainName: string) => {
    if (!editedEntry) return

    const domain = domains.find(d => d.domainName === domainName)
    setEditedEntry({
      ...editedEntry,
      domain: domainName,
      subdomain: '',
      scope: ''
    })

    // Reset subdomain and scope dropdowns
    setSubdomains([])
    setScopes([])

    // Load subdomains for the new domain
    if (domain) {
      try {
        const response = await fetch(`/api/subdomains/${domain.id}`)
        if (response.ok) {
          const data = await response.json()
          setSubdomains(data)
        }
      } catch (error) {
        console.error('Error fetching subdomains:', error)
      }
    }
  }

  const handleSubdomainChange = async (subdomainName: string) => {
    if (!editedEntry) return

    const subdomain = subdomains.find(s => s.subdomainName === subdomainName)
    setEditedEntry({
      ...editedEntry,
      subdomain: subdomainName,
      scope: ''
    })

    // Reset scope dropdown
    setScopes([])

    // Load scopes for the new subdomain
    if (subdomain) {
      try {
        const response = await fetch(`/api/scopes/${subdomain.id}`)
        if (response.ok) {
          const data = await response.json()
          setScopes(data)
        }
      } catch (error) {
        console.error('Error fetching scopes:', error)
      }
    }
  }

  const handleSave = async () => {
    if (!editedEntry) return

    // Validation
    if (!editedEntry.hours || editedEntry.hours <= 0) {
      toast.error('Please enter valid hours')
      return
    }
    if (!editedEntry.notes?.trim()) {
      toast.error('Please enter notes')
      return
    }
    if (!editedEntry.domain || !editedEntry.subdomain || !editedEntry.scope) {
      toast.error('Please select domain, subdomain, and scope')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/entries/${editedEntry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hours: editedEntry.hours,
          notes: editedEntry.notes,
          domain: editedEntry.domain,
          subdomain: editedEntry.subdomain,
          scope: editedEntry.scope
        })
      })

      if (response.ok) {
        toast.success('Entry updated successfully!')
        onSave?.(editedEntry)
        onRefresh?.()
        onClose()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to update entry')
      }
    } catch (error) {
      console.error('Error updating entry:', error)
      toast.error('Error updating entry')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editedEntry) return
    
    if (!confirm('Are you sure you want to delete this entry?')) {
      return
    }

    try {
      const response = await fetch(`/api/entries/${editedEntry.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Entry deleted successfully!')
        onRefresh?.()
        onClose()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to delete entry')
      }
    } catch (error) {
      console.error('Error deleting entry:', error)
      toast.error('Error deleting entry')
    }
  }

  if (!entry) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'view' ? 'Entry Details' : 'Edit Entry'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {mode === 'view' ? (
            // VIEW MODE
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{entry.domain}</Badge>
                <span className="text-sm text-muted-foreground">→</span>
                <Badge variant="secondary">{entry.subdomain}</Badge>
                <span className="text-sm text-muted-foreground">→</span>
                <Badge>{entry.scope}</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Hours</Label>
                  <div className="text-2xl font-bold">{entry.hours}h</div>
                </div>
                <div>
                  <Label>Created</Label>
                  <div>{new Date(entry.createdAt).toLocaleString()}</div>
                </div>
              </div>

              {entry.notes && (
                <div>
                  <Label>Notes</Label>
                  <div className="bg-muted p-3 rounded-md">{entry.notes}</div>
                </div>
              )}
            </div>
          ) : (
            // EDIT MODE
            <div className="space-y-4">
              {loadingDropdowns ? (
                <div className="text-center py-4">
                  <div className="text-sm text-muted-foreground">Loading your assigned domains...</div>
                </div>
              ) : (
                <>
                  {/* Domain Selection */}
                  <div className="space-y-2">
                    <Label>Domain *</Label>
                    <Select
                      value={editedEntry?.domain || ''}
                      onValueChange={handleDomainChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select domain..." />
                      </SelectTrigger>
                      <SelectContent>
                        {domains.map((domain) => (
                          <SelectItem key={domain.id} value={domain.domainName}>
                            {domain.domainName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Subdomain Selection */}
                  <div className="space-y-2">
                    <Label>Subdomain *</Label>
                    <Select
                      value={editedEntry?.subdomain || ''}
                      onValueChange={handleSubdomainChange}
                      disabled={!editedEntry?.domain}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={editedEntry?.domain ? "Select subdomain..." : "Select domain first"} />
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
                    <Label>Scope *</Label>
                    <Select
                      value={editedEntry?.scope || ''}
                      onValueChange={(scope) => editedEntry && setEditedEntry({ ...editedEntry, scope })}
                      disabled={!editedEntry?.subdomain}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={editedEntry?.subdomain ? "Select scope..." : "Select subdomain first"} />
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

                  {/* Hours Input */}
                  <div className="space-y-2">
                    <Label>Hours *</Label>
                    <Input
                      type="number"
                      step="0.25"
                      min="0"
                      max="24"
                      value={editedEntry?.hours || ''}
                      onChange={(e) => editedEntry && setEditedEntry({ 
                        ...editedEntry, 
                        hours: parseFloat(e.target.value) || 0 
                      })}
                      placeholder="e.g., 2.5"
                    />
                  </div>

                  {/* Notes Input */}
                  <div className="space-y-2">
                    <Label>Notes *</Label>
                    <Textarea
                      value={editedEntry?.notes || ''}
                      onChange={(e) => editedEntry && setEditedEntry({ 
                        ...editedEntry, 
                        notes: e.target.value 
                      })}
                      placeholder="Describe the work performed..."
                      rows={3}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            {mode === 'edit' ? (
              <div className="flex gap-2 w-full">
                <Button
                  onClick={handleDelete}
                  variant="destructive"
                  className="mr-auto"
                >
                  Delete Entry
                </Button>
                <Button onClick={onClose} variant="outline">
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={isSaving || loadingDropdowns}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 w-full justify-end">
                <Button onClick={onClose} variant="outline">
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}