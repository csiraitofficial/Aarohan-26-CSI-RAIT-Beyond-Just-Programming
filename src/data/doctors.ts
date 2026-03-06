/**
 * Mock Doctor Data
 *
 * Used for doctor selection UI in moderate/emergency cases.
 * In production, this would come from a backend API.
 */

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  rating: number;
  availability: string;
  languages: string[];
  fee: string;
  avatar?: string; // URL or initials fallback
}

export const MOCK_DOCTORS: Doctor[] = [
  {
    id: 'doc-1',
    name: 'Dr. Priya Sharma',
    specialty: 'General Physician',
    experience: '12 years',
    rating: 4.8,
    availability: 'Available now',
    languages: ['English', 'Hindi'],
    fee: '₹300',
  },
  {
    id: 'doc-2',
    name: 'Dr. Rajesh Patel',
    specialty: 'Internal Medicine',
    experience: '18 years',
    rating: 4.9,
    availability: 'Available in 15 min',
    languages: ['English', 'Hindi', 'Gujarati'],
    fee: '₹500',
  },
  {
    id: 'doc-3',
    name: 'Dr. Anita Desai',
    specialty: 'Family Medicine',
    experience: '8 years',
    rating: 4.7,
    availability: 'Available now',
    languages: ['English', 'Hindi', 'Marathi'],
    fee: '₹250',
  },
  {
    id: 'doc-4',
    name: 'Dr. Suresh Kumar',
    specialty: 'Emergency Medicine',
    experience: '15 years',
    rating: 4.9,
    availability: 'Available now',
    languages: ['English', 'Hindi', 'Tamil'],
    fee: '₹600',
  },
];
