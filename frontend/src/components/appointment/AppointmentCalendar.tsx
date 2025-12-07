'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CalendarAppointment } from '@/lib/api/calendar';

interface AppointmentCalendarProps {
  appointmentDate: string;
  doctorId: number;
  onDateSelect?: (date: Date) => void;
  className?: string;
}

export function AppointmentCalendar({ 
  appointmentDate, 
  doctorId,
  onDateSelect,
  className = '' 
}: AppointmentCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(appointmentDate));
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [loading, setLoading] = useState(false);

  // Get the first and last day of the current month view
  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth
  });

  // Get the day of week for the first day of the month (0 = Sunday, 1 = Monday, etc.)
  const startDay = firstDayOfMonth.getDay();
  
  // Generate empty cells for days before the first day of the month
  const emptyStartDays = Array(startDay).fill(null);

  // Fetch appointments for the current month
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!doctorId) return;
      
      setLoading(true);
      try {
        const startDate = format(firstDayOfMonth, 'yyyy-MM-dd');
        const endDate = format(lastDayOfMonth, 'yyyy-MM-dd');
        
        const response = await fetch(`/api/appointments/calendar?doctor_id=${doctorId}&start_date=${startDate}&end_date=${endDate}`);
        const data = await response.json();
        
        if (response.ok) {
          setAppointments(Array.isArray(data) ? data : data.data || []);
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointments();
  }, [doctorId, firstDayOfMonth, lastDayOfMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Check if a date has appointments
  const hasAppointments = (date: Date) => {
    return appointments.some(apt => 
      isSameDay(new Date(apt.start_time), date)
    );
  };

  // Check if a date is the appointment date
  const isAppointmentDate = (date: Date) => {
    return isSameDay(new Date(appointmentDate), date);
  };

  // Handle date selection
  const handleDateClick = (date: Date) => {
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow border border-gray-200 overflow-hidden ${className}`}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <button 
          onClick={handlePrevMonth}
          className="p-1 rounded-full hover:bg-gray-100"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h3 className="font-medium text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button 
          onClick={handleNextMonth}
          className="p-1 rounded-full hover:bg-gray-100"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>
      
      {/* Calendar Grid */}
      <div className="p-3">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="text-xs font-medium text-center text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before the first of the month */}
          {emptyStartDays.map((_, index) => (
            <div key={`empty-${index}`} className="h-8" />
          ))}
          
          {/* Days of the month */}
          {daysInMonth.map((date) => {
            const dateHasAppointments = hasAppointments(date);
            const isApptDate = isAppointmentDate(date);
            const isCurrentMonth = isSameMonth(date, currentMonth);
            
            return (
              <button
                key={date.toString()}
                onClick={() => handleDateClick(date)}
                disabled={!isCurrentMonth}
                className={`relative flex items-center justify-center h-8 w-8 mx-auto rounded-full text-sm font-medium
                  ${isToday(date) ? 'font-bold' : ''}
                  ${isApptDate 
                    ? 'bg-blue-600 text-white' 
                    : dateHasAppointments 
                      ? 'bg-blue-100 text-blue-700' 
                      : isCurrentMonth 
                        ? 'text-gray-900 hover:bg-gray-100' 
                        : 'text-gray-400'}
                `}
              >
                {date.getDate()}
                {dateHasAppointments && !isApptDate && (
                  <span className="absolute bottom-0 w-1 h-1 rounded-full bg-blue-500"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Legend */}
      <div className="px-4 py-2 border-t border-gray-200 text-xs text-gray-500">
        <div className="flex items-center justify-center space-x-4">
          <div className="flex items-center">
            <span className="w-2 h-2 mr-1 rounded-full bg-blue-100"></span>
            <span>Available</span>
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 mr-1 rounded-full bg-blue-600"></span>
            <span>Selected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
