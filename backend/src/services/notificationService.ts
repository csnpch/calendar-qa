import type { Event } from '../types';

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

  private static isValidWebhookResponse(webhookUrl: string, responseText: string, status: number): boolean {
    // Check for known webhook domains
    const validWebhookDomains = [
      'hooks.slack.com',
      'outlook.office.com',
      'hooks.teams.microsoft.com',
      'discord.com',
      'discordapp.com',
      'hooks.zapier.com',
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

  static createTeamsPayload(events: Event[], notificationDate: string, isToday: boolean = false): TeamsNotificationPayload {
    const dateLabel = isToday ? 'วันนี้' : 'พรุ่งนี้';
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
                text: 'Calendar QA System',
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
    let eventDetails = `${dateFormatted} | ${events.length} เหตุการณ์\n\n`;
    eventDetails += `📊 จำนวนรวม: ${events.length} เหตุการณ์\n\n`;
    
    // Add detailed information for today and tomorrow
    if (isToday) {
      eventDetails += `📅 วันนี้มีเหตุการณ์:\n`;
    } else {
      eventDetails += `📅 พรุ่งนี้มีเหตุการณ์:\n`;
    }
    
    Object.entries(eventsByType).forEach(([type, typeEvents]) => {
      eventDetails += `\n🔸 ${type} (${typeEvents.length} คน):\n`;
      typeEvents.forEach(event => {
        const employeeName = event.employeeName || 'ไม่ระบุชื่อ';
        const description = event.description || 'ไม่ได้ระบุรายละเอียด';
        eventDetails += `   • ${employeeName} - ${description}\n`;
      });
    });

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
              text: 'Calendar QA System',
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
                    text: eventDetails.trim(),
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

  static async sendTeamsNotification(webhookUrl: string, payload: TeamsNotificationPayload): Promise<boolean> {
    try {
      console.log('Sending Teams notification to:', webhookUrl);
      console.log('Payload:', JSON.stringify(payload, null, 2));
      
      // Use the same approach as the working example
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      let responseText = '';
      try {
        responseText = await response.text();
      } catch (e) {
        console.log('Could not read response text:', e);
      }
      
      console.log('Response status:', response.status);
      console.log('Response text:', responseText);

      if (!response.ok) {
        console.error('Failed to send Teams notification:', response.status, response.statusText);
        console.error('Response body:', responseText);
        return false;
      }

      console.log('Teams notification sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending Teams notification:', error);
      return false;
    }
  }

  static async sendTeamsNotificationWithError(webhookUrl: string, payload: TeamsNotificationPayload): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Sending Teams notification to:', webhookUrl);
      console.log('Payload:', JSON.stringify(payload, null, 2));
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      let responseText = '';
      try {
        responseText = await response.text();
      } catch (e) {
        console.log('Could not read response text:', e);
      }
      
      console.log('Response status:', response.status);
      console.log('Response text:', responseText);

      // Check for common non-webhook HTTP status codes
      if (response.status === 405) {
        const errorMessage = `Method not allowed: ${webhookUrl} does not accept POST requests (405 Method Not Allowed)`;
        console.error('Method not allowed:', errorMessage);
        return { success: false, error: errorMessage };
      }

      if (!response.ok) {
        const errorMessage = `Webhook failed with status ${response.status}: ${response.statusText}. Response: ${responseText}`;
        console.error('Failed to send Teams notification:', errorMessage);
        return { success: false, error: errorMessage };
      }

      // Additional validation for proper webhook endpoints
      if (!this.isValidWebhookResponse(webhookUrl, responseText, response.status)) {
        const errorMessage = `Invalid webhook endpoint: ${webhookUrl} does not appear to be a valid webhook. Response: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`;
        console.error('Invalid webhook endpoint:', errorMessage);
        return { success: false, error: errorMessage };
      }

      console.log('Teams notification sent successfully');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown network error';
      console.error('Error sending Teams notification:', error);
      return { success: false, error: `Network error: ${errorMessage}` };
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

  static async sendEventsNotificationWithError(
    events: Event[], 
    webhookUrl: string, 
    notificationDate: string, 
    isToday: boolean = false
  ): Promise<{ success: boolean; error?: string }> {
    const payload = this.createTeamsPayload(events, notificationDate, isToday);
    return this.sendTeamsNotificationWithError(webhookUrl, payload);
  }
}