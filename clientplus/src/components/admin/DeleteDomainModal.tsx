// src/components/admin/DeleteDomainModal.tsx
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

interface DeleteDomainModalProps {
  isOpen: boolean;
  domain: Domain;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteDomainModal({ isOpen, domain, onClose, onSuccess }: DeleteDomainModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const hasRelatedData = 
    domain.stats.subdomainCount > 0 ||
    domain.stats.userCount > 0 ||
    domain.stats.templateCount > 0 ||
    domain.stats.entryCount > 0;

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/domains/${domain.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Domain deleted successfully', {
          description: `"${domain.domainName}" has been removed from the system.`,
        });
        onSuccess();
      } else {
        const error = await response.json();
        toast.error('Failed to delete domain', {
          description: error.error || 'Please try again.',
        });
      }
    } catch (error) {
      toast.error('Network error', {
        description: 'Please check your connection and try again.',
      });
      console.error('Error deleting domain:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Domain
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{domain.domainName}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {hasRelatedData && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Cannot delete domain with existing data:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  {domain.stats.subdomainCount > 0 && (
                    <li>• {domain.stats.subdomainCount} subdomains</li>
                  )}
                  {domain.stats.userCount > 0 && (
                    <li>• {domain.stats.userCount} assigned users</li>
                  )}
                  {domain.stats.templateCount > 0 && (
                    <li>• {domain.stats.templateCount} scope templates</li>
                  )}
                  {domain.stats.entryCount > 0 && (
                    <li>• {domain.stats.entryCount} time entries</li>
                  )}
                </ul>
                <p className="mt-2 text-sm">
                  Please remove all related data before deleting this domain.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {!hasRelatedData && (
            <div className="text-sm text-gray-600">
              This domain has no associated data and can be safely deleted.
            </div>
          )}
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
          <Button 
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading || hasRelatedData}
          >
            {isLoading ? 'Deleting...' : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Domain
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}