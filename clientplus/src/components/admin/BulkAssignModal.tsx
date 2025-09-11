// src/components/admin/BulkAssignModal.tsx
'use client';

import { useState } from 'react';
import { X, Users, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Subdomain {
  id: number;
  subdomainName: string;
  leadConsultant: string | null;
  domain: {
    id: number;
    domainName: string;
  };
}

interface Consultant {
  username: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

interface BulkAssignModalProps {
  isOpen: boolean;
  selectedSubdomainIds: number[];
  subdomains: Subdomain[];
  consultants: Consultant[];
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkAssignModal({ 
  isOpen, 
  selectedSubdomainIds,
  subdomains,
  consultants,
  onClose, 
  onSuccess 
}: BulkAssignModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState('');

  const selectedSubdomains = subdomains.filter(s => selectedSubdomainIds.includes(s.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedSubdomainIds.length === 0) {
      toast.error('No Selection', {
        description: 'No subdomains selected'
      });
      return;
    }

    setLoading(true);
    
    try {
      const promises = selectedSubdomainIds.map(id => 
        fetch(`/api/admin/subdomains/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            leadConsultant: selectedConsultant || null
          }),
        })
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
      const failed = results.length - successful;

      if (successful > 0) {
        toast.success('Bulk Assignment Complete', {
          description: `${successful} subdomain${successful !== 1 ? 's' : ''} updated successfully${failed > 0 ? `, ${failed} failed` : ''}`
        });
      }

      if (failed > 0 && successful === 0) {
        toast.error('Assignment Failed', {
          description: 'Failed to update subdomains'
        });
      }

      onSuccess();
    } catch (error) {
      toast.error('Failed to perform bulk assignment');
    } finally {
      setLoading(false);
    }
  };

  const getConsultantDisplay = (consultant: Consultant) => {
    const displayName = consultant.firstName && consultant.lastName 
      ? `${consultant.firstName} ${consultant.lastName}`
      : consultant.username;
    
    return `${displayName} (@${consultant.username})`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Bulk Assign Lead Consultant</h2>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Selected Subdomains Summary */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Check className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">
                {selectedSubdomainIds.length} subdomain{selectedSubdomainIds.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="max-h-32 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {selectedSubdomains.map(subdomain => (
                  <Badge key={subdomain.id} variant="secondary" className="text-xs">
                    {subdomain.domain.domainName} → {subdomain.subdomainName}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Current Assignments */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current Lead Consultant Assignments:</Label>
            <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
              {selectedSubdomains.map(subdomain => (
                <div key={subdomain.id} className="flex justify-between items-center py-1 text-sm">
                  <span className="text-gray-700">
                    {subdomain.domain.domainName} → {subdomain.subdomainName}
                  </span>
                  <span className="text-gray-600">
                    {subdomain.leadConsultant ? `@${subdomain.leadConsultant}` : 'Unassigned'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="consultant">New Lead Consultant</Label>
              <select
                id="consultant"
                value={selectedConsultant}
                onChange={(e) => setSelectedConsultant(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Remove assignment (Unassigned)</option>
                {consultants
                  .sort((a, b) => {
                    // Sort by role priority: SUPER_USER > LEAD_CONSULTANT > CONSULTANT
                    const rolePriority = { 'SUPER_USER': 3, 'LEAD_CONSULTANT': 2, 'CONSULTANT': 1 };
                    const aPriority = rolePriority[a.role as keyof typeof rolePriority] || 0;
                    const bPriority = rolePriority[b.role as keyof typeof rolePriority] || 0;
                    
                    if (aPriority !== bPriority) {
                      return bPriority - aPriority;
                    }
                    
                    return a.username.localeCompare(b.username);
                  })
                  .map((consultant) => (
                    <option key={consultant.username} value={consultant.username}>
                      {getConsultantDisplay(consultant)} - {consultant.role}
                    </option>
                  ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                This will override existing assignments for all selected subdomains
              </p>
            </div>

            {selectedConsultant && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  <strong>@{selectedConsultant}</strong> will be assigned as lead consultant 
                  to all {selectedSubdomainIds.length} selected subdomain{selectedSubdomainIds.length !== 1 ? 's' : ''}.
                </p>
              </div>
            )}

            {!selectedConsultant && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  All {selectedSubdomainIds.length} selected subdomain{selectedSubdomainIds.length !== 1 ? 's' : ''} will 
                  become <strong>unassigned</strong> (no lead consultant).
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading 
                  ? `Updating ${selectedSubdomainIds.length} subdomain${selectedSubdomainIds.length !== 1 ? 's' : ''}...` 
                  : `Assign to ${selectedSubdomainIds.length} subdomain${selectedSubdomainIds.length !== 1 ? 's' : ''}`
                }
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}