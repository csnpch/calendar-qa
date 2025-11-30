import { describe, test, expect, beforeEach } from "bun:test";
import { EventMergeService } from "../../src/services/eventMergeService";
import { EventService } from "../../src/services/eventService";
import { EmployeeService } from "../../src/services/employeeService";
import "../../tests/setup";
import moment from "moment";

describe("EventMergeService", () => {
  let eventMergeService: EventMergeService;
  let eventService: EventService;
  let employeeService: EmployeeService;

  beforeEach(async () => {
    const { cleanupDatabase } = await import("../../tests/setup");
    cleanupDatabase();

    eventMergeService = new EventMergeService();
    eventService = new EventService();
    employeeService = new EmployeeService();
  });

  describe("findConsecutiveEvents", () => {
    test("should merge events separated by a weekend", () => {
      // Create test employee
      const employee = employeeService.createEmployee({
        name: "Test Employee",
      });

      // Create events: Friday (26 Dec) and Monday (29 Dec)
      // Weekend in between: Sat 27, Sun 28
      eventService.createEvent({
        employeeId: employee.id,
        leaveType: "vacation",
        startDate: "2025-12-26", // Friday
        endDate: "2025-12-26",
      });

      eventService.createEvent({
        employeeId: employee.id,
        leaveType: "vacation",
        startDate: "2025-12-29", // Monday (after weekend)
        endDate: "2025-12-29",
      });

      const groups = eventMergeService.findConsecutiveEvents();

      expect(groups.length).toBe(1);
      expect(groups[0]?.events.length).toBe(2);
      expect(groups[0]?.employeeId).toBe(employee.id);
    });

    test("should merge events across multiple weekends", () => {
      const employee = employeeService.createEmployee({
        name: "Field",
      });

      // Dec 22-26 (Mon-Fri)
      for (let day = 22; day <= 26; day++) {
        eventService.createEvent({
          employeeId: employee.id,
          leaveType: "vacation",
          startDate: `2025-12-${day}`,
          endDate: `2025-12-${day}`,
        });
      }

      // Weekend: Dec 27-28 (Sat-Sun)

      // Dec 29 (Mon)
      eventService.createEvent({
        employeeId: employee.id,
        leaveType: "vacation",
        startDate: "2025-12-29",
        endDate: "2025-12-29",
      });

      const groups = eventMergeService.findConsecutiveEvents();

      expect(groups.length).toBe(1);
      expect(groups[0]?.events.length).toBe(6); // Should merge all 6 days
      expect(moment(groups[0]?.events[0]?.startDate).format("DD/MM")).toBe(
        "22/12"
      );
      const lastEvent = groups[0]?.events[groups[0]?.events.length - 1];
      expect(moment(lastEvent?.startDate).format("DD/MM")).toBe("29/12");
    });

    test("CRITICAL REAL CASE: Field's actual data - merge 22-26 Dec + 29 Dec (from screenshot)", () => {
      // This replicates the EXACT bug from the screenshot
      // Field has events on Dec 22, 23, 24, 25, 26 and 29
      // Dec 27-28 are Sat-Sun (weekend)
      // Expected: Should merge into ONE range event (22-29 Dec)
      // Current bug: Shows as TWO events (22-26 and 29)

      const field = employeeService.createEmployee({
        name: "Field - Krittakorn.cha",
      });

      // Create the exact scenario from screenshot
      // Single-day events: Dec 22, 23, 24, 25, 26
      for (const day of [22, 23, 24, 25, 26]) {
        eventService.createEvent({
          employeeId: field.id,
          leaveType: "vacation",
          startDate: `2025-12-${day}`,
          endDate: `2025-12-${day}`,
        });
      }

      // Dec 27 = Saturday, Dec 28 = Sunday (weekend - not in DB)

      // Single-day event: Dec 29
      eventService.createEvent({
        employeeId: field.id,
        leaveType: "vacation",
        startDate: "2025-12-29",
        endDate: "2025-12-29",
      });

      // Verify the days of week
      expect(moment("2025-12-26").format("dddd")).toBe("Friday");
      expect(moment("2025-12-27").format("dddd")).toBe("Saturday");
      expect(moment("2025-12-28").format("dddd")).toBe("Sunday");
      expect(moment("2025-12-29").format("dddd")).toBe("Monday");

      // Find groups to merge
      const groups = eventMergeService.findConsecutiveEvents();

      // CRITICAL TEST: Should find exactly 1 group containing all 6 events
      expect(groups.length).toBe(1);
      expect(groups[0]?.employeeName).toBe("Field - Krittakorn.cha");
      expect(groups[0]?.events.length).toBe(6);

      // Verify all dates are in the group
      const dates = groups[0]?.events.map((e) =>
        moment(e.startDate).format("YYYY-MM-DD")
      );
      expect(dates).toContain("2025-12-22");
      expect(dates).toContain("2025-12-23");
      expect(dates).toContain("2025-12-24");
      expect(dates).toContain("2025-12-25");
      expect(dates).toContain("2025-12-26");
      expect(dates).toContain("2025-12-29");
    });

    test("should NOT merge events separated by working days", () => {
      const employee = employeeService.createEmployee({
        name: "Test Employee 2",
      });

      // Create events with a working day gap
      eventService.createEvent({
        employeeId: employee.id,
        leaveType: "vacation",
        startDate: "2025-12-22", // Monday
        endDate: "2025-12-22",
      });

      // Gap: 23 Dec is Tuesday (working day)

      eventService.createEvent({
        employeeId: employee.id,
        leaveType: "vacation",
        startDate: "2025-12-24", // Wednesday
        endDate: "2025-12-24",
      });

      const groups = eventMergeService.findConsecutiveEvents();

      // Should not merge because there's a working day in between
      expect(groups.length).toBe(0);
    });

    test("should merge only events with same employee and leave type", () => {
      const employee1 = employeeService.createEmployee({
        name: "Employee 1",
      });
      const employee2 = employeeService.createEmployee({
        name: "Employee 2",
      });

      // Employee 1 - vacation (Fri + Mon across weekend)
      eventService.createEvent({
        employeeId: employee1.id,
        leaveType: "vacation",
        startDate: "2025-12-26", // Friday
        endDate: "2025-12-26",
      });
      eventService.createEvent({
        employeeId: employee1.id,
        leaveType: "vacation",
        startDate: "2025-12-29", // Monday
        endDate: "2025-12-29",
      });

      // Employee 1 - sick (consecutive days)
      eventService.createEvent({
        employeeId: employee1.id,
        leaveType: "sick",
        startDate: "2025-12-30", // Tuesday
        endDate: "2025-12-30",
      });
      eventService.createEvent({
        employeeId: employee1.id,
        leaveType: "sick",
        startDate: "2025-12-31", // Wednesday
        endDate: "2025-12-31",
      });

      // Employee 2 - vacation (consecutive days)
      eventService.createEvent({
        employeeId: employee2.id,
        leaveType: "vacation",
        startDate: "2025-12-22", // Monday
        endDate: "2025-12-22",
      });
      eventService.createEvent({
        employeeId: employee2.id,
        leaveType: "vacation",
        startDate: "2025-12-23", // Tuesday
        endDate: "2025-12-23",
      });

      const groups = eventMergeService.findConsecutiveEvents();

      // Should have 3 groups: emp1-vacation, emp1-sick, emp2-vacation
      expect(groups.length).toBe(3);

      const emp1Vacation = groups.find(
        (g) => g.employeeId === employee1.id && g.leaveType === "vacation"
      );
      const emp1Sick = groups.find(
        (g) => g.employeeId === employee1.id && g.leaveType === "sick"
      );
      const emp2Vacation = groups.find(
        (g) => g.employeeId === employee2.id && g.leaveType === "vacation"
      );

      expect(emp1Vacation?.events.length).toBe(2);
      expect(emp1Sick?.events.length).toBe(2);
      expect(emp2Vacation?.events.length).toBe(2);
    });

    test("should not merge if less than 2 events", () => {
      const employee = employeeService.createEmployee({
        name: "Solo Employee",
      });

      // Create only 1 event
      eventService.createEvent({
        employeeId: employee.id,
        leaveType: "vacation",
        startDate: "2025-12-22",
        endDate: "2025-12-22",
      });

      const groups = eventMergeService.findConsecutiveEvents();

      expect(groups.length).toBe(0);
    });

    test("should handle events that are already consecutive (no holidays)", () => {
      const employee = employeeService.createEmployee({
        name: "Consecutive Employee",
      });

      // Create 3 consecutive weekday events
      eventService.createEvent({
        employeeId: employee.id,
        leaveType: "vacation",
        startDate: "2025-12-22", // Monday
        endDate: "2025-12-22",
      });
      eventService.createEvent({
        employeeId: employee.id,
        leaveType: "vacation",
        startDate: "2025-12-23", // Tuesday
        endDate: "2025-12-23",
      });
      eventService.createEvent({
        employeeId: employee.id,
        leaveType: "vacation",
        startDate: "2025-12-24", // Wednesday
        endDate: "2025-12-24",
      });

      const groups = eventMergeService.findConsecutiveEvents();

      expect(groups.length).toBe(1);
      expect(groups[0]?.events.length).toBe(3);
    });
  });

  describe("mergeEventGroup", () => {
    test("should successfully merge a group and delete original events", async () => {
      const employee = employeeService.createEmployee({
        name: "Merge Test",
      });

      const event1 = eventService.createEvent({
        employeeId: employee.id,
        leaveType: "vacation",
        startDate: "2025-12-26", // Friday
        endDate: "2025-12-26",
        description: "First day",
      });

      const event2 = eventService.createEvent({
        employeeId: employee.id,
        leaveType: "vacation",
        startDate: "2025-12-29", // Monday
        endDate: "2025-12-29",
      });

      const group = {
        employeeId: employee.id,
        employeeName: employee.name,
        leaveType: "vacation",
        events: [event1, event2],
      };

      const result = await eventMergeService.mergeEventGroup(group);

      expect(result.success).toBe(true);
      expect(result.eventsCount).toBe(2);
      expect(result.startDate).toBe("2025-12-26");
      expect(result.endDate).toBe("2025-12-29");

      // Verify original events are deleted
      const allEvents = eventService.getAllEvents();
      expect(allEvents.find((e) => e.id === event1.id)).toBeUndefined();
      expect(allEvents.find((e) => e.id === event2.id)).toBeUndefined();

      // Verify new range event exists
      const rangeEvents = allEvents.filter(
        (e) => e.startDate === "2025-12-26" && e.endDate === "2025-12-29"
      );
      expect(rangeEvents.length).toBe(1);
      expect(rangeEvents[0]?.description).toBe("First day"); // Description from first event
    });
  });

  describe("executeMergeJob", () => {
    test("should NOT try to merge existing range events", () => {
      // If Field's events are already range events (not single-day),
      // they should NOT be picked up by findConsecutiveEvents
      const field = employeeService.createEmployee({
        name: "Field",
      });

      // Create a range event (already merged)
      eventService.createEvent({
        employeeId: field.id,
        leaveType: "vacation",
        startDate: "2025-12-22",
        endDate: "2025-12-26", // This is a range, not single-day
      });

      // Create another range event
      eventService.createEvent({
        employeeId: field.id,
        leaveType: "vacation",
        startDate: "2025-12-29",
        endDate: "2025-12-29", // Single-day
      });

      const groups = eventMergeService.findConsecutiveEvents();

      // Should find 0 groups because one is already a range event
      // Only single-day events should be considered
      expect(groups.length).toBe(0);
    });

    test("should merge multiple groups in one job execution", async () => {
      const emp1 = employeeService.createEmployee({
        name: "Employee 1",
      });
      const emp2 = employeeService.createEmployee({
        name: "Employee 2",
      });

      // Create events for emp1 (Fri + Mon across weekend)
      eventService.createEvent({
        employeeId: emp1.id,
        leaveType: "vacation",
        startDate: "2025-12-26", // Friday
        endDate: "2025-12-26",
      });
      eventService.createEvent({
        employeeId: emp1.id,
        leaveType: "vacation",
        startDate: "2025-12-29", // Monday
        endDate: "2025-12-29",
      });

      // Create events for emp2 (consecutive days)
      eventService.createEvent({
        employeeId: emp2.id,
        leaveType: "sick",
        startDate: "2025-12-30", // Tuesday
        endDate: "2025-12-30",
      });
      eventService.createEvent({
        employeeId: emp2.id,
        leaveType: "sick",
        startDate: "2025-12-31", // Wednesday
        endDate: "2025-12-31",
      });

      await eventMergeService.executeMergeJob();

      // Should have merged both groups
      const allEvents = eventService.getAllEvents();

      // Should have 2 range events instead of 4 single-day events
      expect(allEvents.length).toBe(2);

      const emp1Event = allEvents.find((e) => e.employeeId === emp1.id);
      const emp2Event = allEvents.find((e) => e.employeeId === emp2.id);

      expect(emp1Event?.startDate).toBe("2025-12-26");
      expect(emp1Event?.endDate).toBe("2025-12-29");

      expect(emp2Event?.startDate).toBe("2025-12-30");
      expect(emp2Event?.endDate).toBe("2025-12-31");
    });
  });
});
