// src/app/admin/scopes/page.tsx - Part 1: Main Component and State
'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Search, 
  Target,
  Loader2,
  Trash2,
  Edit,
  Package,
  Link,
  X,
  AlertTriangle,
  Users,
  Clock,
  Building2,
  Eye
} from 'lucide-react';

// Interface definitions
interface UniversalScope {
  id: number;
  templateName: string;
  description?: string;
  domain: {
    id: number;
    domainName: string;
  };
  createdAt: string;
  updatedAt: string;
  assignmentCount: number;
  hasHistoricalData?: boolean;
}

interface DomainData {
  id: number;
  domainName: string;
}

interface SubdomainData {
  id: number;
  subdomainName: string;
  domain: {
    id: number;
    domainName: string;
  };
}

export default function ScopeManagementPage() {
  // Universal Scopes State
  const [universalScopes, setUniversalScopes] = useState<UniversalScope[]>([]);
  const [filteredScopes, setFilteredScopes] = useState<UniversalScope[]>([]);
  
  // Common Data
  const [domains, setDomains] = useState<DomainData[]>([]);
  const [subdomains, setSubdomains] = useState<SubdomainData[]>([]);
  
  // Loading and filters
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  // Form states
  const [newScopeName, setNewScopeName] = useState('');
  const [newScopeDescription, setNewScopeDescription] = useState('');
  const [createDomainIds, setCreateDomainIds] = useState<number[]>([]);
  const [editingScope, setEditingScope] = useState<UniversalScope | null>(null);
  const [itemToDelete, setItemToDelete] = useState<UniversalScope | null>(null);
  const [scopeToAssign, setScopeToAssign] = useState<UniversalScope | null>(null);
  const [selectedSubdomains, setSelectedSubdomains] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

    // New state for viewing assignments
  const [showViewAssignmentsModal, setShowViewAssignmentsModal] = useState(false);
  const [viewingScopeAssignments, setViewingScopeAssignments] = useState<any>(null);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  // Effects and data fetching
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Filter scopes based on search term and domain
    let filtered = universalScopes;
    
    if (searchTerm) {
      filtered = filtered.filter(scope =>
        scope.templateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scope.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scope.domain.domainName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedDomain) {
      filtered = filtered.filter(scope => scope.domain.id === parseInt(selectedDomain));
    }
    
    setFilteredScopes(filtered);
  }, [universalScopes, searchTerm, selectedDomain]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        fetchUniversalScopes(),
        fetchDomains(),
        fetchSubdomains()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUniversalScopes = async () => {
    const response = await fetch('/api/admin/scope-templates');
    if (!response.ok) throw new Error('Failed to fetch universal scopes');
    
    const data = await response.json();
    setUniversalScopes(data.templates || []);
  };

  const fetchDomains = async () => {
    const response = await fetch('/api/admin/domains');
    if (!response.ok) throw new Error('Failed to fetch domains');
    
    const data = await response.json();
    setDomains(data.domains || []);
  };

  const fetchSubdomains = async () => {
    const response = await fetch('/api/admin/subdomains');
    if (response.ok) {
      const data = await response.json();
      setSubdomains(data.subdomains || []);
    }
  };

  // Utility functions
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDomain('');
  };

  const resetCreateForm = () => {
    setNewScopeName('');
    setNewScopeDescription('');
    setCreateDomainIds([]);
  };

  const resetEditForm = () => {
    setEditingScope(null);
    setNewScopeName('');
    setNewScopeDescription('');
  };

  const resetAssignForm = () => {
    setScopeToAssign(null);
    setSelectedSubdomains([]);
  };

  const openEditModal = (scope: UniversalScope) => {
    setEditingScope(scope);
    setNewScopeName(scope.templateName);
    setNewScopeDescription(scope.description || '');
    setShowEditModal(true);
  };

  const openAssignModal = async (scope: UniversalScope) => {
    setScopeToAssign(scope);
    setShowAssignModal(true);
    
    // Get already assigned subdomains and pre-select them
    try {
      const response = await fetch(`/api/admin/scope-templates/${scope.id}/assignments`);
      if (response.ok) {
        const data = await response.json();
        const alreadyAssignedIds = data.assignments.map((a: any) => a.subdomain.id);
        setSelectedSubdomains(alreadyAssignedIds);
      } else {
        setSelectedSubdomains([]);
      }
    } catch (error) {
      console.error('Error fetching existing assignments:', error);
      setSelectedSubdomains([]);
    }
  };

  const getAvailableSubdomains = () => {
    if (!scopeToAssign) return [];
    return subdomains.filter(sub => sub.domain.id === scopeToAssign.domain.id);
  };

  // Event handlers (Part 2)
  const handleCreateScope = async () => {
    if (!newScopeName.trim() || createDomainIds.length === 0) {
      alert('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/scope-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateName: newScopeName.trim(),
          description: newScopeDescription.trim(),
          domainIds: createDomainIds
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create universal scope');
      }

      alert('Universal scope created successfully');
      setShowCreateModal(false);
      resetCreateForm();
      fetchUniversalScopes();
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditScope = async () => {
    if (!editingScope || !newScopeName.trim()) {
      alert('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/scope-templates/${editingScope.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateName: newScopeName.trim(),
          description: newScopeDescription.trim()
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update scope');
      }

      alert('Scope updated successfully');
      setShowEditModal(false);
      resetEditForm();
      fetchUniversalScopes();
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteScope = async () => {
    if (!itemToDelete) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/scope-templates/${itemToDelete.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete scope');
      }

      alert('Scope deleted successfully');
      setShowDeleteModal(false);
      setItemToDelete(null);
      fetchUniversalScopes();
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

// FIXED: Assignment handler (Replace in Part 2)
  const handleAssignToSubdomains = async () => {
    if (!scopeToAssign || selectedSubdomains.length === 0) {
      alert('Please select subdomains to assign');
      return;
    }

    setSubmitting(true);
    try {
      // Process each subdomain separately since API expects one subdomain at a time
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const subdomainId of selectedSubdomains) {
        try {
          const response = await fetch('/api/admin/scope-assignments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subdomainId: subdomainId,  // Single subdomain ID
              templateIds: [scopeToAssign.id]  // Array of template IDs
            })
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to assign scope');
          }

          successCount++;
        } catch (error: any) {
          errorCount++;
          errors.push(`Subdomain ${subdomainId}: ${error.message}`);
        }
      }

      // Show result summary
      if (successCount > 0 && errorCount === 0) {
        alert(`Successfully assigned scope to ${successCount} subdomain${successCount !== 1 ? 's' : ''}`);
      } else if (successCount > 0 && errorCount > 0) {
        alert(`Assigned to ${successCount} subdomain${successCount !== 1 ? 's' : ''}. Failed for ${errorCount}: ${errors.join(', ')}`);
      } else {
        alert(`Failed to assign scope: ${errors.join(', ')}`);
      }

      setShowAssignModal(false);
      resetAssignForm();
      fetchUniversalScopes();
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewAssignments = async (scope: UniversalScope) => {
    if (scope.assignmentCount === 0) {
      alert('This scope has no assignments to view');
      return;
    }

    setAssignmentsLoading(true);
    setShowViewAssignmentsModal(true);
    
    try {
      const response = await fetch(`/api/admin/scope-templates/${scope.id}/assignments`);
      if (!response.ok) {
        throw new Error('Failed to fetch assignments');
      }
      
      const data = await response.json();
      setViewingScopeAssignments(data);
    } catch (error: any) {
      alert('Error: ' + error.message);
      setShowViewAssignmentsModal(false);
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const closeViewAssignmentsModal = () => {
    setShowViewAssignmentsModal(false);
    setViewingScopeAssignments(null);
  };



  // Loading states and main JSX (Part 3)
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading scope management...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-4">❌ {error}</div>
            <Button onClick={fetchData}>Try Again</Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <Target className="h-6 w-6 text-blue-600" />
              Universal Scope Management
            </h1>
            <p className="text-gray-600">Create and manage universal scopes that can be assigned to subdomains</p>
          </div>
          
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Universal Scope
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Scopes</p>
                <p className="text-2xl font-semibold text-gray-900">{universalScopes.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Link className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Assignments</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {universalScopes.reduce((sum, scope) => sum + scope.assignmentCount, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Domains</p>
                <p className="text-2xl font-semibold text-gray-900">{domains.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Filtered Results</p>
                <p className="text-2xl font-semibold text-gray-900">{filteredScopes.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search scopes by name, description, or domain..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Domains</option>
              {domains.map(domain => (
                <option key={domain.id} value={domain.id.toString()}>
                  {domain.domainName}
                </option>
              ))}
            </select>

            <Button 
              variant="outline" 
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        </div>
        {/* Universal Scopes Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scope Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Domain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredScopes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {universalScopes.length === 0 
                          ? 'No universal scopes found' 
                          : 'No scopes match your filters'
                        }
                      </p>
                      <p className="text-sm text-gray-400">
                        {universalScopes.length === 0 
                          ? 'Create your first universal scope to get started' 
                          : 'Try adjusting your search or filter criteria'
                        }
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredScopes.map((scope) => (
                    <tr key={scope.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{scope.templateName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{scope.domain.domainName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {scope.description || 'No description'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Link className="h-3 w-3 mr-1" />
                          {scope.assignmentCount} subdomains
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {new Date(scope.createdAt).toLocaleDateString()}
                        </div>
                      </td>
<td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {/* View Assignments Button */}
                          {scope.assignmentCount > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewAssignments(scope)}
                              className="text-green-600 hover:text-green-700"
                              title="View which subdomains are assigned to this scope"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {/* Assign Button */}
                          {scope.assignmentCount === 0 ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAssignModal(scope)}
                              className="text-blue-600 hover:text-blue-700"
                              title="Assign this scope to subdomains"
                            >
                              <Link className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAssignModal(scope)}
                              className="text-xs"
                              title="Assign to more subdomains"
                            >
                              + Assign More
                            </Button>
                          )}
                          
                          {/* Edit Button */}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openEditModal(scope)}
                            title="Edit scope name and description"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          {/* Delete Button */}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setItemToDelete(scope);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-700"
                            title="Delete this scope"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Section */}
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Total Scopes:</span>
              <span className="ml-2 font-medium">{universalScopes.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Assigned:</span>
              <span className="ml-2 font-medium">
                {universalScopes.filter(s => s.assignmentCount > 0).length}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Unassigned:</span>
              <span className="ml-2 font-medium">
                {universalScopes.filter(s => s.assignmentCount === 0).length}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Total Assignments:</span>
              <span className="ml-2 font-medium">
                {universalScopes.reduce((sum, scope) => sum + scope.assignmentCount, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Create Universal Scope</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCreateModal(false);
                  resetCreateForm();
                }}
                disabled={submitting}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="scopeName">Scope Name *</Label>
                <Input
                  id="scopeName"
                  value={newScopeName}
                  onChange={(e) => setNewScopeName(e.target.value)}
                  placeholder="Enter scope name"
                  disabled={submitting}
                />
              </div>

              <div>
                <Label htmlFor="scopeDescription">Description</Label>
                <Input
                  id="scopeDescription"
                  value={newScopeDescription}
                  onChange={(e) => setNewScopeDescription(e.target.value)}
                  placeholder="Enter description (optional)"
                  disabled={submitting}
                />
              </div>

              <div>
                <Label>Select Domains * ({createDomainIds.length} selected)</Label>
                <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                  {domains.map(domain => (
                    <label key={domain.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={createDomainIds.includes(domain.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCreateDomainIds([...createDomainIds, domain.id]);
                          } else {
                            setCreateDomainIds(createDomainIds.filter(id => id !== domain.id));
                          }
                        }}
                        disabled={submitting}
                        className="rounded"
                      />
                      <span className="text-sm">{domain.domainName}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  resetCreateForm();
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateScope}
                disabled={submitting || !newScopeName.trim() || createDomainIds.length === 0}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Scope'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingScope && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Edit Universal Scope</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowEditModal(false);
                  resetEditForm();
                }}
                disabled={submitting}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {editingScope.assignmentCount > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Warning: This scope is currently assigned to {editingScope.assignmentCount} subdomain(s).</p>
                    <p className="mt-1">Changing the scope name will affect historical data and existing assignments.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="editScopeName">Scope Name *</Label>
                <Input
                  id="editScopeName"
                  value={newScopeName}
                  onChange={(e) => setNewScopeName(e.target.value)}
                  placeholder="Enter scope name"
                  disabled={submitting}
                />
              </div>

              <div>
                <Label htmlFor="editScopeDescription">Description</Label>
                <Input
                  id="editScopeDescription"
                  value={newScopeDescription}
                  onChange={(e) => setNewScopeDescription(e.target.value)}
                  placeholder="Enter description (optional)"
                  disabled={submitting}
                />
              </div>

              <div>
                <Label>Domain</Label>
                <Input
                  value={editingScope.domain.domainName}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">Domain cannot be changed for existing scopes</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  resetEditForm();
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleEditScope}
                disabled={submitting || !newScopeName.trim()}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Scope'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Assign to Subdomains Modal */}
      {showAssignModal && scopeToAssign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Assign "{scopeToAssign.templateName}" to Subdomains</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAssignModal(false);
                  resetAssignForm();
                }}
                disabled={submitting}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Domain:</strong> {scopeToAssign.domain.domainName}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Currently assigned to {scopeToAssign.assignmentCount} subdomain(s)
              </p>
            </div>

            <div className="space-y-4">
<div>
                <Label>Select Subdomains to Assign ({selectedSubdomains.length} selected)</Label>
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                  {/* Select All Checkbox */}
                  {getAvailableSubdomains().length > 0 && (
                    <label className="flex items-center space-x-2 cursor-pointer hover:bg-blue-50 p-2 rounded border-b border-gray-200 bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedSubdomains.length === getAvailableSubdomains().length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            // Select all subdomains
                            setSelectedSubdomains(getAvailableSubdomains().map(s => s.id));
                          } else {
                            // Deselect all subdomains
                            setSelectedSubdomains([]);
                          }
                        }}
                        disabled={submitting}
                        className="rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Select All ({getAvailableSubdomains().length} subdomains)
                      </span>
                    </label>
                  )}
                  
                  {/* Individual Subdomains */}
                  {getAvailableSubdomains().map(subdomain => (
                    <label key={subdomain.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={selectedSubdomains.includes(subdomain.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSubdomains([...selectedSubdomains, subdomain.id]);
                          } else {
                            setSelectedSubdomains(selectedSubdomains.filter(id => id !== subdomain.id));
                          }
                        }}
                        disabled={submitting}
                        className="rounded"
                      />
                      <span className="text-sm">{subdomain.subdomainName}</span>
                    </label>
                  ))}
                  {getAvailableSubdomains().length === 0 && (
                    <p className="text-sm text-gray-500 p-2">No subdomains available for this domain</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAssignModal(false);
                  resetAssignForm();
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAssignToSubdomains}
                disabled={submitting || selectedSubdomains.length === 0}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  `Assign to ${selectedSubdomains.length} Subdomain${selectedSubdomains.length !== 1 ? 's' : ''}`
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Confirm Delete</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowDeleteModal(false);
                  setItemToDelete(null);
                }}
                disabled={submitting}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {itemToDelete.assignmentCount > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium">Warning: This scope is assigned to {itemToDelete.assignmentCount} subdomain(s).</p>
                    <p className="mt-1">Deleting it will remove all assignments and may affect historical data.</p>
                  </div>
                </div>
              </div>
            )}

            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the scope "<strong>{itemToDelete.templateName}</strong>"? 
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setItemToDelete(null);
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDeleteScope}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Scope'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

            {/* View Assignments Modal */}
      {showViewAssignmentsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {viewingScopeAssignments ? `Assignments for "${viewingScopeAssignments.template.templateName}"` : 'Loading...'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeViewAssignmentsModal}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {assignmentsLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2">Loading assignments...</span>
              </div>
            ) : viewingScopeAssignments ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm text-blue-600">Total Assignments</div>
                    <div className="text-2xl font-semibold text-blue-900">
                      {viewingScopeAssignments.summary.totalAssignments}
                    </div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-sm text-green-600">Active Usage</div>
                    <div className="text-2xl font-semibold text-green-900">
                      {viewingScopeAssignments.summary.totalUsage}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-sm text-purple-600">Active Subdomains</div>
                    <div className="text-2xl font-semibold text-purple-900">
                      {viewingScopeAssignments.summary.activeSubdomains}
                    </div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="text-sm text-orange-600">Consultants</div>
                    <div className="text-2xl font-semibold text-orange-900">
                      {viewingScopeAssignments.summary.uniqueConsultants}
                    </div>
                  </div>
                </div>

                {/* Assignments Table */}
                <div className="bg-white border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subdomain
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Domain
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Lead Consultant
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Usage
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Used
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Assigned Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {viewingScopeAssignments.assignments.map((assignment: any) => (
                          <tr key={assignment.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <div className="font-medium text-gray-900">
                                {assignment.subdomain.subdomainName}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900">
                                {assignment.subdomain.domain.domainName}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900">
                                {assignment.subdomain.leadConsultant || 'Not assigned'}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  assignment.stats.usageCount === 0 
                                    ? 'bg-gray-100 text-gray-800'
                                    : assignment.stats.usageCount < 10
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  <Clock className="h-3 w-3 mr-1" />
                                  {assignment.stats.usageCount} entries
                                </span>
                                {assignment.stats.activeConsultants > 0 && (
                                  <span className="text-xs text-gray-500 mt-1">
                                    {assignment.stats.activeConsultants} consultant{assignment.stats.activeConsultants !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-500">
                                {assignment.stats.lastUsedDate 
                                  ? new Date(assignment.stats.lastUsed).toLocaleDateString()
                                  : 'Never used'
                                }
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-500">
                                {new Date(assignment.createdAt).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-400">
                                by {assignment.createdBy}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* No assignments message */}
                {viewingScopeAssignments.assignments.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No assignments found for this scope</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Failed to load assignments</p>
              </div>
            )}
          </div>
        </div>
      )}



    </AdminLayout>
  );
}