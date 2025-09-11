'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Users, Building2, Activity, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ClientsTable } from '@/components/admin/ClientsTable';
import { CreateClientModal } from '@/components/admin/CreateClientModal';
import { EditClientModal } from '@/components/admin/EditClientModal';
import { ClientDetailsModal } from '@/components/admin/ClientDetailsModal';

interface ClientStats {
  projectCount: number;
  totalHours: any;
  lastActivityDate: string | null;
  hasSubdomain: boolean;
  leadConsultant: string | null;
}

interface Client {
  id: number;
  clientName: string;
  type: 'PRJ' | 'RET' | 'FFNT';
  status: 'A' | 'E';
  activity: string;
  createdAt: string;
  updatedAt: string;
  stats: ClientStats;
}

// Safe number conversion helper
const safeNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (value && typeof value.toNumber === 'function') return value.toNumber();
  if (value !== null && value !== undefined) return Number(value);
  return 0;
};

export default function ClientManagementPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    fetchClients();
  }, [searchTerm, statusFilter, typeFilter]);

  const fetchClients = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const response = await fetch(`/api/admin/clients?${params}`);
      const data = await response.json();

      if (response.ok) {
        setClients(data.clients || []);
      } else {
        toast.error(data.error || 'Failed to fetch clients');
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setShowDetailsModal(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setShowEditModal(true);
  };

  const handleDeactivateClient = async (client: Client) => {
    if (!confirm(`Are you sure you want to deactivate "${client.clientName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/clients/${client.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Client "${client.clientName}" deactivated successfully`);
        fetchClients();
      } else {
        toast.error(data.error || 'Failed to deactivate client');
      }
    } catch (error) {
      console.error('Error deactivating client:', error);
      toast.error('Failed to deactivate client');
    }
  };

  const handleCloseModals = () => {
    setSelectedClient(null);
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDetailsModal(false);
  };

  const handleSuccess = () => {
    fetchClients();
    handleCloseModals();
  };

  // Calculate summary stats
  const summaryStats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'A').length,
    totalProjects: clients.reduce((sum, c) => sum + c.stats.projectCount, 0),
    totalHours: clients.reduce((sum, c) => sum + safeNumber(c.stats.totalHours), 0)
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-600" />
              Client Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage consulting clients and their project histories
            </p>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.total}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Clients</p>
                <p className="text-2xl font-bold text-green-600">{summaryStats.active}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Entries</p>
                <p className="text-2xl font-bold text-purple-600">{summaryStats.totalProjects}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold text-orange-600">{summaryStats.totalHours.toFixed(1)}h</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="ended">Ended</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="PRJ">Project</SelectItem>
                <SelectItem value="RET">Retainer</SelectItem>
                <SelectItem value="FFNT">Internal</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setTypeFilter('all');
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>

        {/* Clients Table */}
        <ClientsTable
          clients={clients}
          loading={loading}
          onView={handleViewClient}
          onEdit={handleEditClient}
          onDeactivate={handleDeactivateClient}
        />

        {/* Modals */}
        <CreateClientModal
          isOpen={showCreateModal}
          onClose={handleCloseModals}
          onSuccess={handleSuccess}
        />

        <EditClientModal
          client={selectedClient}
          isOpen={showEditModal}
          onClose={handleCloseModals}
          onSuccess={handleSuccess}
        />

        <ClientDetailsModal
          client={selectedClient}
          isOpen={showDetailsModal}
          onClose={handleCloseModals}
        />
      </div>
    </AdminLayout>
  );
}