// src/components/ui/UserProfileDropdown.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  User, 
  LogOut, 
  Shield, 
  ChevronDown,
  ArrowLeft
} from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';

export function UserProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if we're currently in admin area
  const isInAdminArea = pathname?.startsWith('/admin');
  const isAdmin = session?.user?.role === 'SUPER_USER';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!session?.user) {
    return null;
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  const handleProfileClick = () => {
    router.push('/profile');
    setIsOpen(false);
  };

  const handleAdminClick = () => {
    router.push('/admin');
    setIsOpen(false);
  };

  const handleBackToClientPlus = () => {
    router.push('/dashboard');
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 transition-colors"
      >
        <UserAvatar 
          user={{
            username: session.user.username,
            email: session.user.email??undefined,
            profileImage: session.user.profileImage,
            firstName: session.user.firstName,
            lastName: session.user.lastName,
          }}
          size="sm"
        />
        <ChevronDown className={`h-4 w-4 text-gray-500 transform transition-transform ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-20">
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-gray-100">
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
                <div>
                  <p className="font-medium text-gray-900">
                    {session.user.firstName && session.user.lastName 
                      ? `${session.user.firstName} ${session.user.lastName}`
                      : session.user.username
                    }
                  </p>
                  <p className="text-sm text-gray-500">{session.user.email}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    {isAdmin && <Shield className="w-3 h-3 text-red-500" />}
                    <span className="text-xs text-gray-500 capitalize">
                      {session.user.role?.replace('_', ' ').toLowerCase()}
                    </span>
                    {isInAdminArea && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full ml-2">
                        Admin Mode
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button
                onClick={handleProfileClick}
                className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Profile Settings</span>
              </button>

              {/* Navigation Options based on current location */}
              {isAdmin && (
                <>
                  <div className="border-t border-gray-100 my-2" />
                  
                  {isInAdminArea ? (
                    // Show "Back to ClientPlus" when in admin area
                    <button
                      onClick={handleBackToClientPlus}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to ClientPlus</span>
                    </button>
                  ) : (
                    // Show "Admin Panel" when in main app
                    <button
                      onClick={handleAdminClick}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Admin Panel</span>
                    </button>
                  )}
                </>
              )}

              <div className="border-t border-gray-100 my-2" />
              
              <button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}