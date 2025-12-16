'use client';

import { useSearchParams } from 'next/navigation';
import { EnhancedCalendarView } from '@/components/calendar/EnhancedCalendarView';
import AdminLayout from "@/components/admin/AdminLayout";
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';

export default function CalendarPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const doctorId = searchParams.get('doctor') ? parseInt(searchParams.get('doctor') as string) : undefined;
  const date = searchParams.get('date') || undefined;
  const view = searchParams.get('view') === 'day' ? 'day' : 'week';
  
  // State for handling slot clicks and navigation to appointment creation
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);

  // Handle slot clicks for appointment creation
  const handleSlotClick = useCallback((date: string, time: string) => {
    setSelectedSlot({ date, time });
    
    // Navigate to appointment creation page with pre-filled data
    // This creates a new appointment with the selected date/time
    const params = new URLSearchParams({
      date,
      time,
      doctor: doctorId?.toString() || '',
      source: 'calendar'
    });
    
    // Navigate to appointments list or create new appointment
    router.push(`/admin/appointments/new?${params.toString()}`);
  }, [doctorId, router]);

  // Handle calendar state changes
  const handleStateChange = useCallback((state: {
    doctorId?: number;
    date: Date;
    view: 'day' | 'week';
  }) => {
    // Update URL parameters
    const params = new URLSearchParams(searchParams.toString());
    if (state.doctorId) {
      params.set('doctor', state.doctorId.toString());
    }
    params.set('date', format(state.date, 'yyyy-MM-dd'));
    params.set('view', state.view);
    
    router.push(`/admin/calendar?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  return (
    <AdminLayout>
      <div className="flex flex-col h-full bg-white">
        <EnhancedCalendarView
          doctorId={doctorId}
          initialDate={date}
          view={view}
          className="h-full"
          selectedSlot={selectedSlot || undefined}
          onSlotClick={handleSlotClick}
          onStateChange={handleStateChange}
        />
      </div>
    </AdminLayout>
  );
}
