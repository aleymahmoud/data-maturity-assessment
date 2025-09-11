// src/components/ui/UserAvatar.tsx
'use client';

import Image from 'next/image';
import { useState } from 'react';

interface UserAvatarProps {
  user: {
    username?: string;
    email?: string;
    profileImage?: string;
    firstName?: string;
    lastName?: string;
  };
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showOnlineStatus?: boolean;
  isOnline?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

export function UserAvatar({ 
  user, 
  size = 'md', 
  className = '',
  showOnlineStatus = false,
  isOnline = false,
  clickable = false,
  onClick
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  // Generate initials from user data
  const getInitials = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Generate avatar background color based on user name
  const getAvatarColor = () => {
    const colors = [
      'bg-blue-600',
      'bg-green-600', 
      'bg-purple-600',
      'bg-pink-600',
      'bg-indigo-600',
      'bg-red-600',
      'bg-yellow-600',
      'bg-gray-600'
    ];
    
    const name = user.firstName || user.username || user.email || '';
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const renderFallback = () => (
    <div className={`
      ${sizeClasses[size]} 
      ${getAvatarColor()} 
      rounded-full 
      flex 
      items-center 
      justify-center 
      relative
      ${clickable ? 'cursor-pointer hover:opacity-80' : ''}
      ${className}
    `}>
      <span className={`text-white font-medium ${textSizeClasses[size]}`}>
        {getInitials()}
      </span>
      {showOnlineStatus && (
        <div className={`
          absolute -bottom-0 -right-0 
          ${size === 'xs' ? 'w-2 h-2' : size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'}
          ${isOnline ? 'bg-green-400' : 'bg-gray-400'} 
          border-2 border-white rounded-full
        `} />
      )}
    </div>
  );

  if (!user.profileImage || imageError) {
    return (
      <div onClick={clickable ? onClick : undefined}>
        {renderFallback()}
      </div>
    );
  }

  return (
    <div 
      className={`relative ${clickable ? 'cursor-pointer hover:opacity-80' : ''}`}
      onClick={clickable ? onClick : undefined}
    >
      <Image
        src={user.profileImage.startsWith('http') 
          ? user.profileImage 
          : `/images/users/${user.profileImage}`
        }
        alt={`${user.firstName || user.username}'s avatar`}
        width={size === 'xs' ? 24 : size === 'sm' ? 32 : size === 'md' ? 40 : size === 'lg' ? 48 : 64}
        height={size === 'xs' ? 24 : size === 'sm' ? 32 : size === 'md' ? 40 : size === 'lg' ? 48 : 64}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
        onError={() => setImageError(true)}
      />
      {showOnlineStatus && (
        <div className={`
          absolute -bottom-0 -right-0 
          ${size === 'xs' ? 'w-2 h-2' : size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'}
          ${isOnline ? 'bg-green-400' : 'bg-gray-400'} 
          border-2 border-white rounded-full
        `} />
      )}
    </div>
  );
}