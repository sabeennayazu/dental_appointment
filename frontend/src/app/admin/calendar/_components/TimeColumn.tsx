export function TimeColumn() {
  // Generate time slots from 8 AM to 8 PM
  const timeSlots = Array.from({ length: 13 }, (_, i) => {
    const hour = i + 8; // Start from 8 AM
    return `${hour > 12 ? hour - 12 : hour} ${hour >= 12 ? 'PM' : 'AM'}`;
  });

  return (
    <div className="flex flex-col w-16 flex-shrink-0 border-r border-gray-200">
      {/* Empty cell for header alignment */}
      <div className="h-16 border-b border-gray-200" />
      
      {timeSlots.map((time, index) => (
        <div 
          key={index} 
          className="h-16 flex items-start justify-end pr-2 text-xs text-gray-500 border-b border-gray-100"
        >
          {time}
        </div>
      ))}
    </div>
  );
}
