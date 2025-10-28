import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

export interface Service {
  id: number;
  title: string;
  description: string;
  icon: ReactNode;
}

export interface Benefit {
  title: string;
  description: string;
  icon: ReactNode;
}

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  rating: number;
}

export interface Doctor {
  id: number;
  name: string;
  service: string;
}

export interface FormData {
  name: string;
  email: string;
  phone: string;
  service: string;
  doctor: string;
  date: string;
  time: string;
  message: string;
}