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

const tracksCache: TracksCache = {};
const CACHE_EXPIRY = 60 * 60 * 1000;

const initializeCache = () => {
  try {
    const savedCache = localStorage.getItem("tracksCache");
    if (savedCache) {
      const parsedCache = JSON.parse(savedCache);
      const now = Date.now();
      Object.keys(parsedCache).forEach((key) => {
        const entry = parsedCache[key];
        if (entry && entry.timestamp && now - entry.timestamp < entry.expiryTime) {
          tracksCache[key] = entry;
        }
      });
    }
  } catch (error) {
    console.error("Error loading cache from localStorage:", error);
  }
};

if (typeof window !== "undefined") {
  initializeCache();
}

const saveCache = () => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("tracksCache", JSON.stringify(tracksCache));
    } catch (error) {
      console.error("Error saving cache to localStorage:", error);
    }
  }
};

export const useTracks = (options?: { trackNames?: string[]; page?: number; limit?: number }) => {
  const { trackNames = [], page = 1, limit = 10 } = options || {};

  const [tracks, setTracks] = useState<Track[]>([]);
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalTracks, setTotalTracks] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(page);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadedPagesRef = useRef<Set<number>>(new Set());

  const { playTrackAtIndex, isPlaying, togglePlayPause, currentTime, duration } = useAudio();

  const cacheKey = useMemo(() => {
    const baseKey = trackNames.length > 0 ? trackNames.sort().join(",") : "all-tracks";
    return `${baseKey}-page${currentPage}-limit${limit}`;
  }, [trackNames, currentPage, limit]);

  const goToPage = useCallback((newPage: number) => {
    if (newPage !== currentPage) setCurrentPage(newPage);
  }, [currentPage]);

  useEffect(() => {
    abortControllerRef.current = new AbortController();
    isMountedRef.current = true;

    const fetchTracks = async () => {
      try {
        abortControllerRef.current = new AbortController();
        isMountedRef.current = true;

        const cachedData = tracksCache[cacheKey];
        const now = Date.now();

        if (cachedData && now - cachedData.timestamp < cachedData.expiryTime) {
          if (isMountedRef.current) {
            setTracks(cachedData.data);
            setTotalTracks(cachedData.total ?? cachedData.data.length);
            setTotalPages(cachedData.totalPages || 1);
            setIsLoading(false);
          }
          return;
        }

        if (isMountedRef.current) setIsLoading(true);

        const queryParams = new URLSearchParams();
        queryParams.append("page", currentPage.toString());
        queryParams.append("limit", limit.toString());
        trackNames.forEach((name) => queryParams.append("tracks", name));

        const url = `/api/tracks?${queryParams.toString()}`;
        const response = await fetch(url, {
          signal: abortControllerRef.current?.signal,
          headers: { "Cache-Control": "max-age=6000" },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch tracks: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data?.tracks && Array.isArray(data.tracks)) {
          tracksCache[cacheKey] = {
            data: data.tracks,
            timestamp: now,
            expiryTime: CACHE_EXPIRY,
            total: data.total,
            totalPages: data.totalPages,
          };

          saveCache();

          if (isMountedRef.current) {
            setTracks(data.tracks);
            setTotalTracks(data.total);
            setTotalPages(data.totalPages);
            setError(null);

            // Update allTracks safely using a functional update
            setAllTracks((prevAllTracks) => {
              const newAllTracks = [...prevAllTracks];
              const startIndex = (currentPage - 1) * limit;

              for (let i = 0; i < data.tracks.length; i++) {
                newAllTracks[startIndex + i] = data.tracks[i];
              }

              return newAllTracks.filter((track) => track !== undefined);
            });
          }
        } else {
          if (isMountedRef.current) {
            setError("No tracks found or invalid response format.");
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("Error fetching tracks:", err);
        if (isMountedRef.current) setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (isMountedRef.current) setIsLoading(false);
      }
    };

    fetchTracks();

    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, [cacheKey]);

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
