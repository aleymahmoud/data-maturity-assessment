'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  BarChart3, 
  Calendar, 
  FileText, 
  Home, 
  Menu, 
  Settings, 
  Users, 
  LogOut,
  User,
  Clock,
  X
} from 'lucide-react';
import { APP_CONFIG } from '@/lib/utils';

const navigationItems = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: Home, 
    roles: ['SUPER_USER', 'LEAD_CONSULTANT', 'CONSULTANT', 'SUPPORTING'] 
  },
  { 
    name: 'Data Entry', 
    href: '/data-entry', 
    icon: Clock, 
    roles: ['SUPER_USER', 'LEAD_CONSULTANT', 'CONSULTANT', 'SUPPORTING'] 
  },
  { 
    name: 'Analytics', 
    href: '/analytics', 
    icon: BarChart3, 
    roles: ['SUPER_USER', 'LEAD_CONSULTANT', 'CONSULTANT'] 
  },
  { 
    name: 'Reports', 
    href: '/reports', 
    icon: FileText, 
    roles: ['SUPER_USER', 'LEAD_CONSULTANT', 'CONSULTANT'] 
  },
  { 
    name: 'Calendar', 
    href: '/calendar', 
    icon: Calendar, 
    roles: ['SUPER_USER', 'LEAD_CONSULTANT', 'CONSULTANT'] 
  },
  { 
    name: 'Settings', 
    href: '/settings', 
    icon: Settings, 
    roles: ['SUPER_USER', 'LEAD_CONSULTANT'] 
  },
  { 
    name: 'Users', 
    href: '/users', 
    icon: Users, 
    roles: ['SUPER_USER'] 
  },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">Loading...</div>
    </div>;
  }

  const userRole = session.user.role;
  const filteredNavigation = navigationItems.filter(item => 
    item.roles.includes(userRole)
  );

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 fixed w-full top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <Menu size={20} />
            </button>
            <Link href="/dashboard">
              <h1 className="text-xl font-bold clientplus-gradient bg-clip-text text-transparent cursor-pointer">
                {APP_CONFIG.name}
              </h1>
            </Link>
          </div>
          
          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-3 text-gray-600 hover:text-gray-900 p-2 rounded-md"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User size={16} className="text-blue-600" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">{session.user.username}</p>
                <p className="text-xs text-gray-500">{userRole.replace('_', ' ')}</p>
              </div>
            </button>

            {/* User Dropdown */}
            {userMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setUserMenuOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-20">
                  <div className="p-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{session.user.username}</p>
                    <p className="text-xs text-gray-500">{userRole.replace('_', ' ')}</p>
                  </div>
                  <div className="py-1">
                    <Link 
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User size={16} className="mr-3" />
                      Profile Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      <LogOut size={16} className="mr-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className={`bg-white border-r border-gray-200 w-64 min-h-screen fixed md:relative z-40 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-200 ease-in-out`}>
          {/* Mobile close button */}
          <div className="md:hidden flex justify-end p-4">
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="p-4">
            <ul className="space-y-2">
              {filteredNavigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors ${
                      pathname === item.href
                        ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon size={18} />
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 md:ml-0 min-h-screen">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}