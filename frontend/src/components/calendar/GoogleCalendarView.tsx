'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  subDays,
  isSameDay,
  parseISO,
  addWeeks,
  subWeeks,
} from 'date-fns';
import { Doctor } from '@/lib/types';
import { CalendarAppointment, getAppointments, getDoctors } from '@/lib/api/calendar';
import { DoctorSelector } from './DoctorSelector';
import { TimeSlotGrid } from './TimeSlotGrid';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Search,
  Settings,
  Grid3x3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface GoogleCalendarViewProps {
  doctorId?: number;
  initialDate?: string;
  view?: 'day' | 'week' | 'month';
  className?: string;
  compact?: boolean;
  onStateChange?: (state: {
    doctorId?: number;
    date: Date;
    view: 'day' | 'week' | 'month';
  }) => void;
}

export function GoogleCalendarView({
  doctorId: initialDoctorId,
  initialDate,
  view: initialView = 'week',
  className,
  compact = false,
  onStateChange,
}: GoogleCalendarViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    initialDate ? parseISO(initialDate) : new Date()
  );
  const [view, setView] = useState<'day' | 'week' | 'month'>(initialView);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Calculate week range
  const weekStart = useMemo(
    () => startOfWeek(selectedDate, { weekStartsOn: 0 }),
    [selectedDate]
  );
  const weekEnd = useMemo(
    () => endOfWeek(selectedDate, { weekStartsOn: 0 }),
    [selectedDate]
  );
  const weekDays = useMemo(() => {
    const days = [];
    let current = weekStart;
    while (current <= weekEnd) {
      days.push(current);
      current = addDays(current, 1);
    }
    return days;
  }, [weekStart, weekEnd]);

  // Fetch doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      const doctors = await getDoctors();
      if (initialDoctorId) {
        const doctor = doctors.find((d: Doctor) => d.id === initialDoctorId);
        if (doctor) {
          setSelectedDoctor(doctor);
        }
      } else if (doctors.length > 0) {
        setSelectedDoctor(doctors[0]);
      }
    };
    fetchDoctors();
  }, [initialDoctorId]);

  // Fetch appointments
  useEffect(() => {
    if (!selectedDoctor) return;

    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const startDate = format(weekStart, 'yyyy-MM-dd');
        const endDate = format(weekEnd, 'yyyy-MM-dd');

        const data = await getAppointments({
          doctor_id: selectedDoctor.id,
          start_date: startDate,
          end_date: endDate,
        });

        setAppointments(data);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [selectedDoctor, weekStart, weekEnd]);

  // Update URL
  useEffect(() => {
    if (!selectedDoctor) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set('doctor', selectedDoctor.id.toString());
    params.set('date', format(selectedDate, 'yyyy-MM-dd'));
    params.set('view', view);

    router.push(`?${params.toString()}`, { scroll: false });

    if (onStateChange) {
      onStateChange({
        doctorId: selectedDoctor.id,
        date: selectedDate,
        view,
      });
    }
  }, [selectedDoctor, selectedDate, view, router, searchParams, onStateChange]);

  const handleDoctorChange = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setDatePickerOpen(false);
    }
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const goToPreviousWeek = () => {
    setSelectedDate((prev) => subWeeks(prev, 1));
  };

  const goToNextWeek = () => {
    setSelectedDate((prev) => addWeeks(prev, 1));
  };

  return (
    <div className={cn('flex flex-col h-full bg-white', className)}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-gray-200 px-6 py-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="rounded-full"
            >
              Today
            </Button>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPreviousWeek}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToNextWeek}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            <h1 className="text-xl font-medium text-gray-900 min-w-[200px]">
              {format(selectedDate, 'MMMM yyyy')}
            </h1>
          </div>

         
        </div>

        {/* Doctor Selector and Date Picker */}
        <div className="flex items-center space-x-3 mt-4">
          <DoctorSelector
            selectedDoctor={selectedDoctor}
            onSelect={handleDoctorChange}
          />
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <CalendarIcon className="h-4 w-4" />
                <span>{format(selectedDate, 'MMM d, yyyy')}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </motion.div>

      {/* Week View */}
      {!loading && selectedDoctor ? (
        <TimeSlotGrid
          weekDays={weekDays}
          appointments={appointments}
          selectedDate={selectedDate}
          compact={compact}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          {loading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          ) : (
            <p className="text-gray-500">Please select a doctor to view appointments</p>
          )}
        </div>
      )}
    </div>
  );
}
