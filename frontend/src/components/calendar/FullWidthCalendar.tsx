'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  format,
  addDays,
  subDays,
  isToday,
  isSameDay,
  parseISO,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { Doctor, Service, AppointmentHistory } from '@/lib/types';
import { CalendarAppointment, getAppointments, getDoctors } from '@/lib/api/calendar';
import { getServices } from '@/lib/api/services';
import { getHistory } from '@/lib/api/history';
import { ServiceDoctorSelector } from './ServiceDoctorSelector';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, User, Phone, CheckCircle, XCircle } from 'lucide-react';
import { MaterialDatePicker } from './MaterialDatePicker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// Time slots from 8 AM to 8 PM
const TIME_SLOTS = Array.from({ length: 13 }, (_, i) => {
  const hour = i + 8; // Start at 8 AM
  return {
    hour,
    label:
      hour === 12
        ? '12 PM'
        : hour < 12
          ? `${hour} AM`
          : `${hour - 12} PM`,
    time24: `${hour.toString().padStart(2, '0')}:00`,
  };
});


// Helper function to get appointment color based on visited status
function getAppointmentColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'visited':
      return 'bg-green-100 border-green-300 hover:bg-green-200'; // Light green for visited
    default:
      return 'bg-red-100 border-red-300 hover:bg-red-200'; // Light red for not visited
  }
}

// Helper function to get text color based on visited status
function getAppointmentTextColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'visited':
      return 'text-green-900'; // Dark green text for light green background
    default:
      return 'text-red-900'; // Dark red text for light red background
  }
}

// Helper function to map backend status to UI label
function getStatusLabel(status: string): 'Visited' | 'Unvisited' {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'visited':
      return 'Visited';
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
  // Map appointment status more comprehensively
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


  // Ensure we have proper ISO format time
  const timeStr = history.appointment_time || '00:00';
  const startTimeStr = `${history.appointment_date}T${timeStr}`;
  
  // Calculate end time (default 60 minutes duration)
  const [hours, minutes] = timeStr.split(':').map(Number);
  const startDate = new Date(`${history.appointment_date}T${timeStr}`);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 60 minutes
  const endTimeStr = endDate.toISOString().split('T')[1]; // Get time part
  const endDateStr = endDate.toISOString().split('T')[0]; // Get date part
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
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [history, setHistory] = useState<AppointmentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [hoveredSlot, setHoveredSlot] = useState<{ time: string } | null>(null);
  const [hoveredAppointment, setHoveredAppointment] = useState<number | null>(null);

  // Horizontal scroll state
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [visibleDates, setVisibleDates] = useState<Date[]>([]);
  const [scrollPosition, setScrollPosition] = useState(0);
  const isScrolling = useRef(false);

  // Generate visible dates for horizontal scrolling
  const generateVisibleDates = useCallback((centerDate: Date, count: number = 30) => {
    const dates: Date[] = [];
    const startOffset = Math.floor(count / 2);

    for (let i = -startOffset; i <= startOffset; i++) {
      dates.push(addDays(centerDate, i));
    }

    return dates;
  }, []);

  // Initialize visible dates and center selected date
  useEffect(() => {
    setVisibleDates(generateVisibleDates(selectedDate, 30));
    
    // Center the selected date in the horizontal scroll container
    const centerSelectedDate = () => {
      setTimeout(() => {
        if (scrollContainerRef.current) {
          const container = scrollContainerRef.current;
          const dateElements = container.querySelectorAll('[data-date]');
          const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

          dateElements.forEach((element) => {
            if (element.getAttribute('data-date') === selectedDateStr) {
              element.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
          });
        }
      }, 50);
    };

    centerSelectedDate();
  }, [selectedDate, generateVisibleDates]);

  // Initialize filtering state from URL parameters
  useEffect(() => {
    const doctorParam = searchParams.get('doctor');
    const serviceParam = searchParams.get('service');
    const dateParam = searchParams.get('date');

    // Update date from URL if present
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

    // Fetch and set service from URL if present
    if (serviceParam) {
      const serviceId = parseInt(serviceParam);
      if (!isNaN(serviceId)) {
        const fetchServiceById = async () => {
          try {
            const allServices = await getServices();
            const service = allServices.find((s: Service) => s.id === serviceId);
            if (service) {
              setSelectedService(service);
            }
          } catch (error) {
            console.error('Error fetching service:', error);
          }
        };
        fetchServiceById();
      }
    }

    // Fetch and set doctor from URL if present
    if (doctorParam) {
      const doctorId = parseInt(doctorParam);
      if (!isNaN(doctorId)) {
        const fetchDoctorById = async () => {
          try {
            const allDoctors = await getDoctors();
            const doctor = allDoctors.find((d: Doctor) => d.id === doctorId);
            if (doctor) {
              setSelectedDoctor(doctor);
            }
          } catch (error) {
            console.error('Error fetching doctor:', error);
          }
        };
        fetchDoctorById();
      }
    }
  }, [searchParams]);

  // Fetch appointments for selected date (all doctors for client-side filtering)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');

        // Fetch all appointments for selected date (no doctor filter for client-side filtering)
        const appointmentsData = await getAppointments({
          start_date: dateStr,
          end_date: dateStr,
        });

        // Fetch all history data for selected date (no doctor filter)
        // Pass date range parameters that backend expects
        const historyData = await getHistory({
          start_date: dateStr,
          end_date: dateStr,
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
  }, [selectedDate]);

  // Update URL (only when filters are applied)
  useEffect(() => {
    const currentParams = new URLSearchParams(searchParams.toString());
    const newDoctorId = selectedDoctor?.id.toString();
    const newServiceId = selectedService?.id.toString();
    const newDate = format(selectedDate, 'yyyy-MM-dd');

    // Only update URL if values have actually changed
    if (currentParams.get('doctor') !== newDoctorId ||
        currentParams.get('service') !== newServiceId ||
        currentParams.get('date') !== newDate) {

      const params = new URLSearchParams();
      params.set('date', newDate);

      // Only add doctor/service to URL if they are selected
      if (selectedDoctor) {
        params.set('doctor', selectedDoctor.id.toString());
      }
      if (selectedService) {
        params.set('service', selectedService.id.toString());
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

  // Navigation handlers
  const handleServiceChange = (service: Service) => {
    setSelectedService(service);
    setSelectedDoctor(null);
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

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const handleSlotClick = (time: string) => {
    if (onSlotClick) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      onSlotClick(dateStr, time);
    }
  };

  const handleSlotHover = (time: string | null) => {
    setHoveredSlot(time ? { time } : null);
  };

  // Handle appointment click - navigate to history detail page
  const handleAppointmentClick = useCallback((appointment: CalendarAppointment, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // All calendar appointments come from history, so navigate to history page
      if (appointment.id) {
        router.push(`/admin/history/${appointment.id}`);
      }
    } catch (error) {
      console.error('Error navigating to appointment:', error);
    }
  }, [router]);

  // Combine appointments and history for selected date only
  const combinedAppointments = useMemo(() => {
    const historyAsAppointments = history.map(convertHistoryToCalendarAppointment);
    return [...appointments, ...historyAsAppointments].filter(apt =>
      isSameDay(parseISO(apt.start_time), selectedDate)
    );
  }, [appointments, history, selectedDate]);

  // Client-side filtering based on selected doctor and service
  const filteredAppointments = useMemo(() => {
    return combinedAppointments.filter((appointment) => {
      // Filter by doctor - if no doctor selected, show all
      let matchesDoctor = !selectedDoctor;
      
      if (selectedDoctor) {
        if (appointment.doctor) {
          const appointmentDoctorId = appointment.doctor.id;
          const selectedDoctorId = selectedDoctor.id;
          
          // Robust comparison that handles various data types
          if (appointmentDoctorId !== undefined && appointmentDoctorId !== null) {
            const appointmentDoctorIdNum = Number(appointmentDoctorId);
            const selectedDoctorIdNum = Number(selectedDoctorId);
            
            if (!isNaN(appointmentDoctorIdNum) && !isNaN(selectedDoctorIdNum)) {
              matchesDoctor = appointmentDoctorIdNum === selectedDoctorIdNum;
            } else {
              // String comparison as fallback
              matchesDoctor = String(appointmentDoctorId) === String(selectedDoctorId);
            }
          } else {
            matchesDoctor = false;
          }
        } else {
          // Appointment has no doctor assigned
          matchesDoctor = false;
        }
      }

      // Filter by service - if no service selected, show all
      let matchesService = !selectedService;
      
      if (selectedService) {
        if (appointment.service) {
          const appointmentServiceId = appointment.service.id;
          const selectedServiceId = selectedService.id;
          
          // Robust comparison that handles various data types
          if (appointmentServiceId !== undefined && appointmentServiceId !== null) {
            const appointmentServiceIdNum = Number(appointmentServiceId);
            const selectedServiceIdNum = Number(selectedServiceId);
            
            if (!isNaN(appointmentServiceIdNum) && !isNaN(selectedServiceIdNum)) {
              matchesService = appointmentServiceIdNum === selectedServiceIdNum;
            } else {
              // String comparison as fallback
              matchesService = String(appointmentServiceId) === String(selectedServiceId);
            }
          } else {
            matchesService = false;
          }
        } else {
          // Appointment has no service assigned
          matchesService = false;
        }
      }

      return matchesDoctor && matchesService;
    });
  }, [combinedAppointments, selectedDoctor, selectedService]);

  // Group appointments by hour for vertical stacking (using filtered appointments)
  const appointmentsByHour = useMemo(() => {
    const grouped: Record<number, CalendarAppointment[]> = {};

    filteredAppointments.forEach(appointment => {
      const hour = parseInt(format(parseISO(appointment.start_time), 'H'));
      if (!grouped[hour]) {
        grouped[hour] = [];
      }
      grouped[hour].push(appointment);
    });

    return grouped;
  }, [filteredAppointments]);

  // Normalized horizontal scroll handler
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!scrollContainerRef.current || isScrolling.current) return;
    
    // Only handle horizontal scrolling or vertical with shift key
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) {
      e.preventDefault();
      isScrolling.current = true;
      
      const container = scrollContainerRef.current;
      // Use normalized delta for 1:1 scrolling feel
      const delta = e.deltaX || e.deltaY;
      const scrollAmount = delta * 0.8; // Slight damping for natural feel
      
      container.scrollBy({
        left: scrollAmount,
        behavior: 'auto'
      });
      
      // Reset scrolling flag after a short delay
      setTimeout(() => {
        isScrolling.current = false;
      }, 16);
    }
  }, []);

  // Add wheel event listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  // Horizontal scroll handlers
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const containerWidth = container.clientWidth;
    const itemWidth = 100; // Approximate width of each date item

    // Calculate center date
    const centerIndex = Math.floor((scrollLeft + containerWidth / 2) / itemWidth);
    const centerDate = visibleDates[centerIndex];

    if (centerDate && !isSameDay(centerDate, selectedDate)) {
      setSelectedDate(centerDate);
    }

    setScrollPosition(scrollLeft);
  }, [visibleDates, selectedDate]);

  // Load more dates when scrolling near edges
  const handleScrollEnd = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const containerWidth = container.clientWidth;

    // If we're near the right edge, load more future dates
    if (scrollLeft + containerWidth > scrollWidth - 200) {
      const lastDate = visibleDates[visibleDates.length - 1];
      const newDates = Array.from({ length: 10 }, (_, i) => addDays(lastDate, i + 1));
      setVisibleDates(prev => [...prev, ...newDates]);
    }

    // If we're near the left edge, load more past dates
    if (scrollLeft < 200) {
      const firstDate = visibleDates[0];
      const newDates = Array.from({ length: 10 }, (_, i) => subDays(firstDate, i + 1)).reverse();
      setVisibleDates(prev => [...newDates, ...prev]);
    }
  }, [visibleDates]);

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
                onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Date Input Field */}
          <Button
            variant="outline"
            onClick={() => setDatePickerOpen(true)}
            className="w-[200px] justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-8 w-8" />
            {format(selectedDate, 'PPP')}
          </Button>

          {/* Material Date Picker Modal */}
          <MaterialDatePicker
            selected={selectedDate}
            onSelect={handleDateSelect}
            open={datePickerOpen}
            onOpenChange={setDatePickerOpen}
          />
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

      {/* Horizontal Scrollable Date Row */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
          onScroll={handleScroll}
        >
          <style>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <div className="flex">
            {visibleDates.map((date) => {
              const dateIsToday = isToday(date);
              const dateIsSelected = isSameDay(date, selectedDate);

              return (
                <div
                  key={date.toString()}
                  data-date={format(date, 'yyyy-MM-dd')}
                  className={cn(
                    'flex flex-col items-center justify-center py-3 border-r border-gray-200 last:border-r-0 cursor-pointer transition-colors min-w-[100px] hover:bg-gray-100 flex-shrink-0',
                    dateIsSelected && 'bg-blue-50'
                  )}
                  onClick={() => handleDateClick(date)}
                >
                  <div className="text-xs text-gray-600 font-medium uppercase">
                    {format(date, 'EEE')}
                  </div>
                  <div
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-full mt-1 text-sm font-medium',
                      dateIsToday && !dateIsSelected && 'bg-blue-500 text-white',
                      dateIsSelected && 'bg-blue-600 text-white',
                      !dateIsToday && !dateIsSelected && 'text-gray-900'
                    )}
                  >
                    {format(date, 'd')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Single-Day Time Grid */}
      {!loading ? (
        <div className="flex-1 overflow-auto">
          <div className="flex">
            {/* Time Column */}
            <div className="w-20 flex-shrink-0 border-r border-gray-200">
              {TIME_SLOTS.map((slot) => (
                <div
                  key={slot.hour}
                  className="border-b border-gray-100 px-2 py-3 text-right h-20 flex items-center justify-end"
                >
                  <div className="text-xs text-gray-600 font-medium">
                    {slot.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Appointments Grid - Full Width */}
            <div className="flex-1">
              {TIME_SLOTS.map((slot) => {
                const hourAppointments = appointmentsByHour[slot.hour] || [];
                const isSelectedSlot = selectedSlot &&
                  selectedSlot.date === format(selectedDate, 'yyyy-MM-dd') &&
                  selectedSlot.time === slot.time24;

                return (
                  <div
                    key={slot.hour}
                    className={cn(
                      'border-b border-gray-100 relative cursor-pointer transition-colors',
                      'h-20 hover:bg-blue-50',
                      isSelectedSlot && 'bg-blue-100 ring-2 ring-blue-500',
                      hourAppointments.length > 0 && !isSelectedSlot && 'bg-gray-50'
                    )}
                    onClick={() => handleSlotClick(slot.time24)}
                    onMouseEnter={() => handleSlotHover(slot.time24)}
                    onMouseLeave={() => handleSlotHover(null)}
                  >
                    {/* Selected Slot Indicator */}
                    {isSelectedSlot && (
                      <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    )}

                    {/* Vertical Appointment Stacking */}
                    {hourAppointments.length > 0 && (
                      <div className="absolute inset-1 pointer-events-none">
                        {hourAppointments.map((appointment, index) => {
                          const colorClass = getAppointmentColor(appointment.status);
                          const textColorClass = getAppointmentTextColor(appointment.status);
                          const isHovered = hoveredAppointment === appointment.id;
                          
                          // Stack appointments vertically, each taking 20px height
                          const itemHeight = 20;
                          const topOffset = index * itemHeight;

                          return (
                            <div key={appointment.id} className="relative">
                              <div
                                className={cn(
                                  'absolute flex border rounded text-xs p-1.5 transition-all cursor-pointer pointer-events-auto w-full',
                                  'hover:z-10 hover:shadow-lg hover:scale-105',
                                  'shadow-sm',
                                  colorClass,
                                  textColorClass
                                )}
                                style={{
                                  top: `${topOffset}px`,
                                  left: '0px',
                                  right: '0px',
                                  height: `${itemHeight - 2}px`,
                                  zIndex: isHovered ? 20 : 10 + index,
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  overflow: 'hidden',
                                }}
                                onMouseEnter={() => setHoveredAppointment(appointment.id)}
                                onMouseLeave={() => setHoveredAppointment(null)}
                                onClick={(e) => handleAppointmentClick(appointment, e)}
                              >
                                <div className="flex flex-row items-center justify-start h-full gap-1 overflow-hidden flex-1">
                                  <div className="font-medium truncate text-xs whitespace-nowrap">
                                    {appointment.patient_name.split(' ')[0]}
                                  </div>

                                  <div className="text-xs opacity-80 truncate whitespace-nowrap">
                                    {format(parseISO(appointment.start_time), 'HH:mm')}
                                  </div>

                                  {appointment.status && (
                                    <div className="text-xs capitalize font-medium whitespace-nowrap">
                                      {getStatusLabel(appointment.status)}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <AppointmentTooltip
                                appointment={appointment}
                                visible={isHovered}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Hover indicator for available slots */}
                    {hoveredSlot?.time === slot.time24 && hourAppointments.length === 0 && (
                      <div className="absolute inset-0 bg-blue-100 opacity-50 pointer-events-none"></div>
                    )}
                  </div>
                );
              })}
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
                No appointments found for the selected date and filters
              </p>
              <p className="text-sm text-gray-400">Try selecting a different date or adjusting your filters</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}