// src/components/admin/CreateSubdomainModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Building2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Domain {
  id: number;
  domainName: string;
}

interface Consultant {
  username: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

interface CreateSubdomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  consultants: Consultant[];
}

export function CreateSubdomainModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  consultants 
}: CreateSubdomainModalProps) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    domainId: '',
    subdomainName: '',
    leadConsultant: ''
  });


  // Fetch domains when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchDomains();
    }
  }, [isOpen]);

  const fetchDomains = async () => {
    try {
      const response = await fetch('/api/admin/domains');
      if (response.ok) {
        const data = await response.json();
        // Filter out "Consulting" domain since it's managed by Client Management
        const filteredDomains = (data.domains || []).filter(
          (domain: { domainName: string }) => domain.domainName.toLowerCase() !== 'consulting'
        );
        setDomains(filteredDomains);
      }
    } catch (error) {
      console.error('Failed to fetch domains:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.domainId || !formData.subdomainName) {
      toast.error('Please fill in all required fields');({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/subdomains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domainId: parseInt(formData.domainId),
          subdomainName: formData.subdomainName,
          leadConsultant: formData.leadConsultant || null
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Subdomain created successfully');
        onSuccess();
        resetForm();
      } else {
        toast.error(data.error || 'Failed to create subdomain');
      }
    } catch (error) {
      toast.error('Failed to create subdomain');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      domainId: '',
      subdomainName: '',
      leadConsultant: ''
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
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
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Create Subdomain</h2>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label htmlFor="domain">Domain *</Label>
            <select
              id="domain"
              required
              value={formData.domainId}
              onChange={(e) => setFormData({ ...formData, domainId: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a domain</option>
              {domains.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.domainName}
                </option>
              ))}
            </select>
          </div>

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
              <option value="">Assign later</option>
              {consultants.map((consultant) => (
                <option key={consultant.username} value={consultant.username}>
                  {getConsultantDisplay(consultant)} - {consultant.role}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
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
              {loading ? 'Creating...' : 'Create Subdomain'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}