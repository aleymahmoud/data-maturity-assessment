// src/components/ui/Logo.tsx - Updated with better fallback for testing
'use client';

import { useState } from 'react';

interface LogoProps {
  variant?: 'full' | 'icon' | 'text';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export function Logo({ 
  variant = 'full', 
  size = 'md', 
  className = '',
  showText = true 
}: LogoProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl'
  };

  // Enhanced fallback with better styling
  const renderFallback = () => (
    <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm ${className}`}>
      <span className="text-white font-bold text-sm">CP</span>
    </div>
  );

  // Logo files are now added - remove the forced fallback
  // const forceShowFallback = true; // REMOVED - now shows real logo

  if (variant === 'icon' || !showText) {
    return (
      <div className={`flex items-center ${className}`}>
        {!imageError ? (
          <img
            src="/images/logo/logo-icon.png"
            alt="ClientPlus Logo"
            width={size === 'sm' ? 24 : size === 'md' ? 32 : 48}
            height={size === 'sm' ? 24 : size === 'md' ? 32 : 48}
            className={`${sizeClasses[size]} object-contain`}
            onError={() => setImageError(true)}
          />
        ) : (
          renderFallback()
        )}
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={`flex flex-col ${className}`}>
        <h1 className={`${textSizeClasses[size]} font-bold text-blue-600`}>ClientPlus</h1>
        <p className="text-xs text-gray-500">Consultant Tracking</p>
      </div>
    );
  }

  // Full logo - for now showing enhanced fallback
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {!imageError ? (
        <img
          src="/images/logo/logo-full.png"
          alt="ClientPlus Logo"
          width={size === 'sm' ? 120 : size === 'md' ? 150 : 200}
          height={size === 'sm' ? 30 : size === 'md' ? 40 : 50}
          className="object-contain"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex items-center space-x-3">
          <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm`}>
            <span className="text-white font-bold text-sm">CP</span>
          </div>
          {showText && (
            <div>
              <h1 className={`${textSizeClasses[size]} font-bold text-blue-600`}>ClientPlus</h1>
              <p className="text-xs text-gray-500">Consultant Tracking</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}