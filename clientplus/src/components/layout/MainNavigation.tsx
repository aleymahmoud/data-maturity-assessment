// src/components/layout/MainNavigation.tsx
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Home, 
  PlusCircle, 
  BarChart3, 
  FileText, 
  Settings,
  Menu,
  X,
  Target
} from 'lucide-react';
import { UserProfileDropdown } from '@/components/ui/UserProfileDropdown';
import { Logo } from '@/components/ui/Logo';
import { UserAvatar } from '@/components/ui/UserAvatar';

interface NavigationItem {
  href: string;
  label: string;
  icon: any;
  roles?: string[];
}

const navigationItems: NavigationItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/data-entry', label: 'Add Entry', icon: PlusCircle },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/admin/scopes', label: 'Scope Management', icon: Target, roles: ['SUPER_USER', 'LEAD_CONSULTANT'] },
  { href: '/settings', label: 'Settings', icon: Settings, roles: ['SUPER_USER', 'LEAD_CONSULTANT'] },
];

interface MainNavigationProps {
  children: React.ReactNode;
}

export function MainNavigation({ children }: MainNavigationProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  if (!session?.user) {
    return null;
  }

  const userRole = session.user.role;

  // Filter navigation items based on user role
  const filteredNavItems = navigationItems.filter(item => 
    !item.roles || item.roles.includes(userRole)
  );

  const handleNavClick = (href: string) => {
    router.push(href);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar header with Logo */}
        <div className="flex items-center justify-between p-4 border-b">
          <Logo variant="full" size="md" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 pt-4 pb-4 space-y-2">
          {/* Main Navigation - Clean, no admin items */}
          <div className="space-y-1">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <button
                  key={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className={`
                    w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${isActive 
                      ? 'bg-blue-100 text-blue-900' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* User info at bottom with UserAvatar */}
        <div className="border-t p-4">
          <div className="flex items-center space-x-3">
            <UserAvatar 
              user={{
                username: session.user.username,
                email: session.user.email??undefined,
                profileImage: session.user.profileImage,
                firstName: session.user.firstName,
                lastName: session.user.lastName,
              }}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {session.user.firstName && session.user.lastName 
                  ? `${session.user.firstName} ${session.user.lastName}`
                  : session.user.username
                }
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {session.user.role?.replace('_', ' ').toLowerCase()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:ml-0">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b px-4 py-3 lg:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md hover:bg-gray-100"
              >
                <Menu className="h-5 w-5" />
              </button>
              
              <div className="hidden lg:block">
                <h1 className="text-xl font-semibold text-gray-900">
                  {filteredNavItems.find(item => item.href === pathname)?.label || 'Dashboard'}
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-sm text-gray-500">
                Welcome back, {session.user.firstName || session.user.username}
              </div>
              
              {/* User Profile Dropdown - Only access point to admin for super users */}
              <UserProfileDropdown />
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}