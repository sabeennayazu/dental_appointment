'use client';

import { useMemo } from 'react';
import { format, parseISO, getHours, getMinutes, isSameDay } from 'date-fns';
import { CalendarAppointment } from '@/lib/api/calendar';
import { AppointmentBlock } from './AppointmentBlock';
import { cn } from '@/lib/utils';

interface TimeSlotGridProps {
  weekDays: Date[];
  appointments: CalendarAppointment[];
  selectedDate: Date;
  compact?: boolean;
  selectedSlot?: { date: string; time: string };
  onSlotClick?: (date: string, time: string) => void;
}

// Enhanced timezone-aware date utilities
const getLocalDateString = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

const getLocalTimeString = (date: Date): string => {
  return format(date, 'HH:mm');
};

const parseLocalDateTime = (dateStr: string, timeStr: string): Date => {
  // Parse in local timezone to avoid timezone mismatches
  const dateTimeStr = `${dateStr}T${timeStr}`;
  return new Date(dateTimeStr);
};

// Generate time slots from 8 AM to 8 PM with timezone awareness
const TIME_SLOTS = Array.from({ length: 13 }, (_, i) => {
  const hour = i + 8;
  return {
    hour,
    label: `${hour > 12 ? hour - 12 : hour === 0 ? 12 : hour}${hour >= 12 ? 'PM' : 'AM'}`,
    time24: `${hour.toString().padStart(2, '0')}:00`,
  };
});

export function TimeSlotGrid({
  weekDays,
  appointments,
  selectedDate,
  compact = false,
  selectedSlot,
  onSlotClick,
}: TimeSlotGridProps) {
  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, CalendarAppointment[]> = {};

    weekDays.forEach((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      grouped[dateStr] = [];
    });

    appointments.forEach((apt) => {
      const dateStr = format(parseISO(apt.start_time), 'yyyy-MM-dd');
      if (grouped[dateStr]) {
        grouped[dateStr].push(apt);
      }
    });

    return grouped;
  }, [weekDays, appointments]);

  const slotHeight = compact ? 'h-12' : 'h-16';
  const textSize = compact ? 'text-xs' : 'text-sm';

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Day headers */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <div className="w-20 flex-shrink-0 border-r border-gray-200 px-2 py-3">
          <div className={cn('text-gray-600 font-medium', textSize)}>
            {format(selectedDate, 'z')}
          </div>
        </div>
        <div className="flex-1 grid grid-cols-7">
          {weekDays.map((day) => {
            const isToday = isSameDay(day, new Date());
            // CRITICAL: Column highlighting based on selectedDate, not week calculation
            // The selected column is the one where day.getDate() === selectedDate.getDate()
            const isSelected = selectedDate.getDate() === day.getDate() &&
                              selectedDate.getMonth() === day.getMonth() &&
                              selectedDate.getFullYear() === day.getFullYear();

            return (
              <div
                key={day.toString()}
                className={cn(
                  'flex flex-col items-center justify-center py-3 border-r border-gray-200 last:border-r-0',
                  isSelected && 'bg-blue-50'
                )}
              >
                <div className={cn('text-gray-600 font-medium uppercase', textSize)}>
                  {format(day, 'EEE')}
                </div>
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full mt-1 font-medium',
                    isToday && !isSelected && 'bg-blue-500 text-white',
                    isSelected && 'bg-blue-600 text-white',
                    !isToday && !isSelected && 'text-gray-900'
                  )}
                >
                  {format(day, 'd')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Time slots grid */}
      <div className="flex-1 overflow-auto">
        <div className="flex">
          {/* Time column */}
          <div className="w-20 flex-shrink-0 border-r border-gray-200">
            {TIME_SLOTS.map((slot) => (
              <div
                key={slot.hour}
                className={cn(
                  'border-b border-gray-100 px-2 py-1 text-right',
                  slotHeight
                )}
              >
                <div className={cn('text-gray-600 font-medium', textSize)}>
                  {slot.label}
                </div>
              </div>
            ))}
          </div>

          {/* Appointments grid */}
          <div className="flex-1 grid grid-cols-7">
            {weekDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayAppointments = appointmentsByDate[dateStr] || [];

              return (
                <div
                  key={dateStr}
                  className="relative border-r border-gray-200 last:border-r-0"
                >
                  {/* Time slot rows */}
                  {TIME_SLOTS.map((slot) => {
                    const slotTime = `${slot.hour.toString().padStart(2, '0')}:00`;

                    // CRITICAL: Grid cell selection logic
                    // A cell is selected if:
                    // 1. The column date matches selectedDate (day/month/year)
                    // 2. The row time matches selectedTime hour
                    const columnMatches = selectedDate.getDate() === day.getDate() &&
                                        selectedDate.getMonth() === day.getMonth() &&
                                        selectedDate.getFullYear() === day.getFullYear();

                    const rowMatches = selectedSlot?.time.startsWith(`${slot.hour}:`);

                    const isSelectedSlot = selectedSlot && columnMatches && rowMatches;

                    // Enhanced timezone-aware appointment filtering
                    const slotAppointments = dayAppointments.filter(apt => {
                      try {
                        const aptTime = parseISO(apt.start_time);
                        // Convert to local timezone for comparison
                        const localHour = aptTime.getHours();
                        return localHour === slot.hour;
                      } catch (error) {
                        console.warn('Invalid appointment time:', apt.start_time);
                        return false;
                      }
                    });

                    const hasAppointments = slotAppointments.length > 0;

                    return (
                      <div
                        key={`${dateStr}-${slot.hour}`}
                        className={cn(
                          'border-b border-gray-100 relative cursor-pointer hover:bg-blue-50 transition-colors',
                          slotHeight,
                          isSelectedSlot && 'bg-blue-100 ring-2 ring-blue-500',
                          hasAppointments && !isSelectedSlot && 'bg-gray-50'
                        )}
                        onClick={() => {
                          if (onSlotClick) {
                            onSlotClick(dateStr, slotTime);
                          }
                        }}
                      >
                        {/* Selected slot indicator */}
                        {isSelectedSlot && (
                          <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}

                        {/* Enhanced appointment stacking with proper layout */}
                        {slotAppointments.length > 0 && (
                          <div className="absolute inset-1 space-y-0.5 pointer-events-none">
                            {slotAppointments.slice(0, 3).map((apt, index) => (
                              <div
                                key={apt.id}
                                className={cn(
                                  'bg-blue-100 border border-blue-300 rounded text-xs p-1 truncate transition-all hover:bg-blue-200 hover:z-10',
                                  'shadow-sm hover:shadow-md'
                                )}
                                style={{
                                  maxHeight: `${slotAppointments.length > 1 ? '30%' : '100%'}`,
                                  overflow: 'hidden'
                                }}
                              >
                                <div className="font-medium text-blue-900 truncate">
                                  {apt.patient_name}
                                </div>
                                <div className="text-blue-700 truncate text-xs">
                                  {apt.service_name}
                                </div>
                                {apt.status && (
                                  <div className="text-blue-600 truncate text-xs capitalize">
                                    {apt.status.toLowerCase()}
                                  </div>
                                )}
                              </div>
                            ))}
                            {slotAppointments.length > 3 && (
                              <div className="bg-gray-100 border border-gray-300 rounded text-xs p-1 text-center text-gray-600">
                                +{slotAppointments.length - 3} more
                              </div>
                            )}
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
  );
}

// New Day View Time Grid Component
interface DayTimeGridProps {
  selectedDate: Date;
  appointments: CalendarAppointment[];
  selectedTime?: string;
  onTimeClick?: (time: string) => void;
  slotDuration?: 30 | 60; // minutes
}

const TIME_SLOTS_DAY = Array.from({ length: 24 }, (_, i) => {
  const hour = i;
  return {
    hour,
    label: `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour === 0 ? 12 : hour}${hour >= 12 ? 'PM' : 'AM'}`,
    time24: `${hour.toString().padStart(2, '0')}:00`,
  };
}).filter(slot => slot.hour >= 8 && slot.hour <= 18); // 8 AM to 6 PM

export function DayTimeGrid({
  selectedDate,
  appointments,
  selectedTime,
  onTimeClick,
  slotDuration = 60,
}: DayTimeGridProps) {
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // Get appointments for this date
  const dayAppointments = appointments.filter(apt => {
    const aptDate = format(parseISO(apt.start_time), 'yyyy-MM-dd');
    return aptDate === dateStr;
  });

  // Generate slots based on duration
  const slots = useMemo(() => {
    const result = [];
    for (let hour = 8; hour <= 18; hour++) {
      if (slotDuration === 60) {
        result.push({
          time: `${hour.toString().padStart(2, '0')}:00`,
          label: `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour === 0 ? 12 : hour}${hour >= 12 ? 'PM' : 'AM'}`,
          hour,
        });
      } else {
        // 30-minute slots
        result.push({
          time: `${hour.toString().padStart(2, '0')}:00`,
          label: `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour === 0 ? 12 : hour}${hour >= 12 ? 'PM' : 'AM'}`,
          hour,
        });
        result.push({
          time: `${hour.toString().padStart(2, '0')}:30`,
          label: '',
          hour: hour + 0.5,
        });
      }
    }
    return result;
  }, [slotDuration]);

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="min-h-full">
        {slots.map((slot, index) => {
          const isSelected = selectedTime === slot.time;

          // Check if this slot has an appointment
          const appointment = dayAppointments.find(apt => {
            const aptTime = new Date(apt.start_time);
            const aptTimeStr = `${aptTime.getHours().toString().padStart(2, '0')}:${aptTime.getMinutes().toString().padStart(2, '0')}`;
            return aptTimeStr === slot.time;
          });

          const slotHeight = slotDuration === 60 ? 'h-16' : 'h-8';

          return (
            <div
              key={`${dateStr}-${slot.time}`}
              className={cn(
                'flex border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors',
                slotHeight,
                isSelected && 'bg-blue-50 ring-2 ring-blue-500 ring-inset',
                appointment && 'bg-gray-100 cursor-not-allowed'
              )}
              onClick={() => {
                if (!appointment && onTimeClick) {
                  onTimeClick(slot.time);
                }
              }}
            >
              {/* Time label */}
              <div className="w-20 flex-shrink-0 border-r border-gray-200 px-3 py-1 text-right text-sm text-gray-600 font-medium flex items-center justify-end">
                {slot.label}
              </div>

              {/* Time slot content */}
              <div className="flex-1 relative">
                {appointment ? (
                  <div className="absolute inset-1 bg-blue-100 border border-blue-300 rounded p-2 group hover:bg-blue-200 transition-colors">
                    <div className="text-xs font-medium text-blue-900 truncate">
                      {appointment.patient_name}
                    </div>
                    <div className="text-xs text-blue-700 truncate">
                      {appointment.service_name}
                    </div>
                    <div className="absolute bottom-1 right-1 text-xs text-blue-600 capitalize">
                      {appointment.status.toLowerCase()}
                    </div>

                    {/* Hover tooltip */}
                    <div className="absolute left-full top-0 ml-2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                      {appointment.patient_name} - {appointment.service_name}
                      <br />
                      Status: {appointment.status}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-xs">
                    {isSelected && '✓'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
