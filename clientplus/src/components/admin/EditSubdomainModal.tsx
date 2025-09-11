// src/components/admin/EditSubdomainModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Building2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Subdomain {
  id: number;
  subdomainName: string;
  leadConsultant: string | null;
  createdAt: string;
  updatedAt: string;
  domain: {
    id: number;
    domainName: string;
  };
  stats: {
    entryCount: number;
    activeConsultants: number;
    scopesCount: number;
  };
}

interface Consultant {
  username: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

interface EditSubdomainModalProps {
  isOpen: boolean;
  subdomain: Subdomain | null;
  consultants: Consultant[];
  onClose: () => void;
  onSuccess: () => void;
}

export function EditSubdomainModal({ 
  isOpen, 
  subdomain, 
  consultants,
  onClose, 
  onSuccess 
}: EditSubdomainModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subdomainName: '',
    leadConsultant: ''
  });

  useEffect(() => {
    if (isOpen && subdomain) {
      setFormData({
        subdomainName: subdomain.subdomainName,
        leadConsultant: subdomain.leadConsultant || ''
      });
    }
  }, [isOpen, subdomain]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subdomain) return;

    if (!formData.subdomainName) {
      toast.error('Validation Error', {
        description: 'Subdomain name is required'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/subdomains/${subdomain.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subdomainName: formData.subdomainName,
          leadConsultant: formData.leadConsultant || null
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Subdomain updated successfully');
        onSuccess();
      } else {
        toast.error(data.error || 'Failed to update subdomain');
      }
    } catch (error) {
      toast.error('Failed to update subdomain');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen || !subdomain) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Edit Subdomain</h2>
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
          {/* Subdomain Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-600" />
              <span className="font-medium">{subdomain.domain.domainName}</span>
            </div>
            <div className="text-sm text-gray-600">
              Created: {formatDate(subdomain.createdAt)}
            </div>
            
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary">
                {subdomain.stats.entryCount} entries
              </Badge>
              <Badge variant="secondary">
                {subdomain.stats.activeConsultants} consultant{subdomain.stats.activeConsultants !== 1 ? 's' : ''}
              </Badge>
              <Badge variant="secondary">
                {subdomain.stats.scopesCount} scope{subdomain.stats.scopesCount !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="subdomainName">Subdomain Name *</Label>
              <Input
                id="subdomainName"
                type="text"
                required
                value={formData.subdomainName}
                onChange={(e) => setFormData({ ...formData, subdomainName: e.target.value })}
                placeholder="Enter subdomain name"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use letters, numbers, spaces, hyphens, and underscores only
              </p>
            </div>

            <div>
              <Label htmlFor="leadConsultant">Lead Consultant</Label>
              <select
                id="leadConsultant"
                value={formData.leadConsultant}
                onChange={(e) => setFormData({ ...formData, leadConsultant: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No assignment</option>
                {consultants.map((consultant) => (
                  <option key={consultant.username} value={consultant.username}>
                    {getConsultantDisplay(consultant)} - {consultant.role}
                  </option>
                ))}
              </select>
            </div>

            {subdomain.stats.entryCount > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This subdomain has {subdomain.stats.entryCount} historical entries. 
                  Changing the name may affect data consistency.
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
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}