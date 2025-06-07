import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TrendingUp, Calendar, Award, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/contexts/ThemeContext';
import { getDashboardSummary, DashboardSummary } from '@/services/api';
import { LEAVE_TYPE_LABELS } from '@/lib/utils';
import { Layout } from '@/components/Layout';

const getEventTypeColor = (type: string) => {
  switch (type) {
    case 'sick':
      return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200';
    case 'personal':
      return 'bg-blue-100 text-blue-800 dark:bg-gray-800 dark:text-gray-200';
    case 'vacation':
      return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200';
    case 'absent':
      return 'bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-100';
    case 'maternity':
      return 'bg-pink-100 text-pink-800 dark:bg-pink-800 dark:text-pink-200';
    case 'paternity':
      return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-800 dark:text-cyan-200';
    case 'bereavement':
      return 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100';
    case 'study':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-200';
    case 'military':
      return 'bg-teal-100 text-teal-800 dark:bg-teal-800 dark:text-teal-200';
    case 'sabbatical':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-200';
    case 'unpaid':
      return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
    case 'compensatory':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200';
    case 'other':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200';
    default:
      return 'bg-blue-100 text-blue-800 dark:bg-gray-800 dark:text-gray-200';
  }
};

const Index = () => {
  const { theme } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedEventType, setSelectedEventType] = useState('all');
  const [dateFrom, setDateFrom] = useState('2025-06-01');
  const [dateTo, setDateTo] = useState('2025-06-30');
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current date info for display
  const currentDate = useMemo(() => new Date(), []);
  const currentMonth = currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
  const currentYear = currentDate.getFullYear().toString();

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {};
      
      if (selectedPeriod === 'custom') {
        params.startDate = dateFrom;
        params.endDate = dateTo;
      } else if (selectedPeriod === 'month') {
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        params.startDate = startOfMonth.toISOString().split('T')[0];
        params.endDate = endOfMonth.toISOString().split('T')[0];
      } else if (selectedPeriod === 'year') {
        params.startDate = `${currentDate.getFullYear()}-01-01`;
        params.endDate = `${currentDate.getFullYear()}-12-31`;
      }
      
      if (selectedEventType !== 'all') {
        params.eventType = selectedEventType;
      }
      
      const data = await getDashboardSummary(params);
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, selectedEventType, dateFrom, dateTo, currentDate]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Filter and sort ranking based on event type
  const filteredRanking = dashboardData?.employeeRanking?.filter(employee => {
    if (selectedEventType === 'all') return true;
    return employee.eventTypes[selectedEventType as keyof typeof employee.eventTypes] > 0;
  }).sort((a, b) => {
    if (selectedEventType === 'all') {
      return b.totalEvents - a.totalEvents;
    }
    const aCount = a.eventTypes[selectedEventType as keyof typeof a.eventTypes] || 0;
    const bCount = b.eventTypes[selectedEventType as keyof typeof b.eventTypes] || 0;
    return bCount - aCount;
  }) || [];

  return (
    <Layout currentPage="home">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="text-gray-500">กำลังโหลดข้อมูล...</div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            เกิดข้อผิดพลาด: {error}
          </div>
        )}
        
        {!loading && !error && dashboardData && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">เหตุการณ์ทั้งหมด</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.monthlyStats.totalEvents}</div>
                  <p className="text-xs text-muted-foreground">
                    {selectedPeriod === 'custom' 
                      ? `${new Date(dateFrom).toLocaleDateString('th-TH')} - ${new Date(dateTo).toLocaleDateString('th-TH')}`
                      : `ประจำ${selectedPeriod === 'month' ? 'เดือน' : 'ปี'} ${selectedPeriod === 'month' ? currentMonth : currentYear}`
                    }
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">พนักงานที่มีเหตุการณ์</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.monthlyStats.totalEmployees}</div>
                  <p className="text-xs text-muted-foreground">
                    จากทั้งหมด {dashboardData.employeeRanking.length} คน
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">ประเภทที่พบมากที่สุด</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.monthlyStats.mostCommonType}</div>
                  <p className="text-xs text-muted-foreground">
                    ในช่วงเวลาที่เลือก
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Controls */}
        <div className={`grid gap-4 mb-6 ${selectedPeriod === 'custom' 
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' 
          : 'grid-cols-1 sm:grid-cols-2'
        }`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ช่วงเวลา
            </label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกช่วงเวลา" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">รายเดือน</SelectItem>
                <SelectItem value="year">รายปี</SelectItem>
                <SelectItem value="custom">กำหนดเอง</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ประเภทเหตุการณ์
            </label>
            <Select value={selectedEventType} onValueChange={setSelectedEventType}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกประเภท" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกประเภท</SelectItem>
                {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPeriod === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  วันที่เริ่มต้น
                </label>
                <div className="relative w-full">
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full cursor-pointer"
                    style={{ 
                      colorScheme: theme === 'dark' ? 'dark' : 'light',
                      width: '100%'
                    }}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  วันที่สิ้นสุด
                </label>
                <div className="relative w-full">
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full cursor-pointer"
                    style={{ 
                      colorScheme: theme === 'dark' ? 'dark' : 'light',
                      width: '100%'
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Employee Ranking */}
        {!loading && !error && dashboardData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                การจัดอันดับ
              </CardTitle>
              <CardDescription>
                จัดเรียงตามจำนวนเหตุการณ์ {selectedEventType !== 'all' ? `ประเภท${selectedEventType}` : 'ทั้งหมด'}
                {selectedPeriod === 'custom' 
                  ? ` ระหว่างวันที่ ${new Date(dateFrom).toLocaleDateString('th-TH')} - ${new Date(dateTo).toLocaleDateString('th-TH')}`
                  : ` ประจำ${selectedPeriod === 'month' ? 'เดือน' : 'ปี'} ${selectedPeriod === 'month' ? currentMonth : currentYear}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredRanking.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    ไม่พบข้อมูลพนักงานในช่วงเวลาที่เลือก
                  </div>
                ) : (
                  filteredRanking.map((employee, index) => (
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
                              {LEAVE_TYPE_LABELS[type as keyof typeof LEAVE_TYPE_LABELS] || type}: {count}
                            </Badge>
                          )
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Index;
