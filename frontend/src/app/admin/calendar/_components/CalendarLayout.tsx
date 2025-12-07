import { ReactNode } from 'react';

interface CalendarLayoutProps {
  children: ReactNode;
}

export function CalendarLayout({ children }: CalendarLayoutProps) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex flex-col flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
