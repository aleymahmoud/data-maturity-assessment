// src/app/admin/users/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { UsersTable } from '@/components/admin/UsersTable';
import { CreateUserModal } from '@/components/admin/CreateUserModal';
import { EditUserModal } from '@/components/admin/EditUserModal';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string;
  role: "SUPER_USER" | "LEAD_CONSULTANT" | "CONSULTANT" | "SUPPORTING"; // Keep this as is - matches API
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  entryCount: number;
  domains: string[];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        throw new Error('Failed to fetch users');
      }
    } catch (error) {
      toast.error('Failed to load users', {
        description: 'Please refresh the page to try again.',
      });
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setSelectedUser(null);
    setShowEditModal(false);
  };

  const handleSuccess = () => {
    fetchUsers();
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading users...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <UsersTable
        users={users}
        onRefresh={fetchUsers}
        onEditUser={handleEditUser}
        onCreateUser={() => setShowCreateModal(true)}
      />

      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleSuccess}
      />

      {selectedUser && (
        <EditUserModal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          onSuccess={handleSuccess}
          user={selectedUser}
        />
      )}
    </AdminLayout>
  );
}