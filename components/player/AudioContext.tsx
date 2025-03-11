// /context/AudioContext.tsx
"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';

interface Track {
  id: string;
  title: string;
  author: string;
  src: string;
  cover?: string;
}

interface AudioContextType {
    tracks: Track[];
    currentTrackIndex: number;
    isPlaying: boolean;
    volume: number;
    currentTime: number;
    duration: number;
    playTrack: (track: Track, trackList?: Track[]) => void;
    playTrackAtIndex: (index: number, trackList: Track[]) => void;
    togglePlayPause: () => void;
    nextTrack: () => void;
    prevTrack: () => void;
    setVolume: (value: number) => void;
    seekTo: (time: number) => void;
    hasNextTrack: boolean;
    hasPrevTrack: boolean;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (!context) {
        throw new Error('useAudio must be used within an AudioProvider');
    }
    return context;
};

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tracks, setTracks] = useState<Track[]>([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [volume, setVolume] = useState<number>(0.5);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const savedTimeRef = useRef<number>(0);

    // Load saved state from localStorage on initial render
    useEffect(() => {
        // Only run on client side
        if (typeof window !== 'undefined') {
            try {
                const savedState = localStorage.getItem('audioPlayerState');
                if (savedState) {
                    const parsedState = JSON.parse(savedState);

                    if (parsedState.tracks && parsedState.tracks.length > 0) {
                        setTracks(parsedState.tracks);
                        setCurrentTrackIndex(parsedState.currentTrackIndex || 0);
                        setVolume(parsedState.volume || 0.5);
                        savedTimeRef.current = parsedState.currentTime || 0;
                    }
                }
            } catch (error) {
                console.error('Error loading audio state from localStorage:', error);
            }
        }
    }, []);

    // Save state to localStorage when it changes
    useEffect(() => {
        if (tracks.length > 0) {
            const stateToSave = {
                tracks,
                currentTrackIndex,
                volume,
                currentTime
            };
            localStorage.setItem('audioPlayerState', JSON.stringify(stateToSave));
        }
    }, [tracks, currentTrackIndex, volume, currentTime]);

    // Initialize audio element
    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
        }

        const audio = audioRef.current;

        // Set up event listeners
        const handleLoadedMetadata = () => setDuration(audio.duration || 0);
        const handleTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
        const handleEnded = () => {
            if (hasNextTrack) {
                nextTrack();
            } else {
                setIsPlaying(false);
            }
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);

        // Set volume from state
        audio.volume = volume;

        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    // Effect for updating track source
    useEffect(() => {
        if (tracks.length > 0 && currentTrackIndex >= 0 && currentTrackIndex < tracks.length) {
            const currentTrack = tracks[currentTrackIndex];

            if (audioRef.current && currentTrack) {
                const audio = audioRef.current;

                // Save current time of previous track if it's the same track
                if (audio.src.includes(currentTrack.src)) {
                    savedTimeRef.current = audio.currentTime;
                } else {
                    savedTimeRef.current = 0;
                }

                // Update source
                audio.src = currentTrack.src;

                // After source is updated, set the saved time
                audio.addEventListener('loadedmetadata', () => {
                    audio.currentTime = savedTimeRef.current;
                    if (isPlaying) {
                        audio.play().catch(e => console.error("Play failed:", e));
                    }
                }, { once: true });
            }
        }
    }, [tracks, currentTrackIndex]);

    // Effect for play/pause
    useEffect(() => {
        if (audioRef.current && tracks.length > 0 && currentTrackIndex >= 0 && currentTrackIndex < tracks.length) {
            if (isPlaying) {
                audioRef.current.play().catch(e => console.error("Play failed:", e));
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying, tracks, currentTrackIndex]);

    // Effect for volume changes
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    // Calculate if there are next/previous tracks
    const hasNextTrack = useMemo(() => 
        tracks.length > 1 && currentTrackIndex < tracks.length - 1,
        [tracks, currentTrackIndex]
    );

    const hasPrevTrack = useMemo(() => 
        tracks.length > 1 && currentTrackIndex > 0,
        [tracks, currentTrackIndex]
    );

    // Play a specific track, optionally within a new track list
    const playTrack = useCallback((track: Track, trackList?: Track[]) => {
        if (trackList) {
            setTracks(trackList);
            const newIndex = trackList.findIndex(t => t.id === track.id);
            setCurrentTrackIndex(newIndex >= 0 ? newIndex : 0);
        } else {
            // If no track list is provided, create a single-item list
            setTracks([track]);
            setCurrentTrackIndex(0);
        }
        setIsPlaying(true);
    }, []);

    // Play a track at a specific index within a track list
    const playTrackAtIndex = useCallback((index: number, trackList: Track[]) => {
        setTracks(trackList);
        setCurrentTrackIndex(index);
        setIsPlaying(true);
    }, []);

    // Toggle play/pause
    const togglePlayPause = useCallback(() => {
        setIsPlaying(prev => !prev);
    }, []);

    // Next track
    const nextTrack = useCallback(() => {
        if (hasNextTrack) {
            setCurrentTrackIndex(prev => prev + 1);
            savedTimeRef.current = 0;
        }
    }, [hasNextTrack]);

    // Previous track
    const prevTrack = useCallback(() => {
        if (hasPrevTrack) {
            setCurrentTrackIndex(prev => prev - 1);
            savedTimeRef.current = 0;
        }
    }, [hasPrevTrack]);

    // Seek to a specific time
    const seekTo = useCallback((time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    }, []);

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        tracks,
        currentTrackIndex,
        isPlaying,
        volume,
        currentTime,
        duration,
        playTrack,
        playTrackAtIndex,
        togglePlayPause,
        nextTrack,
        prevTrack,
        setVolume,
        seekTo,
        hasNextTrack,
        hasPrevTrack
    }), [
        tracks,
        currentTrackIndex,
        isPlaying,
        volume,
        currentTime,
        duration,
        playTrack,
        playTrackAtIndex,
        togglePlayPause,
        nextTrack,
        prevTrack,
        hasNextTrack,
        hasPrevTrack
    ]);

    return (
        <AudioContext.Provider value={contextValue}>
            {children}
        </AudioContext.Provider>
    );
};