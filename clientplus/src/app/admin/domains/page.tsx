// src/app/admin/domains/page.tsx - Fixed Version
'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DomainsTable } from '@/components/admin/DomainsTable';
import { CreateDomainModal } from '@/components/admin/CreateDomainModal';
import { EditDomainModal } from '@/components/admin/EditDomainModal';
import { DeleteDomainModal } from '@/components/admin/DeleteDomainModal';
import { toast } from 'sonner';
import { Loader2, Plus, Search, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

interface DomainsResponse {
  domains: Domain[];
  globalActiveUsers: number;
}

export default function AdminDomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [filteredDomains, setFilteredDomains] = useState<Domain[]>([]);
  const [globalActiveUsers, setGlobalActiveUsers] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);

  useEffect(() => {
    fetchDomains();
  }, []);

  useEffect(() => {
    // Filter domains based on search term
    const filtered = domains.filter(domain =>
      domain.domainName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDomains(filtered);
  }, [domains, searchTerm]);

  const fetchDomains = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/domains');
      
      if (response.ok) {
        const data: DomainsResponse = await response.json();
        setDomains(data.domains);
        setGlobalActiveUsers(data.globalActiveUsers);
      } else {
        throw new Error('Failed to fetch domains');
      }
    } catch (error) {
      toast.error('Failed to load domains', {
        description: 'Please refresh the page to try again.',
      });
      console.error('Error fetching domains:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditDomain = (domain: Domain) => {
    setSelectedDomain(domain);
    setShowEditModal(true);
  };

  const handleDeleteDomain = (domain: Domain) => {
    setSelectedDomain(domain);
    setShowDeleteModal(true);
  };

  const handleCloseModals = () => {
    setSelectedDomain(null);
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
  };

  const handleSuccess = () => {
    fetchDomains();
    handleCloseModals();
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading domains...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="h-6 w-6 text-blue-600" />
              Domain Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage service domains and their configurations
            </p>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Domain
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">Total Domains</div>
            <div className="text-2xl font-bold text-gray-900">{domains.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">Total Subdomains</div>
            <div className="text-2xl font-bold text-blue-600">
              {domains.reduce((sum, d) => sum + d.stats.subdomainCount, 0)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">Active Users</div>
            <div className="text-2xl font-bold text-green-600">
              {globalActiveUsers}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">Total Entries</div>
            <div className="text-2xl font-bold text-purple-600">
              {domains.reduce((sum, d) => sum + d.stats.entryCount, 0)}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search domains..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="text-sm text-gray-500">
            {filteredDomains.length} of {domains.length} domains
          </div>
        </div>

        {/* Domains Table */}
        <DomainsTable
          domains={filteredDomains}
          onRefresh={fetchDomains}
          onEdit={handleEditDomain}
          onDelete={handleDeleteDomain}
        />

        {/* Modals */}
        <CreateDomainModal
          isOpen={showCreateModal}
          onClose={handleCloseModals}
          onSuccess={handleSuccess}
        />

        {selectedDomain && (
          <>
            <EditDomainModal
              isOpen={showEditModal}
              domain={selectedDomain}
              onClose={handleCloseModals}
              onSuccess={handleSuccess}
            />

            <DeleteDomainModal
              isOpen={showDeleteModal}
              domain={selectedDomain}
              onClose={handleCloseModals}
              onSuccess={handleSuccess}
            />
          </>
        )}
      </div>
    </AdminLayout>
  );
}