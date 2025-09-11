// src/components/admin/UsersTable.tsx - Enhanced with proper confirmation and error handling
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { 
  User, 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  Filter,
  Eye,
  EyeOff,
  Crown,
  Users,
  UserCheck,
  Briefcase,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'SUPER_USER' | 'LEAD_CONSULTANT' | 'CONSULTANT' | 'SUPPORTING';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  entryCount: number;
  domains: string[];
}

interface UsersTableProps {
  users: User[];
  onCreateUser: () => void;
  onEditUser: (user: User) => void;
  onRefresh: () => void;
}

interface ConfirmationState {
  isOpen: boolean;
  action: string;
  userId: string | null;
  userName?: string;
  title: string;
  description: string;
  confirmButtonText: string;
  confirmButtonVariant: "destructive" | "default";
  user: User | null;
}

export function UsersTable({ users, onCreateUser, onEditUser, onRefresh }: UsersTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationState>({
    isOpen: false,
    action: 'deactivate',
    userId: null,
    userName: undefined,
    title: '',
    description: '',
    confirmButtonText: '',
    confirmButtonVariant: 'destructive',
    user: null
  });

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user => {
      const matchesSearch = 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = !filterRole || user.role === filterRole;
      const matchesStatus = !filterStatus || 
        (filterStatus === 'active' && user.isActive) ||
        (filterStatus === 'inactive' && !user.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });

    // Sort by: Super Users first, then by username
    return filtered.sort((a, b) => {
      if (a.role === 'SUPER_USER' && b.role !== 'SUPER_USER') return -1;
      if (b.role === 'SUPER_USER' && a.role !== 'SUPER_USER') return 1;
      return a.username.localeCompare(b.username);
    });
  }, [users, searchTerm, filterRole, filterStatus]);

  // Role display helpers
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_USER': return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'LEAD_CONSULTANT': return <UserCheck className="h-4 w-4 text-blue-600" />;
      case 'CONSULTANT': return <Users className="h-4 w-4 text-green-600" />;
      case 'SUPPORTING': return <Briefcase className="h-4 w-4 text-gray-600" />;
      default: return <User className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_USER': return 'Super User';
      case 'LEAD_CONSULTANT': return 'Lead Consultant';
      case 'CONSULTANT': return 'Consultant';
      case 'SUPPORTING': return 'Supporting Staff';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_USER': return 'text-yellow-800 bg-yellow-100';
      case 'LEAD_CONSULTANT': return 'text-blue-800 bg-blue-100';
      case 'CONSULTANT': return 'text-green-800 bg-green-100';
      case 'SUPPORTING': return 'text-gray-800 bg-gray-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  // Handle user status toggle (activate/deactivate)
  const handleToggleStatus = (user: User) => {
    const action = user.isActive ? 'deactivate' : 'activate';
    const title = user.isActive ? 'Deactivate User Account' : 'Activate User Account';
    const description = user.isActive 
      ? 'This will deactivate the user account and remove their access to the system. Their data will be preserved and this action can be reversed.'
      : 'This will reactivate the user account and restore their access to the system.';
    const confirmButtonText = user.isActive ? 'Deactivate User' : 'Activate User';
    const confirmButtonVariant = user.isActive ? 'destructive' : 'default';

    setConfirmation({
      isOpen: true,
      action,
      userId: user.id,
      userName: user.username,
      title,
      description,
      confirmButtonText,
      confirmButtonVariant,
      user
    });
  };

  // Handle user delete (which is actually deactivate in your system)
  const handleDeleteUser = (user: User) => {
    setConfirmation({
      isOpen: true,
      action: 'deactivate',
      userId: user.id,
      userName: user.username,
      title: 'Deactivate User Account',
      description: 'This will deactivate the user account and remove their access to the system. Their data will be preserved and this action can be reversed.',
      confirmButtonText: 'Deactivate User',
      confirmButtonVariant: 'destructive',
      user
    });
  };

  // Execute the confirmed action with proper error handling
  const executeAction = async () => {
    if (!confirmation.user) return;

    const { user, action } = confirmation;
    setLoadingUserId(user.id);

    try {
      let endpoint = `/api/admin/users/${user.id}`;
      let method = action === 'delete' ? 'DELETE' : 'PATCH';
      let requestBody = action !== 'delete' ? { isActive: action === 'activate' } : undefined;

      console.log('API Request:', { endpoint, method, body: requestBody });

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        ...(requestBody && { body: JSON.stringify(requestBody) })
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response:', responseText);

      if (response.ok) {
        const result = JSON.parse(responseText);
        toast.success(`User ${action}d successfully`);
        onRefresh();
      } else {
        const error = responseText ? JSON.parse(responseText) : { error: 'Unknown error' };
        toast.error(error.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingUserId(null);
    }

    closeConfirmation();
  };

  // Close confirmation modal
  const closeConfirmation = () => {
    setConfirmation({
      isOpen: false,
      action: 'deactivate',
      userId: null,
      userName: undefined,
      title: '',
      description: '',
      confirmButtonText: '',
      confirmButtonVariant: 'destructive',
      user: null
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage users, roles, and permissions</p>
        </div>
        <Button onClick={onCreateUser} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create User
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Filter className="h-4 w-4" />
          <span>Filter Users</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            <option value="SUPER_USER">Super User</option>
            <option value="LEAD_CONSULTANT">Lead Consultant</option>
            <option value="CONSULTANT">Consultant</option>
            <option value="SUPPORTING">Supporting Staff</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredAndSortedUsers.length} of {users.length} users
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getRoleIcon(user.role)}
                      <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.isActive 
                          ? 'text-green-800 bg-green-100' 
                          : 'text-red-800 bg-red-100'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => handleToggleStatus(user)}
                        disabled={loadingUserId === user.id}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        title={user.isActive ? 'Deactivate user' : 'Activate user'}
                      >
                        {loadingUserId === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : user.isActive ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.updatedAt).toLocaleDateString()}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditUser(user)}
                        disabled={loadingUserId === user.id}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit user"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user)}
                        disabled={loadingUserId === user.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        title="Deactivate user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedUsers.length === 0 && (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterRole || filterStatus 
                ? 'Try adjusting your filters or search term.' 
                : 'Get started by creating a new user.'}
            </p>
            {!searchTerm && !filterRole && !filterStatus && (
              <div className="mt-6">
                <Button onClick={onCreateUser}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create User
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={closeConfirmation}
        onConfirm={executeAction}
        title={confirmation.title}
        description={confirmation.description}
        confirmButtonText={confirmation.confirmButtonText}
        confirmButtonVariant={confirmation.confirmButtonVariant}
        userName={confirmation.userName}
      />
    </div>
  );
}