'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import { LeadConsultantsTable } from '@/components/admin/LeadConsultantsTable';
import { ManageAssignmentsModal } from '@/components/admin/ManageAssignmentsModal';
import { Button } from '@/components/ui/button';
import { CreateUserModal } from '@/components/admin/CreateUserModal';

interface LeadConsultant {
  id: string;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImage: string | null;
  isActive: boolean;
  assignedSubdomains: {
    id: number;
    subdomainName: string;
    domain: {
      domainName: string;
    };
  }[];
  workload: number;
}

export default function LeadConsultantsPage() {
  const [leadConsultants, setLeadConsultants] = useState<LeadConsultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState<LeadConsultant | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchLeadConsultants();
  }, []);

  const fetchLeadConsultants = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/lead-consultants');

      if (response.ok) {
        const data = await response.json();
        setLeadConsultants(data);
      } else {
        throw new Error('Failed to fetch lead consultants');
      }
    } catch (error) {
      toast.error('Failed to load lead consultants', {
        description: 'Please refresh the page to try again.',
      });
      console.error('Error fetching lead consultants:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading lead consultants...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Lead Consultant Management</h1>
          <p className="text-gray-600">Assign and manage lead consultants.</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Lead Consultant
        </Button>
      </div>
      <LeadConsultantsTable
        consultants={leadConsultants}
        onRefresh={fetchLeadConsultants}
        onManageAssignments={(consultant) => {
          setSelectedConsultant(consultant);
          setShowAssignModal(true);
        }}
      />

      {selectedConsultant && (
        <ManageAssignmentsModal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          onSuccess={() => {
            fetchLeadConsultants();
            setShowAssignModal(false);
          }}
          consultant={selectedConsultant}
        />
      )}

      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchLeadConsultants();
          setShowCreateModal(false);
        }}
      />
    </AdminLayout>
  );
}
