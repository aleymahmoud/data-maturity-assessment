// src/components/admin/EditUserModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  Loader2, 
  Shield,
  ShieldCheck,
  Users,
  UserCheck,
  Key,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';

const updateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['SUPER_USER', 'LEAD_CONSULTANT', 'CONSULTANT', 'SUPPORTING']),
  isActive: z.boolean(),
  domainIds: z.array(z.number()).optional(),
});

const resetPasswordSchema = z.object({
  action: z.enum(['generate', 'set']),
  newPassword: z.string().optional(),
  sendEmail: z.boolean(),
}).refine((data) => {
  if (data.action === 'set' && (!data.newPassword || data.newPassword.length < 8)) {
    return false;
  }
  return true;
}, {
  message: 'Password must be at least 8 characters when setting manually',
  path: ['newPassword'],
});

type UpdateUserData = z.infer<typeof updateUserSchema>;
type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

interface User {
  id: string;
  username: string;
  email: string;
  role: 'SUPER_USER' | 'LEAD_CONSULTANT' | 'CONSULTANT' | 'SUPPORTING';
  isActive: boolean;
  createdAt: string;
  entryCount: number;
  domains: string[];
}

interface Domain {
  id: number;
  domainName: string;
  userCount: number;
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User;
}

const roleOptions = [
  { value: 'SUPER_USER', label: 'Super User', icon: Shield, color: 'text-red-600', description: 'Full system access' },
  { value: 'LEAD_CONSULTANT', label: 'Lead Consultant', icon: ShieldCheck, color: 'text-blue-600', description: 'Team leadership access' },
  { value: 'CONSULTANT', label: 'Consultant', icon: Users, color: 'text-green-600', description: 'Standard consultant access' },
  { value: 'SUPPORTING', label: 'Supporting Staff', icon: UserCheck, color: 'text-gray-600', description: 'Limited support access' },
] as const;

export function EditUserModal({ isOpen, onClose, onSuccess, user }: EditUserModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [userDomains, setUserDomains] = useState<number[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const {
    register: registerUpdate,
    handleSubmit: handleUpdateSubmit,
    formState: { errors: updateErrors },
    watch: watchUpdate,
    setValue: setUpdateValue,
  } = useForm<UpdateUserData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    watch: watchPassword,
    setValue: setPasswordValue,
    reset: resetPasswordForm,
  } = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      action: 'generate',
      sendEmail: true,
    },
  });

  const selectedDomainIds = watchUpdate('domainIds') || [];
  const passwordAction = watchPassword('action');

  useEffect(() => {
    if (isOpen) {
      fetchDomains();
      fetchUserDetails();
    }
  }, [isOpen, user.id]);

const fetchDomains = async () => {
  try {
    const response = await fetch('/api/admin/domains');
    if (response.ok) {
      const domainsData = await response.json();
      
      // Handle the new response structure
      if (domainsData.domains && Array.isArray(domainsData.domains)) {
        // New structure: { domains: [...], globalActiveUsers: number }
        setDomains(domainsData.domains);
      } else if (Array.isArray(domainsData)) {
        // Old structure: just array of domains
        setDomains(domainsData);
      } else {
        console.error('Unexpected domains data structure:', domainsData);
        setDomains([]);
      }
    }
  } catch (error) {
    console.error('Error fetching domains:', error);
    setDomains([]);
  }
};

  const fetchUserDetails = async () => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`);
      if (response.ok) {
        const userData = await response.json();
        const domainIds = userData.domains?.map((d: any) => d.id) || [];
        setUserDomains(domainIds);
        setUpdateValue('domainIds', domainIds);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const onUpdateSubmit = async (data: UpdateUserData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success('User updated successfully!');
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        toast.error('Failed to update user', {
          description: error.error || 'An unexpected error occurred',
        });
      }
    } catch (error) {
      toast.error('Network error', {
        description: 'Failed to connect to the server',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (data: ResetPasswordData) => {
    setIsResettingPassword(true);
    
    try {
      const response = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.newPassword && !result.emailSent) {
          toast.success('Password reset successfully!', {
            description: `New password: ${result.newPassword}`,
            duration: 10000,
          });
        } else if (result.emailSent) {
          toast.success('Password reset successfully!', {
            description: 'New password has been sent via email.',
          });
        } else {
          toast.success('Password updated successfully!');
        }
        
        resetPasswordForm();
      } else {
        const error = await response.json();
        toast.error('Failed to reset password', {
          description: error.error || 'An unexpected error occurred',
        });
      }
    } catch (error) {
      toast.error('Network error', {
        description: 'Failed to connect to the server',
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const toggleDomainSelection = (domainId: number) => {
    const currentIds = selectedDomainIds;
    const newIds = currentIds.includes(domainId)
      ? currentIds.filter(id => id !== domainId)
      : [...currentIds, domainId];
    setUpdateValue('domainIds', newIds);
  };

  const handleClose = () => {
    if (!isLoading && !isResettingPassword) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Edit User: {user.username}
          </DialogTitle>
          <DialogDescription>
            Modify user details, permissions, and reset passwords.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Details & Permissions
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Reset Password
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-6">
            <form onSubmit={handleUpdateSubmit(onUpdateSubmit)} className="space-y-6">
              {/* User Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-700 font-medium">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{user.username}</h3>
                    <p className="text-sm text-gray-500">Created: {new Date(user.createdAt).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-500">{user.entryCount} time entries</p>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  {...registerUpdate('email')}
                  disabled={isLoading}
                  className={updateErrors.email ? 'border-red-500' : ''}
                />
                {updateErrors.email && (
                  <p className="text-sm text-red-600">{updateErrors.email.message}</p>
                )}
              </div>

              {/* Role Selection */}
              <div className="space-y-3">
                <Label>User Role</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {roleOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = watchUpdate('role') === option.value;
                    
                    return (
                      <label
                        key={option.value}
                        className={`
                          relative flex items-center p-3 border rounded-lg cursor-pointer transition-all
                          ${isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                      >
                        <input
                          type="radio"
                          value={option.value}
                          {...registerUpdate('role')}
                          className="sr-only"
                        />
                        <div className="flex items-center space-x-3 w-full">
                          <Icon className={`h-5 w-5 ${isSelected ? 'text-blue-600' : option.color}`} />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{option.label}</div>
                            <div className="text-xs text-gray-500">{option.description}</div>
                          </div>
                          {isSelected && (
                            <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Domain Assignment */}
              <div className="space-y-3">
                <Label>Domain Access</Label>
                <div className="bg-gray-50 p-3 rounded-lg max-h-32 overflow-y-auto">
                  {domains.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {domains.map((domain) => (
                        <label
                          key={domain.id}
                          className="flex items-center space-x-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedDomainIds.includes(domain.id)}
                            onChange={() => toggleDomainSelection(domain.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{domain.domainName}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No domains available</p>
                  )}
                </div>
              </div>

              {/* User Status */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  {...registerUpdate('isActive')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="isActive" className="text-sm font-normal">
                  User account is active
                </Label>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="min-w-[120px]"
                >
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Update User
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="password" className="space-y-6 mt-6">
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800">
                <strong>Security Notice:</strong> Resetting a user's password will immediately invalidate their current password and any active sessions.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-6">
              {/* Reset Method */}
              <div className="space-y-3">
                <Label>Reset Method</Label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="generate"
                      {...registerPassword('action')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">Generate secure password automatically</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="set"
                      {...registerPassword('action')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">Set specific password</span>
                  </label>
                </div>
              </div>

              {/* Manual Password Input */}
              {passwordAction === 'set' && (
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password (min 8 characters)"
                      {...registerPassword('newPassword')}
                      className={passwordErrors.newPassword ? 'border-red-500' : ''}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="text-sm text-red-600">{passwordErrors.newPassword.message}</p>
                  )}
                </div>
              )}

              {/* Email Option */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="sendEmail"
                  {...registerPassword('sendEmail')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="sendEmail" className="text-sm font-normal">
                  Send new password via email to {user.email}
                </Label>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isResettingPassword}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isResettingPassword}
                  className="min-w-[140px]"
                  variant="destructive"
                >
                  {isResettingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Reset Password
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}