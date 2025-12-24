'use client';

import { useSearchParams } from 'next/navigation';
import { FullWidthCalendar } from '@/components/calendar/FullWidthCalendar';
import AdminLayout from "@/components/admin/AdminLayout";
import { useState, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';

function CalendarContent() {
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
    serviceId?: number;
    date: Date;
  }) => {
    // Update URL parameters
    const params = new URLSearchParams(searchParams.toString());
    if (state.doctorId) {
      params.set('doctor', state.doctorId.toString());
    }
    if (state.serviceId) {
      params.set('service', state.serviceId.toString());
    }
    params.set('date', format(state.date, 'yyyy-MM-dd'));
    
    router.push(`/admin/calendar?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  return (
    <div className="flex flex-col h-full bg-white">
      <FullWidthCalendar
        doctorId={doctorId}
        initialDate={date}
        className="h-full"
        selectedSlot={selectedSlot || undefined}
        onSlotClick={handleSlotClick}
        onStateChange={handleStateChange}
      />
    </div>
  );
}

export default function CalendarPage() {
  return (
    <AdminLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      }>
        <CalendarContent />
      </Suspense>
    </AdminLayout>
  );
}
