import React, { useState } from 'react';
import { TrendingUp, Calendar, Award, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layout } from '@/components/Layout';

// Mock data for demonstration
const mockData = {
  currentMonth: 'มิถุนายน 2025',
  currentYear: '2025',
  employeeRanking: [
    { name: 'สมชาย ใจดี', totalEvents: 8, eventTypes: { 'ลาป่วย': 3, 'ลากิจ': 2, 'ลาพักร้อน': 3 } },
    { name: 'สมหญิง รักงาน', totalEvents: 6, eventTypes: { 'ลาป่วย': 1, 'ลากิจ': 3, 'ลาพักร้อน': 2 } },
    { name: 'วิชาญ ขยัน', totalEvents: 5, eventTypes: { 'ลาป่วย': 2, 'ลากิจ': 1, 'ลาพักร้อน': 2 } },
    { name: 'มาลี สวยงาม', totalEvents: 4, eventTypes: { 'ลาป่วย': 1, 'ลากิจ': 1, 'ลาพักร้อน': 2 } },
    { name: 'จิตร เก่งมาก', totalEvents: 3, eventTypes: { 'ลาป่วย': 1, 'ลาพักร้อน': 2 } }
  ],
  monthlyStats: {
    totalEvents: 26,
    totalEmployees: 5,
    mostCommonType: 'ลาพักร้อน'
  }
};

const getEventTypeColor = (type: string) => {
  switch (type) {
    case 'ลาป่วย':
      return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200';
    case 'ลากิจ':
      return 'bg-blue-100 text-blue-800 dark:bg-gray-800 dark:text-gray-200';
    case 'ลาพักร้อน':
      return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
};

const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedEventType, setSelectedEventType] = useState('all');

  const filteredRanking = mockData.employeeRanking.filter(employee => {
    if (selectedEventType === 'all') return true;
    return employee.eventTypes[selectedEventType as keyof typeof employee.eventTypes] > 0;
  }).sort((a, b) => {
    if (selectedEventType === 'all') {
      return b.totalEvents - a.totalEvents;
    }
    const aCount = a.eventTypes[selectedEventType as keyof typeof a.eventTypes] || 0;
    const bCount = b.eventTypes[selectedEventType as keyof typeof b.eventTypes] || 0;
    return bCount - aCount;
  });

  return (
    <Layout currentPage="home">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">เหตุการณ์ทั้งหมด</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockData.monthlyStats.totalEvents}</div>
              <p className="text-xs text-muted-foreground">
                ประจำ{selectedPeriod === 'month' ? 'เดือน' : 'ปี'} {selectedPeriod === 'month' ? mockData.currentMonth : mockData.currentYear}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">พนักงานที่มีเหตุการณ์</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockData.monthlyStats.totalEmployees}</div>
              <p className="text-xs text-muted-foreground">
                จากทั้งหมด {mockData.employeeRanking.length} คน
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ประเภทที่พบมากที่สุด</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockData.monthlyStats.mostCommonType}</div>
              <p className="text-xs text-muted-foreground">
                ในช่วงเวลาที่เลือก
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ช่วงเวลา
            </label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="เลือกช่วงเวลา" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">รายเดือน</SelectItem>
                <SelectItem value="year">รายปี</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ประเภทเหตุการณ์
            </label>
            <Select value={selectedEventType} onValueChange={setSelectedEventType}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="เลือกประเภท" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกประเภท</SelectItem>
                <SelectItem value="ลาป่วย">ลาป่วย</SelectItem>
                <SelectItem value="ลากิจ">ลากิจ</SelectItem>
                <SelectItem value="ลาพักร้อน">ลาพักร้อน</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Employee Ranking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              การจัดอันดับ
            </CardTitle>
            <CardDescription>
              จัดเรียงตามจำนวนเหตุการณ์ {selectedEventType !== 'all' ? `ประเภท${selectedEventType}` : 'ทั้งหมด'}
              ประจำ{selectedPeriod === 'month' ? 'เดือน' : 'ปี'} {selectedPeriod === 'month' ? mockData.currentMonth : mockData.currentYear}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredRanking.map((employee, index) => (
                <div key={employee.name} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-gray-800 text-blue-600 dark:text-gray-400 rounded-full font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{employee.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        รวม {selectedEventType === 'all' ? employee.totalEvents : (employee.eventTypes[selectedEventType as keyof typeof employee.eventTypes] || 0)} เหตุการณ์
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(employee.eventTypes).map(([type, count]) => (
                      count > 0 && (
                        <Badge key={type} variant="secondary" className={getEventTypeColor(type)}>
                          {type}: {count}
                        </Badge>
                      )
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
