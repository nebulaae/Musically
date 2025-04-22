import { twMerge } from "tailwind-merge"
import { clsx, type ClassValue } from "clsx"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
};

// get proxied image
// Helper function to transform image URLs
export const getProxiedImageUrl = (coverPath: string): string => {
  // If it's already a full URL or the default cover, use it as is
  if (coverPath === '/default-cover.jpg' || coverPath.startsWith('data:') || coverPath.startsWith('http')) {
    return coverPath;
  }

  // If it's a cover path from our backend, use the proxy
  if (coverPath.startsWith('/covers/')) {
    const filename = coverPath.split('/').pop();
    return `/api/cover/${filename}`;
  }

  // Fallback to the default cover
  return '/default-cover.jpg';
};