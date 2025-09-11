import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function calculateUtilization(
  hoursWorked: number,
  dealDays: number
): number {
  if (dealDays === 0) return 0;
  return (hoursWorked / (dealDays * 8)) * 100;
}

export function getUtilizationColor(utilization: number): string {
  if (utilization > 100) return 'utilization-over';
  if (utilization >= 70) return 'utilization-high';
  if (utilization >= 40) return 'utilization-medium';
  return 'utilization-low';
}

export function getMonthName(monthNumber: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return months[monthNumber - 1] || '';
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Date utility functions for Sunday-Saturday week ranges
export function getCurrentWeekSundayToSaturday(): { from: Date; to: Date } {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate Sunday of current week
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek);
  sunday.setHours(0, 0, 0, 0);
  
  // Calculate Saturday of current week
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  saturday.setHours(23, 59, 59, 999);
  
  return { from: sunday, to: saturday };
}

export function getLastWeekSundayToSaturday(): { from: Date; to: Date } {
  const currentWeek = getCurrentWeekSundayToSaturday();
  
  const lastSunday = new Date(currentWeek.from);
  lastSunday.setDate(currentWeek.from.getDate() - 7);
  
  const lastSaturday = new Date(currentWeek.to);
  lastSaturday.setDate(currentWeek.to.getDate() - 7);
  
  return { from: lastSunday, to: lastSaturday };
}

export function getWeekRangeFromDate(date: Date): { from: Date; to: Date } {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate Sunday of the week containing the given date
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - dayOfWeek);
  sunday.setHours(0, 0, 0, 0);
  
  // Calculate Saturday of the same week
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  saturday.setHours(23, 59, 59, 999);
  
  return { from: sunday, to: saturday };
}

export const APP_CONFIG = {
  name: 'ClientPlus',
  version: '1.0.0',
  description: 'Consultant tracking and client management system',
  defaultWorkingHours: 8,
  supportedFileTypes: ['xlsx', 'csv', 'pdf'],
  maxFileSize: 10 * 1024 * 1024, // 10MB
} as const;