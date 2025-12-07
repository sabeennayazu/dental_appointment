import { useState, useEffect } from 'react';
import { Doctor } from '@/lib/types';
import { calendarApi } from '@/lib/api/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DoctorSelectorProps {
  selectedDoctor: number | null;
  onSelectDoctor: (doctorId: number | null) => void;
}

export function DoctorSelector({ selectedDoctor, onSelectDoctor }: DoctorSelectorProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const data = await calendarApi.getDoctors();
        setDoctors(data);
      } catch (err) {
        console.error('Error fetching doctors:', err);
        setError('Failed to load doctors');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const handleValueChange = (value: string) => {
    onSelectDoctor(value ? parseInt(value, 10) : null);
  };

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Loading doctors..." />
        </SelectTrigger>
      </Select>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-sm">
        {error}
      </div>
    );
  }

  return (
    <Select
      value={selectedDoctor?.toString() || ''}
      onValueChange={handleValueChange}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select a doctor" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">All Doctors</SelectItem>
        {doctors.map((doctor) => (
          <SelectItem key={doctor.id} value={doctor.id.toString()}>
            Dr. {doctor.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
