// src/app/admin/subdomains/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Users, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { SubdomainsTable } from '@/components/admin/SubdomainsTable';
import { CreateSubdomainModal } from '@/components/admin/CreateSubdomainModal';
import { EditSubdomainModal } from '@/components/admin/EditSubdomainModal';
import { BulkAssignModal } from '@/components/admin/BulkAssignModal';
import { AdminLayout } from '@/components/admin/AdminLayout';

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

export default function SubdomainsPage() {
  const [subdomains, setSubdomains] = useState<Subdomain[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedConsultant, setSelectedConsultant] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingSubdomain, setEditingSubdomain] = useState<Subdomain | null>(null);
  const [selectedSubdomains, setSelectedSubdomains] = useState<number[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);

  const fetchSubdomains = async () => {
    try {
      const response = await fetch('/api/admin/subdomains');
      if (response.ok) {
        const data = await response.json();
        setSubdomains(data.subdomains);
        setConsultants(data.consultants);
        setTotalEntries(data.totalEntries || 0); // Add this line
      } else {
        toast.error('Failed to fetch subdomains', {
          description: 'Please try again'
        });
      }
    } catch (error) {
      toast.error('Failed to fetch subdomains', {
        description: 'Please try again'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubdomains();
  }, []);

  const handleEdit = (subdomain: Subdomain) => {
    setEditingSubdomain(subdomain);
    setShowEditModal(true);
  };

  const handleBulkAssign = () => {
    if (selectedSubdomains.length === 0) {
      toast.error('No Selection', {
        description: 'Please select subdomains to assign consultants'
      });
      return;
    }
    setShowBulkModal(true);
  };

  // Filter subdomains based on search and filters
  const filteredSubdomains = subdomains.filter(subdomain => {
    const matchesSearch = 
      subdomain.subdomainName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subdomain.domain.domainName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (subdomain.leadConsultant && subdomain.leadConsultant.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDomain = selectedDomain === 'all' || subdomain.domain.domainName === selectedDomain;
    const matchesConsultant = selectedConsultant === 'all' || subdomain.leadConsultant === selectedConsultant;

    return matchesSearch && matchesDomain && matchesConsultant;
  });

  // Get unique domains for filter
  const uniqueDomains = [...new Set(subdomains.map(s => s.domain.domainName))];

  // Get unique consultants for filter
  const uniqueLeadConsultants = [...new Set(subdomains.map(s => s.leadConsultant))].filter(Boolean);


  // Calculate stats
  const totalSubdomains = subdomains.length;
  const subdomainsWithLeads = subdomains.filter(s => s.leadConsultant).length;

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Subdomain Management</h1>
            <p className="text-gray-600">Manage domain subdivisions and consultant assignments</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Subdomain
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center p-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Subdomains</p>
                <p className="text-2xl font-bold">{totalSubdomains}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="h-4 w-4 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">With Lead Consultants</p>
                <p className="text-2xl font-bold">{subdomainsWithLeads}</p>
                <p className="text-xs text-gray-500">{((subdomainsWithLeads / totalSubdomains) * 100 || 0).toFixed(1)}%</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Entries</p>
                <p className="text-2xl font-bold">{totalEntries.toLocaleString()}</p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Activity className="h-4 w-4 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Avg Entries/Subdomain</p>
                <p className="text-2xl font-bold">{Math.round(totalEntries / totalSubdomains || 0)}</p>
              </div>
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Activity className="h-4 w-4 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search subdomains, domains, or consultants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm min-w-[140px]"
              >
                <option value="all">All Domains</option>
                {uniqueDomains.map(domain => (
                  <option key={domain} value={domain}>{domain}</option>
                ))}
              </select>

              <select
                value={selectedConsultant}
                onChange={(e) => setSelectedConsultant(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm min-w-[150px]"
              >
                <option value="all">All Consultants</option>
                  {uniqueLeadConsultants.filter(consultant => consultant !== null).map(consultant => (
                    <option key={consultant} value={consultant}>{consultant}</option>
                  ))}
              </select>

              {selectedSubdomains.length > 0 && (
                <Button
                  onClick={handleBulkAssign}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Bulk Assign ({selectedSubdomains.length})
                </Button>
              )}
            </div>

            {filteredSubdomains.length !== totalSubdomains && (
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="secondary">
                  {filteredSubdomains.length} of {totalSubdomains} subdomains shown
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedDomain('all');
                    setSelectedConsultant('all');
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subdomains Table */}
        <SubdomainsTable
          subdomains={filteredSubdomains}
          consultants={consultants}
          onEdit={handleEdit}
          onRefresh={fetchSubdomains}
          selectedSubdomains={selectedSubdomains}
          onSelectionChange={setSelectedSubdomains}
        />

        {/* Modals */}
        <CreateSubdomainModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchSubdomains();
            setShowCreateModal(false);
          }}
          consultants={consultants}
        />

        <EditSubdomainModal
          isOpen={showEditModal}
          subdomain={editingSubdomain}
          consultants={consultants}
          onClose={() => {
            setShowEditModal(false);
            setEditingSubdomain(null);
          }}
          onSuccess={() => {
            fetchSubdomains();
            setShowEditModal(false);
            setEditingSubdomain(null);
          }}
        />

        <BulkAssignModal
          isOpen={showBulkModal}
          selectedSubdomainIds={selectedSubdomains}
          subdomains={subdomains}
          consultants={consultants}
          onClose={() => setShowBulkModal(false)}
          onSuccess={() => {
            fetchSubdomains();
            setShowBulkModal(false);
            setSelectedSubdomains([]);
          }}
        />
      </div>
    </AdminLayout>
  );
}