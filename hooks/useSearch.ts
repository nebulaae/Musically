"use client"

import { useDebounce } from "./useDebounce";
import { Track } from "@/db/models/tracks.model";
import { useAudio } from "@/components/player/AudioContext";
import { useState, useEffect, useCallback, useMemo } from "react";

export const useSearch = () => {
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [searchResults, setSearchResults] = useState<Track[]>([]);
    const [allTracks, setAllTracks] = useState<Track[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const tracksPerPage = 10;

    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const { playTrackAtIndex } = useAudio();

    // Fetch all tracks only once when the hook mounts
    useEffect(() => {
        const fetchAllTracks = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('/api/tracks');

                if (!response.ok) {
                    throw new Error(`Ошибка при загрузке песен: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();

                if (data && data.tracks && Array.isArray(data.tracks)) {
                    setAllTracks(data.tracks);
                    setSearchResults(data.tracks); // Initially show all tracks
                } else {
                    setError('Песни не найдены. Возможно некорректный формат');
                }
            } catch (err) {
                console.error('Ошибка при загрузке песен:', err);
                setError(err instanceof Error ? err.message : 'Возникла неизвестная ошибка при загрузке песен.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllTracks();
    }, []);

    // Filter tracks based on debounced search query
    useEffect(() => {
        if (!debouncedSearchQuery.trim()) {
            setSearchResults(allTracks);
            return;
        }

        const normalizedQuery = debouncedSearchQuery.toLowerCase().trim();

        const filtered = allTracks.filter(track =>
            track.title.toLowerCase().includes(normalizedQuery) ||
            track.author.toLowerCase().includes(normalizedQuery) ||
            (track.album && track.album.toLowerCase().includes(normalizedQuery)) ||
            track.id.includes(normalizedQuery)
        );

        setSearchResults(filtered);
        // Reset to first page when results change
        setCurrentPage(1);
    }, [debouncedSearchQuery, allTracks]);

    // Handle search input change
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    }, []);

    // Handle track selection with correct index calculation
    const handleTrackSelect = useCallback((index: number) => {
        // The index passed from FetchTracks is relative to the current page
        // We need to adjust it to the actual index in searchResults
        const actualIndex = (currentPage - 1) * tracksPerPage + index;
        playTrackAtIndex(actualIndex, searchResults);
    }, [playTrackAtIndex, searchResults, currentPage]);

    const totalPages = useMemo(() =>
        Math.max(1, Math.ceil(searchResults.length / tracksPerPage)),
        [searchResults.length]
    );

    // Get current tracks for the current page
    const currentPageTracks = useMemo(() => {
        const startIndex = (currentPage - 1) * tracksPerPage;
        return searchResults.slice(startIndex, startIndex + tracksPerPage);
    }, [searchResults, currentPage]);

    return {
        searchQuery,
        searchResults,
        currentPageTracks,
        currentPage,
        setCurrentPage,
        totalPages,
        isLoading,
        error,
        handleSearchChange,
        handleTrackSelect
    };
};