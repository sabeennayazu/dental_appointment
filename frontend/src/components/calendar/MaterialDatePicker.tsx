'use client';

import React, { useState, useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, isSameMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface MaterialDatePickerProps {
  selected: Date;
  onSelect: (date: Date) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function MaterialDatePicker({ selected, onSelect, open, onOpenChange }: MaterialDatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(selected));

  // Generate days for the current month
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    // Add padding days to align with weekdays
    const startDayOfWeek = getDay(start);
    const paddingDays = Array(startDayOfWeek).fill(null);
    
    return [...paddingDays, ...days];
  }, [currentMonth]);

  const handlePreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const handleDateClick = (date: Date) => {
    onSelect(date);
    onOpenChange(false);
  };

  const handleTodayClick = () => {
    const today = new Date();
    onSelect(today);
    setCurrentMonth(startOfMonth(today));
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-[400px] max-w-[90vw] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium uppercase tracking-wider opacity-90">
                SELECT DATE
              </div>
              <div className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                {format(selected, 'EEEE, MMM d')}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTodayClick}
              className="text-white/80 hover:text-white hover:bg-white/20"
            >
              Today
            </Button>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <div className="text-lg font-semibold text-gray-900">
            {format(currentMonth, 'MMMM yyyy')}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="p-4">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map(day => (
              <div
                key={day}
                className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="h-10" />;
              }

              const isSelected = isSameDay(day, selected);
              const isTodayDate = isToday(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);

              return (
                <Button
                  key={day.toString()}
                  variant="ghost"
                  onClick={() => handleDateClick(day)}
                  className={cn(
                    'h-10 w-10 rounded-full text-sm font-medium transition-all duration-200',
                    'hover:bg-gray-100',
                    isSelected && 'bg-purple-600 text-white hover:bg-purple-700',
                    isTodayDate && !isSelected && 'bg-purple-100 text-purple-600 hover:bg-purple-200',
                    !isCurrentMonth && 'text-gray-400',
                    isCurrentMonth && 'text-gray-900'
                  )}
                >
                  {format(day, 'd')}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 bg-gray-50">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            className="px-6 bg-purple-600 hover:bg-purple-700"
          >
            OK
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
