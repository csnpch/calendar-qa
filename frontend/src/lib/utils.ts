import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const LEAVE_TYPE_LABELS = {
  'vacation': 'ลาพักร้อน',
  'personal': 'ลากิจ',
  'sick': 'ลาป่วย',
  'absent': 'ขาดงาน',
  'maternity': 'ลาคลอด',
  'paternity': 'ลาบิดา',
  'bereavement': 'ลาฌาปนกิจ',
  'study': 'ลาศึกษา',
  'military': 'ลาทหาร',
  'sabbatical': 'ลาพักผ่อนพิเศษ',
  'unpaid': 'ลาไม่ได้รับเงินเดือน',
  'compensatory': 'ลาชดเชย',
  'other': 'อื่นๆ'
} as const;
