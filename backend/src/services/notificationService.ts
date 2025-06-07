import { Event } from '../types';

export interface TeamsNotificationPayload {
  '@type': 'MessageCard';
  '@context': 'http://schema.org/extensions';
  themeColor: string;
  summary: string;
  sections: Array<{
    activityTitle: string;
    activitySubtitle: string;
    activityImage?: string;
    facts: Array<{
      name: string;
      value: string;
    }>;
    markdown: boolean;
  }>;
  potentialAction?: Array<{
    '@type': string;
    name: string;
    targets: Array<{
      os: string;
      uri: string;
    }>;
  }>;
}

export class NotificationService {
  private static getLeaveTypeInThai(leaveType: string): string {
    const typeMap: { [key: string]: string } = {
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
    };
    return typeMap[leaveType] || leaveType;
  }

  private static getThemeColor(leaveType: string): string {
    const colorMap: { [key: string]: string } = {
      'sick': '#ff4444',
      'personal': '#0078d4',
      'vacation': '#107c10',
      'absent': '#d13438',
      'maternity': '#e3008c',
      'paternity': '#00bcf2',
      'bereavement': '#737373',
      'study': '#ff8c00',
      'military': '#008080',
      'sabbatical': '#5c2d91',
      'unpaid': '#69797e',
      'compensatory': '#00875a',
      'other': '#8764b8'
    };
    return colorMap[leaveType] || '#0078d4';
  }

  private static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('th-TH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }

  private static formatDateShort(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  }

  static createTeamsPayload(events: Event[], notificationDate: string, isToday: boolean = false): TeamsNotificationPayload {
    const dateLabel = isToday ? 'วันนี้' : 'พรุ่งนี้';
    const dateFormatted = this.formatDate(notificationDate);
    
    if (events.length === 0) {
      return {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        themeColor: '#107c10',
        summary: `ไม่มีเหตุการณ์${dateLabel}`,
        sections: [{
          activityTitle: `📅 แจ้งเตือนปฏิทิน - ${dateLabel}`,
          activitySubtitle: dateFormatted,
          facts: [{
            name: 'สถานะ',
            value: `ไม่มีเหตุการณ์${dateLabel} ✅`
          }],
          markdown: true
        }]
      };
    }

    // Group events by leave type
    const eventsByType = events.reduce((acc, event) => {
      const thaiType = this.getLeaveTypeInThai(event.leaveType);
      if (!acc[thaiType]) {
        acc[thaiType] = [];
      }
      acc[thaiType].push(event);
      return acc;
    }, {} as { [key: string]: Event[] });

    const facts = [];
    
    // Add summary
    facts.push({
      name: 'จำนวนรวม',
      value: `${events.length} เหตุการณ์`
    });

    // Add details by type
    Object.entries(eventsByType).forEach(([type, typeEvents]) => {
      const employees = typeEvents.map(e => e.employeeName).join(', ');
      facts.push({
        name: `${type} (${typeEvents.length})`,
        value: employees
      });
    });

    // Determine primary theme color (use the most common event type's color)
    const mostCommonType = Object.entries(eventsByType)
      .sort((a, b) => b[1].length - a[1].length)[0];
    const primaryEvent = mostCommonType[1][0];
    const themeColor = this.getThemeColor(primaryEvent.leaveType);

    return {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      themeColor,
      summary: `${events.length} เหตุการณ์${dateLabel}`,
      sections: [{
        activityTitle: `📅 แจ้งเตือนปฏิทิน - ${dateLabel}`,
        activitySubtitle: `${dateFormatted} | ${events.length} เหตุการณ์`,
        facts,
        markdown: true
      }],
      potentialAction: [{
        '@type': 'OpenUri',
        name: 'ดูรายละเอียดในปฏิทิน',
        targets: [{
          os: 'default',
          uri: 'http://localhost:5173/calendar-events'
        }]
      }]
    };
  }

  static async sendTeamsNotification(webhookUrl: string, payload: TeamsNotificationPayload): Promise<boolean> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error('Failed to send Teams notification:', response.status, response.statusText);
        return false;
      }

      console.log('Teams notification sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending Teams notification:', error);
      return false;
    }
  }

  static async sendEventsNotification(
    events: Event[], 
    webhookUrl: string, 
    notificationDate: string, 
    isToday: boolean = false
  ): Promise<boolean> {
    const payload = this.createTeamsPayload(events, notificationDate, isToday);
    return this.sendTeamsNotification(webhookUrl, payload);
  }
}