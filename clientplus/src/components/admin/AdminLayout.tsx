// src/components/admin/AdminLayout.tsx - Updated for Lead Consultant Access
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Settings, 
  Shield, 
  Home, 
  Menu,
  X,
  Building2,
  FileText,
  BarChart3,
  ArrowLeft,
  // Add missing icons for future use
  UserCheck,
  Layers,
  Crown,
  Target,
  DollarSign
} from 'lucide-react';
import { UserProfileDropdown } from '@/components/ui/UserProfileDropdown';
import { UserAvatar } from '@/components/ui/UserAvatar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

// Navigation items with role-based access
const allAdminNavItems = [
  { href: '/admin', icon: Home, label: 'Dashboard', roles: ['SUPER_USER', 'LEAD_CONSULTANT'] },
  { href: '/admin/users', icon: Users, label: 'User Management', roles: ['SUPER_USER'] },
  { href: '/admin/domains', icon: Building2, label: 'Domain Management', roles: ['SUPER_USER'] },
  { href: '/admin/clients', icon: UserCheck, label: 'Client Management', roles: ['SUPER_USER'] },
  { href: '/admin/subdomains', icon: Layers, label: 'Subdomain Management', roles: ['SUPER_USER'] },
  { href: '/admin/lead-consultants', icon: Crown, label: 'Lead Consultant Mngmt', roles: ['SUPER_USER'] },
  { href: '/admin/scopes', icon: Target, label: 'Scope Management', roles: ['SUPER_USER', 'LEAD_CONSULTANT'] },
  { href: '/admin/deals', icon: DollarSign, label: 'Consultant Deals', roles: ['SUPER_USER'] },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Check if user has admin access (SUPER_USER or LEAD_CONSULTANT)
  const hasAdminAccess = session?.user.role === 'SUPER_USER' || session?.user.role === 'LEAD_CONSULTANT';

  if (!session || !hasAdminAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have admin privileges.</p>
          <Button onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Filter navigation items based on user role
  const adminNavItems = allAdminNavItems.filter(item => 
    item.roles.includes(session.user.role)
  );

  const handleBackToApp = () => {
    router.push('/dashboard');
  };

  // Determine theme color based on role
  const isLeadConsultant = session.user.role === 'LEAD_CONSULTANT';
  const themeColor = isLeadConsultant ? 'blue' : 'red';
  const sidebarBg = isLeadConsultant ? 'bg-blue-900' : 'bg-red-900';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar - Color theme based on role */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${sidebarBg}
      `}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Shield className={`h-8 w-8 ${isLeadConsultant ? 'text-blue-200' : 'text-red-200'}`} />
            <span className="text-white font-semibold">
              {isLeadConsultant ? 'Lead Panel' : 'Admin Panel'}
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2 rounded-md text-gray-300 hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-5 px-2">
          <div className="space-y-1">
            {/* Back to Main App */}
            <button
              onClick={handleBackToApp}
              className={`
                group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left
                ${isLeadConsultant 
                  ? 'text-blue-200 hover:bg-blue-800 hover:text-white' 
                  : 'text-red-200 hover:bg-red-800 hover:text-white'
                }
              `}
            >
              <ArrowLeft className="h-4 w-4 mr-3" />
              Back to App
            </button>

            {/* Navigation Items */}
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left
                    ${isActive
                      ? `bg-white ${isLeadConsultant ? 'text-blue-900' : 'text-red-900'}`
                      : `${isLeadConsultant 
                          ? 'text-blue-200 hover:bg-blue-800 hover:text-white' 
                          : 'text-red-200 hover:bg-red-800 hover:text-white'
                        }`
                    }
                  `}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* User Info at Bottom */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className={`p-3 rounded-lg ${isLeadConsultant ? 'bg-blue-800' : 'bg-red-800'}`}>
            <div className="flex items-center space-x-3">
              <UserAvatar 
                  user={{
                    username: session.user.username,
                    email: session.user.email ?? undefined,
                    profileImage: session.user.profileImage,
                    firstName: session.user.firstName,
                    lastName: session.user.lastName,
                  }} 
                  size="sm" 
                />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {session.user.firstName && session.user.lastName
                    ? `${session.user.firstName} ${session.user.lastName}`
                    : session.user.username
                  }
                </p>
                <p className={`text-xs ${isLeadConsultant ? 'text-blue-200' : 'text-red-200'}`}>
                  {isLeadConsultant ? 'Lead Consultant' : 'Super User'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main admin content */}
      <div className="flex-1 md:ml-0">
        {/* Admin Top bar */}
        <div className="bg-white shadow-sm border-b px-4 py-3 md:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-md hover:bg-gray-100"
              >
                <Menu className="h-5 w-5" />
              </button>
              
              {/* Admin breadcrumb */}
              <div className="flex items-center space-x-2">
                <Shield className={`h-5 w-5 ${isLeadConsultant ? 'text-blue-600' : 'text-red-600'}`} />
                <span className={`text-sm font-medium ${isLeadConsultant ? 'text-blue-600' : 'text-red-600'}`}>
                  {isLeadConsultant ? 'Lead Consultant Portal' : 'Admin Portal'}
                </span>
                <span className="text-gray-400">|</span>
                <h1 className="text-xl font-semibold text-gray-900">
                  {adminNavItems.find(item => item.href === pathname)?.label || 
                   (isLeadConsultant ? 'Lead Dashboard' : 'Admin Dashboard')
                  }
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-sm text-gray-500">
                Welcome back, {session.user.firstName || session.user.username}
              </div>
              
              <UserProfileDropdown />
            </div>
          </div>
        </div>

        {/* Admin page content */}
        <main className="flex-1 p-4 md:p-6">
          {/* Admin context indicator */}
          <div className={`mb-6 border-l-4 p-4 rounded-r-lg ${
            isLeadConsultant 
              ? 'bg-blue-50 border-blue-400' 
              : 'bg-red-50 border-red-400'
          }`}>
            <div className="flex items-center">
              <Shield className={`h-5 w-5 mr-2 ${isLeadConsultant ? 'text-blue-400' : 'text-red-400'}`} />
              <p className={`text-sm ${isLeadConsultant ? 'text-blue-700' : 'text-red-700'}`}>
                <span className="font-medium">
                  {isLeadConsultant ? 'Lead Consultant Mode:' : 'Administrator Mode:'}
                </span> 
                {isLeadConsultant 
                  ? ' You can manage scopes and view analytics for your assigned domains.'
                  : ' You are currently managing system settings and users.'
                }
              </p>
            </div>
          </div>
          
          {children}
        </main>
      </div>
    </div>
  );
}