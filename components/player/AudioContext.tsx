"use client"

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
    useRef,
} from 'react';

// Interfaces
interface Track {
    id: string;
    title: string;
    author: string;
    src: string;
    cover?: string;
    type?: string;
    album?: string;
}

// Reverted RepeatMode to boolean
interface AudioContextType {
    tracks: Track[];
    currentTrack: Track | null;
    currentTrackIndex: number | null;
    isPlaying: boolean;
    volume: number;
    currentTime: number;
    duration: number;
    shuffleMode: boolean;
    repeatMode: boolean; // boolean: true = repeat current, false = none
    isLoading: boolean;
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
    const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [volume, setVolume] = useState<number>(0.5);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [shuffleMode, setShuffleMode] = useState<boolean>(false);
    // ***** State reverted to boolean *****
    const [repeatMode, setRepeatMode] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const isSeekingRef = useRef<boolean>(false);
    const currentPlayPromiseRef = useRef<Promise<void> | null>(null);
    const lastUpdateTimeRef = useRef<number>(0);
    const shouldAutoPlayRef = useRef(false);

    // --- Utilities ---

    const shuffleTracks = useCallback((trackArray: Track[]) => {
        const shuffled = [...trackArray];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }, []);

    // ***** Updated toggleRepeatMode for boolean *****
    const toggleRepeatMode = useCallback(() => {
        setRepeatMode(prev => !prev);
    }, []);

    // --- Derived State ---

    const currentTrack = useMemo<Track | null>(() => {
        if (currentTrackIndex !== null && tracks.length > 0 && tracks[currentTrackIndex]) {
            return tracks[currentTrackIndex];
        }
        return null;
    }, [tracks, currentTrackIndex]);

    // ***** hasNext/Prev doesn't depend on boolean repeatMode *****
    const hasNextTrack = useMemo(() => {
        if (tracks.length === 0 || currentTrackIndex === null) return false;
        return currentTrackIndex < tracks.length - 1;
    }, [tracks, currentTrackIndex]);

    const hasPrevTrack = useMemo(() => {
        if (tracks.length === 0 || currentTrackIndex === null) return false;
        return currentTrackIndex > 0;
    }, [tracks, currentTrackIndex]);

    // --- Core Audio Logic ---

    // Refined setAudioSource: Sets state (isPlaying) but lets useEffect handle the actual play() call
    const setAudioSource = useCallback((track: Track, playWhenReady: boolean) => {
        const audio = audioRef.current;
        if (!audio || !track) return;

        setIsLoading(true); // Start loading indicator

        if (audio.src !== track.src) {
            console.log(`Setting new audio source: ${track.src}`);
            // Interaction before changing src
            currentPlayPromiseRef.current?.catch(() => {/* ignore abort */ }); // Handle pending promise
            currentPlayPromiseRef.current = null;
            if (!audio.paused) audio.pause(); // Pause if playing

            // Set new source and reset state
            audio.src = track.src;
            audio.preload = "auto";
            audio.currentTime = 0; // Reset audio element time
            setCurrentTime(0);     // Reset React state time
            setDuration(0);        // Reset duration until loadedmetadata

            // Set intended play state, let effect handle play() call
            setIsPlaying(playWhenReady);
            if (!playWhenReady) setIsLoading(false); // If not playing, loading finishes here

        } else {
            console.log("Audio source is the same.");
            // Source is the same, just handle play/pause intent
            if (playWhenReady && audio.paused) {
                setIsPlaying(true); // Let effect handle play()
                // Try immediate play for responsiveness
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    currentPlayPromiseRef.current = playPromise;
                    playPromise.catch(error => {
                        if (error.name !== 'AbortError') {
                            setIsPlaying(false);
                            setIsLoading(false);
                        }
                    });
                }
            } else if (!playWhenReady && !audio.paused) {
                audio.pause(); // Pause directly
                setIsPlaying(false);
                setIsLoading(false);
            } else {
                // State matches intent, ensure loading is off
                setIsLoading(false);
            }
        }
    }, []); // Minimal dependencies, relies on closure for state setters


    // --- Playback Control ---

    const seekTo = useCallback((time: number) => {
        const audio = audioRef.current;
        if (audio && isFinite(time)) {
            const targetTime = Math.max(0, Math.min(time, audio.duration || Infinity));
            isSeekingRef.current = true;
            setCurrentTime(targetTime);
            audio.currentTime = targetTime;
            // 'seeked' event handles setting isSeekingRef false and resuming play if needed
        }
    }, []);

    const playTrack = useCallback((track: Track, trackList?: Track[]) => {
        let newIndex = 0;
        let newTracks = tracks;
        let newOriginalTracks = originalTracks;

        if (trackList) {
            newOriginalTracks = [...trackList]; // Always update original list
            if (shuffleMode) {
                // Shuffle the new list, keeping the selected track first
                const selectedTrack = trackList.find(t => t.id === track.id) || track; // Find or use the passed track
                const others = trackList.filter(t => t.id !== selectedTrack.id);
                newTracks = [selectedTrack, ...shuffleTracks(others)];
                newIndex = 0; // Selected track is now at index 0
            } else {
                newTracks = [...trackList];
                newIndex = newTracks.findIndex(t => t.id === track.id);
                if (newIndex === -1) newIndex = 0; // Fallback
            }
        } else {
            // Playing a single track not part of the current list context
            // Treat it as a new list of one
            newTracks = [track];
            newOriginalTracks = [track];
            newIndex = 0;
            setShuffleMode(false); // Turn off shuffle for single track play
        }

        setTracks(newTracks);
        setOriginalTracks(newOriginalTracks); // Update original list reference
        setCurrentTrackIndex(newIndex);

        // Important: Set isPlaying to true BEFORE the effect runs
        setIsPlaying(true);

        // Force immediate audio setup and playback
        if (track && audioRef.current) {
            // Set audio source with true to play when ready
            setAudioSource(track, true);

            // IMPORTANT: Add a small timeout to ensure the audio element has time to update
            // This is critical for ensuring playback starts immediately after click
            setTimeout(() => {
                if (audioRef.current && audioRef.current.paused) {
                    console.log("Forcing immediate playback after track selection");
                    const playPromise = audioRef.current.play();
                    if (playPromise !== undefined) {
                        currentPlayPromiseRef.current = playPromise;
                        playPromise.catch(error => {
                            console.error("Immediate play failed:", error);
                            if (error.name !== 'AbortError') {
                                setIsPlaying(false);
                                setIsLoading(false);
                            }
                        });
                    }
                }
            }, 10); // Reduced timeout to improve responsiveness
        }
    }, [tracks, originalTracks, currentTrackIndex, shuffleMode, shuffleTracks, setAudioSource]);

    const playTrackAtIndex = useCallback((index: number, trackList: Track[]) => {
        if (index < 0 || index >= trackList.length) return;
        const targetTrack = trackList[index];
        playTrack(targetTrack, trackList); // Delegate logic
    }, [playTrack]);


    const togglePlayPause = useCallback(() => {
        const audio = audioRef.current;
        if (!audio || !currentTrack) return;

        // Simple toggle of the isPlaying state
        // The useEffect hook watching `isPlaying` will handle the actual play/pause call
        setIsPlaying(prevIsPlaying => !prevIsPlaying);

    }, [currentTrack]); // Depends on currentTrack to ensure there is something to toggle

    const nextTrack = useCallback(() => {
        if (tracks.length === 0 || currentTrackIndex === null) return;

        let nextIndex: number | null = null;

        if (currentTrackIndex < tracks.length - 1) {
            nextIndex = currentTrackIndex + 1;
        } else if (repeatMode === true) {
            nextIndex = 0; // Loop back to start
            setIsPlaying(true);
        }

        if (nextIndex !== null) {
            setCurrentTrackIndex(nextIndex);
            setIsPlaying(true); // Auto-play next track
            
        } else {
            // End of list and no repeat 'all'
            setIsPlaying(false);
            // Optionally seek to 0 if you want the player to reset
            // seekTo(0);
        }
    }, [tracks, currentTrackIndex, repeatMode]); // Removed seekTo dependency here

    const prevTrack = useCallback(() => {
        if (tracks.length === 0 || currentTrackIndex === null) return;

        let prevIndex: number | null = null;

        // If track has played for more than ~3 seconds, restart it instead of going previous
        if (audioRef.current && audioRef.current.currentTime > 5) {
            seekTo(0);
            setIsPlaying(true); // Ensure it plays from start
            return;
        }

        if (currentTrackIndex > 0) {
            prevIndex = currentTrackIndex - 1;
        } else if (repeatMode === true) {
            prevIndex = tracks.length - 1; // Loop back to end
        }

        if (prevIndex !== null) {
            setCurrentTrackIndex(prevIndex);
            setIsPlaying(true); // Auto-play previous track
        } else {
            // Start of list and no repeat 'all'
            // Optionally seek to 0 or do nothing
            seekTo(0);
            setIsPlaying(true); // Re-play the first track from start
        }
    }, [tracks, currentTrackIndex, repeatMode, seekTo]); // Added seekTo dependency


    const setVolumeCallback = useCallback((value: number) => {
        const newVolume = Math.max(0, Math.min(1, value));
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
    }, []);


    const toggleShuffleMode = useCallback(() => {
        const newShuffleMode = !shuffleMode;
        setShuffleMode(newShuffleMode);

        if (!currentTrack) {
            // If nothing playing, just shuffle/unshuffle the list if needed
            setTracks(prevTracks => {
                if (newShuffleMode) {
                    setOriginalTracks([...prevTracks]);
                    return shuffleTracks(prevTracks);
                } else {
                    const restored = originalTracks.length > 0 ? [...originalTracks] : [...prevTracks];
                    setOriginalTracks([]);
                    return restored;
                }
            });
            return;
        }

        // If track is selected/playing
        if (newShuffleMode) {
            const current = currentTrack;
            setTracks(prevTracks => {
                setOriginalTracks([...prevTracks]); // Store before shuffle
                const others = prevTracks.filter(t => t.id !== current.id);
                const newShuffledList = [current, ...shuffleTracks(others)];
                // Update index async after state update (effect might be better)
                // Schedule index update to run after state propagation
                setTimeout(() => setCurrentTrackIndex(0), 0);
                return newShuffledList;
            });
        } else {
            // Disabling shuffle
            if (originalTracks.length > 0) {
                const current = currentTrack;
                const restoredTracks = [...originalTracks];
                setTracks(restoredTracks); // Restore order
                const originalIndex = restoredTracks.findIndex(t => t.id === current.id);
                // Schedule index update
                setTimeout(() => setCurrentTrackIndex(originalIndex >= 0 ? originalIndex : 0), 0);
            }
            setOriginalTracks([]); // Clear original tracks reference
        }
    }, [shuffleMode, tracks, currentTrack, originalTracks, shuffleTracks]); // Dependencies


    // --- Effects ---

    // ***** Updated handleEnded for boolean repeatMode (repeat current) *****
    const handleEnded = useCallback(() => {
        if (repeatMode) {
            console.log("Track ended, repeating current track.");
            seekTo(0);
            setIsPlaying(true);
        } else {
            console.log("Track ended, attempting next track.");
            if (currentTrackIndex !== null && currentTrackIndex < tracks.length - 1) {
                nextTrack();
            } else {
                setIsPlaying(false);
                setCurrentTime(0);
            }
        }
    }, [repeatMode, seekTo, currentTrackIndex, tracks.length, nextTrack]);

    // Initialize Audio Element & Base Listeners
    useEffect(() => {
        audioRef.current = new Audio();
        const audio = audioRef.current;
        audio.volume = volume;
        audio.preload = "metadata";

        // Event Handlers (defined inside useEffect to access audio ref directly)
        const handleLoadedMetadata = () => {
            const audioDuration = audio.duration;
            if (isFinite(audioDuration) && audioDuration > 0) setDuration(audioDuration);
            else setDuration(0);
        };
        const handlePlaying = () => { setIsPlaying(true); setIsLoading(false); };
        const handleWaiting = () => { if (isPlaying) setIsLoading(true); }; // Show loading only if playing
        const handleCanPlay = () => { setIsLoading(false); }; // Or handleCanPlayThrough
        const handlePause = () => { if (!isSeekingRef.current) setIsPlaying(false); };
        const handleStalled = () => setIsLoading(true);

        const handleTimeUpdate = () => {
            const now = Date.now();
            // Throttle updates to every 100ms for better performance
            if (!isSeekingRef.current && now - lastUpdateTimeRef.current > 100) {
                if (isFinite(audio.currentTime)) setCurrentTime(audio.currentTime);
                lastUpdateTimeRef.current = now;
            }
        };

        const handleDurationChange = () => {
            const audioDuration = audio.duration;
            if (isFinite(audioDuration) && audioDuration > 0) setDuration(audioDuration);
        };

        const handleSeeked = () => {
            isSeekingRef.current = false;
            if (isFinite(audio.currentTime)) setCurrentTime(audio.currentTime);
            // If isPlaying is true, the play/pause sync effect should handle resuming play
            setIsLoading(false); // Seeking finished
        };

        const handleError = (e: ErrorEvent) => {
            console.warn("Audio Error:", e, audio.error);
            setIsLoading(false);
            setIsPlaying(false);
            // Optional: skip to next on error
            const shouldSkip = audio.error && [
                audio.error.MEDIA_ERR_NETWORK, audio.error.MEDIA_ERR_DECODE, audio.error.MEDIA_ERR_SRC_NOT_SUPPORTED
            ]
            if (shouldSkip && hasNextTrack) {
                console.warn("Attempting to skip to next track due to error.");
                setTimeout(nextTrack, 1000); // Delay before skipping
            }
        };

        // Add listeners
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('durationchange', handleDurationChange);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('playing', handlePlaying);
        audio.addEventListener('waiting', handleWaiting);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('seeked', handleSeeked);
        audio.addEventListener('stalled', handleStalled);
        audio.addEventListener('error', handleError);

        // Cleanup
        return () => {
            console.log("Cleaning up Audio Element");
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('durationchange', handleDurationChange);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('playing', handlePlaying);
            audio.removeEventListener('waiting', handleWaiting);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('seeked', handleSeeked);
            audio.removeEventListener('stalled', handleStalled);
            audio.removeEventListener('error', handleError);

            currentPlayPromiseRef.current?.catch(() => {/* ignore abort */ });
            currentPlayPromiseRef.current = null;
            audio.removeAttribute('src');
            audio.load(); // Release resources
            audioRef.current = null;
        };
        // Dependencies for setup effect (include state/functions used *within* the handlers)
    }, [currentTrackIndex, tracks, nextTrack, seekTo, hasNextTrack]);

    // This ensures volume changes are applied without re-creating the audio element
    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.volume = volume;
        }
    }, [volume]);

    // Effect to handle track changes (when currentTrackIndex changes)
    // This now correctly delegates play logic to the play/pause effect
    useEffect(() => {
        if (currentTrack) {
            console.log(`Track Change Effect: Index ${currentTrackIndex}`);
            // setAudioSource handles setting src, preload, resetting time,
            // and setting the initial isPlaying state based on previous state.
            // It does NOT call play() directly anymore.
            setAudioSource(currentTrack, isPlaying); // Pass previous isPlaying state
        } else {
            // Reset audio element if no track is selected
            const audio = audioRef.current;
            if (audio) {
                audio.pause();
                audio.removeAttribute('src');
                audio.load();
            }
            setIsPlaying(false);
            setCurrentTime(0);
            setDuration(0);
            setIsLoading(false);
        }
        // Depend only on track identity and the setAudioSource function reference.
    }, [currentTrackIndex, currentTrack, setAudioSource]); // Removed isPlaying from here


    // Effect to SYNCHRONIZE isPlaying state with the audio element
    // This effect now reliably handles the play() and pause() calls and promises
    useEffect(() => {
        const audio = audioRef.current;
        // Guard against running when audio/track isn't ready
        if (!audio || !currentTrack || !audio.src || audio.readyState === 0) {
            // If state says playing but we can't, correct the state
            if (isPlaying && (!audio?.src || audio?.readyState === 0)) {
                setIsPlaying(false);
            }
            return;
        }

        if (isPlaying) {
            // Intent is to play
            if (audio.paused) {
                console.log("Play/Pause Sync: Audio is paused, calling play().");
                setIsLoading(true); // Show loading until 'playing'
                currentPlayPromiseRef.current = audio.play();
                currentPlayPromiseRef.current
                    .then(() => {
                        // Play started or will start soon ('playing' event is definitive)
                        console.log("Play/Pause Sync: play() promise resolved.");
                    })
                    .catch(error => {
                        console.error("Play/Pause Sync: play() promise failed:", error);
                        if (error.name !== 'AbortError') {
                            setIsPlaying(false); // Revert state on error
                            setIsLoading(false);
                        }
                        // AbortError is often expected if pause/src change interrupts play
                    })
                    .finally(() => {
                        currentPlayPromiseRef.current = null; // Clear ref
                    });
            } else {
                // Already playing, ensure loading indicator is false
                setIsLoading(false);
            }
        } else {
            // Intent is to pause
            if (!audio.paused) {
                console.log("Play/Pause Sync: Audio is playing, calling pause().");
                // Cancel any pending play() promise before pausing
                currentPlayPromiseRef.current?.catch(() => {/* ignore abort */ });
                currentPlayPromiseRef.current = null;
                audio.pause();
            }
            // Ensure loading is off when paused
            setIsLoading(false);
        }
        // This effect MUST depend on isPlaying and currentTrack
    }, [isPlaying, currentTrack]);

    // --- Context Value ---
    const contextValue = useMemo(() => ({
        tracks,
        currentTrack,
        currentTrackIndex,
        isPlaying,
        volume,
        currentTime,
        duration,
        shuffleMode,
        repeatMode, // boolean state
        isLoading,
        playTrack,
        playTrackAtIndex,
        togglePlayPause,
        nextTrack,
        prevTrack,
        setVolume: setVolumeCallback,
        seekTo,
        toggleShuffleMode,
        toggleRepeatMode, // boolean toggle
        hasNextTrack,
        hasPrevTrack,
    }), [
        // List all state and callbacks being exported
        tracks, currentTrack, currentTrackIndex, isPlaying, volume, currentTime, duration,
        shuffleMode, repeatMode, isLoading, playTrack, playTrackAtIndex, togglePlayPause,
        nextTrack, prevTrack, setVolumeCallback, seekTo, toggleShuffleMode, toggleRepeatMode,
        hasNextTrack, hasPrevTrack
    ]);

    return (
        <AudioContext.Provider value={contextValue}>
            {children}
        </AudioContext.Provider>
    );
};