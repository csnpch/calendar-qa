import React, { useState, useEffect, useCallback, useMemo } from 'react';
import moment from 'moment';
import { TrendingUp, Calendar, Award, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/contexts/ThemeContext';
import { getDashboardSummary, DashboardSummary } from '@/services/api';
import { LEAVE_TYPE_LABELS, getLeaveTypeColor } from '@/lib/utils';
import { Layout } from '@/components/Layout';
import { UserDetailsModal } from '@/components/UserDetailsModal';

const Dashboard = () => {
  const { theme } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedEventType, setSelectedEventType] = useState('all');
  const [dateFrom, setDateFrom] = useState('2025-06-01');
  const [dateTo, setDateTo] = useState('2025-06-30');
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get current date info for display
  const currentDate = useMemo(() => moment().toDate(), []);
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
      // For selectedPeriod === 'all', don't set any date params to get all data
      
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

  const handleEmployeeClick = (employeeName: string) => {
    setSelectedEmployee(employeeName);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
  };

  const getDateRange = () => {
    if (selectedPeriod === 'custom') {
      return { from: dateFrom, to: dateTo };
    } else if (selectedPeriod === 'month') {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      return {
        from: startOfMonth.toISOString().split('T')[0],
        to: endOfMonth.toISOString().split('T')[0]
      };
    } else if (selectedPeriod === 'year') {
      return {
        from: `${currentDate.getFullYear()}-01-01`,
        to: `${currentDate.getFullYear()}-12-31`
      };
    } else if (selectedPeriod === 'all') {
      return undefined; // No date range for all data
    }
    return undefined;
  };

  const selectedEmployeeData = selectedEmployee && dashboardData 
    ? dashboardData.employeeRanking.find(emp => emp.name === selectedEmployee)
    : null;

  return (
    <Layout currentPage="dashboard">
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
                      : selectedPeriod === 'all'
                      ? 'ข้อมูลทั้งหมด'
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
                  <div className="text-2xl font-bold">
                    {LEAVE_TYPE_LABELS[dashboardData.monthlyStats.mostCommonType as keyof typeof LEAVE_TYPE_LABELS] || dashboardData.monthlyStats.mostCommonType}
                  </div>
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
                <SelectItem value="all">ทั้งหมด</SelectItem>
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
            <Combobox
              options={[
                { value: 'all', label: 'ทุกประเภท' },
                ...Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => ({ value, label }))
              ]}
              value={selectedEventType}
              onValueChange={setSelectedEventType}
              placeholder="เลือกประเภท"
              searchPlaceholder="ค้นหาประเภท..."
              emptyMessage="ไม่พบประเภทเหตุการณ์"
            />
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
                  : selectedPeriod === 'all'
                  ? ' ข้อมูลทั้งหมด'
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
                    <div 
                      key={employee.name} 
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => handleEmployeeClick(employee.name)}
                    >
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
                            <Badge key={type} variant="secondary" className={getLeaveTypeColor(type)}>
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

        <UserDetailsModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          employeeName={selectedEmployee || ''}
          employeeData={selectedEmployeeData}
          dateRange={getDateRange()}
        />
      </div>
    </Layout>
  );
};

export default Dashboard;
