/**
 * Shared Calendar Logic and Synchronization Utilities
 * Provides common functionality for both admin and appointment calendars
 */

import { format, parseISO, startOfWeek, endOfWeek, addDays, isSameDay, addWeeks, subWeeks, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { CalendarAppointment } from '@/lib/api/calendar';
import { Doctor, Appointment } from '@/lib/types';

// Enhanced time slot configuration
export const TIME_SLOT_CONFIG = {
  START_HOUR: 6, // 6 AM
  END_HOUR: 22,  // 10 PM
  SLOT_DURATION: 60, // minutes
  MAX_APPOINTMENTS_PER_SLOT: 3
} as const;

// Generate time slots for calendar grid
export function generateTimeSlots() {
  const slots = [];
  for (let hour = TIME_SLOT_CONFIG.START_HOUR; hour <= TIME_SLOT_CONFIG.END_HOUR; hour++) {
    let displayHour: number;
    if (hour < 12) {
      displayHour = hour;
    } else {
      displayHour = hour - 12;
      if (displayHour === 0) displayHour = 12; // Handle 12 PM case
    }
    const period = hour >= 12 ? 'PM' : 'AM';
    slots.push({
      hour,
      label: `${displayHour}${period}`,
      time24: `${hour.toString().padStart(2, '0')}:00`,
    });
  }
  return slots;
}

// Calculate date range based on view
export function calculateDateRange(date: Date, view: 'day' | 'week') {
  if (view === 'day') {
    return {
      start: date,
      end: date,
      days: [date]
    };
  } else {
    const weekStart = startOfWeek(date, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(date, { weekStartsOn: 0 });
    const days = [];
    let current = weekStart;
    while (current <= weekEnd) {
      days.push(current);
      current = addDays(current, 1);
    }
    return {
      start: weekStart,
      end: weekEnd,
      days
    };
  }
}

// Enhanced appointment positioning with collision detection
export interface PositionedAppointment {
  appointment: CalendarAppointment;
  position: number; // 0, 1, or 2 (max 3 per hour)
  totalInSlot: number;
  date: string;
  hour: number;
}

export function positionAppointments(appointments: CalendarAppointment[], dateRange: { days: Date[] }) {
  const positioned: Map<string, PositionedAppointment[]> = new Map();

  dateRange.days.forEach(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayAppointments = appointments.filter(apt => {
      const aptDate = format(parseISO(apt.start_time), 'yyyy-MM-dd');
      return aptDate === dateStr;
    });

    // Group appointments by hour
    const appointmentsByHour: Map<number, CalendarAppointment[]> = new Map();
    
    dayAppointments.forEach(apt => {
      const aptTime = parseISO(apt.start_time);
      const hour = aptTime.getHours();
      if (!appointmentsByHour.has(hour)) {
        appointmentsByHour.set(hour, []);
      }
      appointmentsByHour.get(hour)!.push(apt);
    });

    // Position appointments (max 3 per hour)
    appointmentsByHour.forEach((hourlyApps, hour) => {
      const positionedHourly: PositionedAppointment[] = [];
      hourlyApps.slice(0, TIME_SLOT_CONFIG.MAX_APPOINTMENTS_PER_SLOT).forEach((apt, index) => {
        positionedHourly.push({
          appointment: apt,
          position: index,
          totalInSlot: Math.min(hourlyApps.length, TIME_SLOT_CONFIG.MAX_APPOINTMENTS_PER_SLOT),
          date: dateStr,
          hour
        });
      });
      const key = `${dateStr}-${hour}`;
      positioned.set(key, positionedHourly);
    });
  });

  return positioned;
}

// Check if a time slot is at capacity
export function isSlotAtCapacity(positionedAppointments: Map<string, PositionedAppointment[]>, date: string, hour: number): boolean {
  const key = `${date}-${hour}`;
  const slotApps = positionedAppointments.get(key) || [];
  return slotApps.length >= TIME_SLOT_CONFIG.MAX_APPOINTMENTS_PER_SLOT;
}

// Get month/year display text
export function getMonthYearDisplay(date: Date, view: 'day' | 'week', dateRange: { start: Date; end: Date }) {
  if (view === 'week') {
    const monthStart = startOfMonth(dateRange.start);
    const monthEnd = endOfMonth(dateRange.end);
    if (monthStart.getMonth() === monthEnd.getMonth()) {
      return format(dateRange.start, 'MMMM yyyy');
    } else {
      return `${format(dateRange.start, 'MMM')} - ${format(dateRange.end, 'MMM yyyy')}`;
    }
  } else {
    return format(date, 'EEEE, MMMM d, yyyy');
  }
}

// Navigation utilities
export function navigateDate(currentDate: Date, direction: 'previous' | 'next' | 'today', view: 'day' | 'week') {
  switch (direction) {
    case 'today':
      return new Date();
    case 'previous':
      return view === 'week' ? subWeeks(currentDate, 1) : subDays(currentDate, 1);
    case 'next':
      return view === 'week' ? addWeeks(currentDate, 1) : addDays(currentDate, 1);
    default:
      return currentDate;
  }
}

// URL parameter management
export function buildCalendarParams(state: {
  doctorId?: number;
  date: Date;
  view: 'day' | 'week';
}) {
  const params = new URLSearchParams();
  if (state.doctorId) {
    params.set('doctor', state.doctorId.toString());
  }
  params.set('date', format(state.date, 'yyyy-MM-dd'));
  params.set('view', state.view);
  return params;
}

// Parse URL parameters
export function parseCalendarParams(searchParams: URLSearchParams) {
  return {
    doctorId: searchParams.get('doctor') ? parseInt(searchParams.get('doctor') as string) : undefined,
    date: searchParams.get('date') || undefined,
    view: (searchParams.get('view') === 'day' ? 'day' : 'week') as 'day' | 'week',
    source: searchParams.get('source') || undefined
  };
}

// Appointment creation navigation
export function buildAppointmentCreationParams(selectedSlot: { date: string; time: string }, doctorId?: number) {
  const params = new URLSearchParams({
    date: selectedSlot.date,
    time: selectedSlot.time,
    source: 'calendar'
  });
  
  if (doctorId) {
    params.set('doctor', doctorId.toString());
  }
  
  return params;
}

// Calendar state synchronization
export interface CalendarState {
  selectedDoctor: Doctor | null;
  selectedDate: Date;
  view: 'day' | 'week';
  selectedSlot: { date: string; time: string } | null;
  appointments: CalendarAppointment[];
  loading: boolean;
}

export interface CalendarActions {
  setDoctor: (doctor: Doctor | null) => void;
  setDate: (date: Date) => void;
  setView: (view: 'day' | 'week') => void;
  setSelectedSlot: (slot: { date: string; time: string } | null) => void;
  setAppointments: (appointments: CalendarAppointment[]) => void;
  setLoading: (loading: boolean) => void;
  navigateTo: (direction: 'previous' | 'next' | 'today') => void;
  selectSlot: (date: string, time: string) => void;
}

// Enhanced slot validation
export function validateSlotSelection(
  positionedAppointments: Map<string, PositionedAppointment[]>,
  date: string,
  time: string
): { isValid: boolean; reason?: string } {
  const hour = parseInt(time.split(':')[0]);
  
  // Check if hour is within business hours
  if (hour < TIME_SLOT_CONFIG.START_HOUR || hour > TIME_SLOT_CONFIG.END_HOUR) {
    return { isValid: false, reason: 'Time slot is outside business hours' };
  }
  
  // Check if slot is at capacity
  if (isSlotAtCapacity(positionedAppointments, date, hour)) {
    return { isValid: false, reason: 'Time slot is at maximum capacity' };
  }
  
  return { isValid: true };
}

// Real-time synchronization utilities
export interface CalendarSyncEvent {
  type: 'appointment_created' | 'appointment_updated' | 'appointment_deleted' | 'slot_selected';
  data: any;
  timestamp: number;
}

export class CalendarSyncManager {
  private subscribers: Set<(event: CalendarSyncEvent) => void> = new Set();
  
  subscribe(callback: (event: CalendarSyncEvent) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
  
  emit(event: CalendarSyncEvent) {
    this.subscribers.forEach(callback => callback(event));
  }
  
  // Emit events for appointment changes
  emitAppointmentCreated(appointment: CalendarAppointment | Appointment) {
    this.emit({
      type: 'appointment_created',
      data: appointment,
      timestamp: Date.now()
    });
  }
  
  emitAppointmentUpdated(appointment: CalendarAppointment | Appointment) {
    this.emit({
      type: 'appointment_updated',
      data: appointment,
      timestamp: Date.now()
    });
  }
  
  emitAppointmentDeleted(appointmentId: number) {
    this.emit({
      type: 'appointment_deleted',
      data: { id: appointmentId },
      timestamp: Date.now()
    });
  }
  
  emitSlotSelected(slot: { date: string; time: string }) {
    this.emit({
      type: 'slot_selected',
      data: slot,
      timestamp: Date.now()
    });
  }
}

// Global sync manager instance
export const calendarSyncManager = new CalendarSyncManager();
