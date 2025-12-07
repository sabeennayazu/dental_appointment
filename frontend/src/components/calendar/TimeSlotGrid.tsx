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
}

// Generate time slots from 8 AM to 8 PM
const TIME_SLOTS = Array.from({ length: 13 }, (_, i) => {
  const hour = i + 8;
  return {
    hour,
    label: `${hour > 12 ? hour - 12 : hour === 0 ? 12 : hour}${hour >= 12 ? 'PM' : 'AM'}`,
  };
});

export function TimeSlotGrid({
  weekDays,
  appointments,
  selectedDate,
  compact = false,
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
            const isSelected = isSameDay(day, selectedDate);

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
                  {TIME_SLOTS.map((slot) => (
                    <div
                      key={`${dateStr}-${slot.hour}`}
                      className={cn(
                        'border-b border-gray-100 relative',
                        slotHeight
                      )}
                    />
                  ))}

                  {/* Appointments positioned absolutely */}
                  <div className="absolute inset-0">
                    {dayAppointments.map((apt) => (
                      <AppointmentBlock
                        key={apt.id}
                        appointment={apt}
                        slotHeight={parseInt(slotHeight.match(/\d+/)?.[0] || '16')}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
