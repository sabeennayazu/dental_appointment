'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  format,
  isToday,
  isSameDay,
  parseISO,
} from 'date-fns';
import { Doctor, Service, AppointmentHistory } from '@/lib/types';
import { CalendarAppointment, getAppointments, getDoctors } from '@/lib/api/calendar';
import { getHistory } from '@/lib/api/history';
import { ServiceDoctorSelector } from './ServiceDoctorSelector';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, User, Phone, CheckCircle, XCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  generateTimeSlots,
  calculateDateRange,
  positionAppointments,
  isSlotAtCapacity,
  getMonthYearDisplay,
  navigateDate,
  buildCalendarParams,
  validateSlotSelection,
  calendarSyncManager,
  CalendarSyncEvent
} from '@/lib/calendar-sync';

// Use shared time slots from calendar-sync
const TIME_SLOTS = generateTimeSlots();

// Enhanced appointment positioning logic
interface PositionedAppointment {
  appointment: CalendarAppointment;
  position: number; // 0, 1, or 2 (max 3 per hour)
  totalInSlot: number;
}

// Helper function to get appointment color based on status
function getAppointmentColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'bg-green-100 border-green-300 hover:bg-green-200';
    case 'approved':
    case 'scheduled':
      return 'bg-blue-100 border-blue-300 hover:bg-blue-200';
    case 'cancelled':
    case 'rejected':
      return 'bg-red-100 border-red-300 hover:bg-red-200';
    case 'pending':
      return 'bg-orange-100 border-orange-300 hover:bg-orange-200';
    default:
      return 'bg-gray-100 border-gray-300 hover:bg-gray-200';
  }
}

// Helper function to get text color based on status
function getAppointmentTextColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'text-green-900';
    case 'approved':
    case 'scheduled':
      return 'text-blue-900';
    case 'cancelled':
    case 'rejected':
      return 'text-red-900';
    case 'pending':
      return 'text-orange-900';
    default:
      return 'text-gray-900';
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

interface EnhancedCalendarViewProps {
  doctorId?: number;
  initialDate?: string;
  view?: 'day' | 'week';
  className?: string;
  compact?: boolean;
  selectedSlot?: { date: string; time: string };
  onSlotClick?: (date: string, time: string) => void;
  onStateChange?: (state: {
    doctorId?: number;
    serviceId?: number;
    date: Date;
    view: 'day' | 'week';
  }) => void;
}

export function EnhancedCalendarView({
  doctorId: initialDoctorId,
  initialDate,
  view: initialView = 'week',
  className,
  compact = false,
  selectedSlot,
  onSlotClick,
  onStateChange,
}: EnhancedCalendarViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    initialDate ? parseISO(initialDate) : new Date()
  );
  const [view, setView] = useState<'day' | 'week'>(initialView);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [history, setHistory] = useState<AppointmentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [hoveredSlot, setHoveredSlot] = useState<{ date: string; time: string } | null>(null);
  const [hoveredAppointment, setHoveredAppointment] = useState<number | null>(null);

  // Calculate date range using shared logic
  const dateRange = useMemo(() => calculateDateRange(selectedDate, view), [selectedDate, view]);

  // Combine appointments and history data
  const combinedAppointments = useMemo(() => {
    const historyAsAppointments = history.map(convertHistoryToCalendarAppointment);
    return [...appointments, ...historyAsAppointments];
  }, [appointments, history]);

  // Enhanced appointment positioning using shared logic
  const positionedAppointments = useMemo(() => positionAppointments(combinedAppointments, dateRange), [combinedAppointments, dateRange]);

  // Fetch doctors - now only loads doctors for selected service
  useEffect(() => {
    // Don't auto-select doctor anymore - wait for service selection
    if (initialDoctorId && selectedService) {
      // If we have an initial doctor ID, we need to fetch doctors for the service
      const fetchDoctorById = async () => {
        try {
          const allDoctors = await getDoctors();
          const doctor = allDoctors.find((d: Doctor) => d.id === initialDoctorId);
          if (doctor && doctor.service === selectedService.id) {
            setSelectedDoctor(doctor);
          }
        } catch (error) {
          console.error('Error fetching doctor:', error);
        }
      };
      fetchDoctorById();
    }
  }, [initialDoctorId, selectedService]);

  // Fetch appointments and history for the date range - only if doctor is selected
  useEffect(() => {
    if (!selectedDoctor) {
      setAppointments([]);
      setHistory([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const startDate = format(dateRange.start, 'yyyy-MM-dd');
        const endDate = format(dateRange.end, 'yyyy-MM-dd');

        // Fetch active appointments
        const appointmentsData = await getAppointments({
          doctor_id: selectedDoctor.id,
          start_date: startDate,
          end_date: endDate,
        });

        // Fetch history data
        const historyData = await getHistory({
          doctor_id: selectedDoctor.id,
          start_date: startDate,
          end_date: endDate,
        });

        setAppointments(appointmentsData);
        setHistory(historyData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setAppointments([]);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDoctor, dateRange]);

  // Update URL using shared logic (fixed to prevent infinite loop)
  useEffect(() => {
    if (!selectedDoctor) return;

    // Only update URL if values have actually changed
    const currentParams = new URLSearchParams(searchParams.toString());
    const newDoctorId = selectedDoctor.id.toString();
    const newServiceId = selectedService?.id.toString();
    const newDate = format(selectedDate, 'yyyy-MM-dd');
    const newView = view;
    
    if (currentParams.get('doctor') !== newDoctorId ||
        currentParams.get('service') !== newServiceId ||
        currentParams.get('date') !== newDate ||
        currentParams.get('view') !== newView) {
      
      const params = buildCalendarParams({
        doctorId: selectedDoctor.id,
        date: selectedDate,
        view
      });

      // Add service parameter if service is selected
      if (selectedService) {
        params.set('service', selectedService.id.toString());
      }

      router.push(`?${params.toString()}`, { scroll: false });
    }

    if (onStateChange) {
      onStateChange({
        doctorId: selectedDoctor.id,
        serviceId: selectedService?.id,
        date: selectedDate,
        view,
      });
    }
  }, [selectedDoctor, selectedService, selectedDate, view, router, onStateChange, searchParams]);

  // Navigation handlers
  const handleServiceChange = (service: Service) => {
    setSelectedService(service);
    setSelectedDoctor(null); // Clear doctor when service changes
  };

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
    const newDate = navigateDate(selectedDate, 'today', view);
    setSelectedDate(newDate);
    // Scroll to current time
    const currentHour = new Date().getHours();
    const slotElement = document.getElementById(`slot-${currentHour}`);
    if (slotElement) {
      slotElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const goToPrevious = () => {
    const newDate = navigateDate(selectedDate, 'previous', view);
    setSelectedDate(newDate);
  };

  const goToNext = () => {
    const newDate = navigateDate(selectedDate, 'next', view);
    setSelectedDate(newDate);
  };

  const handleSlotClick = (date: string, time: string) => {
    if (onSlotClick) {
      onSlotClick(date, time);
    }
  };

  const handleSlotHover = (date: string, time: string | null) => {
    setHoveredSlot(time ? { date, time } : null);
  };

  // Get month/year display using shared logic
  const getMonthYearDisplayText = () => getMonthYearDisplay(selectedDate, view, dateRange);

  return (
    <div className={cn('flex flex-col h-full bg-white', className)}>
      {/* Enhanced Header with Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-gray-200 px-6 py-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={view === 'day' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('day')}
                className="h-8 px-3"
              >
                Day
              </Button>
              <Button
                variant={view === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('week')}
                className="h-8 px-3"
              >
                Week
              </Button>
            </div>

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
          </div>

          {/* Date Input Field */}
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
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date);
                      setDatePickerOpen(false);
                    }
                  }}
                  initialFocus
                  className="rounded-md border"
                  styles={{
                    months: {
                      display: 'grid',
                      gridTemplateColumns: '1fr',
                    },
                    month: {
                      display: 'block',
                    },
                    caption: {
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      position: 'relative',
                      padding: '8px',
                    },
                    nav: {
                      display: 'flex',
                      justifyContent: 'space-between',
                      position: 'absolute',
                      left: '8px',
                      right: '8px',
                      top: '8px',
                    },
                    table: {
                      width: '100%',
                      borderCollapse: 'collapse',
                    },
                    head_row: {
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                    },
                    head_cell: {
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                    },
                    row: {
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                    },
                    cell: {
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      aspectRatio: '1',
                      padding: '2px',
                    },
                    day: {
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderRadius: '4px',
                      fontSize: '14px',
                      cursor: 'pointer',
                    },
                  }}
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Service and Doctor Selector */}
        <div className="flex items-center space-x-3 mt-4">
          <ServiceDoctorSelector
            selectedService={selectedService}
            selectedDoctor={selectedDoctor}
            onServiceSelect={handleServiceChange}
            onDoctorSelect={handleDoctorChange}
          />
          
        </div>
      </motion.div>

      {/* Enhanced Calendar Grid */}
      {!loading && selectedDoctor ? (
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Day Headers */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <div className="w-20 flex-shrink-0 border-r border-gray-200 px-2 py-3">
              <div className="text-xs text-gray-600 font-medium">
                {format(selectedDate, 'z')}
              </div>
            </div>
            <div className="flex-1 overflow-x-auto">
              <div className="flex min-w-max">
                {dateRange.days.map((day) => {
                  const dayIsToday = isToday(day);
                  const dayIsSelected = isSameDay(day, selectedDate);

                  return (
                    <div
                      key={day.toString()}
                      className={cn(
                        'flex flex-col items-center justify-center py-3 border-r border-gray-200 last:border-r-0 cursor-pointer transition-colors min-w-[80px] hover:bg-gray-100',
                        dayIsSelected && 'bg-blue-50'
                      )}
                      onClick={() => setSelectedDate(day)}
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
          </div>

          {/* Time Slots Grid */}
          <div className="flex-1 overflow-auto">
            <div className="flex">
              {/* Time Column */}
              <div className="w-20 flex-shrink-0 border-r border-gray-200">
                {TIME_SLOTS.map((slot) => (
                  <div
                    key={slot.hour}
                    id={`slot-${slot.hour}`}
                    className="border-b border-gray-100 px-2 py-3 text-right h-20 flex items-center justify-end"
                  >
                    <div className="text-xs text-gray-600 font-medium">
                      {slot.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Appointments Grid */}
              <div className="flex-1 overflow-x-auto">
                <div className="flex min-w-max">
                  {dateRange.days.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');

                    return (
                      <div
                        key={dateStr}
                        className="relative border-r border-gray-200 last:border-r-0 min-w-[80px]"
                      >
                        {/* Time Slot Rows */}
                        {TIME_SLOTS.map((slot) => {
                          const slotTime = slot.time24;
                          const slotKey = `${dateStr}-${slot.hour}`;
                          const slotAppointments = positionedAppointments.get(slotKey) || [];
                          
                          // Check if this slot is selected
                          const isSelectedSlot = selectedSlot && 
                            selectedSlot.date === dateStr && 
                            selectedSlot.time.startsWith(`${slot.hour}:`);

                          // Check if slot is at capacity using shared logic
                          const isAtCapacity = isSlotAtCapacity(positionedAppointments, dateStr, slot.hour);
                          
                          // Validate slot selection
                          const slotValidation = validateSlotSelection(positionedAppointments, dateStr, slotTime);

                          return (
                            <div
                              key={`${dateStr}-${slot.hour}`}
                              className={cn(
                                'border-b border-gray-100 relative cursor-pointer transition-colors',
                                'h-20 hover:bg-blue-50',
                                isSelectedSlot && 'bg-blue-100 ring-2 ring-blue-500',
                                isAtCapacity && !isSelectedSlot && 'bg-gray-50 cursor-not-allowed',
                                slotAppointments.length > 0 && !isSelectedSlot && 'bg-gray-50',
                                !slotValidation.isValid && !isSelectedSlot && 'bg-red-50 cursor-not-allowed'
                              )}
                              onClick={() => slotValidation.isValid && handleSlotClick(dateStr, slotTime)}
                              onMouseEnter={() => handleSlotHover(dateStr, slotTime)}
                              onMouseLeave={() => handleSlotHover(dateStr, null)}
                            >
                              {/* Selected Slot Indicator */}
                              {isSelectedSlot && (
                                <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                              )}

                              {/* Enhanced Appointment Stacking */}
                              {slotAppointments.length > 0 && (
                                <div className="absolute inset-1 pointer-events-none">
                                  {slotAppointments.map(({ appointment, position, totalInSlot }) => {
                                    const colorClass = getAppointmentColor(appointment.status);
                                    const textColorClass = getAppointmentTextColor(appointment.status);
                                    const isHovered = hoveredAppointment === appointment.id;
                                    
                                    return (
                                      <div key={appointment.id} className="relative">
                                        <div
                                          className={cn(
                                            'absolute border rounded text-xs p-2 transition-all cursor-pointer pointer-events-auto',
                                            'hover:z-10 hover:shadow-md',
                                            'shadow-sm',
                                            colorClass,
                                            textColorClass
                                          )}
                                          style={{
                                            left: `${position * 33.33}%`,
                                            width: totalInSlot === 1 ? 'calc(100% - 8px)' : '30%',
                                            height: 'calc(90% - 4px)',
                                            top: '2px',
                                            marginLeft: '2px'
                                          }}
                                          onMouseEnter={() => setHoveredAppointment(appointment.id)}
                                          onMouseLeave={() => setHoveredAppointment(null)}
                                        >
                                          <div className="font-medium truncate">
                                            {appointment.patient_name}
                                          </div>
                                          <div className="truncate text-xs opacity-80">
                                            {format(parseISO(appointment.start_time), 'HH:mm')}
                                          </div>
                                          {appointment.status && (
                                            <div className="truncate text-xs capitalize font-medium mt-1">
                                              {getStatusLabel(appointment.status)}
                                            </div>
                                          )}
                                        </div>
                                        <AppointmentTooltip 
                                          appointment={appointment} 
                                          visible={isHovered} 
                                        />
                                      </div>
                                    );
                                  })}
                                  {slotAppointments.length >= 3 && (
                                    <div className="absolute bottom-1 right-1 bg-gray-800 text-white text-xs rounded px-1 pointer-events-auto">
                                      +{slotAppointments.length - 2}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Hover indicator for available slots */}
                              {hoveredSlot?.date === dateStr && 
                               hoveredSlot?.time.startsWith(`${slot.hour}:`) && 
                               slotValidation.isValid && (
                                <div className="absolute inset-0 bg-blue-100 opacity-50 pointer-events-none"></div>
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
              <p className="text-gray-500 mb-2">
                {selectedService ? 'Please select a doctor to view appointments' : 'Please select a service to view available doctors'}
              </p>
              {!selectedService && (
                <p className="text-sm text-gray-400">Choose a service first, then select a doctor</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
