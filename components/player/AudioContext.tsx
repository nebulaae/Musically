"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';

interface Track {
  id: string;
  title: string;
  author: string;
  src: string;
  cover?: string;
  type?: string;
  album?: string;
}

interface AudioContextType {
    tracks: Track[];
    currentTrackIndex: number;
    isPlaying: boolean;
    volume: number;
    currentTime: number;
    duration: number;
    shuffleMode: boolean;
    repeatMode: boolean;
    playTrack: (track: Track, trackList?: Track[]) => void;
    playTrackAtIndex: (index: number, trackList: Track[]) => void;
    togglePlayPause: () => void;
    nextTrack: () => void;
    prevTrack: () => void;
    setVolume: (value: number) => void;
    seekTo: (time: number) => void;
    toggleShuffleMode: () => void;
    toggleRepeatMode: () => void;
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
    const [originalTracks, setOriginalTracks] = useState<Track[]>([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [volume, setVolume] = useState<number>(0.5);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [shuffleMode, setShuffleMode] = useState<boolean>(false);
    const [repeatMode, setRepeatMode] = useState<boolean>(false);

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
                        setOriginalTracks(parsedState.tracks);
                        setCurrentTrackIndex(parsedState.currentTrackIndex || 0);
                        setVolume(parsedState.volume || 0.5);
                        setShuffleMode(parsedState.shuffleMode || false);
                        setRepeatMode(parsedState.repeatMode || false);
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
                tracks: originalTracks.length > 0 ? originalTracks : tracks,
                currentTrackIndex,
                volume,
                currentTime,
                shuffleMode,
                repeatMode
            };
            localStorage.setItem('audioPlayerState', JSON.stringify(stateToSave));
        }
    }, [tracks, originalTracks, currentTrackIndex, volume, currentTime, shuffleMode, repeatMode]);

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
            if (repeatMode) {
                // Repeat the current track
                audio.currentTime = 0;
                audio.play().catch(e => console.error("Play failed:", e));
            } else if (hasNextTrack) {
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
    }, [repeatMode]);

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

    // Shuffle an array of tracks
    const shuffleTracks = useCallback((trackArray: Track[]) => {
        const shuffled = [...trackArray];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }, []);

    // Toggle shuffle mode
    const toggleShuffleMode = useCallback(() => {
        setShuffleMode(prev => {
            const newShuffleMode = !prev;
            
            if (newShuffleMode) {
                // Enabling shuffle: store original tracks and shuffle
                if (originalTracks.length === 0) {
                    setOriginalTracks([...tracks]);
                }
                
                // Get current track
                const currentTrack = tracks[currentTrackIndex];
                
                // Shuffle tracks but keep the current track at index 0
                const tracksWithoutCurrent = tracks.filter((_, idx) => idx !== currentTrackIndex);
                const shuffledRest = shuffleTracks(tracksWithoutCurrent);
                setTracks([currentTrack, ...shuffledRest]);
                setCurrentTrackIndex(0);
            } else {
                // Disabling shuffle: restore original track order
                if (originalTracks.length > 0) {
                    // Get current track
                    const currentTrack = tracks[currentTrackIndex];
                    
                    // Find current track in original tracks
                    const originalIndex = originalTracks.findIndex(t => t.id === currentTrack.id);
                    
                    setTracks([...originalTracks]);
                    setCurrentTrackIndex(originalIndex >= 0 ? originalIndex : 0);
                }
            }
            
            return newShuffleMode;
        });
    }, [tracks, currentTrackIndex, originalTracks, shuffleTracks]);

    // Toggle repeat mode
    const toggleRepeatMode = useCallback(() => {
        setRepeatMode(prev => !prev);
    }, []);

    // Play a specific track, optionally within a new track list
    const playTrack = useCallback((track: Track, trackList?: Track[]) => {
        if (trackList) {
            // Save original track list if shuffle is enabled
            if (shuffleMode) {
                setOriginalTracks(trackList);
                
                // Find track in the list
                const trackIndex = trackList.findIndex(t => t.id === track.id);
                
                // Create shuffled version but with selected track first
                const tracksWithoutSelected = trackList.filter(t => t.id !== track.id);
                const shuffledRest = shuffleTracks(tracksWithoutSelected);
                
                setTracks([track, ...shuffledRest]);
                setCurrentTrackIndex(0);
            } else {
                setTracks(trackList);
                const newIndex = trackList.findIndex(t => t.id === track.id);
                setCurrentTrackIndex(newIndex >= 0 ? newIndex : 0);
            }
        } else {
            // If no track list is provided, create a single-item list
            setTracks([track]);
            setOriginalTracks([track]);
            setCurrentTrackIndex(0);
        }
        setIsPlaying(true);
    }, [shuffleMode, shuffleTracks]);

    // Play a track at a specific index within a track list
    const playTrackAtIndex = useCallback((index: number, trackList: Track[]) => {
        if (shuffleMode) {
            setOriginalTracks(trackList);
            
            // Get selected track
            const selectedTrack = trackList[index];
            
            // Create shuffled version but with selected track first
            const tracksWithoutSelected = trackList.filter((_, idx) => idx !== index);
            const shuffledRest = shuffleTracks(tracksWithoutSelected);
            
            setTracks([selectedTrack, ...shuffledRest]);
            setCurrentTrackIndex(0);
        } else {
            setTracks(trackList);
            setCurrentTrackIndex(index);
        }
        setIsPlaying(true);
    }, [shuffleMode, shuffleTracks]);

    // Toggle play/pause
    const togglePlayPause = useCallback(() => {
        setIsPlaying(prev => !prev);
    }, []);

    // Next track
    const nextTrack = useCallback(() => {
        if (hasNextTrack) {
            setCurrentTrackIndex(prev => prev + 1);
            savedTimeRef.current = 0;
        } else if (repeatMode && tracks.length > 0) {
            // If repeat is enabled and we're at the end, go back to the first track
            setCurrentTrackIndex(0);
            savedTimeRef.current = 0;
        }
    }, [hasNextTrack, repeatMode, tracks.length]);

    // Previous track
    const prevTrack = useCallback(() => {
        if (hasPrevTrack) {
            setCurrentTrackIndex(prev => prev - 1);
            savedTimeRef.current = 0;
        } else if (repeatMode && tracks.length > 0) {
            // If repeat is enabled and we're at the beginning, go to the last track
            setCurrentTrackIndex(tracks.length - 1);
            savedTimeRef.current = 0;
        }
    }, [hasPrevTrack, repeatMode, tracks.length]);

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
        shuffleMode,
        repeatMode,
        playTrack,
        playTrackAtIndex,
        togglePlayPause,
        nextTrack,
        prevTrack,
        setVolume,
        seekTo,
        toggleShuffleMode,
        toggleRepeatMode,
        hasNextTrack,
        hasPrevTrack
    }), [
        tracks,
        currentTrackIndex,
        isPlaying,
        volume,
        currentTime,
        duration,
        shuffleMode,
        repeatMode,
        playTrack,
        playTrackAtIndex,
        togglePlayPause,
        nextTrack,
        prevTrack,
        hasNextTrack,
        hasPrevTrack,
        toggleShuffleMode,
        toggleRepeatMode
    ]);

    return (
        <AudioContext.Provider value={contextValue}>
            {children}
        </AudioContext.Provider>
    );
};