# Dashboard Bug Report และการแก้ไข

## 📋 สรุปการวิเคราะห์ Dashboard Flow

### ความต้องการของ Dashboard

Dashboard ต้องการแสดงข้อมูลสรุปดังนี้:

1. **สถิติรวม (Monthly Stats)**

   - จำนวนเหตุการณ์ทั้งหมดในช่วงเวลาที่เลือก
   - จำนวนพนักงานที่มีเหตุการณ์
   - ประเภทเหตุการณ์ที่พบบ่อยที่สุด

2. **การจัดอันดับพนักงาน (Employee Ranking)**

   - จัดเรียงตามจำนวนเหตุการณ์มากไปน้อย
   - แสดงจำนวนเหตุการณ์แยกตามประเภท
   - สามารถกรองตามประเภทเหตุการณ์ได้

3. **ช่วงเวลาที่รองรับ**
   - รายเดือน (Month)
   - รายปี (Year)
   - ทั้งหมด (All)
   - กำหนดเอง (Custom Range)

---

## 🐛 บัคที่พบทั้งหมด

### Bug #1: Date Filtering ไม่รองรับ Multi-Day Events ❌

**ตำแหน่ง:** `backend/src/services/eventService.ts` - `getDashboardSummary()`

**ปัญหา:**

```typescript
// โค้ดเดิม - ผิด
if (startDate && endDate) {
  whereClause = "WHERE date >= ? AND date <= ?";
  params.push(startDate, endDate);
}
```

Query ใช้เฉพาะ field `date` ซึ่งเป็น legacy field สำหรับ single-day events เท่านั้น

- ไม่สามารถตรวจจับ multi-day events ที่ใช้ `start_date` และ `end_date`
- Events ที่ยาวหลายวันจะไม่ถูกนับเมื่อกรองตามช่วงเวลา
- เช่น: ลาพักร้อน 10-15 มิ.ย. จะไม่ปรากฏในสรุปประจำเดือนมิถุนายน

**การแก้ไข:**

```typescript
// โค้ดใหม่ - ถูกต้อง
if (startDate && endDate) {
  // ตรวจสอบทั้ง single-day และ multi-day events
  // Event overlaps ถ้า: start_date <= endDate AND end_date >= startDate
  whereClause =
    "WHERE ((date >= ? AND date <= ?) OR (start_date <= ? AND end_date >= ?))";
  params.push(startDate, endDate, endDate, startDate);
}
```

**ผลลัพธ์:**

- ✅ รองรับ single-day events (ใช้ field `date`)
- ✅ รองรับ multi-day events (ใช้ `start_date` และ `end_date`)
- ✅ ตรวจจับ events ที่ overlap กับช่วงเวลาที่เลือก
- ✅ นับ events ที่เริ่มก่อนและจบในช่วงที่เลือก
- ✅ นับ events ที่เริ่มในช่วงและจบหลังช่วงที่เลือก

---

### Bug #2: mostCommonType ถูกแปลเป็นภาษาไทยแล้ว ❌

**ตำแหน่ง:** `backend/src/services/eventService.ts` - `getDashboardSummary()`

**ปัญหา:**

```typescript
// โค้ดเดิม - ผิด
return {
  monthlyStats: {
    totalEvents,
    totalEmployees,
    mostCommonType:
      mostCommonType === "sick"
        ? "ลาป่วย"
        : mostCommonType === "personal"
        ? "ลากิจ"
        : mostCommonType === "vacation"
        ? "ลาพักร้อน"
        : mostCommonType,
  },
  employeeRanking,
};
```

Backend แปล leave type เป็นภาษาไทยส่งกลับไป แต่ Frontend ต้องการ raw key เพื่อนำไปหา label จาก `LEAVE_TYPE_LABELS`

**ผลกระทบ:**

- Frontend ไม่สามารถใช้ค่าที่ได้เป็น key lookup ใน `LEAVE_TYPE_LABELS`
- อาจทำให้แสดงผลผิดพลาดหรือไม่แสดง
- ทำให้ logic ของ frontend ที่ต้องการใช้ key (เช่น 'sick', 'vacation') ใช้งานไม่ได้

**การแก้ไข:**

```typescript
// โค้ดใหม่ - ถูกต้อง
return {
  monthlyStats: {
    totalEvents,
    totalEmployees,
    mostCommonType, // ส่ง raw key กลับไป ให้ frontend แปลเอง
  },
  employeeRanking,
};
```

**หลักการ:**

- **Backend ไม่ควรทำ translation** - Backend ควรส่งข้อมูลดิบ (raw data)
- **Frontend เป็นผู้จัดการ presentation** - Frontend มี `LEAVE_TYPE_LABELS` สำหรับแปลภาษา
- ทำให้ระบบ flexible กว่า เช่น สามารถเปลี่ยนภาษาได้จาก frontend

---

### Bug #3: UserDetailsModal ใช้ field `date` ที่อาจเป็น null ❌

**ตำแหน่ง:** `frontend/src/components/UserDetailsModal.tsx`

**ปัญหา:**

```typescript
// โค้ดเดิม - ผิด
const groupedEvents = events.reduce((groups, event) => {
  const eventDate = new Date(event.date); // อาจเป็น null สำหรับ multi-day events
  const year = eventDate.getFullYear().toString();
  const month = eventDate.toLocaleDateString("th-TH", { month: "long" });
  const date = event.date;
  // ...
});
```

**ผลกระทบ:**

- Multi-day events อาจมี `date = null`
- `new Date(null)` จะได้ Invalid Date
- Modal จะแสดงผลผิดพลาดหรือ crash

**การแก้ไข:**

```typescript
// โค้ดใหม่ - ถูกต้อง
const groupedEvents = events.reduce((groups, event) => {
  // ใช้ startDate สำหรับ multi-day events, fallback ไป date สำหรับ legacy events
  const dateToUse = event.date || event.startDate;
  const eventDate = new Date(dateToUse);
  const year = eventDate.getFullYear().toString();
  const month = eventDate.toLocaleDateString("th-TH", { month: "long" });
  const date = dateToUse;
  // ...
});
```

**ผลลัพธ์:**

- ✅ รองรับทั้ง single-day และ multi-day events
- ✅ ไม่มี Invalid Date
- ✅ Modal แสดงผลถูกต้อง

---

### Bug #4: Frontend ไม่มี Unit Tests ❌

**ปัญหา:**

- ไม่มีการทดสอบอัตโนมัติ
- ไม่มีการตรวจสอบว่า API integration ทำงานถูกต้อง
- Regression bugs อาจเกิดขึ้นได้ง่าย

**สถานะ:**

- ⏳ ยังไม่ได้ติดตั้ง testing framework เนื่องจากมีปัญหา npm permissions
- 📝 แนะนำให้ติดตั้ง: Vitest + React Testing Library

**คำสั่งติดตั้งที่แนะนำ:**

```bash
cd frontend
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

---

## ✅ การทดสอบและ Test Cases

### Backend Tests ที่เพิ่มเข้ามา

**File:** `backend/tests/services/dashboardService.test.ts`

**Test Suites:**

1. **Basic Functionality (5 tests)**

   - ✅ should return summary for all events when no filters applied
   - ✅ should filter by date range correctly
   - ✅ should calculate most common leave type correctly
   - ✅ should filter by event type
   - ✅ should combine date range and event type filters

2. **Multi-Day Events - BUG TESTS (4 tests)**

   - ✅ should count multi-day events within date range
   - ✅ should count events that start before and end within range
   - ✅ should count events that start within and end after range
   - ✅ should NOT count events completely outside date range

3. **Employee Ranking (3 tests)**

   - ✅ should rank employees by total events descending
   - ✅ should include event type breakdown for each employee
   - ✅ should filter ranking by event type

4. **Edge Cases (3 tests)**

   - ✅ should handle no events
   - ✅ should handle date range with no matching events
   - ✅ should handle event type filter with no matches

5. **Return Type Validation (2 tests)**
   - ✅ should return mostCommonType as raw leave type key, not Thai translation
   - ✅ should have correct structure for employeeRanking

**ผลการทดสอบ:**

```
Test Suites: 4 passed, 4 total
Tests:       55 passed, 55 total
```

---

## 📊 ตัวอย่างการทำงานที่ถูกต้อง

### Scenario 1: Multi-Day Event Counting

**ข้อมูล:**

- Employee A: ลาพักร้อน 10-15 มิ.ย. (6 วัน)
- Employee B: ลาป่วย 20 มิ.ย. (1 วัน)
- Employee C: ลากิจ 28 พ.ค. - 3 มิ.ย. (7 วัน, overlap 3 วันในมิ.ย.)

**Query:** Dashboard สำหรับเดือนมิถุนายน (1-30 มิ.ย.)

**ผลลัพธ์ที่ถูกต้อง:**

```javascript
{
  monthlyStats: {
    totalEvents: 3,        // นับทั้ง 3 events
    totalEmployees: 3,     // พนักงาน 3 คน
    mostCommonType: 'vacation'
  },
  employeeRanking: [
    { name: 'Employee A', totalEvents: 1, eventTypes: { vacation: 1 } },
    { name: 'Employee B', totalEvents: 1, eventTypes: { sick: 1 } },
    { name: 'Employee C', totalEvents: 1, eventTypes: { personal: 1 } }
  ]
}
```

### Scenario 2: Event Type Filtering

**ข้อมูล:**

- Employee A: 3 vacation, 2 sick
- Employee B: 2 sick, 1 personal
- Employee C: 1 vacation

**Query:** กรองเฉพาะ sick leave

**ผลลัพธ์ที่ถูกต้อง:**

```javascript
{
  monthlyStats: {
    totalEvents: 4,        // 2 + 2 sick events
    totalEmployees: 2,     // เฉพาะ A และ B ที่มี sick
    mostCommonType: 'sick'
  },
  employeeRanking: [
    { name: 'Employee A', totalEvents: 2, eventTypes: { sick: 2 } },
    { name: 'Employee B', totalEvents: 2, eventTypes: { sick: 2 } }
    // Employee C ไม่ปรากฏเพราะไม่มี sick leave
  ]
}
```

---

## 🔧 ไฟล์ที่ถูกแก้ไข

### Backend

1. ✅ `backend/src/services/eventService.ts` - แก้ date filtering และ translation
2. ✅ `backend/tests/setup.ts` - เพิ่ม test employees จาก 2 เป็น 5 คน
3. ✅ `backend/tests/services/dashboardService.test.ts` - เพิ่ม 17 test cases ใหม่
4. ✅ `backend/tests/services/employeeService.test.ts` - อัพเดท assertions ให้ตรงกับข้อมูลใหม่

### Frontend

1. ✅ `frontend/src/components/UserDetailsModal.tsx` - แก้การใช้ date field
2. ✅ `frontend/src/services/api.ts` - เพิ่ม startDate, endDate ใน EmployeeEvent interface

---

## 🎯 สรุปผลการแก้ไข

### ก่อนแก้ไข ❌

- Dashboard นับ multi-day events ไม่ถูกต้อง
- mostCommonType เป็นภาษาไทย ทำให้ frontend ใช้งานยาก
- UserDetailsModal อาจ crash กับ multi-day events
- ไม่มี test coverage สำหรับ dashboard functionality

### หลังแก้ไข ✅

- Dashboard นับทุก event ถูกต้อง (single-day และ multi-day)
- mostCommonType เป็น raw key ที่ frontend ใช้งานได้
- UserDetailsModal รองรับทุกประเภท events
- มี comprehensive test suite (17 tests) ที่ทดสอบทุก edge cases
- All 55 backend tests passed

---

## 📝 Recommendations

### สำหรับ Frontend Testing

1. แก้ไข npm permissions:

   ```bash
   sudo chown -R $(whoami) ~/.npm
   ```

2. ติดตั้ง Vitest:

   ```bash
   cd frontend
   npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
   ```

3. สร้าง test files:
   - `frontend/src/pages/Dashboard.test.tsx` - ทดสอบ component
   - `frontend/src/services/api.test.ts` - ทดสอบ API calls
   - `frontend/vitest.config.ts` - configuration

### การปรับปรุงเพิ่มเติม

1. เพิ่ม integration tests ระหว่าง frontend-backend
2. เพิ่ม E2E tests สำหรับ user workflows
3. เพิ่ม error handling ที่ดีขึ้นเมื่อ API fails
4. เพิ่ม loading states ที่ชัดเจนขึ้น

---

**วันที่:** 30 พฤศจิกายน 2025
**Status:** ✅ Completed (Backend), ⏳ Pending (Frontend Testing Setup)
