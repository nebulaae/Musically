import { twMerge } from "tailwind-merge"
import { clsx, type ClassValue } from "clsx"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
};

// get proxied image
// Helper function to transform image URLs
export const getProxiedImageUrl = (coverPath: string): string => {
  // If it's a cover path from our backend, use the proxy
  if (coverPath.startsWith('/covers/')) {
    const filename = coverPath.split('/').pop();
    return `/api/cover/${filename}`;
  }

  // Fallback to the default cover
  return '/api/cover/default-cover.jpg';
};

// Helper function to transform track IDs into proxied stream URLs
export const getProxiedTrackUrl = (trackId: string): string => {
  if (!trackId) {
    console.warn("Attempted to get proxied URL for null/undefined trackId");
    return '';
  }
  return `/api/tracks/stream/${trackId}`;
};

// Pluralize
export const pluralize = (count: number, forms: [string, string, string]) => {
  const cases = [2, 0, 1, 1, 1, 2];
  return forms[
    count % 100 > 4 && count % 100 < 20
      ? 2
      : cases[
      count % 10 < 5
        ? count % 10
        : 5
      ]
  ];
};
