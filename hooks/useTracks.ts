"use client";

import { Track } from "@/db/models/tracks.model";
import { useAudio } from "@/components/player/AudioContext";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";

interface CacheEntry {
  data: Track[];
  timestamp: number;
  expiryTime: number;
  total?: number;
  totalPages?: number;
}

interface TracksCache {
  [key: string]: CacheEntry;
}

// Shared cache implementation
export const createTracksCache = () => {
  const CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour
  const MAX_CACHE_ENTRIES = 50;

  // In-memory cache
  const memoryCache: TracksCache = {};

  // Initialize cache from localStorage
  const initializeCache = () => {
    try {
      if (typeof window === 'undefined') return;

      const savedCache = localStorage.getItem("tracksCache");
      if (!savedCache) return;

      const parsedCache = JSON.parse(savedCache);
      const now = Date.now();

      // Only load valid entries
      Object.keys(parsedCache).forEach((key) => {
        const entry = parsedCache[key];
        if (entry && entry.timestamp && now - entry.timestamp < entry.expiryTime) {
          memoryCache[key] = entry;
        }
      });
    } catch (error) {
      console.error("Error loading cache from localStorage:", error);
    }
  };

  // Save cache to localStorage
  const saveCache = () => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem("tracksCache", JSON.stringify(memoryCache));
    } catch (error) {
      console.error("Error saving cache to localStorage:", error);

      // If storage is full, clear older entries
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        cleanCache();
        try {
          localStorage.setItem("tracksCache", JSON.stringify(memoryCache));
        } catch (e) {
          // If still failing, clear all cache
          Object.keys(memoryCache).forEach(key => delete memoryCache[key]);
          localStorage.removeItem("tracksCache");
        }
      }
    }
  };

  // Clean old entries from cache
  const cleanCache = () => {
    const now = Date.now();

    // Remove expired entries
    Object.keys(memoryCache).forEach(key => {
      if (now - memoryCache[key].timestamp > memoryCache[key].expiryTime) {
        delete memoryCache[key];
      }
    });

    // If still too many entries, remove oldest ones
    const entries = Object.entries(memoryCache);
    if (entries.length > MAX_CACHE_ENTRIES) {
      entries
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)
        .slice(0, entries.length - MAX_CACHE_ENTRIES)
        .forEach(([key]) => {
          delete memoryCache[key];
        });
    }
  };

  // Get data from cache
  const getCachedData = (key: string): CacheEntry | null => {
    const entry = memoryCache[key];
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.expiryTime) {
      delete memoryCache[key];
      return null;
    }

    return entry;
  };

  // Store data in cache
  const setCachedData = (key: string, data: Track[], total?: number, totalPages?: number) => {
    memoryCache[key] = {
      data,
      timestamp: Date.now(),
      expiryTime: CACHE_EXPIRY,
      total,
      totalPages
    };

    // Clean cache before saving
    cleanCache();
    saveCache();
  };

  // Initialize cache
  if (typeof window !== 'undefined') {
    initializeCache();
  }

  return {
    getCachedData,
    setCachedData,
    cleanCache
  };
};

// Create singleton cache instance
const tracksCache = createTracksCache();

// Track request state to avoid duplicate fetches
const pendingRequests = new Map<string, Promise<any>>();

export const useTracks = (options?: { trackNames?: string[]; page?: number; limit?: number; search?: string }) => {
  const { trackNames = [], page = 1, limit = 10, search = "" } = options || {};

  const [tracks, setTracks] = useState<Track[]>([]);
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalTracks, setTotalTracks] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(page);
  const isMountedRef = useRef(true);

  const { playTrackAtIndex, isPlaying, togglePlayPause, currentTime, duration } = useAudio();

  // Create a stable cache key
  const cacheKey = useMemo(() => {
    const baseKey = trackNames.length > 0
      ? trackNames.sort().join(",")
      : "all-tracks";

    const searchParam = search ? `-search-${search}` : '';
    return `${baseKey}${searchParam}-page${currentPage}-limit${limit}`;
  }, [trackNames, currentPage, limit, search]);

  // Navigate between pages
  const goToPage = useCallback((newPage: number) => {
    if (newPage !== currentPage) setCurrentPage(newPage);
  }, [currentPage]);

  // Fetch tracks with deduplication of concurrent requests
  const fetchTracksData = useCallback(async (cacheKey: string, url: string) => {
    // Check if there's already a pending request for this cache key
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey);
    }

    const fetchPromise = fetch(url, {
      headers: { "Cache-Control": "max-age=6000" },
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch tracks: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .finally(() => {
        // Remove from pending requests when done
        pendingRequests.delete(cacheKey);
      });

    // Store the promise to deduplicate concurrent requests
    pendingRequests.set(cacheKey, fetchPromise);
    return fetchPromise;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    const fetchTracks = async () => {
      try {
        // Check for cached data first
        const cachedData = tracksCache.getCachedData(cacheKey);

        if (cachedData) {
          if (isMountedRef.current) {
            setTracks(cachedData.data);
            setTotalTracks(cachedData.total ?? cachedData.data.length);
            setTotalPages(cachedData.totalPages || 1);
            setIsLoading(false);

            // Update allTracks from cache
            setAllTracks((prevAllTracks) => {
              const newAllTracks = [...prevAllTracks];
              const startIndex = (currentPage - 1) * limit;

              for (let i = 0; i < cachedData.data.length; i++) {
                newAllTracks[startIndex + i] = cachedData.data[i];
              }

              return newAllTracks.filter(Boolean);
            });
          }
          return;
        }

        if (isMountedRef.current) setIsLoading(true);

        const queryParams = new URLSearchParams();
        queryParams.append("page", currentPage.toString());
        queryParams.append("limit", limit.toString());

        // Add search parameter if provided
        if (search) {
          queryParams.append("search", search);
        }

        // Add track names if provided
        trackNames.forEach((name) => queryParams.append("tracks", name));

        const url = `/api/tracks?${queryParams.toString()}`;

        // Use the deduplication function
        const data = await fetchTracksData(cacheKey, url);

        if (data?.tracks && Array.isArray(data.tracks)) {
          // Cache the response
          tracksCache.setCachedData(
            cacheKey,
            data.tracks,
            data.total,
            data.totalPages
          );

          if (isMountedRef.current) {
            setTracks(data.tracks);
            setTotalTracks(data.total);
            setTotalPages(data.totalPages);
            setError(null);

            // Update allTracks with requested page data
            setAllTracks((prevAllTracks) => {
              const newAllTracks = [...prevAllTracks];
              const startIndex = (currentPage - 1) * limit;

              for (let i = 0; i < data.tracks.length; i++) {
                if (data.tracks[i]) {
                  newAllTracks[startIndex + i] = data.tracks[i];
                }
              }

              return newAllTracks.filter(Boolean);
            });
          }
        } else {
          if (isMountedRef.current) {
            setError("No tracks found or invalid response format.");
          }
        }
      } catch (err) {
        console.error("Error fetching tracks:", err);
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (isMountedRef.current) setIsLoading(false);
      }
    };

    fetchTracks();

    return () => {
      isMountedRef.current = false;
    };
  }, [cacheKey, currentPage, limit, fetchTracksData]);

  const handleTrackSelect = useCallback((index: number, trackList?: Track[]) => {
    // If a specific track list is provided, use it directly
    if (trackList && trackList.length > 0) {
      playTrackAtIndex(index, trackList);
      return;
    }

    // Fallback to using all tracks
    const tracksToUse = allTracks.length > 0 ? allTracks : tracks;
    playTrackAtIndex(index, tracksToUse);
  }, [playTrackAtIndex, tracks, allTracks]);

  // Clean up cache periodically (every 5 minutes)
  useEffect(() => {
    const intervalId = setInterval(() => {
      tracksCache.cleanCache();
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  return useMemo(
    () => ({
      tracks,
      allTracks,
      isPlaying,
      isLoading,
      error,
      currentTime,
      duration,
      totalTracks,
      totalPages,
      currentPage,
      goToPage,
      handleTrackSelect,
      handlePlayPauseToggle: togglePlayPause,
    }),
    [tracks, allTracks, isPlaying, isLoading, error, currentTime, duration, totalTracks, totalPages, currentPage, goToPage, handleTrackSelect, togglePlayPause]
  );
};