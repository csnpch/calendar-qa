import {
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
  afterAll,
} from "bun:test";
import { cleanupDatabase } from "../setup";
import { EventService } from "../../src/services/eventService";
import type { CreateEventRequest } from "../../src/types";

describe("DashboardService", () => {
  let eventService: EventService;

  beforeEach(() => {
    cleanupDatabase();
    eventService = new EventService();
  });

  describe("getDashboardSummary - Basic Functionality", () => {
    beforeEach(() => {
      // Create test events for June 2025
      // Employee 1 (John Smith) - 3 vacation days
      eventService.createEvent({
        employeeId: 1,
        leaveType: "vacation",
        startDate: "2025-06-01",
        endDate: "2025-06-01",
        description: "Vacation day 1",
      });
      eventService.createEvent({
        employeeId: 1,
        leaveType: "vacation",
        startDate: "2025-06-02",
        endDate: "2025-06-02",
        description: "Vacation day 2",
      });
      eventService.createEvent({
        employeeId: 1,
        leaveType: "sick",
        startDate: "2025-06-10",
        endDate: "2025-06-10",
        description: "Sick leave",
      });

      // Employee 2 (Sarah Johnson) - 2 sick days
      eventService.createEvent({
        employeeId: 2,
        leaveType: "sick",
        startDate: "2025-06-05",
        endDate: "2025-06-05",
        description: "Sick day 1",
      });
      eventService.createEvent({
        employeeId: 2,
        leaveType: "sick",
        startDate: "2025-06-06",
        endDate: "2025-06-06",
        description: "Sick day 2",
      });

      // Employee 3 - event outside date range
      eventService.createEvent({
        employeeId: 3,
        leaveType: "personal",
        startDate: "2025-07-15",
        endDate: "2025-07-15",
        description: "July event",
      });
    });

    test("should return summary for all events when no filters applied", () => {
      const summary = eventService.getDashboardSummary();

      expect(summary.monthlyStats.totalEvents).toBe(6);
      expect(summary.monthlyStats.totalEmployees).toBe(3);
      expect(summary.employeeRanking).toHaveLength(3);
    });

    test("should filter by date range correctly", () => {
      const summary = eventService.getDashboardSummary(
        "2025-06-01",
        "2025-06-30"
      );

      expect(summary.monthlyStats.totalEvents).toBe(5);
      expect(summary.monthlyStats.totalEmployees).toBe(2);
      expect(summary.employeeRanking).toHaveLength(2);
    });

    test("should calculate most common leave type correctly", () => {
      const summary = eventService.getDashboardSummary(
        "2025-06-01",
        "2025-06-30"
      );

      // 3 sick events vs 2 vacation events in June
      expect(summary.monthlyStats.mostCommonType).toBe("sick");
    });

    test("should filter by event type", () => {
      const summary = eventService.getDashboardSummary(
        undefined,
        undefined,
        "vacation"
      );

      expect(summary.monthlyStats.totalEvents).toBe(2);
      expect(summary.employeeRanking[0].name).toBe("John Smith");
      expect(summary.employeeRanking[0].totalEvents).toBe(2);
    });

    test("should combine date range and event type filters", () => {
      const summary = eventService.getDashboardSummary(
        "2025-06-01",
        "2025-06-30",
        "sick"
      );

      expect(summary.monthlyStats.totalEvents).toBe(3);
      expect(summary.employeeRanking).toHaveLength(2);
    });
  });

  describe("getDashboardSummary - Multi-Day Events (BUG TEST)", () => {
    beforeEach(() => {
      // Employee 1 - Multi-day vacation (June 10-15 = 6 days)
      eventService.createEvent({
        employeeId: 1,
        leaveType: "vacation",
        startDate: "2025-06-10",
        endDate: "2025-06-15",
        description: "Multi-day vacation",
      });

      // Employee 2 - Single day sick leave in June
      eventService.createEvent({
        employeeId: 2,
        leaveType: "sick",
        startDate: "2025-06-20",
        endDate: "2025-06-20",
        description: "Single sick day",
      });

      // Employee 3 - Multi-day event spanning May-June (May 28 - June 3)
      eventService.createEvent({
        employeeId: 3,
        leaveType: "personal",
        startDate: "2025-05-28",
        endDate: "2025-06-03",
        description: "Spanning months",
      });
    });

    test("should count multi-day events within date range", () => {
      const summary = eventService.getDashboardSummary(
        "2025-06-01",
        "2025-06-30"
      );

      // Should include:
      // 1. Employee 1: Multi-day vacation (June 10-15)
      // 2. Employee 2: Single sick day (June 20)
      // 3. Employee 3: Event spanning May-June (overlaps with June 1-3)
      expect(summary.monthlyStats.totalEvents).toBe(3);
      expect(summary.monthlyStats.totalEmployees).toBe(3);
    });

    test("should count events that start before and end within range", () => {
      const summary = eventService.getDashboardSummary(
        "2025-06-01",
        "2025-06-30"
      );

      // Employee 3's event starts May 28 but overlaps with June 1-3
      const employee3 = summary.employeeRanking.find(
        (e) => e.name === "Michael Brown"
      );
      expect(employee3).toBeDefined();
      expect(employee3!.totalEvents).toBe(1);
    });

    test("should count events that start within and end after range", () => {
      // Employee 1 - Event starting in June ending in July
      eventService.createEvent({
        employeeId: 1,
        leaveType: "vacation",
        startDate: "2025-06-28",
        endDate: "2025-07-05",
        description: "June-July vacation",
      });

      const summary = eventService.getDashboardSummary(
        "2025-06-01",
        "2025-06-30"
      );

      const employee1 = summary.employeeRanking.find(
        (e) => e.name === "John Smith"
      );
      expect(employee1).toBeDefined();
      // Should count both multi-day events for Employee 1
      expect(employee1!.totalEvents).toBe(2);
    });

    test("should NOT count events completely outside date range", () => {
      // Employee 4 - Event in May only
      eventService.createEvent({
        employeeId: 4,
        leaveType: "vacation",
        startDate: "2025-05-01",
        endDate: "2025-05-05",
        description: "May only",
      });

      const summary = eventService.getDashboardSummary(
        "2025-06-01",
        "2025-06-30"
      );

      // Should not include Employee 4
      const employee4 = summary.employeeRanking.find(
        (e) => e.name === "Emily Davis"
      );
      expect(employee4).toBeUndefined();
    });
  });

  describe("getDashboardSummary - Employee Ranking", () => {
    beforeEach(() => {
      // Employee 1 - 5 events total (3 vacation, 2 sick)
      for (let i = 1; i <= 3; i++) {
        eventService.createEvent({
          employeeId: 1,
          leaveType: "vacation",
          startDate: `2025-06-0${i}`,
          endDate: `2025-06-0${i}`,
        });
      }
      for (let i = 4; i <= 5; i++) {
        eventService.createEvent({
          employeeId: 1,
          leaveType: "sick",
          startDate: `2025-06-0${i}`,
          endDate: `2025-06-0${i}`,
        });
      }

      // Employee 2 - 3 events (2 sick, 1 personal)
      eventService.createEvent({
        employeeId: 2,
        leaveType: "sick",
        startDate: "2025-06-10",
        endDate: "2025-06-10",
      });
      eventService.createEvent({
        employeeId: 2,
        leaveType: "sick",
        startDate: "2025-06-11",
        endDate: "2025-06-11",
      });
      eventService.createEvent({
        employeeId: 2,
        leaveType: "personal",
        startDate: "2025-06-12",
        endDate: "2025-06-12",
      });

      // Employee 3 - 1 event
      eventService.createEvent({
        employeeId: 3,
        leaveType: "vacation",
        startDate: "2025-06-15",
        endDate: "2025-06-15",
      });
    });

    test("should rank employees by total events descending", () => {
      const summary = eventService.getDashboardSummary();

      expect(summary.employeeRanking[0].name).toBe("John Smith");
      expect(summary.employeeRanking[0].totalEvents).toBe(5);

      expect(summary.employeeRanking[1].name).toBe("Sarah Johnson");
      expect(summary.employeeRanking[1].totalEvents).toBe(3);

      expect(summary.employeeRanking[2].name).toBe("Michael Brown");
      expect(summary.employeeRanking[2].totalEvents).toBe(1);
    });

    test("should include event type breakdown for each employee", () => {
      const summary = eventService.getDashboardSummary();

      const employee1 = summary.employeeRanking[0];
      expect(employee1.eventTypes.vacation).toBe(3);
      expect(employee1.eventTypes.sick).toBe(2);

      const employee2 = summary.employeeRanking[1];
      expect(employee2.eventTypes.sick).toBe(2);
      expect(employee2.eventTypes.personal).toBe(1);
    });

    test("should filter ranking by event type", () => {
      const summary = eventService.getDashboardSummary(
        undefined,
        undefined,
        "sick"
      );

      // Only employees with sick leave should appear
      expect(summary.employeeRanking).toHaveLength(2);
      expect(summary.employeeRanking[0].name).toBe("John Smith");
      expect(summary.employeeRanking[0].totalEvents).toBe(2);
      expect(summary.employeeRanking[1].name).toBe("Sarah Johnson");
      expect(summary.employeeRanking[1].totalEvents).toBe(2);
    });
  });

  describe("getDashboardSummary - Edge Cases", () => {
    test("should handle no events", () => {
      const summary = eventService.getDashboardSummary();

      expect(summary.monthlyStats.totalEvents).toBe(0);
      expect(summary.monthlyStats.totalEmployees).toBe(0);
      expect(summary.monthlyStats.mostCommonType).toBe("N/A");
      expect(summary.employeeRanking).toHaveLength(0);
    });

    test("should handle date range with no matching events", () => {
      eventService.createEvent({
        employeeId: 1,
        leaveType: "vacation",
        startDate: "2025-06-01",
        endDate: "2025-06-01",
      });

      const summary = eventService.getDashboardSummary(
        "2025-07-01",
        "2025-07-31"
      );

      expect(summary.monthlyStats.totalEvents).toBe(0);
      expect(summary.monthlyStats.totalEmployees).toBe(0);
    });

    test("should handle event type filter with no matches", () => {
      eventService.createEvent({
        employeeId: 1,
        leaveType: "vacation",
        startDate: "2025-06-01",
        endDate: "2025-06-01",
      });

      const summary = eventService.getDashboardSummary(
        undefined,
        undefined,
        "maternity"
      );

      expect(summary.monthlyStats.totalEvents).toBe(0);
      expect(summary.employeeRanking).toHaveLength(0);
    });
  });

  describe("getDashboardSummary - Return Type Validation", () => {
    beforeEach(() => {
      eventService.createEvent({
        employeeId: 1,
        leaveType: "sick",
        startDate: "2025-06-01",
        endDate: "2025-06-01",
      });
    });

    test("should return mostCommonType as raw leave type key, not Thai translation", () => {
      const summary = eventService.getDashboardSummary();

      // Should return 'sick', NOT 'ลาป่วย'
      expect(summary.monthlyStats.mostCommonType).toBe("sick");
      expect(summary.monthlyStats.mostCommonType).not.toBe("ลาป่วย");
    });

    test("should have correct structure for employeeRanking", () => {
      const summary = eventService.getDashboardSummary();

      expect(summary.employeeRanking[0]).toHaveProperty("name");
      expect(summary.employeeRanking[0]).toHaveProperty("totalEvents");
      expect(summary.employeeRanking[0]).toHaveProperty("eventTypes");
      expect(typeof summary.employeeRanking[0].eventTypes).toBe("object");
    });
  });
});
