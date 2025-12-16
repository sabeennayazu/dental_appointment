'use client';

import { useState, useEffect } from 'react';
import { Doctor, Service } from '@/lib/types';
import { getDoctorsByService, getServices } from '@/lib/api/services';
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

interface ServiceDoctorSelectorProps {
  selectedDoctor: Doctor | null;
  selectedService: Service | null;
  onDoctorSelect: (doctor: Doctor) => void;
  onServiceSelect: (service: Service) => void;
  className?: string;
}

export function ServiceDoctorSelector({ 
  selectedDoctor, 
  selectedService,
  onDoctorSelect, 
  onServiceSelect,
  className 
}: ServiceDoctorSelectorProps) {
  const [serviceOpen, setServiceOpen] = useState(false);
  const [doctorOpen, setDoctorOpen] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [internalSelectedDoctor, setInternalSelectedDoctor] = useState<Doctor | null>(selectedDoctor);

  // Sync internal state with prop state
  useEffect(() => {
    setInternalSelectedDoctor(selectedDoctor);
  }, [selectedDoctor]);

  // Load services on mount
  useEffect(() => {
    const fetchServices = async () => {
      setLoadingServices(true);
      try {
        const data = await getServices();
        setServices(data);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, []); // Remove dependency on services.length to prevent infinite loops

  // Load doctors when service changes
  useEffect(() => {
    const fetchDoctors = async () => {
      if (!selectedService) {
        setDoctors([]);
        return;
      }

      setLoadingDoctors(true);
      try {
        const data = await getDoctorsByService(selectedService.id);
        setDoctors(data);
      } catch (error) {
        console.error('Error fetching doctors:', error);
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, [selectedService]);

  const handleServiceSelect = (service: Service) => {
    console.log('Service selected:', service);
    onServiceSelect(service);
    setServiceOpen(false);
    // Clear selected doctor when service changes
    setInternalSelectedDoctor(null);
    onDoctorSelect(null as any);
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    console.log('Doctor selected:', doctor);
    setInternalSelectedDoctor(doctor);
    onDoctorSelect(doctor);
    setDoctorOpen(false);
  };

  return (
    <div className={cn('flex items-center space-x-3', className)}>
      {/* Service Selector */}
      <Popover open={serviceOpen} onOpenChange={setServiceOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={serviceOpen}
            className="w-[200px] justify-between"
          >
            {selectedService ? (
              <span className="truncate">{selectedService.name}</span>
            ) : (
              'Select service...'
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-1">
  {services.map(service => (
    <button
      key={service.id}
      type="button"
      onClick={() => handleServiceSelect(service)}
      className={cn(
        "w-full px-3 py-2 text-left text-sm hover:bg-muted rounded",
        selectedService?.id === service.id && "bg-muted"
      )}
    >
      {service.name}
    </button>
  ))}
</PopoverContent>

      </Popover>

      {/* Doctor Selector */}
      <Popover open={doctorOpen} onOpenChange={setDoctorOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={doctorOpen}
            className="w-[200px] justify-between"
            disabled={!selectedService}
          >
            {internalSelectedDoctor ? (
              <span className="truncate">{internalSelectedDoctor.name}</span>
            ) : (
              selectedService ? 'Select doctor...' : 'Select service first'
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
       <PopoverContent className="w-[200px] p-1">
  {doctors.map(doctor => (
    <button
      key={doctor.id}
      type="button"
      onClick={() => handleDoctorSelect(doctor)}
      className={cn(
        "w-full px-3 py-2 text-left text-sm hover:bg-muted rounded",
        selectedService?.id === doctor.id && "bg-muted"
      )}
    >
      {doctor.name}
    </button>
  ))}
</PopoverContent>

      </Popover>
    </div>
  );
}
