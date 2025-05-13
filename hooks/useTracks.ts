"use client";

import { Track } from "@/server/models/track";
import { getProxiedTrackUrl } from "@/lib/utils";
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

// Creating a map to store aggregated tracks for each hook instance
const trackAggregates = new Map<string, Track[]>();

export const useTracks = (options?: { trackNames?: string[]; page?: number; limit?: number; search?: string }) => {
  const { trackNames = [], page = 1, limit = 10, search = "" } = options || {};

  // Determine if we're fetching by IDs or names
  const isFetchingByIds = useMemo(() => {
    return trackNames.length > 0 && trackNames.every(track => !isNaN(Number(track)));
  }, [trackNames]);

  // Create a unique identifier for this hook instance
  const instanceId = useMemo(() => {
    // For ID-based fetching, we use a different prefix
    const prefix = isFetchingByIds ? "tracks-by-id" : "tracks";
    return trackNames.length > 0
      ? `${prefix}-${trackNames.sort().join(",")}-${search}`
      : `all-tracks-${search}`;
  }, [trackNames, search, isFetchingByIds]);

  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalTracks, setTotalTracks] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(page);
  const isMountedRef = useRef(true);

  // Get from AudioContext
  const { playTrackAtIndex, isPlaying, togglePlayPause, currentTime, duration } = useAudio();

  // Initialize this instance's aggregate tracks if needed
  useEffect(() => {
    if (!trackAggregates.has(instanceId)) {
      trackAggregates.set(instanceId, []);
    }

    // Cleanup on unmount
    return () => {
      // Consider whether to remove this instance's data on unmount
      // trackAggregates.delete(instanceId);
    };
  }, [instanceId]);

  const cacheKey = useMemo(() => {
    const baseKey = isFetchingByIds
      ? `tracks-by-id-${trackNames.sort().join(",")}`
      : trackNames.length > 0
        ? `tracks-by-name-${trackNames.sort().join(",")}`
        : "all-tracks";
    const searchParam = search ? `-search-${search}` : '';
    return `${baseKey}${searchParam}-page${currentPage}-limit${limit}`;
  }, [trackNames, currentPage, limit, search, isFetchingByIds]);

  const goToPage = useCallback((newPage: number) => {
    if (newPage !== currentPage) setCurrentPage(newPage);
  }, [currentPage]);

  const fetchTracksData = useCallback(async (cacheKey: string, url: string) => {
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
        pendingRequests.delete(cacheKey);
      });
    pendingRequests.set(cacheKey, fetchPromise);
    return fetchPromise;
  }, []);

  // This effect handles fetching and updating tracks without causing infinite loops
  useEffect(() => {
    isMountedRef.current = true;

    const fetchTracks = async () => {
      try {
        const cachedData = tracksCache.getCachedData(cacheKey);

        if (cachedData) {
          if (isMountedRef.current) {
            // Apply proxy URL transformation to cached data
            const proxiedCachedTracks = cachedData.data.map(track => ({
              ...track,
              src: getProxiedTrackUrl(track.id)
            }));

            setTracks(proxiedCachedTracks);
            setTotalTracks(cachedData.total ?? cachedData.data.length);
            setTotalPages(cachedData.totalPages || 1);
            setIsLoading(false);

            // Update the aggregate collection outside of render cycles
            const startIndex = (currentPage - 1) * limit;
            const aggregate = trackAggregates.get(instanceId) || [];

            // Fill in the correct slots with the new tracks
            for (let i = 0; i < proxiedCachedTracks.length; i++) {
              if (startIndex + i < aggregate.length) {
                aggregate[startIndex + i] = proxiedCachedTracks[i];
              } else {
                aggregate.push(proxiedCachedTracks[i]);
              }
            }

            // Store back in the map
            trackAggregates.set(instanceId, aggregate.filter(Boolean));
          }
          return;
        }

        if (isMountedRef.current) setIsLoading(true);

        const queryParams = new URLSearchParams();
        queryParams.append("page", currentPage.toString());
        queryParams.append("limit", limit.toString());
        if (search) queryParams.append("search", search);

        // Handle both ID-based and name-based fetching
        if (isFetchingByIds) {
          // For ID-based fetching, use 'tracks' parameter which the backend will interpret as IDs
          trackNames.forEach((id) => queryParams.append("tracks", id));
        } else {
          // For name-based fetching (as per original implementation)
          trackNames.forEach((name) => queryParams.append("tracks", name));
        }

        // Fetching from the frontend API route that forwards to the backend
        const url = `/api/tracks?${queryParams.toString()}`;

        const data = await fetchTracksData(cacheKey, url);

        if (data?.tracks && Array.isArray(data.tracks)) {
          // Apply proxy URL transformation to fetched data
          const proxiedFetchedTracks = data.tracks.map((track: Track) => ({
            ...track,
            src: getProxiedTrackUrl(track.id)
          }));

          // Cache the data with proxied URLs
          tracksCache.setCachedData(
            cacheKey,
            proxiedFetchedTracks,
            data.total,
            data.totalPages
          );

          if (isMountedRef.current) {
            setTracks(proxiedFetchedTracks);
            setTotalTracks(data.total);
            setTotalPages(data.totalPages);
            setError(null);

            // Update the aggregate collection outside of render cycles
            const startIndex = (currentPage - 1) * limit;
            const aggregate = trackAggregates.get(instanceId) || [];

            // Fill in the correct slots with the new tracks
            for (let i = 0; i < proxiedFetchedTracks.length; i++) {
              if (startIndex + i < aggregate.length) {
                aggregate[startIndex + i] = proxiedFetchedTracks[i];
              } else {
                aggregate.push(proxiedFetchedTracks[i]);
              }
            }

            // Store back in the map
            trackAggregates.set(instanceId, aggregate.filter(Boolean));
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
  }, [cacheKey, currentPage, limit, fetchTracksData, instanceId, isFetchingByIds]);

  // Handle track selection without dependency on changing state
  const handleTrackSelect = useCallback((index: number, trackList?: Track[]) => {
    // Use the provided trackList if available
    if (trackList && trackList.length > 0) {
      playTrackAtIndex(index, trackList);
      return;
    }

    // Otherwise, use either the current tracks or the aggregate
    const aggregate = trackAggregates.get(instanceId) || [];

    // If we have aggregate tracks, use those; otherwise fall back to current page tracks
    const tracksToPlay = aggregate.length > 0 ? aggregate : tracks;
    playTrackAtIndex(index, tracksToPlay);
  }, [tracks, playTrackAtIndex, instanceId]);

  // Periodically clean the cache
  useEffect(() => {
    const intervalId = setInterval(() => {
      tracksCache.cleanCache();
    }, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Compute allTracks outside of the render cycle, based on the aggregate
  const getAllTracks = useCallback(() => {
    return trackAggregates.get(instanceId) || [];
  }, [instanceId]);

  // Return memoized state with a function to get allTracks
  return useMemo(
    () => ({
      tracks,
      allTracks: getAllTracks(),
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
    [
      tracks,
      getAllTracks,
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
      togglePlayPause
    ]
  );
};