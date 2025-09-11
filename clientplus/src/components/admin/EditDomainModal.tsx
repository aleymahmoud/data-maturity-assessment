// src/components/admin/EditDomainModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Building2, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Domain {
  id: number;
  domainName: string;
  createdAt: string;
  updatedAt: string;
  stats: {
    userCount: number;
    subdomainCount: number;
    templateCount: number;
    entryCount: number;
    activeConsultants: number;
  };
}

interface EditDomainModalProps {
  isOpen: boolean;
  domain: Domain;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditDomainModal({ isOpen, domain, onClose, onSuccess }: EditDomainModalProps) {
  const [domainName, setDomainName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (domain) {
      setDomainName(domain.domainName);
    }
  }, [domain]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!domainName.trim()) {
      toast.error('Please enter a domain name');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/domains/${domain.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domainName: domainName.trim()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Domain updated successfully', {
          description: `"${data.domain.domainName}" has been updated.`,
        });
        onSuccess();
      } else {
        const error = await response.json();
        toast.error('Failed to update domain', {
          description: error.error || 'Please try again.',
        });
      }
    } catch (error) {
      toast.error('Network error', {
        description: 'Please check your connection and try again.',
      });
      console.error('Error updating domain:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Edit Domain
          </DialogTitle>
          <DialogDescription>
            Update the domain name and settings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="domainName" className="text-right">
                Name
              </Label>
              <Input
                id="domainName"
                value={domainName}
                onChange={(e) => setDomainName(e.target.value)}
                className="col-span-3"
                placeholder="Enter domain name..."
                disabled={isLoading}
                autoFocus
              />
            </div>
            <div className="text-sm text-gray-500 mt-2">
              <strong>Current Usage:</strong> {domain.stats.subdomainCount} subdomains, 
              {' '}{domain.stats.userCount} users, {domain.stats.entryCount} entries
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}