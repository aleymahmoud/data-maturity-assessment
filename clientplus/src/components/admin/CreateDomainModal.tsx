// src/components/admin/CreateDomainModal.tsx
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Building2, Plus } from 'lucide-react';
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

interface CreateDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateDomainModal({ isOpen, onClose, onSuccess }: CreateDomainModalProps) {
  const [domainName, setDomainName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!domainName.trim()) {
      toast.error('Please enter a domain name');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domainName: domainName.trim()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Domain created successfully', {
          description: `"${data.domain.domainName}" has been added to the system.`,
        });
        setDomainName('');
        onSuccess();
      } else {
        const error = await response.json();
        toast.error('Failed to create domain', {
          description: error.error || 'Please try again.',
        });
      }
    } catch (error) {
      toast.error('Network error', {
        description: 'Please check your connection and try again.',
      });
      console.error('Error creating domain:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setDomainName('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Create Domain
          </DialogTitle>
          <DialogDescription>
            Add a new service domain to organize your consulting services.
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
            <div className="text-xs text-gray-500">
              Examples: Consulting, Training, Strategy, etc.
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Domain
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}