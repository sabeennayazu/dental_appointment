'use client';

import { useState, useEffect } from 'react';
import { Doctor } from '@/lib/types';
import { getDoctors } from '@/lib/api/calendar';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DoctorSelectorProps {
  selectedDoctor: Doctor | null;
  onSelect: (doctor: Doctor) => void;
  className?: string;
}

export function DoctorSelector({ selectedDoctor, onSelect, className }: DoctorSelectorProps) {
  const [open, setOpen] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // Initial load of doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const data = await getDoctors();
        setDoctors(data);
      } catch (error) {
        console.error('Error fetching doctors:', error);
      } finally {
        setLoading(false);
      }
    };

    if (doctors.length === 0) {
      fetchDoctors();
    }
  }, [doctors.length]);

  const handleSearch = async (search: string) => {
    setSearchValue(search);
    if (search.length === 0) {
      const data = await getDoctors();
      setDoctors(data);
    } else {
      // Filter doctors based on search
      const filtered = doctors.filter((d) =>
        d.name.toLowerCase().includes(search.toLowerCase())
      );
      setDoctors(filtered);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-[250px] justify-between', className)}
        >
          {selectedDoctor ? (
            <span className="truncate">{selectedDoctor.name}</span>
          ) : (
            'Select doctor...'
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search doctors..."
            value={searchValue}
            onValueChange={handleSearch}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? 'Loading doctors...' : 'No doctors found.'}
            </CommandEmpty>
            <CommandGroup>
              {doctors.map((doctor) => (
                <CommandItem
                  key={doctor.id}
                  value={doctor.id.toString()}
                  onSelect={() => {
                    onSelect(doctor);
                    setOpen(false);
                    setSearchValue('');
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedDoctor?.id === doctor.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {doctor.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
