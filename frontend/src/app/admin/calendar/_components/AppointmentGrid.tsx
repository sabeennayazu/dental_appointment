import { format, parseISO, isSameDay } from 'date-fns';
import { CalendarAppointment } from '@/lib/api/calendar';

interface AppointmentGridProps {
  days: Date[];
  appointments: CalendarAppointment[];
  isLoading: boolean;
}

export function AppointmentGrid({ days, appointments, isLoading }: AppointmentGridProps) {
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">Loading appointments...</div>
      </div>
    );
  }

  // Group appointments by day and time slot
  const appointmentsByDay = days.map(day => {
    const dayAppointments = appointments.filter(apt => 
      isSameDay(parseISO(apt.start_time), day)
    );
    
    // Group by hour
    const byHour: Record<number, CalendarAppointment[]> = {};
    
    dayAppointments.forEach(apt => {
      const hour = new Date(apt.start_time).getHours();
      if (!byHour[hour]) {
        byHour[hour] = [];
      }
      byHour[hour].push(apt);
    });
    
    return byHour;
  });

  // Generate time slots from 8 AM to 8 PM
  const timeSlots = Array.from({ length: 13 }, (_, i) => i + 8);

  return (
    <div className="flex-1 overflow-auto">
      {/* Time slots */}
      {timeSlots.map((hour, hourIndex) => (
        <div key={hour} className="flex h-16 border-b border-gray-100">
          {days.map((day, dayIndex) => {
            const dayAppointments = appointmentsByDay[dayIndex][hour] || [];
            const hasTooManyAppointments = dayAppointments.length > 4;
            
            return (
              <div 
                key={dayIndex} 
                className={`flex-1 border-r border-gray-100 relative ${hasTooManyAppointments ? 'bg-red-50' : ''}`}
              >
                <div className="absolute inset-0 overflow-y-auto p-1">
                  {hasTooManyAppointments && (
                    <div className="text-xs text-red-500 font-medium bg-red-100 p-1 rounded mb-1">
                      ⚠️ Too many appointments
                    </div>
                  )}
                  
                  {dayAppointments.slice(0, 4).map((appointment) => (
                    <AppointmentCard 
                      key={appointment.id} 
                      appointment={appointment} 
                    />
                  ))}
                  
                  {dayAppointments.length > 4 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayAppointments.length - 4} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

interface AppointmentCardProps {
  appointment: CalendarAppointment;
}

function AppointmentCard({ appointment }: AppointmentCardProps) {
  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 border-yellow-300',
    APPROVED: 'bg-blue-100 border-blue-300',
    REJECTED: 'bg-red-100 border-red-300',
    COMPLETED: 'bg-green-100 border-green-300',
    CANCELLED: 'bg-red-100 border-red-300',
  };
  
  const statusColor = statusColors[appointment.status] || 'bg-gray-100 border-gray-300';
  
  return (
    <div 
      className={`mb-1 p-1 rounded border ${statusColor} text-xs cursor-pointer hover:shadow-sm`}
      title={`${appointment.patient.name} - ${appointment.service_name}`}
    >
      <div className="font-medium truncate">{appointment.patient.name}</div>
      <div className="text-gray-600 truncate">{appointment.service_name}</div>
      <div className="text-gray-500 text-[10px] mt-0.5">
        {format(parseISO(appointment.start_time), 'h:mm a')}
      </div>
    </div>
  );
}
