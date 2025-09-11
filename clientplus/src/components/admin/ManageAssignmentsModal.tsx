'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface LeadConsultant {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  assignedSubdomains: { id: number }[];
}

interface Subdomain {
  id: number;
  subdomainName: string;
  domain: {
    domainName: string;
  };
}

interface ManageAssignmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  consultant: LeadConsultant | null;
}

export function ManageAssignmentsModal({
  isOpen,
  onClose,
  onSuccess,
  consultant,
}: ManageAssignmentsModalProps) {
  const [subdomains, setSubdomains] = useState<Subdomain[]>([]);
  const [selectedSubdomains, setSelectedSubdomains] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSubdomains();
    }
  }, [isOpen]);

  useEffect(() => {
    if (consultant) {
      const initialSelected = new Set(
        consultant.assignedSubdomains.map((s) => s.id)
      );
      setSelectedSubdomains(initialSelected);
    }
  }, [consultant]);

  const fetchSubdomains = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/subdomains?simple=true'); // A new query param to get just names and ids
      if (response.ok) {
        const data = await response.json();
        setSubdomains(data.subdomains);
      } else {
        throw new Error('Failed to fetch subdomains');
      }
    } catch (error) {
      toast.error('Failed to load subdomains');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSubdomain = (subdomainId: number) => {
    const newSelection = new Set(selectedSubdomains);
    if (newSelection.has(subdomainId)) {
      newSelection.delete(subdomainId);
    } else {
      newSelection.add(subdomainId);
    }
    setSelectedSubdomains(newSelection);
  };

  const handleSave = async () => {
    if (!consultant) return;

    setSaving(true);
    try {
      const response = await fetch(
        `/api/admin/lead-consultants/${consultant.username}/assignments`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subdomainIds: Array.from(selectedSubdomains),
          }),
        }
      );

      if (response.ok) {
        toast.success('Assignments updated successfully');
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update assignments');
      }
    } catch (error) {
      toast.error('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  if (!consultant) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Manage Assignments for {consultant.firstName} {consultant.lastName}
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-2 p-1">
            {subdomains.map((subdomain) => (
              <div
                key={subdomain.id}
                className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100"
              >
                <Checkbox
                  id={`subdomain-${subdomain.id}`}
                  checked={selectedSubdomains.has(subdomain.id)}
                  onCheckedChange={() => handleToggleSubdomain(subdomain.id)}
                />
                <label
                  htmlFor={`subdomain-${subdomain.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {subdomain.subdomainName} ({subdomain.domain.domainName})
                </label>
              </div>
            ))}
          </div>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={loading || saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
