'use client';

import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { CalendarAppointment } from '@/lib/api/calendar';
import { cn } from '@/lib/utils';

interface AppointmentTooltipProps {
  appointment: CalendarAppointment;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  REJECTED: 'bg-red-100 text-red-800',
};

export function AppointmentTooltip({ appointment }: AppointmentTooltipProps) {
  const startTime = parseISO(appointment.start_time);
  const endTime = parseISO(appointment.end_time);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute z-50 w-72 p-4 mt-2 text-sm bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-10 left-0 top-full"
    >
      <div className="space-y-3">
        {/* Patient Name */}
        <div>
          <div className="font-semibold text-gray-900">{appointment.patient_name}</div>
        </div>

        {/* Service */}
        <div>
          <div className="text-xs font-medium text-gray-500 uppercase">Service</div>
          <div className="text-gray-900">{appointment.service_name}</div>
        </div>

        {/* Date & Time */}
        <div>
          <div className="text-xs font-medium text-gray-500 uppercase">Date & Time</div>
          <div className="text-gray-900">
            {format(startTime, 'EEEE, MMMM d, yyyy')}
            <br />
            {format(startTime, 'h:mma')} - {format(endTime, 'h:mma')}
          </div>
        </div>

        {/* Contact Info */}
        {appointment.patient && (
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase">Contact</div>
            <div className="text-gray-900">
              {appointment.patient.phone && (
                <div>Phone: {appointment.patient.phone}</div>
              )}
              {appointment.patient.email && (
                <div>Email: {appointment.patient.email}</div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {appointment.message && (
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase">Notes</div>
            <div className="text-gray-700 whitespace-pre-wrap break-words">
              {appointment.message}
            </div>
          </div>
        )}

        {/* Status & Created */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
              statusColors[appointment.status] || statusColors.PENDING
            )}
          >
            {appointment.status.charAt(0) + appointment.status.slice(1).toLowerCase()}
          </span>
          <div className="text-xs text-gray-500">
            {format(parseISO(appointment.created_at), 'MMM d, yyyy')}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
