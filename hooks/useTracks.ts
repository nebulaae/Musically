"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAudio } from "@/components/player/AudioContext";
import { Track } from "@/db/models/tracks.model";

// Create a global cache for track data with better typing
interface CacheEntry {
  data: Track[];
  timestamp: number;
  expiryTime: number;
}

interface TracksCache {
  [key: string]: CacheEntry
}

// Move cache outside of the component to persist between renders
const tracksCache: TracksCache = {};
const CACHE_EXPIRY = 60 * 60 * 1000; // 1 hours

// Add localStorage persistence for the cache
const initializeCache = () => {
  try {
    const savedCache = localStorage.getItem('tracksCache');
    if (savedCache) {
      const parsedCache = JSON.parse(savedCache);

      // Validate cache entries and remove expired ones
      const now = Date.now();
      Object.keys(parsedCache).forEach(key => {
        const entry = parsedCache[key];
        if (entry && entry.timestamp && now - entry.timestamp < entry.expiryTime) {
          tracksCache[key] = entry;
        }
      });
    }
  } catch (error) {
    console.error('Error loading cache from localStorage:', error);
  }
};

// Initialize cache on module load
if (typeof window !== 'undefined') {
  initializeCache();
}

// Save cache to localStorage
const saveCache = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('tracksCache', JSON.stringify(tracksCache));
    } catch (error) {
      console.error('Error saving cache to localStorage:', error);
    }
  }
};

export const useTracks = (...trackNames: string[]) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    playTrackAtIndex,
    isPlaying,
    togglePlayPause,
    currentTime,
    duration
  } = useAudio();

  // Create a stable cache key from trackNames
  const cacheKey = useMemo(() =>
    trackNames.length > 0 ? trackNames.sort().join(',') : 'all-tracks',
    [trackNames]
  );

  useEffect(() => {
    // Set up AbortController for fetch
    abortControllerRef.current = new AbortController();

    isMountedRef.current = true;

    const fetchTracks = async () => {
      try {
        // Check cache first
        const cachedData = tracksCache[cacheKey];
        const now = Date.now();

        if (cachedData && (now - cachedData.timestamp) < cachedData.expiryTime) {
          if (isMountedRef.current) {
            setTracks(cachedData.data);
            setIsLoading(false);
          }
          return;
        }

        if (isMountedRef.current) setIsLoading(true);

        let url = '/api/tracks';
        // If track names are provided, add them as query parameters
        if (trackNames.length > 0) {
          const queryParams = new URLSearchParams();
          trackNames.forEach(name => queryParams.append('tracks', name));
          url = `${url}?${queryParams.toString()}`;
        }

        const response = await fetch(url, {
          signal: abortControllerRef.current?.signal,
          // Add cache control headers
          headers: {
            'Cache-Control': 'max-age=6000', // 1 hour
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch tracks: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          // Update cache
          tracksCache[cacheKey] = {
            data,
            timestamp: now,
            expiryTime: CACHE_EXPIRY
          };

          // Save cache to localStorage
          saveCache();

          if (isMountedRef.current) {
            setTracks(data);
            setError(null);
          }
        } else {
          if (isMountedRef.current) {
            setError('No tracks found. Please add some music files to the tracks directory.');
          }
        }
      } catch (err) {
        // Don't log aborted requests as errors
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }

        console.error('Error fetching tracks:', err);
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'Unknown error fetching tracks');
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    fetchTracks();

    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, [cacheKey]); // Depend only on the memoized cacheKey

  // Memoize track selection handler to prevent unnecessary re-renders
  const handleTrackSelect = useCallback((index: number) => {
    playTrackAtIndex(index, tracks);
  }, [playTrackAtIndex, tracks]);

  // Return memoized values
  return useMemo(() => ({
    tracks,
    isPlaying,
    isLoading,
    error,
    currentTime,
    duration,
    handleTrackSelect,
    handlePlayPauseToggle: togglePlayPause
  }), [
    tracks,
    isPlaying,
    isLoading,
    error,
    currentTime,
    duration,
    handleTrackSelect,
    togglePlayPause
  ]);
};