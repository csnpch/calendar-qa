import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { 
  fetchAllCompanyHolidays, 
  createMultipleCompanyHolidays, 
  updateCompanyHoliday, 
  deleteCompanyHoliday,
  clearAllCompanyHolidays,
  type CompanyHoliday 
} from '@/services/companyHolidayService';
import { Plus, Trash2, Edit, Calendar as CalendarIcon, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface HolidayFormData {
  name: string;
  date: string;
  description: string;
}

const CompanyHolidays: React.FC = () => {
  const { isAdminAuthenticated } = useAuth();
  const [holidays, setHolidays] = useState<CompanyHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<CompanyHoliday | null>(null);
  const [holidayRows, setHolidayRows] = useState<HolidayFormData[]>([
    { name: '', date: '', description: '' }
  ]);

  useEffect(() => {
    loadHolidays();
  }, []);

  const loadHolidays = async () => {
    try {
      setLoading(true);
      const data = await fetchAllCompanyHolidays();
      setHolidays(data);
    } catch (error) {
      console.error('Error loading company holidays:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลวันหยุดบริษัทได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateDateFormat = (date: string): boolean => {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!regex.test(date)) return false;
    
    const [day, month, year] = date.split('/').map(Number);
    const dateObj = new Date(year, month - 1, day);
    return dateObj.getDate() === day && 
           dateObj.getMonth() === month - 1 && 
           dateObj.getFullYear() === year;
  };

  const formatDateForAPI = (date: string): string => {
    const [day, month, year] = date.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const formatDateForDisplay = (date: string): string => {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  };

  const addHolidayRow = () => {
    setHolidayRows([...holidayRows, { name: '', date: '', description: '' }]);
  };

  const removeHolidayRow = (index: number) => {
    if (holidayRows.length > 1) {
      setHolidayRows(holidayRows.filter((_, i) => i !== index));
    }
  };

  const updateHolidayRow = (index: number, field: keyof HolidayFormData, value: string) => {
    const updatedRows = [...holidayRows];
    updatedRows[index][field] = value;
    setHolidayRows(updatedRows);
  };

  const handleDateBlur = (index: number, date: string) => {
    if (date && !validateDateFormat(date)) {
      toast({
        title: "รูปแบบวันที่ไม่ถูกต้อง",
        description: "กรุณาใส่วันที่ในรูปแบบ DD/MM/YYYY",
        variant: "destructive",
      });
    }
  };

  const handleSaveHolidays = async () => {
    const validHolidays = holidayRows.filter(row => 
      row.name.trim() && row.date.trim() && validateDateFormat(row.date)
    );

    if (validHolidays.length === 0) {
      toast({
        title: "ข้อมูลไม่ถูกต้อง",
        description: "กรุณาใส่ข้อมูลวันหยุดอย่างน้อย 1 วัน",
        variant: "destructive",
      });
      return;
    }

    try {
      const holidaysToCreate = validHolidays.map(row => ({
        name: row.name.trim(),
        date: formatDateForAPI(row.date),
        description: row.description.trim() || undefined
      }));

      await createMultipleCompanyHolidays(holidaysToCreate);
      
      toast({
        title: "สำเร็จ",
        description: `เพิ่มวันหยุดบริษัท ${holidaysToCreate.length} วันเรียบร้อยแล้ว`,
      });

      setIsDialogOpen(false);
      setHolidayRows([{ name: '', date: '', description: '' }]);
      loadHolidays();
    } catch (error) {
      console.error('Error creating holidays:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มวันหยุดบริษัทได้",
        variant: "destructive",
      });
    }
  };

  const handleEditHoliday = async () => {
    if (!editingHoliday) return;

    const row = holidayRows[0];
    if (!row.name.trim() || !row.date.trim() || !validateDateFormat(row.date)) {
      toast({
        title: "ข้อมูลไม่ถูกต้อง",
        description: "กรุณาใส่ข้อมูลให้ครบถ้วนและถูกต้อง",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateCompanyHoliday(editingHoliday.id, {
        name: row.name.trim(),
        date: formatDateForAPI(row.date),
        description: row.description.trim() || undefined
      });

      toast({
        title: "สำเร็จ",
        description: "แก้ไขวันหยุดบริษัทเรียบร้อยแล้ว",
      });

      setIsDialogOpen(false);
      setEditingHoliday(null);
      setHolidayRows([{ name: '', date: '', description: '' }]);
      loadHolidays();
    } catch (error) {
      console.error('Error updating holiday:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถแก้ไขวันหยุดบริษัทได้",
        variant: "destructive",
      });
    }
  };

  const handleDeleteHoliday = async (id: number) => {
    if (!confirm('คุณต้องการลบวันหยุดนี้หรือไม่?')) return;

    try {
      await deleteCompanyHoliday(id);
      
      toast({
        title: "สำเร็จ",
        description: "ลบวันหยุดบริษัทเรียบร้อยแล้ว",
      });

      loadHolidays();
    } catch (error) {
      console.error('Error deleting holiday:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถลบวันหยุดบริษัทได้",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (holiday: CompanyHoliday) => {
    setEditingHoliday(holiday);
    setHolidayRows([{
      name: holiday.name,
      date: formatDateForDisplay(holiday.date),
      description: holiday.description || ''
    }]);
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingHoliday(null);
    setHolidayRows([{ name: '', date: '', description: '' }]);
    setIsDialogOpen(true);
  };

  const handleClearAllHolidays = async () => {
    if (!confirm('คุณต้องการลบวันหยุดบริษัททั้งหมดหรือไม่? การกระทำนี้ไม่สามารถกู้คืนได้')) return;

    try {
      const result = await clearAllCompanyHolidays();
      
      toast({
        title: "สำเร็จ",
        description: `ลบวันหยุดบริษัททั้งหมด ${result.count} วันเรียบร้อยแล้ว`,
      });

      loadHolidays();
    } catch (error) {
      console.error('Error clearing all holidays:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถลบวันหยุดบริษัททั้งหมดได้",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout currentPage="company-holidays">
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl font-bold">วันหยุดบริษัท</CardTitle>
            {isAdminAuthenticated && (
              <div className="flex gap-2">
                {holidays.length > 0 && (
                  <Button 
                    onClick={handleClearAllHolidays} 
                    variant="outline"
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                  >
                    <X className="w-4 h-4" />
                    ลบทั้งหมด
                  </Button>
                )}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={openAddDialog} className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      เพิ่มวันหยุด
                    </Button>
                  </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingHoliday ? 'แก้ไขวันหยุดบริษัท' : 'เพิ่มวันหยุดบริษัท'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {!editingHoliday && (
                      <div className="flex justify-end">
                        <Button onClick={addHolidayRow} variant="outline" size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          เพิ่มแถว
                        </Button>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      {holidayRows.map((row, index) => (
                        <div key={index} className="flex gap-3 items-start">
                          <div className="flex-1">
                            <Input
                              placeholder="ชื่อวันหยุด"
                              value={row.name}
                              onChange={(e) => updateHolidayRow(index, 'name', e.target.value)}
                            />
                          </div>
                          <div className="flex-1 relative">
                            <Input
                              placeholder="DD/MM/YYYY"
                              value={row.date}
                              onChange={(e) => updateHolidayRow(index, 'date', e.target.value)}
                              onBlur={(e) => handleDateBlur(index, e.target.value)}
                            />
                            <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          </div>
                          <div className="flex-1">
                            <Input
                              placeholder="หมายเหตุ (ไม่บังคับ)"
                              value={row.description}
                              onChange={(e) => updateHolidayRow(index, 'description', e.target.value)}
                            />
                          </div>
                          {!editingHoliday && holidayRows.length > 1 && (
                            <Button
                              onClick={() => removeHolidayRow(index)}
                              variant="outline"
                              size="sm"
                              className="px-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button 
                        onClick={() => setIsDialogOpen(false)} 
                        variant="outline"
                      >
                        ยกเลิก
                      </Button>
                      <Button 
                        onClick={editingHoliday ? handleEditHoliday : handleSaveHolidays}
                      >
                        {editingHoliday ? 'บันทึก' : 'เพิ่มวันหยุด'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">กำลังโหลด...</div>
            ) : holidays.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                ไม่มีวันหยุดบริษัท
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อวันหยุด</TableHead>
                    <TableHead>วันที่</TableHead>
                    <TableHead>หมายเหตุ</TableHead>
                    {isAdminAuthenticated && <TableHead>การจัดการ</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holidays.map((holiday) => (
                    <TableRow key={holiday.id}>
                      <TableCell className="font-medium">{holiday.name}</TableCell>
                      <TableCell>{formatDateForDisplay(holiday.date)}</TableCell>
                      <TableCell>{holiday.description || '-'}</TableCell>
                      {isAdminAuthenticated && (
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => openEditDialog(holiday)}
                              variant="outline"
                              size="sm"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteHoliday(holiday.id)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CompanyHolidays;