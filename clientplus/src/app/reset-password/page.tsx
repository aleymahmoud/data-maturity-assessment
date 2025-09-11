// src/app/reset-password/page.tsx
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    
    if (!tokenParam) {
      setIsValidating(false);
      return;
    }

    setToken(tokenParam);
    
    // Validate token exists (basic check)
    if (tokenParam.length > 10) {
      setIsValidToken(true);
    }
    
    setIsValidating(false);
  }, [searchParams]);

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Validating reset link...</p>
        </div>
      </div>
    );
  }

  if (!token || !isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-blue-600">ClientPlus</h1>
            <p className="mt-2 text-sm text-gray-600">Consultant Tracking System</p>
          </div>
          
          <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Invalid Reset Link</h2>
                <p className="text-gray-600">
                  This password reset link is invalid or has expired.
                </p>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg text-sm text-red-800">
                <p className="font-medium mb-1">Possible reasons:</p>
                <ul className="text-left space-y-1">
                  <li>• The link has expired (links expire after 15 minutes)</li>
                  <li>• The link has already been used</li>
                  <li>• The link is malformed or incomplete</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <Button
                  onClick={() => router.push('/login')}
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
                
                <p className="text-sm text-gray-500">
                  Need a new reset link? Click "Forgot your password?" on the login page.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-600">ClientPlus</h1>
          <p className="mt-2 text-sm text-gray-600">Consultant Tracking System</p>
        </div>
        
        <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
          <ResetPasswordForm token={token} />
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}