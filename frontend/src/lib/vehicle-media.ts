import type { SyntheticEvent } from 'react';
import type { Vehicle } from '../types/api';

const images = [
  'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1600&q=85',
  'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1600&q=85',
  'https://images.unsplash.com/photo-1551830820-330a71b99659?auto=format&fit=crop&w=1600&q=85',
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1600&q=85',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=85',
];

export function imageForVehicle(vehicle: Pick<Vehicle, 'id' | 'category' | 'imageUrl'>) {
  if (vehicle.imageUrl) return vehicle.imageUrl;
  const index = [...vehicle.id].reduce((sum, character) => sum + character.charCodeAt(0), 0) % images.length;
  return images[index] ?? images[0];
}

export function fallbackImage(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  if (!image.src.endsWith('/northline-vehicle-fallback.svg')) image.src = '/northline-vehicle-fallback.svg';
}
