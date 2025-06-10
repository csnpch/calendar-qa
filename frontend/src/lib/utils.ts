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
  'vacation': 'bg-sky-100 dark:bg-sky-800/40 text-sky-800 dark:text-sky-200 border-sky-200 dark:border-sky-600',
  'personal': 'bg-green-100 dark:bg-green-800/40 text-green-800 dark:text-green-200 border-green-200 dark:border-green-600',
  'sick': 'bg-red-100 dark:bg-red-800/40 text-red-800 dark:text-red-200 border-red-200 dark:border-red-600',
  'other': 'bg-purple-100 dark:bg-purple-800/40 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-600'
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
