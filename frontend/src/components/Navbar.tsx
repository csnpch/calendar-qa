import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  CalendarDays, 
  Building2, 
  Users, 
  Settings, 
  MoreVertical, 
  Moon, 
  Sun 
} from 'lucide-react';

interface NavbarProps {
  currentPage?: 'home' | 'calendar-events' | 'employees' | 'cronjob-config';
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage = 'home' }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const isCurrentPage = (page: string) => currentPage === page;

  const getButtonClasses = (page: string) => {
    if (isCurrentPage(page)) {
      return "text-blue-600 hover:text-blue-700 dark:text-gray-200 dark:hover:text-white font-medium";
    }
    return "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white";
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-600">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <div className="p-1.5 sm:p-2 md:p-3 bg-blue-100 dark:bg-gray-700 rounded-lg">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-blue-600 dark:text-gray-200" />
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Calendar QA</h1>
          </Button>
          
          {/* Navigation Menu */}
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className={getButtonClasses('home')}
              >
                หน้าแรก
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/calendar-events')}
                className={getButtonClasses('calendar-events')}
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                ปฏิทินเหตุการณ์
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/employees')}
                className={getButtonClasses('employees')}
              >
                <Users className="w-4 h-4 mr-2" />
                จัดการพนักงาน
              </Button>
            </nav>
            
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-white dark:hover:text-gray-300 border-gray-200 dark:border-gray-600"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="p-2">
                  <DropdownMenuItem onClick={() => navigate('/cronjob-config')} className="px-4 py-3">
                    <Settings className="w-4 h-4 mr-2" />
                    ตั้งค่า Cronjob
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-white dark:hover:text-gray-300 border-gray-200 dark:border-gray-600"
              >
                {theme === 'dark' ? 
                  <Sun className="w-4 h-4" /> : 
                  <Moon className="w-4 h-4" />
                }
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
