/** @jsxImportSource react */
import { Heart, UserCheck, HeartPulse, Activity, Smile, Users, ThumbsUp } from 'lucide-react';
import { Service, Benefit, Testimonial } from './types';
import { createElement } from 'react';

// Accept any icon component from lucide-react — keep typing permissive to avoid
// TypeScript errors when icons differ between versions.
const createIcon = (Icon: any) => createElement(Icon, { className: "h-6 w-6" });

export const services: Service[] = [
  {
    id: 1,
    title: "General Dentistry",
    description: "Regular checkups, cleanings, and preventive care for healthy teeth and gums.",
    // 'Tooth' is not available in some lucide-react sets; use Activity as a safe fallback
    icon: createIcon(Activity)
  },
  {
    id: 2,
    title: "Cosmetic Dentistry",
    description: "Enhance your smile with professional whitening, veneers, and aesthetic treatments.",
    icon: createIcon(Smile)
  },
  {
    id: 3,
    title: "Dental Surgery",
    description: "Advanced surgical procedures including implants and complex extractions.",
    icon: createIcon(HeartPulse)
  },
  {
    id: 4,
    title: "Orthodontics",
    description: "Straighten your teeth with braces, aligners, and other orthodontic solutions.",
    icon: createIcon(Activity)
  }
];

export const benefits: Benefit[] = [
  {
    title: "Experienced Team",
    description: "Our dentists have years of experience and ongoing education.",
    icon: createIcon(Users)
  },
  {
    title: "Patient-First Care",
    description: "We prioritize your comfort and provide personalized treatment plans.",
    icon: createIcon(Heart)
  },
  {
    title: "Modern Technology",
    description: "State-of-the-art equipment for precise and comfortable treatments.",
    icon: createIcon(UserCheck)
  },
  {
    title: "Guaranteed Results",
    description: "We ensure your satisfaction with our dental procedures.",
    icon: createIcon(ThumbsUp)
  }
];

export const testimonials = [
  {
    id: 1,
    name: "John Smith",
    role: "Regular Patient",
    content: "The best dental care I've ever received. Professional, caring, and modern facility.",
    rating: 5
  },
  {
    id: 2,
    name: "Sarah Jones",
    role: "New Patient",
    content: "Finally found a dental clinic that makes me feel comfortable and relaxed.",
    rating: 5
  },
  {
    id: 3,
    name: "Mike Brown",
    role: "Long-term Patient",
    content: "Excellent service, friendly staff, and very thorough with treatments.",
    rating: 4
  }
];