'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  isToday,
  isSameDay,
  parseISO,
  getHours,
  getMinutes,
  differenceInMinutes,
  eachDayOfInterval,
} from 'date-fns';
import { Doctor, Service, AppointmentHistory } from '@/lib/types';
import { CalendarAppointment, getAppointments } from '@/lib/api/calendar';
import { getHistory } from '@/lib/api/history';
import { getServices, getDoctorsByService } from '@/lib/api/services';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { MaterialDatePicker } from './MaterialDatePicker';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
const HOUR_HEIGHT = 60; // 60px per hour
const DATE_SELECTOR_DAYS = 14; // Number of days to show in horizontal selector

// Helper function to determine if appointment is visited
function isVisited(appointment: CalendarAppointment | AppointmentHistory, history?: AppointmentHistory): boolean {
  if (history && 'visited' in history) {
    return history.visited === 'visited';
  }
  if ('visited' in appointment && (appointment as any).visited) {
    return (appointment as any).visited === 'visited';
  }
  const status = appointment.status?.toLowerCase() || '';
  return status === 'completed' || status === 'visited';
}

// Helper function to get appointment color based on visited status
function getAppointmentColor(isVisitedStatus: boolean) {
  return isVisitedStatus
    ? 'bg-green-500 border-green-600 hover:bg-green-600' // Green for visited
    : 'bg-red-500 border-red-600 hover:bg-red-600'; // Red for unvisited
}

// Helper function to convert history to calendar appointment format
function convertHistoryToCalendarAppointment(history: AppointmentHistory): CalendarAppointment {
  let status: CalendarAppointment["status"] = "PENDING";

  if (
    history.new_status === "PENDING" ||
    history.new_status === "APPROVED" ||
    history.new_status === "REJECTED" ||
    history.new_status === "COMPLETED" ||
    history.new_status === "CANCELLED"
  ) {
    status = history.new_status;
  } else if (history.visited === "visited") {
    status = "COMPLETED";
  } else if (history.visited === "unvisited") {
    status = "APPROVED";
  }

  const timeStr = history.appointment_time || '00:00';
  const startTimeStr = `${history.appointment_date}T${timeStr}`;

  const [hours, minutes] = timeStr.split(':').map(Number);
  const startDate = new Date(`${history.appointment_date}T${timeStr}`);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  const endTimeStr = endDate.toISOString().split('T')[1];
  const endDateStr = endDate.toISOString().split('T')[0];
  const endTimeISO = `${endDateStr}T${endTimeStr}`;

  return {
    id: history.id,
    name: history.name,
    email: history.email,
    phone: history.phone,
    message: history.message,
    admin_notes: history.notes,
    status,
    created_at: history.timestamp,
    updated_at: history.timestamp,
    patient_name: history.name,
    patient: {
      id: history.id,
      name: history.name,
      phone: history.phone,
      email: history.email,
    },
    service_name: history.service_name,
    service: {
      id: history.service_id,
      name: history.service_name,
      description: '',
      created_at: history.timestamp,
    },
    doctor: history.doctor_id ? {
      id: history.doctor_id,
      name: history.doctor_name || '',
      service: history.service_id,
      service_name: history.service_name,
      email: '',
      phone: '',
      active: true,
    } : null,
    start_time: startTimeStr,
    end_time: endTimeISO,
    service_duration: 60,
  };
}

interface FullWidthCalendarProps {
  doctorId?: number;
  initialDate?: string;
  className?: string;
  selectedSlot?: { date: string; time: string };
  onSlotClick?: (date: string, time: string) => void;
  onStateChange?: (state: {
    doctorId?: number;
    serviceId?: number;
    date: Date;
  }) => void;
}

export function FullWidthCalendar({
  doctorId: initialDoctorId,
  initialDate,
  className,
  selectedSlot,
  onSlotClick,
  onStateChange,
}: FullWidthCalendarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    initialDate ? parseISO(initialDate) : new Date()
  );
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [history, setHistory] = useState<AppointmentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [hoveredAppointment, setHoveredAppointment] = useState<number | null>(null);
  const dateSelectorRef = useRef<HTMLDivElement>(null);

  // Generate date range for horizontal selector (centered around selected date)
  const dateRange = useMemo(() => {
    const start = subDays(selectedDate, Math.floor(DATE_SELECTOR_DAYS / 2));
    const end = addDays(selectedDate, Math.floor(DATE_SELECTOR_DAYS / 2));
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  // Fetch services on mount
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesData = await getServices();
        setServices(servicesData || []);
      } catch (error) {
        console.error('Error fetching services:', error);
      }
    };
    fetchServices();
  }, []);

  // Fetch doctors based on selected service
  useEffect(() => {
    const fetchDoctors = async () => {
      if (selectedService) {
        try {
          const doctorsData = await getDoctorsByService(selectedService.id);
          setAvailableDoctors(doctorsData || []);
          
          // Clear selected doctor if it's not available for the selected service
          if (selectedDoctor && !doctorsData.find(d => d.id === selectedDoctor.id)) {
            setSelectedDoctor(null);
          }
          
          // If initialDoctorId is provided and matches a doctor in the service, set it
          if (initialDoctorId && !selectedDoctor) {
            const doctor = doctorsData.find(d => d.id === initialDoctorId);
            if (doctor) {
              setSelectedDoctor(doctor);
            }
          }
        } catch (error) {
          console.error('Error fetching doctors:', error);
          setAvailableDoctors([]);
        }
      } else {
        // No service selected - show all doctors
        try {
          const { getDoctors } = await import('@/lib/api/calendar');
          const allDoctors = await getDoctors();
          setAvailableDoctors(allDoctors || []);
          
          // If initialDoctorId is provided, set it as selected
          if (initialDoctorId && !selectedDoctor) {
            const doctor = allDoctors.find(d => d.id === initialDoctorId);
            if (doctor) {
              setSelectedDoctor(doctor);
            }
          }
        } catch (error) {
          console.error('Error fetching all doctors:', error);
        }
      }
    };
    fetchDoctors();
  }, [selectedService, initialDoctorId]);

  // Initialize date from URL if present
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam && dateParam !== format(selectedDate, 'yyyy-MM-dd')) {
      try {
        const urlDate = parseISO(dateParam);
        if (!isNaN(urlDate.getTime())) {
          setSelectedDate(urlDate);
        }
      } catch (error) {
        console.error('Invalid date in URL:', dateParam);
      }
    }
  }, [searchParams]);

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

  // Fetch appointments for selected date
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');

        const appointmentsData = await getAppointments({
          start_date: dateStr,
          end_date: dateStr,
          doctor_id: selectedDoctor?.id,
        });

        const historyData = await getHistory({
          start_date: dateStr,
          end_date: dateStr,
          doctor_id: selectedDoctor?.id,
        });

        setAppointments(appointmentsData || []);
        setHistory(historyData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setAppointments([]);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate, selectedDoctor]);

  // Update URL when filters change
  useEffect(() => {
    const currentParams = new URLSearchParams(searchParams.toString());
    const newDoctorId = selectedDoctor?.id.toString();
    const newServiceId = selectedService?.id.toString();
    const newDate = format(selectedDate, 'yyyy-MM-dd');

    if (
      currentParams.get('doctor') !== newDoctorId ||
      currentParams.get('service') !== newServiceId ||
      currentParams.get('date') !== newDate
    ) {
      const params = new URLSearchParams();
      params.set('date', newDate);

      if (selectedService) {
        params.set('service', selectedService.id.toString());
      }
      if (selectedDoctor) {
        params.set('doctor', selectedDoctor.id.toString());
      }

      router.push(`?${params.toString()}`, { scroll: false });
    }

    if (onStateChange) {
      onStateChange({
        doctorId: selectedDoctor?.id,
        serviceId: selectedService?.id,
        date: selectedDate,
      });
    }
  }, [selectedDoctor, selectedService, selectedDate, router, onStateChange, searchParams]);

  // Combine appointments and history for selected date only - filter out rejected appointments globally
  const combinedAppointments = useMemo(() => {
    const historyAsAppointments = history.map(convertHistoryToCalendarAppointment);
    const allAppointments = [...appointments, ...historyAsAppointments]
      .filter(apt => apt.start_time && apt.end_time)
      .filter(apt => {
        try {
          return isSameDay(parseISO(apt.start_time), selectedDate);
        } catch (error) {
          console.warn('Invalid start_time for appointment:', apt.id, apt.start_time);
          return false;
        }
      })
      // Filter out rejected appointments globally
      .filter(apt => {
        const status = apt.status?.toUpperCase();
        return status !== 'REJECTED';
      });
    return allAppointments;
  }, [appointments, history, selectedDate]);

  // Create a map of appointment ID to history for visited status lookup
  const historyMap = useMemo(() => {
    const map = new Map<number, AppointmentHistory>();
    history.forEach(h => {
      map.set(h.id, h);
    });
    return map;
  }, [history]);

  // Group appointments by hour and calculate positions (max 3 per hour) - Horizontal Alignment
  const positionedAppointments = useMemo(() => {
    // Group appointments by hour
    const appointmentsByHour = new Map<number, typeof combinedAppointments>();
    
    combinedAppointments.forEach(appointment => {
      const startTime = parseISO(appointment.start_time);
      const hour = getHours(startTime);
      
      if (!appointmentsByHour.has(hour)) {
        appointmentsByHour.set(hour, []);
      }
      appointmentsByHour.get(hour)!.push(appointment);
    });

    // Process each hour, limit to 3 appointments max
    const result: Array<{
      appointment: CalendarAppointment;
      top: number;
      height: number;
      left: number;
      width: number;
      timeDisplay: string;
      isVisited: boolean;
      position: number; // 0, 1, or 2 for horizontal alignment
      totalInSlot: number;
    }> = [];

    appointmentsByHour.forEach((hourAppointments, hour) => {
      // Limit to 3 appointments per hour
      const limitedAppointments = hourAppointments.slice(0, 3);
      const totalInSlot = limitedAppointments.length;
      
      limitedAppointments.forEach((appointment, index) => {
        const startTime = parseISO(appointment.start_time);
        const endTime = parseISO(appointment.end_time);

        // Horizontal alignment: each appointment occupies 1/3 width when 2-3 appointments
        // Full width when only 1 appointment
        const appointmentWidth = totalInSlot === 1 ? 100 : 33.33;
        const leftPosition = totalInSlot === 1 ? 0 : index * 33.33;

        // Top position: calculate slot index based on hour (8 AM = 0, 9 AM = 1, etc.)
        const slotIndex = TIME_SLOTS.findIndex(slot => slot.hour === hour);
        const top = slotIndex >= 0 ? slotIndex * HOUR_HEIGHT : 0;
        const height = HOUR_HEIGHT - 2; // Small margin from edges

        // Format time display
        const timeDisplay = `${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}`;

        // Get original history for visited status check
        const originalHistory = historyMap.get(appointment.id);

        result.push({
          appointment,
          top,
          height,
          left: leftPosition,
          width: appointmentWidth,
          timeDisplay,
          isVisited: isVisited(appointment, originalHistory),
          position: index,
          totalInSlot,
        });
      });
    });

    return result.sort((a, b) => a.top - b.top || a.left - b.left);
  }, [combinedAppointments, historyMap]);

  // Handlers
  const handleServiceChange = (serviceId: string) => {
    if (serviceId === 'all') {
      setSelectedService(null);
      setSelectedDoctor(null);
    } else {
      const service = services.find(s => s.id === parseInt(serviceId));
      setSelectedService(service || null);
      setSelectedDoctor(null); // Clear doctor when service changes
    }
  };

  const handleDoctorChange = (doctorId: string) => {
    if (doctorId === 'all') {
      setSelectedDoctor(null);
    } else {
      const doctor = availableDoctors.find(d => d.id === parseInt(doctorId));
      setSelectedDoctor(doctor || null);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setDatePickerOpen(false);
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const handlePreviousDay = () => {
    setSelectedDate(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };

  const handleAppointmentClick = useCallback((appointment: CalendarAppointment, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (appointment.id) {
        router.push(`/admin/history/${appointment.id}`);
      }
    } catch (error) {
      console.error('Error navigating to appointment:', error);
    }
  }, [router]);

  const handleTimeSlotClick = (hour: number) => {
    if (onSlotClick) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const timeStr = `${hour.toString().padStart(2, '0')}:00`;
      onSlotClick(dateStr, timeStr);
    }
  };

  return (
    <div className={cn('flex flex-col h-full bg-white', className)}>
      {/* Header with Navigation and Filters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-gray-200 px-6 py-4"
      >
        <div className="flex items-center justify-between mb-4">
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
              onClick={handlePreviousDay}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextDay}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setDatePickerOpen(true)}
              className="w-[200px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDate, 'PPP')}
            </Button>
          </div>

          {/* Service and Doctor Filters */}
          <div className="flex items-center space-x-3">
            <Select
              value={selectedService?.id.toString() || 'all'}
              onValueChange={handleServiceChange}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Services" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id.toString()}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedDoctor?.id.toString() || 'all'}
              onValueChange={handleDoctorChange}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Doctors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Doctors</SelectItem>
                {availableDoctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id.toString()}>
                    {doctor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <MaterialDatePicker
            selected={selectedDate}
            onSelect={handleDateSelect}
            open={datePickerOpen}
            onOpenChange={setDatePickerOpen}
          />
        </div>

        {/* Horizontal Scrollable Date Selector */}
        <div className="border-t border-gray-200 pt-3">
          <div
            ref={dateSelectorRef}
            className="flex overflow-x-auto space-x-2 pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
            style={{
              scrollbarWidth: 'thin',
            }}
          >
            {dateRange.map((date) => {
              const dateIsToday = isToday(date);
              const dateIsSelected = isSameDay(date, selectedDate);

              return (
                <button
                  key={date.toString()}
                  data-date={format(date, 'yyyy-MM-dd')}
                  onClick={() => handleDateClick(date)}
                  className={cn(
                    'flex flex-col items-center justify-center py-2 px-4 min-w-[80px] rounded-lg transition-colors',
                    'hover:bg-gray-100',
                    dateIsSelected && 'bg-blue-50'
                  )}
                >
                  <div className="text-xs text-gray-600 font-medium uppercase mb-1">
                    {format(date, 'EEE')}
                  </div>
                  <div
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
                      dateIsToday && !dateIsSelected && 'bg-blue-500 text-white',
                      dateIsSelected && 'bg-blue-600 text-white',
                      !dateIsToday && !dateIsSelected && 'text-gray-900'
                    )}
                  >
                    {format(date, 'd')}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Single-Day Calendar Grid */}
      {!loading ? (
        <div className="flex-1 overflow-auto">
          <div className="flex" style={{ minHeight: `${TIME_SLOTS.length * HOUR_HEIGHT}px` }}>
            {/* Time Column */}
            <div className="w-24 flex-shrink-0 border-r border-gray-200 bg-gray-50 sticky left-0 z-10">
              {TIME_SLOTS.map((slot) => (
                <div
                  key={slot.hour}
                  className="border-b border-gray-200 px-2 py-1 text-right"
                  style={{ height: `${HOUR_HEIGHT}px` }}
                >
                  <div className="text-xs text-gray-600 font-medium">
                    {slot.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Single Date Column with Appointments */}
            <div className="flex-1 relative bg-white" style={{ minHeight: `${TIME_SLOTS.length * HOUR_HEIGHT}px` }}>
              {/* Grid Lines - Horizontal and Vertical */}
              <div className="absolute inset-0">
                {TIME_SLOTS.map((slot, slotIndex) => (
                  <div
                    key={slot.hour}
                    className="absolute left-0 right-0 border-b border-gray-300 cursor-pointer hover:bg-blue-50 transition-colors"
                    style={{
                      top: `${slotIndex * HOUR_HEIGHT}px`,
                      height: `${HOUR_HEIGHT}px`,
                    }}
                    onClick={() => handleTimeSlotClick(slot.hour)}
                  />
                ))}
                {/* Vertical grid lines at boundaries */}
                <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-300" />
                <div className="absolute right-0 top-0 bottom-0 w-px bg-gray-300" />
              </div>

              {/* Appointments - Horizontal Alignment (Side-by-Side) */}
              {TIME_SLOTS.map((slot, slotIndex) => {
                const hour = slot.hour;
                const slotAppointments = positionedAppointments.filter(
                  (pos) => {
                    const aptHour = getHours(parseISO(pos.appointment.start_time));
                    return aptHour === hour;
                  }
                );

                if (slotAppointments.length === 0) return null;

                // Calculate top position based on slot index (not hour) to account for 8 AM start
                const topPosition = slotIndex * HOUR_HEIGHT;

                return (
                  <div
                    key={`slot-${hour}`}
                    className="absolute flex gap-1"
                    style={{
                      top: `${topPosition + 2}px`,
                      left: '4px',
                      right: '4px',
                      height: `${HOUR_HEIGHT - 4}px`,
                    }}
                  >
                    {slotAppointments.map(({ appointment, width, timeDisplay, isVisited, position }) => {
                      const isHovered = hoveredAppointment === appointment.id;
                      const colorClass = getAppointmentColor(isVisited);

                      return (
                        <div
                          key={appointment.id}
                          className={cn(
                            'rounded border shadow-sm cursor-pointer transition-all flex-shrink-0',
                            'hover:shadow-md hover:z-20',
                            colorClass,
                            'text-white',
                            isHovered && 'z-20 shadow-lg'
                          )}
                          style={{
                            width: `${width}%`,
                            height: '100%',
                            zIndex: isHovered ? 20 : 10,
                          }}
                          onMouseEnter={() => setHoveredAppointment(appointment.id)}
                          onMouseLeave={() => setHoveredAppointment(null)}
                          onClick={(e) => handleAppointmentClick(appointment, e)}
                        >
                          <div className="p-2 h-full flex flex-col justify-between overflow-hidden">
                            <div className="font-medium text-xs truncate">
                              {appointment.patient_name}
                            </div>
                            <div className="truncate text-xs opacity-80">
                              {timeDisplay}
                            </div>
                            {appointment.status && (
                              <div className="truncate text-xs capitalize font-medium mt-1">
                                {appointment.status === 'COMPLETED' || isVisited ? 'Visited' : 'Unvisited'}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Selected Slot Indicator */}
              {selectedSlot &&
                selectedSlot.date === format(selectedDate, 'yyyy-MM-dd') && (
                  <div
                    className="absolute left-0 right-0 bg-blue-100 border-2 border-blue-500 rounded pointer-events-none"
                    style={{
                      top: `${(() => {
                        const selectedHour = parseInt(selectedSlot.time.split(':')[0]);
                        const slotIndex = TIME_SLOTS.findIndex(slot => slot.hour === selectedHour);
                        return slotIndex >= 0 ? slotIndex * HOUR_HEIGHT : 0;
                      })()}px`,
                      height: `${HOUR_HEIGHT}px`,
                    }}
                  />
                )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
}
