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
  'personal': 'bg-blue-100 dark:bg-blue-800/40 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-600',
  'sick': 'bg-blue-100 dark:bg-blue-800/40 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-600',
  'other': 'bg-blue-100 dark:bg-blue-800/40 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-600'
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
