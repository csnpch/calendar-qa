
import React from 'react';
import { Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmployeeListProps {
  employees: string[];
  onAddEmployee: (name: string) => void;
}

export const EmployeeList: React.FC<EmployeeListProps> = ({ employees, onAddEmployee }) => {
  const [newEmployeeName, setNewEmployeeName] = React.useState('');
  const [isAdding, setIsAdding] = React.useState(false);

  const handleAdd = () => {
    if (newEmployeeName.trim()) {
      onAddEmployee(newEmployeeName.trim());
      setNewEmployeeName('');
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">รายชื่อพนักงาน</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มพนักงาน
        </Button>
      </div>

      <div className="space-y-3">
        {employees.map((employee, index) => (
          <div
            key={index}
            className="p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-200 font-semibold text-sm">
                  {employee.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-gray-900 dark:text-white font-medium">{employee}</span>
            </div>
          </div>
        ))}

        {isAdding && (
          <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20">
            <input
              type="text"
              value={newEmployeeName}
              onChange={(e) => setNewEmployeeName(e.target.value)}
              placeholder="ชื่อพนักงานใหม่"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
              autoFocus
            />
            <div className="flex space-x-2 mt-2">
              <Button size="sm" onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white">
                เพิ่ม
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsAdding(false)}>
                ยกเลิก
              </Button>
            </div>
          </div>
        )}

        {employees.length === 0 && !isAdding && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p>ยังไม่มีพนักงานในระบบ</p>
            <p className="text-sm">คลิก "เพิ่มพนักงาน" เพื่อเริ่มต้น</p>
          </div>
        )}
      </div>
    </div>
  );
};
