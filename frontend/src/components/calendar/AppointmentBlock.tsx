'use client';

import { useState } from 'react';
import { format, parseISO, getHours, getMinutes, differenceInMinutes } from 'date-fns';
import { CalendarAppointment } from '@/lib/api/calendar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { AppointmentTooltip } from './AppointmentTooltip';

interface AppointmentBlockProps {
  appointment: CalendarAppointment;
  slotHeight: number;
}

const statusColors: Record<string, { bg: string; border: string; text: string }> = {
  PENDING: { bg: 'bg-amber-50', border: 'border-l-4 border-amber-500', text: 'text-amber-900' },
  APPROVED: { bg: 'bg-blue-50', border: 'border-l-4 border-blue-500', text: 'text-blue-900' },
  CONFIRMED: { bg: 'bg-blue-50', border: 'border-l-4 border-blue-500', text: 'text-blue-900' },
  COMPLETED: { bg: 'bg-green-50', border: 'border-l-4 border-green-500', text: 'text-green-900' },
  CANCELLED: { bg: 'bg-gray-100', border: 'border-l-4 border-gray-400', text: 'text-gray-600' },
  REJECTED: { bg: 'bg-red-50', border: 'border-l-4 border-red-500', text: 'text-red-900' },
};

export function AppointmentBlock({ appointment, slotHeight }: AppointmentBlockProps) {
  const [isHovered, setIsHovered] = useState(false);

  const startTime = parseISO(appointment.start_time);
  const endTime = parseISO(appointment.end_time);

  // Calculate position and height
  const startHour = getHours(startTime);
  const startMinute = getMinutes(startTime);
  const durationMinutes = differenceInMinutes(endTime, startTime);

  // Position from 8 AM (hour 8)
  const topOffset = (startHour - 8) * slotHeight + (startMinute / 60) * slotHeight;
  const heightValue = (durationMinutes / 60) * slotHeight;

  const colors = statusColors[appointment.status] || statusColors.PENDING;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute left-0 right-0 mx-1"
      style={{
        top: `${topOffset}px`,
        height: `${heightValue}px`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        className={cn(
          'h-full p-2 rounded-md shadow-sm cursor-pointer overflow-hidden',
          'text-xs font-medium transition-all duration-200',
          colors.bg,
          colors.border,
          colors.text,
          isHovered && 'shadow-md ring-1 ring-blue-300'
        )}
      >
        <div className="truncate font-semibold">{appointment.patient_name}</div>
        <div className="truncate text-opacity-75">{appointment.service_name}</div>
        <div className="text-opacity-75 mt-0.5">
          {format(startTime, 'h:mma')} - {format(endTime, 'h:mma')}
        </div>
      </motion.div>

      <AnimatePresence>
        {isHovered && <AppointmentTooltip appointment={appointment} />}
      </AnimatePresence>
    </motion.div>
  );
}
