'use client';

import { useSearchParams } from 'next/navigation';
import { GoogleCalendarView } from '@/components/calendar/GoogleCalendarView';

export default function CalendarPage() {
  const searchParams = useSearchParams();
  const doctorId = searchParams.get('doctor') ? parseInt(searchParams.get('doctor') as string) : undefined;
  const date = searchParams.get('date') || undefined;
  const view = searchParams.get('view') === 'day' ? 'day' : 'week';

  return (
    <div className="flex flex-col h-full bg-white">
      <GoogleCalendarView
        doctorId={doctorId}
        initialDate={date}
        view={view}
        className="h-full"
      />
    </div>
  );
}
