// src/components/admin/CreateUserModal.tsx - Enhanced with Password Options
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
  Loader2, 
  Plus,
  Shield,
  ShieldCheck,
  Users,
  UserCheck,
  Eye,
  EyeOff,
  Mail
} from 'lucide-react';

const createUserSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['SUPER_USER', 'LEAD_CONSULTANT', 'CONSULTANT', 'SUPPORTING']),
  isActive: z.boolean(),
  domainIds: z.array(z.number()).optional(),
  passwordMethod: z.enum(['generate', 'set']),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  sendEmail: z.boolean(),
}).refine((data) => {
  if (data.passwordMethod === 'set') {
    if (!data.password || data.password.length < 8) {
      return false;
    }
    if (data.password !== data.confirmPassword) {
      return false;
    }
  }
  return true;
}, {
  message: 'Password must be at least 8 characters and passwords must match',
  path: ['password'],
});

type CreateUserData = z.infer<typeof createUserSchema>;

interface Domain {
  id: number;
  domainName: string;
  stats?: {
    userCount: number;
  };
}

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const roleOptions = [
  { 
    value: 'SUPER_USER', 
    label: 'Super User', 
    icon: Shield, 
    color: 'text-red-600', 
    description: 'Full system access' 
  },
  { 
    value: 'LEAD_CONSULTANT', 
    label: 'Lead Consultant', 
    icon: ShieldCheck, 
    color: 'text-blue-600', 
    description: 'Team leadership access' 
  },
  { 
    value: 'CONSULTANT', 
    label: 'Consultant', 
    icon: Users, 
    color: 'text-green-600', 
    description: 'Standard consultant access' 
  },
  { 
    value: 'SUPPORTING', 
    label: 'Supporting Staff', 
    icon: UserCheck, 
    color: 'text-gray-600', 
    description: 'Limited support access' 
  },
] as const;

export function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [selectedDomainIds, setSelectedDomainIds] = useState<number[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      isActive: true,
      passwordMethod: 'generate',
      sendEmail: true,
    },
  });

  const passwordMethod = watch('passwordMethod');
  const userEmail = watch('email');

  useEffect(() => {
    if (isOpen) {
      fetchDomains();
    }
  }, [isOpen]);

  const fetchDomains = async () => {
    setLoadingDomains(true);
    try {
      const response = await fetch('/api/admin/domains');
      if (response.ok) {
        const domainsData = await response.json();
        
        // Handle the new response structure
        if (domainsData.domains && Array.isArray(domainsData.domains)) {
          setDomains(domainsData.domains);
        } else if (Array.isArray(domainsData)) {
          setDomains(domainsData);
        } else {
          console.error('Unexpected domains data structure:', domainsData);
          setDomains([]);
        }
      }
    } catch (error) {
      console.error('Error fetching domains:', error);
      setDomains([]);
    } finally {
      setLoadingDomains(false);
    }
  };

  const toggleDomainSelection = (domainId: number) => {
    setSelectedDomainIds(prev => {
      const newSelection = prev.includes(domainId)
        ? prev.filter(id => id !== domainId)
        : [...prev, domainId];
      setValue('domainIds', newSelection);
      return newSelection;
    });
  };

  const onSubmit = async (data: CreateUserData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          domainIds: selectedDomainIds,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Handle different success scenarios
        if (data.passwordMethod === 'generate' && result.generatedPassword) {
          if (data.sendEmail && result.emailSent) {
            toast.success('User created successfully!', {
              description: `Password has been sent to ${data.email}`,
            });
          } else {
            toast.success('User created successfully!', {
              description: `Generated password: ${result.generatedPassword}`,
              duration: 10000,
            });
          }
        } else {
          toast.success('User created successfully!');
        }
        
        handleClose();
        onSuccess();
      } else {
        const error = await response.json();
        toast.error('Failed to create user', {
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

  const handleClose = () => {
    reset();
    setSelectedDomainIds([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-600" />
            Create New User
          </DialogTitle>
          <DialogDescription>
            Add a new user to the ClientPlus system. They will receive login credentials via email.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* User Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                placeholder="Enter username"
                {...register('username')}
                disabled={isLoading}
              />
              {errors.username && (
                <p className="text-xs text-red-600">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Password Method */}
          <div className="space-y-4">
            <Label>Password Setup *</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="generate"
                  value="generate"
                  {...register('passwordMethod')}
                  className="w-4 h-4 text-blue-600"
                />
                <Label htmlFor="generate" className="text-sm font-normal">
                  Generate secure password automatically
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="set"
                  value="set"
                  {...register('passwordMethod')}
                  className="w-4 h-4 text-blue-600"
                />
                <Label htmlFor="set" className="text-sm font-normal">
                  Set specific password
                </Label>
              </div>
            </div>

            {/* Password Fields (shown only when "set" is selected) */}
            {passwordMethod === 'set' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      {...register('password')}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm password"
                      {...register('confirmPassword')}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {errors.password && (
              <p className="text-xs text-red-600">{errors.password.message}</p>
            )}

            {/* Email Option */}
            <div className="flex items-center space-x-2 bg-blue-50 p-3 rounded-lg">
              <input
                type="checkbox"
                id="sendEmail"
                {...register('sendEmail')}
                className="w-4 h-4 text-blue-600"
              />
              <Label htmlFor="sendEmail" className="text-sm font-normal flex items-center">
                <Mail className="h-4 w-4 mr-2 text-blue-600" />
                Send {passwordMethod === 'generate' ? 'new' : 'login'} password via email to{' '}
                <span className="font-medium ml-1">
                  {userEmail || '[user@email.com]'}
                </span>
              </Label>
            </div>
          </div>

          {/* User Role */}
          <div className="space-y-3">
            <Label>User Role *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {roleOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = watch('role') === option.value;
                
                return (
                  <label
                    key={option.value}
                    className={`
                      relative flex cursor-pointer rounded-lg border p-4 focus:outline-none transition-colors
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      value={option.value}
                      {...register('role')}
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
            {errors.role && (
              <p className="text-xs text-red-600">{errors.role.message}</p>
            )}
          </div>

          {/* Domain Assignment */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Domain Access (Optional)</Label>
              {loadingDomains && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
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
                      <span className="text-xs text-gray-500">
                        ({domain.stats?.userCount || 0} users)
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  {loadingDomains ? 'Loading domains...' : 'No domains available'}
                </p>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Select the domains this user should have access to. Users need domain access to create time entries.
            </p>
          </div>

          {/* User Status */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              {...register('isActive')}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <Label htmlFor="isActive" className="text-sm font-normal">
              Activate user account immediately
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
              Create User
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}