// src/components/ui/ConfirmationModal.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, UserX, Loader2, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
  confirmButtonText?: string;
  confirmButtonVariant?: 'default' | 'destructive' | 'outline' | 'secondary';
  icon?: 'warning' | 'danger' | 'info';
  userName?: string;
  actionType?: 'deactivate' | 'delete' | 'activate';
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmButtonText = 'Confirm',
  confirmButtonVariant = 'destructive',
  icon = 'warning',
  userName,
  actionType = 'deactivate',
}: ConfirmationModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      // Error handling is done in parent component
      console.error('Confirmation action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const getIcon = () => {
    switch (icon) {
      case 'danger':
        return <UserX className="h-6 w-6 text-red-600" />;
      case 'info':
        return <AlertTriangle className="h-6 w-6 text-blue-600" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-amber-600" />;
    }
  };

  const getActionColor = () => {
    switch (actionType) {
      case 'activate':
        return 'text-green-800 bg-green-100';
      case 'delete':
        return 'text-red-800 bg-red-100';
      default:
        return 'text-amber-800 bg-amber-100';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {getIcon()}
            <DialogTitle className="text-lg font-semibold">
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-gray-600">
            {description}
          </DialogDescription>
        </DialogHeader>

        {userName && (
          <div className="bg-gray-50 p-3 rounded-lg border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">User:</span>
              <span className="font-medium text-gray-900">{userName}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-gray-600">Action:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor()}`}>
                {actionType.charAt(0).toUpperCase() + actionType.slice(1)}
              </span>
            </div>
          </div>
        )}

        {actionType === 'deactivate' && (
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> This will deactivate the user account. The user will lose access to the system, but their data will be preserved. This action can be reversed.
            </p>
          </div>
        )}

        {actionType === 'delete' && (
          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
            <p className="text-sm text-red-800">
              <strong>Warning:</strong> This action cannot be undone. All user data and history will be permanently removed from the system.
            </p>
          </div>
        )}

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={confirmButtonVariant}
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 sm:flex-none min-w-[120px]"
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {confirmButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}