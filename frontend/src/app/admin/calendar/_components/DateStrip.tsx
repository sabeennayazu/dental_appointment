import { format, isToday } from 'date-fns';

interface DateStripProps {
  days: Date[];
  selectedDate: Date;
}

export function DateStrip({ days, selectedDate }: DateStripProps) {
  return (
    <div className="flex border-b border-gray-200">
      {/* Empty cell for time column alignment */}
      <div className="w-16 flex-shrink-0 border-r border-gray-200" />
      
      <div className="flex flex-1 overflow-x-auto">
        {days.map((day, index) => {
          const isSelected = isSameDay(day, selectedDate);
          return (
            <div 
              key={index}
              className={cn(
                'flex flex-col items-center justify-center flex-1 min-w-[120px] py-2 border-r border-gray-200',
                isSelected ? 'bg-blue-50' : 'bg-white',
                isToday(day) && 'font-semibold'
              )}
            >
              <div className="text-sm text-gray-500">
                {format(day, 'EEE')}
              </div>
              <div 
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full',
                  isSelected 
                    ? 'bg-blue-500 text-white' 
                    : isToday(day) 
                      ? 'text-blue-500' 
                      : 'text-gray-700'
                )}
              >
                {format(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Helper function to check if two dates are the same day
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// Helper function to combine class names
function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
