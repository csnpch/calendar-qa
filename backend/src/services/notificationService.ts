import type { Event } from '../types';
import axios from 'axios';

export interface TeamsNotificationPayload {
  type: 'AdaptiveCard';
  attachments: Array<{
    contentType: 'application/vnd.microsoft.card.adaptive';
    contentUrl: null;
    content: {
      type: 'AdaptiveCard';
      body: Array<{
        type: string;
        size?: string;
        weight?: string;
        text?: string;
        spacing?: string;
        wrap?: boolean;
        color?: string;
        columns?: Array<{
          type: string;
          items: Array<{
            type: string;
            spacing?: string;
            text: string;
            wrap?: boolean;
            color?: string;
            weight?: string;
          }>;
          width: string;
        }>;
      }>;
    };
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

  private static isValidWebhookResponse(webhookUrl: string, responseText: string, status: number): boolean {
    // Check for known webhook domains
    const validWebhookDomains = [
      'hooks.slack.com',
      'outlook.office.com',
      'hooks.teams.microsoft.com',
      'discord.com',
      'discordapp.com',
      'hooks.zapier.com',
      'logic.azure.com', // Azure Logic Apps
      'httpbin.org' // For testing
    ];

    const urlDomain = new URL(webhookUrl).hostname;
    const isKnownWebhookDomain = validWebhookDomains.some(domain => urlDomain.includes(domain));

    // If it's a known webhook domain, trust it
    if (isKnownWebhookDomain) {
      return true;
    }

    // For unknown domains, check response characteristics
    if (status === 200) {
      const lowerResponse = responseText.toLowerCase();
      
      // Check for signs it's NOT a webhook (common website responses)
      const invalidWebhookIndicators = [
        '<html', '<!doctype', '<head>', '<body>', '<title>',
        'google', 'search', 'javascript', '<script', '<style',
        'facebook', 'twitter', 'instagram', 'youtube',
        'privacy policy', 'terms of service', 'cookies'
      ];

      const hasInvalidIndicators = invalidWebhookIndicators.some(indicator => 
        lowerResponse.includes(indicator)
      );

      if (hasInvalidIndicators) {
        return false;
      }

      // Check for webhook success indicators
      const validWebhookIndicators = [
        'success', 'accepted', 'received', 'ok', 'webhook',
        'notification', 'message sent', 'delivered'
      ];

      const hasValidIndicators = validWebhookIndicators.some(indicator => 
        lowerResponse.includes(indicator)
      );

      // If response is very short and doesn't contain HTML, might be valid
      const isShortResponse = responseText.length < 100;
      const noHtmlContent = !lowerResponse.includes('<');

      return hasValidIndicators || (isShortResponse && noHtmlContent);
    }

    return false;
  }

  static createTeamsPayload(events: Event[], notificationDate: string, notificationDays: number): TeamsNotificationPayload {
    let dateLabel: string;
    if (notificationDays === -1) {
      dateLabel = 'วันนี้';
    } else if (notificationDays === 0) {
      dateLabel = 'พรุ่งนี้';
    } else if (notificationDays === 1) {
      dateLabel = '2 วันข้างหน้า';
    } else if (notificationDays === 2) {
      dateLabel = '3 วันข้างหน้า';
    } else if (notificationDays === 6) {
      dateLabel = '1 สัปดาห์ข้างหน้า';
    } else {
      dateLabel = `${notificationDays + 1} วันข้างหน้า`;
    }
    
    const isToday = notificationDays === -1;
    const dateFormatted = this.formatDate(notificationDate);
    
    if (events.length === 0) {
      return {
        type: 'AdaptiveCard',
        attachments: [{
          contentType: 'application/vnd.microsoft.card.adaptive',
          contentUrl: null,
          content: {
            type: 'AdaptiveCard',
            body: [
              {
                type: 'TextBlock',
                size: 'Medium',
                weight: 'Bolder',
                text: '🗓️ **Calendar QA**',
              },
              {
                type: 'ColumnSet',
                columns: [{
                  type: 'Column',
                  items: [
                    {
                      type: 'TextBlock',
                      spacing: 'None',
                      text: `📅 แจ้งเตือนปฏิทิน - ${dateLabel}`,
                      wrap: true,
                      color: 'good',
                      weight: 'Bolder',
                    },
                    {
                      type: 'TextBlock',
                      spacing: 'None',
                      text: `${dateFormatted} | ไม่มีเหตุการณ์${dateLabel} ✅`,
                      wrap: true,
                      color: 'accent',
                    },  
                  ],
                  width: 'stretch',
                }],
              },
            ],
          },
        }],
      };
    }

    // Group events by leave type
    const eventsByType = events.reduce((acc, event) => {
      const thaiType = this.getLeaveTypeInThai(event.leaveType || 'other');
      if (!acc[thaiType]) {
        acc[thaiType] = [];
      }
      acc[thaiType].push(event);
      return acc;
    }, {} as { [key: string]: Event[] });

    // Build event details text with proper information
    let eventDetails = `**${dateFormatted}** | **${events.length} เหตุการณ์**`;
    
    // Build event list only
    let eventList = '';
    Object.entries(eventsByType).forEach(([type, typeEvents]) => {
      eventList += `\n- **${type}** (${typeEvents.length} คน):\n`;
      typeEvents.forEach(event => {
        const employeeName = event.employeeName || 'ไม่ระบุชื่อ';
        const description = event.description;
        if (description && description.trim()) {
          eventList += `  - ${employeeName} - *${description}*\n`;
        } else {
          eventList += `  - ${employeeName}\n`;
        }
      });
    });
    
    // Create event header text
    const eventHeader = isToday ? '⏰ วันนี้มีเหตุการณ์:' : '⏰ พรุ่งนี้มีเหตุการณ์:';

    return {
      type: 'AdaptiveCard',
      attachments: [{
        contentType: 'application/vnd.microsoft.card.adaptive',
        contentUrl: null,
        content: {
          type: 'AdaptiveCard',
          body: [
            {
              type: 'TextBlock',
              size: 'Medium',
              weight: 'Bolder',
              text: '🗓️ **Calendar QA**',
            },
            {
              type: 'ColumnSet',
              columns: [{
                type: 'Column',
                items: [
                  {
                    type: 'TextBlock',
                    spacing: 'None',
                    text: `🔔 แจ้งเตือนปฏิทิน - ${dateLabel}`,
                    wrap: true,
                    color: 'default',
                    weight: 'Bolder',
                  },
                  {
                    type: 'TextBlock',
                    spacing: 'None',
                    text: eventDetails.trim(),
                    wrap: true,
                    color: 'default',
                  },
                  {
                    type: 'TextBlock',
                    spacing: 'Small',
                    text: eventHeader,
                    wrap: true,
                    color: 'default',
                    weight: 'Bolder',
                  },
                  {
                    type: 'TextBlock',
                    spacing: 'None',
                    text: eventList.trim(),
                    wrap: true,
                    color: 'default',
                  },
                ],
                width: 'stretch',
              }],
            },
          ],
        },
      }],
    };
  }

  static async sendTeamsNotification(webhookUrl: string, payload: TeamsNotificationPayload): Promise<boolean> {
    try {
      console.log('Sending Teams notification to:', webhookUrl);
      console.log('Payload:', JSON.stringify(payload, null, 2));
      
      // Use axios for the request
      const response = await axios.post(webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response text:', response.data);

      return true;
    } catch (error) {
      console.error('Error sending Teams notification:', error);
      return false;
    }
  }

  static async sendTeamsNotificationWithError(webhookUrl: string, payload: TeamsNotificationPayload): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await axios.post(webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const responseText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

      // Additional validation for proper webhook endpoints
      if (!this.isValidWebhookResponse(webhookUrl, responseText, response.status)) {
        const errorMessage = `Invalid webhook endpoint: ${webhookUrl} does not appear to be a valid webhook. Response: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`;
        console.error('Invalid webhook endpoint:', errorMessage);
        return { success: false, error: errorMessage };
      }

      return { success: true };
    } catch (error: any) {
      if (error.response) {
        // Check for common non-webhook HTTP status codes first
        if (error.response.status === 405) {
          const errorMessage = `Method not allowed: ${webhookUrl} does not accept POST requests (405 Method Not Allowed)`;
          return { success: false, error: errorMessage };
        }

        if (error.response.status === 404) {
          const errorMessage = `Not found: ${webhookUrl} endpoint does not exist (404 Not Found)`;
          return { success: false, error: errorMessage };
        }

        const responseText = typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data);
        const errorMessage = `Webhook failed with status ${error.response.status}: ${error.response.statusText || 'Unknown error'}. Response: ${responseText}`;
        console.error('Failed to send Teams notification:', errorMessage);
        return { success: false, error: errorMessage };
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown network error';
      console.error('Error sending Teams notification:', error);
      return { success: false, error: `Network error: ${errorMessage}` };
    }
  }

  static async sendEventsNotification(
    events: Event[], 
    webhookUrl: string, 
    notificationDate: string, 
    notificationDays: number
  ): Promise<boolean> {
    const payload = this.createTeamsPayload(events, notificationDate, notificationDays);
    return this.sendTeamsNotification(webhookUrl, payload);
  }

  static async sendEventsNotificationWithError(
    events: Event[], 
    webhookUrl: string, 
    notificationDate: string, 
    notificationDays: number
  ): Promise<{ success: boolean; error?: string }> {
    const payload = this.createTeamsPayload(events, notificationDate, notificationDays);
    return this.sendTeamsNotificationWithError(webhookUrl, payload);
  }

  static createWeeklyTeamsPayload(events: Event[], startDate: string, endDate: string, scope: 'current' | 'next'): TeamsNotificationPayload {
    const startFormatted = this.formatDate(startDate);
    const endFormatted = this.formatDate(endDate);
    const scopeText = scope === 'current' ? 'สัปดาห์นี้' : 'สัปดาห์หน้า';
    
    if (events.length === 0) {
      return {
        type: 'AdaptiveCard',
        attachments: [{
          contentType: 'application/vnd.microsoft.card.adaptive',
          contentUrl: null,
          content: {
            type: 'AdaptiveCard',
            body: [
              {
                type: 'TextBlock',
                size: 'Medium',
                weight: 'Bolder',
                text: '🗓️ **Calendar QA**',
              },
              {
                type: 'ColumnSet',
                columns: [{
                  type: 'Column',
                  items: [
                    {
                      type: 'TextBlock',
                      spacing: 'None',
                      text: `📅 แจ้งเตือนปฏิทิน - ${scopeText}`,
                      wrap: true,
                      color: 'good',
                      weight: 'Bolder',
                    },
                    {
                      type: 'TextBlock',
                      spacing: 'None',
                      text: `${startFormatted} - ${endFormatted} | ไม่มีเหตุการณ์${scopeText} ✅`,
                      wrap: true,
                      color: 'accent',
                    },  
                  ],
                  width: 'stretch',
                }],
              },
            ],
          },
        }],
      };
    }

    // Group events by date first, then by leave type
    const eventsByDate = events.reduce((acc, event) => {
      if (!acc[event.date]) {
        acc[event.date] = {};
      }
      const thaiType = this.getLeaveTypeInThai(event.leaveType || 'other');
      if (!acc[event.date]![thaiType]) {
        acc[event.date]![thaiType] = [];
      }
      acc[event.date]![thaiType]!.push(event);
      return acc;
    }, {} as { [date: string]: { [type: string]: Event[] } });

    // Build event details text
    let eventDetails = `**${startFormatted} - ${endFormatted}** | **${events.length} เหตุการณ์**`;
    
    // Build event list organized by date
    let eventList = '';
    Object.entries(eventsByDate).sort().forEach(([date, dateEvents]) => {
      const dateFormatted = this.formatDate(date);
      const dayEvents = Object.values(dateEvents).flat();
      eventList += `\n**📅 ${dateFormatted}** (${dayEvents.length} เหตุการณ์):\n`;
      
      Object.entries(dateEvents).forEach(([type, typeEvents]) => {
        eventList += `- **${type}** (${typeEvents.length} คน):\n`;
        typeEvents.forEach(event => {
          const employeeName = event.employeeName || 'ไม่ระบุชื่อ';
          const description = event.description;
          if (description && description.trim()) {
            eventList += `  - ${employeeName} - *${description}*\n`;
          } else {
            eventList += `  - ${employeeName}\n`;
          }
        });
      });
    });
    
    const eventHeader = `⏰ ${scopeText}มีเหตุการณ์:`;

    return {
      type: 'AdaptiveCard',
      attachments: [{
        contentType: 'application/vnd.microsoft.card.adaptive',
        contentUrl: null,
        content: {
          type: 'AdaptiveCard',
          body: [
            {
              type: 'TextBlock',
              size: 'Medium',
              weight: 'Bolder',
              text: '🗓️ **Calendar QA**',
            },
            {
              type: 'ColumnSet',
              columns: [{
                type: 'Column',
                items: [
                  {
                    type: 'TextBlock',
                    spacing: 'None',
                    text: `🔔 แจ้งเตือนปฏิทิน - ${scopeText}`,
                    wrap: true,
                    color: 'default',
                    weight: 'Bolder',
                  },
                  {
                    type: 'TextBlock',
                    spacing: 'None',
                    text: eventDetails.trim(),
                    wrap: true,
                    color: 'default',
                  },
                  {
                    type: 'TextBlock',
                    spacing: 'Small',
                    text: eventHeader,
                    wrap: true,
                    color: 'default',
                    weight: 'Bolder',
                  },
                  {
                    type: 'TextBlock',
                    spacing: 'None',
                    text: eventList.trim(),
                    wrap: true,
                    color: 'default',
                  },
                ],
                width: 'stretch',
              }],
            },
          ],
        },
      }],
    };
  }

  static async sendWeeklyEventsNotification(
    events: Event[], 
    webhookUrl: string, 
    startDate: string, 
    endDate: string,
    scope: 'current' | 'next'
  ): Promise<boolean> {
    const payload = this.createWeeklyTeamsPayload(events, startDate, endDate, scope);
    return this.sendTeamsNotification(webhookUrl, payload);
  }

  static async sendWeeklyEventsNotificationWithError(
    events: Event[], 
    webhookUrl: string, 
    startDate: string, 
    endDate: string,
    scope: 'current' | 'next'
  ): Promise<{ success: boolean; error?: string }> {
    const payload = this.createWeeklyTeamsPayload(events, startDate, endDate, scope);
    return this.sendTeamsNotificationWithError(webhookUrl, payload);
  }
}