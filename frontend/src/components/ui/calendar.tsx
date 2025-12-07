'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';

type CalendarProps = React.ComponentProps<typeof DayPicker>;

// Custom Navbar component for react-day-picker
function CustomNavbar(props: any) {
  const { onPreviousClick, onNextClick, ...rest } = props;
  return (
    <nav className="flex items-center justify-between">
      <button
        onClick={onPreviousClick}
        className="h-9 w-9 bg-transparent p-0 text-gray-600 hover:bg-gray-100 rounded-md inline-flex items-center justify-center"
        aria-label="Previous month"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div className="flex-1" />
      <button
        onClick={onNextClick}
        className="h-9 w-9 bg-transparent p-0 text-gray-600 hover:bg-gray-100 rounded-md inline-flex items-center justify-center"
        aria-label="Next month"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

const Calendar = ({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) => {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        nav: 'space-x-1 flex items-center justify-between',
        nav_button:
          'h-9 w-9 bg-transparent p-0 text-gray-600 hover:bg-gray-100 rounded-md inline-flex items-center justify-center',
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell: 'text-gray-500 rounded-md w-9 font-normal text-[0.8rem]',
        row: 'flex w-full mt-2',
        cell: 'h-9 w-9 text-center text-sm p-0 relative',
        day: 'h-9 w-9 p-0 font-normal hover:bg-gray-100 rounded-md flex items-center justify-center',
        day_selected: 'bg-blue-500 text-white hover:bg-blue-600',
        day_today: 'bg-gray-100 font-bold',
        day_outside: 'text-gray-400',
        day_disabled: 'text-gray-300',
        ...classNames,
      }}
      components={{
        Navbar: CustomNavbar as any,
      } as any}
      {...props}
    />
  );
};

Calendar.displayName = 'Calendar';

export { Calendar };

export type { CalendarProps };
