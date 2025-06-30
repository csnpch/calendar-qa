import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Event/Leave Type Constants
export const LEAVE_TYPE_LABELS = {
  'vacation': 'ลาพักร้อน',
  'personal': 'ลากิจ',
  'sick': 'ลาป่วย',
  'other': 'อื่นๆ'
} as const;

export const LEAVE_TYPE_COLORS = {
  'vacation': 'bg-blue-100 dark:bg-blue-800/40 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-600',
  'personal': 'bg-stone-200 dark:bg-stone-800/40 text-stone-800 dark:text-stone-200 border-stone-300 dark:border-stone-600', 
  'sick': 'bg-purple-100 dark:bg-purple-800/40 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-600',
  'other': 'bg-gray-100 dark:bg-gray-800/40 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600'
} as const;

// Utility function for getting leave type colors
export function getLeaveTypeColor(type: keyof typeof LEAVE_TYPE_COLORS): string {
  return LEAVE_TYPE_COLORS[type] || LEAVE_TYPE_COLORS['other'];
}

// Date formatting utilities
export function formatDate(date: Date | null): string {
  if (!date) return '';
  return new Intl.DateTimeFormat('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

export function formatDateShort(date: Date | null): string {
  if (!date) return '';
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

// Calendar constants
export const DAYS_OF_WEEK = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'] as const;

export const MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
] as const;

// Type definitions
export type LeaveType = keyof typeof LEAVE_TYPE_LABELS;
