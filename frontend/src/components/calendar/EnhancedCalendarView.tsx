'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  format,
  isToday,
  isSameDay,
  parseISO,
  addDays,
  subDays,
  getHours,
} from 'date-fns';
import { Doctor, AppointmentHistory } from '@/lib/types';
import { CalendarAppointment, getAppointments, getDoctors } from '@/lib/api/calendar';
import { getHistory } from '@/lib/api/history';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, User, Phone, CheckCircle, XCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';


// Time slots: 8 AM to 7 PM (fixed range)
const START_HOUR = 8; // 8 AM
const END_HOUR = 19;  // 7 PM (19:00)
const TIME_SLOTS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => {
  const hour = START_HOUR + i;
  return {
    hour,
    label:
      hour === 0
        ? '12 AM'
        : hour === 12
          ? '12 PM'
          : hour < 12
            ? `${hour} AM`
            : `${hour - 12} PM`,
    time24: `${hour.toString().padStart(2, '0')}:00`,
  };
});

// Height of each hour slot in pixels
const HOUR_HEIGHT = 80; // 80px per hour

// Use shared time slots from calendar-sync
const generateTimeSlots = () => TIME_SLOTS;


interface EnhancedCalendarViewProps {
  // State props - all state passed from parent
  selectedDate: Date;
  selectedDoctor: Doctor | null;
  appointments: CalendarAppointment[];
  history: AppointmentHistory[];
  loading?: boolean;

  // Callback props - parent handles state changes
  onDateChange: (date: Date) => void;
  onDoctorChange: (doctor: Doctor | null) => void;
  onSlotClick?: (date: string, time: string) => void;
  onCapacityExceeded?: () => void;

  // Layout props
  className?: string;
  compact?: boolean;
  view?: 'day' | 'week';
}

// Helper function to convert history to calendar appointment format
function convertHistoryToCalendarAppointment(history: AppointmentHistory): CalendarAppointment {
  return {
    id: history.id,
    name: history.name,
    email: history.email,
    phone: history.phone,
    message: '',
    admin_notes: '',
    patient_name: history.name,
    patient: {
      id: history.id,
      name: history.name,
      phone: history.phone,
      email: history.email,
    },
    service_name: history.service_name,
    service: {
      id: 0,
      name: history.service_name,
      description: '',
      created_at: history.timestamp,
    },
    doctor: null,
    start_time: `${history.appointment_date}T${history.appointment_time}`,
    end_time: `${history.appointment_date}T${history.appointment_time}`,
    service_duration: 30,
    status: history.visited === 'visited' ? 'COMPLETED' : 'CANCELLED',
    created_at: history.timestamp,
    updated_at: history.timestamp,
  };
}

// Helper function to get appointment color based on status
function getAppointmentColor(status: string) {
  // Map all statuses to either visited (green) or unvisited (red)
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'visited':
      return 'bg-green-100 border-green-300 hover:bg-green-200';
    case 'cancelled':
    case 'rejected':
    case 'pending':
    case 'approved':
    case 'scheduled':
    case 'unvisited':
    default:
      return 'bg-red-100 border-red-300 hover:bg-red-200';
  }
}

// Helper function to get text color based on status
function getAppointmentTextColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'visited':
      return 'text-green-900';
    case 'cancelled':
    case 'rejected':
    case 'pending':
    case 'approved':
    case 'scheduled':
    case 'unvisited':
    default:
      return 'text-red-900';
  }
}

// Helper function to map backend status to UI label
function getStatusLabel(status: string): 'Visited' | 'Unvisited' {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'Visited';
    case 'approved':
    case 'scheduled':
    case 'cancelled':
    case 'rejected':
    case 'pending':
    default:
      return 'Unvisited';
  }
}

// Helper function to get status icon and color for UI
function getStatusIconAndColor(status: string) {
  const label = getStatusLabel(status);
  if (label === 'Visited') {
    return {
      icon: CheckCircle,
      color: 'text-green-500',
      labelColor: 'text-green-700'
    };
  } else {
    return {
      icon: XCircle,
      color: 'text-orange-500',
      labelColor: 'text-orange-700'
    };
  }
}

// Tooltip component for appointment details
function AppointmentTooltip({ appointment, visible }: { appointment: CalendarAppointment; visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[200px] top-full left-0 mt-1">
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-gray-500" />
          <span className="font-medium text-gray-900">{appointment.patient_name}</span>
        </div>
        
        {appointment.patient?.phone && (
          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">{appointment.patient.phone}</span>
          </div>
        )}
        
        <div className="text-sm text-gray-600">
          <div className="font-medium">{appointment.service_name}</div>
          <div>{appointment.doctor?.name}</div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {format(parseISO(appointment.start_time), 'HH:mm')} - {format(parseISO(appointment.end_time), 'HH:mm')}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {(() => {
            const { icon: StatusIcon, color, labelColor } = getStatusIconAndColor(appointment.status);
            return (
              <>
                <StatusIcon className={`h-4 w-4 ${color}`} />
                <span className={`text-sm ${labelColor}`}>{getStatusLabel(appointment.status)}</span>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

export function EnhancedCalendarView({
  selectedDate,
  selectedDoctor,
  appointments,
  history,
  loading = false,
  onDateChange,
  onDoctorChange,
  onSlotClick,
  onCapacityExceeded,
  className,
  compact = false,
  view = 'day',
}: EnhancedCalendarViewProps) {
  const dateSelectorRef = useRef<HTMLDivElement>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [hoveredSlot, setHoveredSlot] = useState<{ date: string; time: string } | null>(null);
  const [hoveredAppointment, setHoveredAppointment] = useState<number | null>(null);
  const [showCapacityModal, setShowCapacityModal] = useState(false);

  // Generate date range for horizontal selector (14 days centered around selected date)
  const dateRange = useMemo(() => {
    const days = [];
    const center = Math.floor(14 / 2);
    for (let i = -center; i <= center; i++) {
      days.push(addDays(selectedDate, i));
    }
    return days;
  }, [selectedDate]);

  // Combine appointments and history data - filter out rejected appointments
  const combinedAppointments = useMemo(() => {
    const historyAsAppointments = history.map(convertHistoryToCalendarAppointment);
    const allAppointments = [...appointments, ...historyAsAppointments];
    
    // Filter out rejected appointments globally
    return allAppointments.filter(apt => {
      const status = apt.status?.toUpperCase();
      return status !== 'REJECTED';
    });
  }, [appointments, history]);

  // Group appointments by hour and calculate positions (max 3 per hour) - Horizontal Alignment
  const positionedAppointmentsBySlot = useMemo(() => {
    const map = new Map<string, Array<{
      appointment: CalendarAppointment;
      position: number;
      totalInSlot: number;
    }>>();

    // Group appointments by date and hour
    const appointmentsByHour = new Map<string, CalendarAppointment[]>();
    
    combinedAppointments.forEach(appointment => {
      try {
        const startTime = parseISO(appointment.start_time);
        const dateStr = format(startTime, 'yyyy-MM-dd');
        const hour = getHours(startTime);
        const key = `${dateStr}-${hour}`;
        
        if (!appointmentsByHour.has(key)) {
          appointmentsByHour.set(key, []);
        }
        appointmentsByHour.get(key)!.push(appointment);
      } catch (error) {
        console.warn('Invalid appointment time:', appointment.start_time);
      }
    });

    // Position appointments (max 3 per hour)
    appointmentsByHour.forEach((hourAppointments, key) => {
      const positioned = hourAppointments.slice(0, 3).map((apt, index) => ({
        appointment: apt,
        position: index,
        totalInSlot: Math.min(hourAppointments.length, 3),
      }));
      map.set(key, positioned);
    });

    return map;
  }, [combinedAppointments]);

  // Check if a slot has reached capacity
  const isSlotAtCapacity = useCallback((dateStr: string, hour: number): boolean => {
    const key = `${dateStr}-${hour}`;
    const appointments = positionedAppointmentsBySlot.get(key) || [];
    return appointments.length >= 3;
  }, [positionedAppointmentsBySlot]);

  // Scroll selected date into view when it changes
  useEffect(() => {
    if (dateSelectorRef.current) {
      const selectedElement = dateSelectorRef.current.querySelector(
        `[data-date="${format(selectedDate, 'yyyy-MM-dd')}"]`
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [selectedDate]);

  // Navigation handlers
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(date);
      setDatePickerOpen(false);
    }
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const goToPrevious = () => {
    onDateChange(subDays(selectedDate, 1));
  };

  const goToNext = () => {
    onDateChange(addDays(selectedDate, 1));
  };

  const handleSlotClick = (dateStr: string, time: string) => {
    const hour = parseInt(time.split(':')[0]);
    if (isSlotAtCapacity(dateStr, hour)) {
      setShowCapacityModal(true);
      onCapacityExceeded?.();
      return;
    }

    if (onSlotClick) {
      onSlotClick(dateStr, time);
    }
  };

  const handleSlotHover = (dateStr: string, time: string | null) => {
    setHoveredSlot(time ? { date: dateStr, time } : null);
  };

  return (
    <div className={cn('flex flex-col h-full bg-white', className)}>
      {/* Header with Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-gray-200 px-6 py-4"
      >
        <div className="flex items-center justify-between mb-4">
          {/* Navigation Controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="rounded-full"
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPrevious}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNext}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Date Picker */}
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[200px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <div className="p-2">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                  className="rounded-md border"
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Doctor Info */}
        {selectedDoctor && (
          <div className="text-sm text-gray-600">
            <p className="font-medium">Doctor: Dr. {selectedDoctor.name}</p>
          </div>
        )}
      </motion.div>

      {/* Calendar Content */}
      {!loading && selectedDoctor ? (
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Horizontal Date Selector */}
          <div
            ref={dateSelectorRef}
            className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto"
          >
            {/* Time column spacer */}
            <div className="w-20 flex-shrink-0 border-r border-gray-200" />

            {/* Date selector */}
            <div className="flex min-w-max">
              {dateRange.map((day) => {
                const dayIsToday = isToday(day);
                const dayIsSelected = isSameDay(day, selectedDate);

                return (
                  <div
                    key={format(day, 'yyyy-MM-dd')}
                    data-date={format(day, 'yyyy-MM-dd')}
                    className={cn(
                      'flex flex-col items-center justify-center py-3 border-r border-gray-200 last:border-r-0 cursor-pointer transition-colors min-w-[100px] hover:bg-gray-100',
                      dayIsSelected && 'bg-blue-50'
                    )}
                    onClick={() => onDateChange(day)}
                  >
                    <div className="text-xs text-gray-600 font-medium uppercase">
                      {format(day, 'EEE')}
                    </div>
                    <div
                      className={cn(
                        'flex items-center justify-center w-8 h-8 rounded-full mt-1 text-sm font-medium',
                        dayIsToday && !dayIsSelected && 'bg-blue-500 text-white',
                        dayIsSelected && 'bg-blue-600 text-white',
                        !dayIsToday && !dayIsSelected && 'text-gray-900'
                      )}
                    >
                      {format(day, 'd')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time Slots Grid */}
          <div className="flex-1 overflow-auto">
            <div className="flex">
              {/* Time Column */}
              <div className="w-20 flex-shrink-0 border-r border-gray-200 bg-gray-50">
                {TIME_SLOTS.map((slot) => (
                  <div
                    key={slot.hour}
                    id={`slot-${slot.hour}`}
                    className="border-b border-gray-100 px-2 py-3 text-right flex items-start justify-end font-medium text-xs text-gray-600"
                    style={{ height: `${HOUR_HEIGHT}px` }}
                  >
                    {slot.label}
                  </div>
                ))}
              </div>

              {/* Appointments Grid */}
              <div className="flex-1 overflow-x-auto">
                <div className="flex min-w-max">
                  {dateRange.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');

                    return (
                      <div
                        key={dateStr}
                        className="relative border-r border-gray-200 last:border-r-0 min-w-[100px]"
                      >
                        {/* Time Slot Rows */}
                        {TIME_SLOTS.map((slot) => {
                          const slotKey = `${dateStr}-${slot.hour}`;
                          const slotAppointments = positionedAppointmentsBySlot.get(slotKey) || [];
                          const slotAtCapacity = isSlotAtCapacity(dateStr, slot.hour);
                          
                          return (
                            <div
                              key={slotKey}
                              className={cn(
                                'border-b border-gray-100 relative cursor-pointer transition-colors',
                                'hover:bg-blue-50',
                                slotAtCapacity && 'bg-gray-50 cursor-not-allowed'
                              )}
                              style={{ height: `${HOUR_HEIGHT}px` }}
                              onClick={() => !slotAtCapacity && handleSlotClick(dateStr, slot.time24)}
                              onMouseEnter={() => handleSlotHover(dateStr, slot.time24)}
                              onMouseLeave={() => handleSlotHover(dateStr, null)}
                            >
                              {/* Appointment Blocks - Horizontal Alignment */}
                              {slotAppointments.length > 0 && (
                                <div className="absolute inset-1 pointer-events-none flex gap-0.5">
                                  {slotAppointments.map(({ appointment, position, totalInSlot }) => {
                                    const colorClass = getAppointmentColor(appointment.status);
                                    const textColorClass = getAppointmentTextColor(appointment.status);
                                    const isHovered = hoveredAppointment === appointment.id;
                                    
                                    // Calculate width: 1/3 for each when 2-3 appointments, full width for 1
                                    const appointmentWidth = totalInSlot === 1 ? '100%' : 'calc(33.33% - 2px)';
                                    
                                    return (
                                      <div
                                        key={appointment.id}
                                        className="relative flex-shrink-0"
                                        style={{ width: appointmentWidth }}
                                      >
                                        <div
                                          className={cn(
                                            'border rounded text-xs p-1.5 transition-all cursor-pointer',
                                            'hover:z-10 hover:shadow-md',
                                            'shadow-sm h-full overflow-hidden flex flex-col',
                                            colorClass,
                                            textColorClass
                                          )}
                                          onMouseEnter={() => setHoveredAppointment(appointment.id)}
                                          onMouseLeave={() => setHoveredAppointment(null)}
                                        >
                                          <div className="font-medium truncate text-[11px]">
                                            {appointment.patient_name}
                                          </div>
                                          <div className="truncate text-[10px] opacity-80">
                                            {format(parseISO(appointment.start_time), 'HH:mm')}
                                          </div>
                                        </div>
                                        {isHovered && (
                                          <AppointmentTooltip
                                            appointment={appointment}
                                            visible={isHovered}
                                          />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Hover indicator for available slots */}
                              {hoveredSlot?.date === dateStr &&
                                hoveredSlot?.time === slot.time24 &&
                                !slotAtCapacity && (
                                <div className="absolute inset-0 bg-blue-100 opacity-30 pointer-events-none"></div>
                              )}

                              {/* Capacity indicator */}
                              {slotAtCapacity && (
                                <div className="absolute top-1 right-1 text-[10px] text-red-600 font-bold">
                                  ⚠️ Full
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          {loading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          ) : (
            <div className="text-center">
              <p className="text-gray-500">
                {selectedDoctor ? 'Loading doctor schedule...' : 'Please select a doctor to view appointments'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Capacity Modal */}
      {showCapacityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Maximum Capacity Reached
            </h3>
            <p className="text-gray-600 mb-6">
              You cannot add more than 3 appointments in this hour.
            </p>
            <button
              onClick={() => setShowCapacityModal(false)}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
