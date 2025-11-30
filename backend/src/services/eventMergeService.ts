import { getDatabase } from "../database/connection";
import { EventService } from "./eventService";
import type { Event } from "../types";
import moment from "moment";
import Logger from "../utils/logger";

interface EventGroup {
  employeeId: number;
  employeeName: string;
  leaveType: string;
  events: Event[];
}

interface MergeResult {
  success: boolean;
  eventsCount: number;
  startDate: string;
  endDate: string;
  error?: string;
}

export class EventMergeService {
  private db = getDatabase();
  private eventService = new EventService();

  /**
   * Find all single-day events and group consecutive ones by employee and leave type
   * Returns array of event groups that should be merged (minimum 2 consecutive days)
   */
  findConsecutiveEvents(): EventGroup[] {
    // Query all single-day events (where startDate === endDate)
    const stmt = this.db.prepare(`
      SELECT 
        e.id,
        e.employee_id as employeeId,
        e.employee_name as employeeName,
        e.leave_type as leaveType,
        e.date,
        e.start_date as startDate,
        e.end_date as endDate,
        e.description,
        e.created_at as createdAt,
        e.updated_at as updatedAt
      FROM events e
      WHERE e.start_date = e.end_date
      ORDER BY e.employee_id, e.leave_type, e.start_date
    `);

    const singleDayEvents = stmt.all() as Event[];

    if (singleDayEvents.length === 0) {
      return [];
    }

    // Group by employeeId + leaveType
    const grouped = new Map<string, Event[]>();

    for (const event of singleDayEvents) {
      const key = `${event.employeeId}-${event.leaveType}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(event);
    }

    // Find consecutive sequences within each group
    const consecutiveGroups: EventGroup[] = [];

    for (const [key, events] of grouped.entries()) {
      // Already sorted by date from the SQL query
      if (events.length < 2) {
        continue; // Need at least 2 events to merge
      }

      const firstEvent = events[0];
      if (!firstEvent) continue; // Safety check

      let currentGroup: Event[] = [firstEvent];

      for (let i = 1; i < events.length; i++) {
        const prevEvent = events[i - 1];
        const currEvent = events[i];

        if (!prevEvent || !currEvent) continue; // Safety check

        const prevDate = moment(prevEvent.startDate);
        const currDate = moment(currEvent.startDate);

        // Check if current date is exactly 1 day after previous
        if (currDate.diff(prevDate, "days") === 1) {
          currentGroup.push(currEvent);
        } else {
          // Sequence broken, save current group if it has 2+ events
          if (currentGroup.length >= 2) {
            const groupFirst = currentGroup[0];
            if (groupFirst) {
              consecutiveGroups.push({
                employeeId: groupFirst.employeeId,
                employeeName: groupFirst.employeeName,
                leaveType: groupFirst.leaveType,
                events: [...currentGroup],
              });
            }
          }
          // Start new group
          currentGroup = [currEvent];
        }
      }

      // Don't forget the last group
      if (currentGroup.length >= 2) {
        const groupFirst = currentGroup[0];
        if (groupFirst) {
          consecutiveGroups.push({
            employeeId: groupFirst.employeeId,
            employeeName: groupFirst.employeeName,
            leaveType: groupFirst.leaveType,
            events: [...currentGroup],
          });
        }
      }
    }

    return consecutiveGroups;
  }

  /**
   * Merge a group of consecutive events into a single range event
   * Creates the new event first, then deletes the individual events
   */
  async mergeEventGroup(group: EventGroup): Promise<MergeResult> {
    const { employeeId, employeeName, leaveType, events } = group;

    // Validate all events have same employeeId and leaveType
    const allSameEmployee = events.every((e) => e.employeeId === employeeId);
    const allSameType = events.every((e) => e.leaveType === leaveType);

    if (!allSameEmployee || !allSameType) {
      return {
        success: false,
        eventsCount: 0,
        startDate: "",
        endDate: "",
        error: "Events do not have matching employee or leave type",
      };
    }

    // Get start and end dates
    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];

    if (!firstEvent || !lastEvent) {
      return {
        success: false,
        eventsCount: 0,
        startDate: "",
        endDate: "",
        error: "Missing start or end event",
      };
    }

    const startDate = firstEvent.startDate;
    const endDate = lastEvent.startDate;

    // Get description from first event (if any)
    const description = events.find((e) => e.description)?.description || null;

    try {
      // Step 1: Create new range event
      const newEvent = this.eventService.createEvent({
        employeeId,
        leaveType: leaveType as any,
        startDate,
        endDate,
        description: description || undefined,
      });

      Logger.info(
        `[EventMerge] Created range event ${newEvent.id} for ${employeeName} (${leaveType}, ${startDate} to ${endDate})`
      );

      // Step 2: Delete all individual events
      for (const event of events) {
        this.eventService.deleteEvent(event.id);
      }

      Logger.info(
        `[EventMerge] Deleted ${events.length} individual events for merge`
      );

      return {
        success: true,
        eventsCount: events.length,
        startDate,
        endDate,
      };
    } catch (error) {
      Logger.error("[EventMerge] Error merging event group:", error);
      return {
        success: false,
        eventsCount: 0,
        startDate,
        endDate,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Main method to execute the merge job
   * Called by the cron scheduler
   */
  async executeMergeJob(): Promise<void> {
    const startTime = moment()
      .utcOffset("+07:00")
      .format("YYYY-MM-DD HH:mm:ss");
    Logger.info(`[EventMerge] Starting merge job at ${startTime}`);

    try {
      // Find all consecutive event groups
      const groups = this.findConsecutiveEvents();

      if (groups.length === 0) {
        Logger.info("[EventMerge] No consecutive events found to merge");
        return;
      }

      Logger.info(`[EventMerge] Found ${groups.length} group(s) to merge`);

      let totalMerged = 0;
      let totalEvents = 0;
      let successCount = 0;
      let failCount = 0;

      // Process each group
      for (const group of groups) {
        const result = await this.mergeEventGroup(group);

        if (result.success) {
          successCount++;
          totalEvents += result.eventsCount;

          Logger.info(
            `[EventMerge] Merged ${result.eventsCount} events for ${group.employeeName} ` +
              `(${group.leaveType}, ${moment(result.startDate).format(
                "DD/MM"
              )}-${moment(result.endDate).format("DD/MM")})`
          );
        } else {
          failCount++;
          Logger.error(
            `[EventMerge] Failed to merge group for ${group.employeeName}: ${result.error}`
          );
        }
      }

      Logger.info(
        `[EventMerge] Merge job completed: ${successCount} groups merged, ` +
          `${totalEvents} events consolidated, ${failCount} failures`
      );
    } catch (error) {
      Logger.error("[EventMerge] Error during merge job execution:", error);
    }
  }
}
