"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
    useRef,
} from 'react';

// Interfaces (keep as they are)
interface Track {
    id: string;
    title: string;
    author: string;
    src: string;
    cover?: string;
    type?: string;
    album?: string;
}

interface MinimalTrack {
    id: string;
    title: string;
    author: string;
    src: string;
}

interface AudioContextType {
    tracks: Track[];
    currentTrack: Track | null; // Provide the full current track object
    currentTrackIndex: number | null; // Allow null for no track selected
    isPlaying: boolean;
    volume: number;
    currentTime: number;
    duration: number;
    shuffleMode: boolean;
    repeatMode: boolean; // More explicit repeat modes
    isLoading: boolean; // Indicate when track is loading
    playTrack: (track: Track, trackList?: Track[]) => void;
    playTrackAtIndex: (index: number, trackList: Track[]) => void;
    togglePlayPause: () => void;
    nextTrack: () => void;
    prevTrack: () => void;
    setVolume: (value: number) => void;
    seekTo: (time: number) => void;
    toggleShuffleMode: () => void;
    toggleRepeatMode: () => void; // Cycle through none -> all -> one -> none
    hasNextTrack: boolean;
    hasPrevTrack: boolean;
}

interface StoredAudioState {
    tracks: MinimalTrack[];
    originalTracks: MinimalTrack[];
    currentTrackIndex: number | null;
    volume: number;
    currentTime: number;
    shuffleMode: boolean;
    repeatMode: boolean;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);
const MAX_STORAGE_SIZE = 2 * 1024 * 1024; // 2MB

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (!context) {
        throw new Error('useAudio must be used within an AudioProvider');
    }
    return context;
};

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tracks, setTracks] = useState<Track[]>([]);
    const [originalTracks, setOriginalTracks] = useState<Track[]>([]); // Store original order when shuffling
    const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [volume, setVolume] = useState<number>(0.5);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [shuffleMode, setShuffleMode] = useState<boolean>(false);
    const [repeatMode, setRepeatMode] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false); // Loading state

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const isSeekingRef = useRef<boolean>(false); // Prevent time updates during seek
    const currentPlayPromiseRef = useRef<Promise<void> | null>(null); // Track the current play() promise
    const storageFailedRef = useRef<boolean>(false);
    const lastUpdateTimeRef = useRef<number>(0); // For throttling time updates

    // --- Utilities ---

    const trackToMinimal = useCallback((track: Track): MinimalTrack => ({
        id: track.id,
        title: track.title,
        author: track.author,
        src: track.src,
    }), []);

    const shuffleTracks = useCallback((trackArray: Track[]) => {
        const shuffled = [...trackArray];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }, []);

    // Toggle repeat mode
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

    const hasNextTrack = useMemo(() => {
        if (tracks.length === 0 || currentTrackIndex === null) return false;
        if (repeatMode === true) return true; // Always possible to loop
        return currentTrackIndex < tracks.length - 1;
    }, [tracks, currentTrackIndex, repeatMode]);

    const hasPrevTrack = useMemo(() => {
        if (tracks.length === 0 || currentTrackIndex === null) return false;
        if (repeatMode === true) return true; // Always possible to loop
        return currentTrackIndex > 0;
    }, [tracks, currentTrackIndex, repeatMode]);

    // --- Storage ---

    const safelyStoreState = useCallback((state: StoredAudioState): boolean => {
        // (Keep your existing safelyStoreState logic - it's good for handling size limits)
        if (storageFailedRef.current) return false;
        try {
            const serialized = JSON.stringify(state);
            if (serialized.length > MAX_STORAGE_SIZE) {
                const minimalState = {
                    currentTrackIndex: state.currentTrackIndex,
                    volume: state.volume,
                    shuffleMode: state.shuffleMode,
                    repeatMode: state.repeatMode,
                    tracks: state.tracks.length > 0 && state.currentTrackIndex !== null ? [state.tracks[state.currentTrackIndex]] : [],
                    originalTracks: [], // Don't store original tracks if minimal
                    currentTime: state.currentTime,
                };
                const minimalSerialized = JSON.stringify(minimalState);
                if (minimalSerialized.length > MAX_STORAGE_SIZE) {
                    const prefsOnly = {
                        volume: state.volume,
                        shuffleMode: state.shuffleMode,
                        repeatMode: state.repeatMode,
                        // maybe store current track ID and time only?
                    };
                    localStorage.setItem('audioPlayerState', JSON.stringify(prefsOnly));
                } else {
                    localStorage.setItem('audioPlayerState', minimalSerialized);
                }
            } else {
                localStorage.setItem('audioPlayerState', serialized);
            }
            return true;
        } catch (error) {
            console.error('Error saving audio state:', error);
            storageFailedRef.current = true;
            return false;
        }
    }, []);

    const cleanupStorage = useCallback(() => {
        // (Keep your existing cleanupStorage logic)
        try {
            const keysToKeep = ['audioPlayerState'];
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && !keysToKeep.includes(key)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
        } catch (error) {
            console.error('Error cleaning up storage:', error);
        }
    }, []);


    // --- Backend Interaction ---
    // Consider moving this fetch logic to a dedicated API service file
    // const fetchTrackMetadata = useCallback(async (trackId: string): Promise<{ duration: number, format: string } | null> => {
    //     try {
    //         const response = await fetch(`/api/tracks/metadata/${trackId}`);
    //         if (!response.ok) {
    //             console.error('Failed to fetch track metadata:', response.statusText);
    //             return null;
    //         }
    //         const data = await response.json();
    //         // Basic validation
    //         if (typeof data.duration !== 'number' || isNaN(data.duration) || !isFinite(data.duration)) {
    //             console.warn(`Received invalid duration from metadata endpoint for track ${trackId}:`, data.duration);
    //             return null; // Treat invalid duration as not found
    //         }
    //         return { duration: data.duration, format: data.format };
    //     } catch (error) {
    //         console.error('Error fetching track metadata:', error);
    //         return null;
    //     }
    // }, []);


    // --- Core Audio Logic ---

    const setAudioSource = useCallback(async (track: Track, playWhenReady: boolean) => {
        const audio = audioRef.current;
        if (!audio || !track) return;

        setIsLoading(true);

        // Only change source if it's different
        if (audio.src !== track.src) {
            // Pause current playback first
            audio.pause();

            // Set source with proper preload
            audio.src = track.src;
            audio.preload = "auto"; // Change from "metadata" to "auto" for faster loading

            // Prioritize playback over metadata loading
            if (playWhenReady) {
                // Set up play promise
                const playPromise = audio.play().catch(err => {
                    console.error("Play failed:", err);
                    setIsPlaying(false);
                    setIsLoading(false);
                });

                currentPlayPromiseRef.current = playPromise;
                setIsPlaying(true);
            }
        } else if (playWhenReady) {
            // Same source but need to play
            audio.play().catch(err => {
                console.error("Play failed:", err);
                setIsPlaying(false);
                setIsLoading(false);
            });
            setIsPlaying(true);
        }
    }, []);

    // --- Playback Control ---

    const seekTo = useCallback((time: number) => {
        const audio = audioRef.current;
        if (audio && isFinite(time)) {
            const targetTime = Math.max(0, Math.min(time, audio.duration || duration || 0));

            // Prevent time updates during seeking
            isSeekingRef.current = true;

            // Set state immediately for responsive UI
            setCurrentTime(targetTime);

            // Set audio time
            audio.currentTime = targetTime;

            // No need to manually call play here, let the 'seeked' event handler handle it
        }
    }, [duration]);

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

        // Force immediate audio setup instead of waiting for effect
        if (track && audioRef.current) {
            setAudioSource(track, true); // true = play when ready
        }

    }, [tracks, originalTracks, currentTrackIndex, shuffleMode, shuffleTracks, seekTo]); // Added seekTo dependency

    const playTrackAtIndex = useCallback((index: number, trackList: Track[]) => {
        if (index < 0 || index >= trackList.length) return; // Invalid index

        let newTracks = tracks;
        let newOriginalTracks = originalTracks;
        let targetIndex = index;

        // Update internal lists regardless of shuffle
        newOriginalTracks = [...trackList];

        if (shuffleMode) {
            // If shuffle is on, shuffle the list but make the selected track the *first* one
            const selectedTrack = trackList[index];
            const others = trackList.filter((_, idx) => idx !== index);
            newTracks = [selectedTrack, ...shuffleTracks(others)];
            targetIndex = 0; // The selected track is now at index 0
        } else {
            newTracks = [...trackList];
            targetIndex = index;
        }

        setTracks(newTracks);
        setOriginalTracks(newOriginalTracks);

        if (currentTrackIndex === targetIndex && audioRef.current && !audioRef.current.paused) {
            seekTo(0); // Restart if already playing the target track
        } else {
            setCurrentTrackIndex(targetIndex);
            // Signal intent to play
            setIsPlaying(true);
        }

    }, [tracks, originalTracks, currentTrackIndex, shuffleMode, shuffleTracks, seekTo]); // Added seekTo dependency


    const togglePlayPause = useCallback(async () => {
        const audio = audioRef.current;
        if (!audio || !currentTrack) return;

        if (isPlaying) {
            // Cancel any pending play promise to avoid "aborted" errors
            currentPlayPromiseRef.current = null;

            audio.pause();
            setIsPlaying(false);
        } else {
            setIsLoading(true);

            try {
                // Always create a new play promise
                const playPromise = audio.play();
                currentPlayPromiseRef.current = playPromise;

                // Wait for play to complete
                await playPromise;
                setIsPlaying(true);
            } catch (error: any) {
                // Ignore AbortError as it's expected when operations are interrupted
                if (error.name !== 'AbortError') {
                    console.error("Play failed:", error);
                    setIsPlaying(false);
                }
            } finally {
                setIsLoading(false);
                currentPlayPromiseRef.current = null;
            }
        }
    }, [isPlaying, currentTrack]);

    const nextTrack = useCallback(() => {
        if (tracks.length === 0 || currentTrackIndex === null) return;

        let nextIndex: number | null = null;

        if (currentTrackIndex < tracks.length - 1) {
            nextIndex = currentTrackIndex + 1;
        } else if (repeatMode === true) {
            nextIndex = 0; // Loop back to start
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
        if (audioRef.current && audioRef.current.currentTime > 3) {
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
        const newVolume = Math.max(0, Math.min(1, value)); // Clamp between 0 and 1
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
    }, []); // No dependencies needed

    const toggleShuffleMode = useCallback(() => {
        const newShuffleMode = !shuffleMode;
        setShuffleMode(newShuffleMode);

        if (!currentTrack) {
            // If nothing is playing, just toggle the mode
            setOriginalTracks(newShuffleMode ? [...tracks] : []); // Store originals if enabling shuffle
            return;
        }

        // If a track is playing or selected
        if (newShuffleMode) {
            // Enabling shuffle
            setOriginalTracks([...tracks]); // Store current (potentially already shuffled) list as original reference *before* reshuffling
            const current = currentTrack; // Get the currently playing track object
            const others = tracks.filter(t => t.id !== current.id);
            const shuffledOthers = shuffleTracks(others);
            const newShuffledList = [current, ...shuffledOthers];
            setTracks(newShuffledList);
            setCurrentTrackIndex(0); // Current track is now at index 0
        } else {
            // Disabling shuffle
            if (originalTracks.length > 0) {
                // Restore original order
                const current = currentTrack;
                const originalIndex = originalTracks.findIndex(t => t.id === current.id);
                setTracks([...originalTracks]);
                setCurrentTrackIndex(originalIndex >= 0 ? originalIndex : 0);
            }
            // Clear original tracks reference if disabling shuffle
            setOriginalTracks([]);
        }
    }, [shuffleMode, tracks, currentTrack, originalTracks, shuffleTracks]);

    // --- Effects ---

    // Initialize Audio Element & Base Listeners
    useEffect(() => {
        audioRef.current = new Audio();
        const audio = audioRef.current;
        audio.volume = volume; // Set initial volume

        // --- Event Listeners ---

        const handleLoadedMetadata = () => {
            console.log("Event: loadedmetadata");
            // Only update duration if it wasn't set by backend metadata or is invalid
            if (!duration || !isFinite(duration) || duration === 0) {
                const audioDuration = audio.duration;
                if (isFinite(audioDuration) && audioDuration > 0) {
                    console.log(`Setting duration from 'loadedmetadata': ${audioDuration}`);
                    setDuration(audioDuration);
                } else {
                    console.warn(`Invalid duration on 'loadedmetadata': ${audioDuration}`);
                    // Maybe try fetching metadata again here?
                }
            }
        };

        const handleCanPlay = () => {
            console.log("Event: canplay");
            setIsLoading(false); // Ready to play (at least the start)
        };

        const handlePlay = () => {
            console.log("Event: play");
            // This might fire before the actual play starts if there's buffering
            // We set isPlaying optimistically, but 'playing' is more reliable
        };

        const handlePlaying = () => {
            console.log("Event: playing");
            setIsPlaying(true); // Confirmed playing
            setIsLoading(false);
        };

        const handlePause = () => {
            console.log("Event: pause");
            // Don't set isPlaying false if we paused due to seeking
            if (!isSeekingRef.current) {
                setIsPlaying(false);
            }
        };

        const handleTimeUpdate = () => {
            // Throttle updates to 4 times per second
            const now = Date.now();
            if (!isSeekingRef.current && now - lastUpdateTimeRef.current > 250) {
                setCurrentTime(audio.currentTime || 0);
                lastUpdateTimeRef.current = now;
            }
        };

        const handleDurationChange = () => {
            console.log("Event: durationchange");
            const audioDuration = audio.duration;
            if (isFinite(audioDuration) && audioDuration > 0) {
                // Update duration if it changes (e.g., live streams or late loading)
                if (duration !== audioDuration) {
                    console.log(`Updating duration from 'durationchange': ${audioDuration}`);
                    setDuration(audioDuration);
                }
            }
        };

        const handleEnded = () => {
            if (repeatMode === true) {
                seekTo(0);
                setIsPlaying(true);
                audio.play().catch(e => console.error("Repeat play failed:", e));
            } else {
                nextTrack();
            }
        };

        const handleSeeked = () => {
            console.log("Event: seeked");
            isSeekingRef.current = false;

            // Ensure time is correct
            setCurrentTime(audio.currentTime);

            // If we were playing before seeking, resume
            if (isPlaying && audio.paused) {
                audio.play().catch(e => {
                    console.error("Play after seek failed:", e);
                    setIsPlaying(false);
                });
            }
        };

        const handleError = (e: ErrorEvent) => {
            console.error("Audio Error:", e);
            // Handle specific errors if needed
            // e.target.error.code gives error type (e.g., MEDIA_ERR_SRC_NOT_SUPPORTED)
            setIsLoading(false);
            setIsPlaying(false);
            // Maybe try to skip to the next track?
            // nextTrack(); // Be careful with error loops
        };

        // Add listeners
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('durationchange', handleDurationChange);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('playing', handlePlaying);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('seeked', handleSeeked);
        audio.addEventListener('error', handleError);

        // Cleanup
        return () => {
            console.log("Cleaning up Audio Element and Listeners");
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('durationchange', handleDurationChange);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('playing', handlePlaying);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('seeked', handleSeeked);
            audio.removeEventListener('error', handleError);
            audio.pause(); // Ensure audio stops
            audio.src = ""; // Release resources
            audioRef.current = null;
        };
        // Run only once on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    // Effect to handle track changes (when currentTrackIndex changes)
    useEffect(() => {
        if (currentTrack) {
            console.log(`Track Changed: Index ${currentTrackIndex}, Title: ${currentTrack.title}`);
            // Call setAudioSource, pass 'isPlaying' state to indicate if it should play immediately
            setAudioSource(currentTrack, isPlaying);
        } else {
            // No track selected, reset audio element
            const audio = audioRef.current;
            if (audio) {
                audio.pause();
                audio.src = "";
            }
            setIsPlaying(false);
            setCurrentTime(0);
            setDuration(0);
            setIsLoading(false);
        }
        // Trigger this effect *only* when the track index changes.
        // isPlaying is passed to setAudioSource to decide if it should play *after* loading.
        // setAudioSource handles the internal logic based on that.
    }, [currentTrackIndex, setAudioSource]); // Watch currentTrackIndex


    // Effect to handle play/pause state changes initiated externally (e.g., togglePlayPause)
    // This effect ensures the audio element's state matches the React state.
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !currentTrack) return; // No audio element or track loaded

        console.log(`Play/Pause Effect: isPlaying=${isPlaying}, audio.paused=${audio.paused}, readyState=${audio.readyState}`);

        if (isPlaying) {
            // We want to play
            if (audio.paused) {
                // Only play if ready enough (or let the browser handle waiting if already loading)
                if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA || audio.readyState === HTMLMediaElement.HAVE_NOTHING && audio.src) {
                    console.log("Attempting to play...");
                    setIsLoading(true); // Show loading until 'playing' event
                    currentPlayPromiseRef.current = audio.play();
                    currentPlayPromiseRef.current?.then(() => {
                        console.log("Play command successful (promise resolved)");
                        // 'playing' event will set isLoading false
                    }).catch(error => {
                        console.error("Effect Play failed:", error);
                        if (error.name !== 'AbortError') {
                            setIsPlaying(false); // Revert state if play fails unexpectedly
                        }
                        setIsLoading(false); // Stop loading indicator on error
                    }).finally(() => {
                        currentPlayPromiseRef.current = null;
                    });
                } else {
                    console.log("Audio not ready enough to play yet, waiting for events...");
                    setIsLoading(true); // Ensure loading is shown while waiting
                }
            } else {
                // Already playing, ensure loading indicator is off
                setIsLoading(false);
            }
        } else {
            // We want to pause
            if (!audio.paused) {
                console.log("Attempting to pause...");
                audio.pause();
            }
            // Ensure loading is off when paused explicitly
            setIsLoading(false);
        }

        // This effect reacts to changes in `isPlaying` state and `currentTrack` (to handle cases where track changes but play state should persist)
    }, [isPlaying, currentTrack]);


    // Load state from localStorage on initial render
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                cleanupStorage();
                const savedState = localStorage.getItem('audioPlayerState');
                if (savedState) {
                    const parsedState: Partial<StoredAudioState> = JSON.parse(savedState);

                    setVolume(parsedState.volume ?? 0.5);
                    setShuffleMode(parsedState.shuffleMode ?? false);
                    setRepeatMode(parsedState.repeatMode ?? false);

                    if (parsedState.tracks && parsedState.tracks.length > 0 && parsedState.currentTrackIndex !== null && parsedState.currentTrackIndex! >= 0) {
                        const loadedTracks = parsedState.tracks as Track[]; // Assume structure matches for now
                        const loadedOriginals = (parsedState.originalTracks as Track[] | undefined) ?? [];
                        const safeIndex = Math.min(parsedState.currentTrackIndex!, loadedTracks.length - 1);

                        setTracks(loadedTracks);
                        setOriginalTracks(loadedOriginals); // Restore original tracks if available
                        setCurrentTrackIndex(safeIndex);
                        // Don't set isPlaying = true here. Let user initiate playback.
                        // Restore time *after* track loads
                        const restoredTime = parsedState.currentTime ?? 0;
                        if (audioRef.current && loadedTracks[safeIndex]) {
                            // Preload metadata for the restored track
                            const audio = audioRef.current;
                            audio.src = loadedTracks[safeIndex].src;
                            audio.preload = "metadata";
                            // Add temporary listener to set time after metadata loads
                            const setRestoredTime = () => {
                                if (audioRef.current && isFinite(restoredTime) && isFinite(audioRef.current.duration)) {
                                    audioRef.current.currentTime = Math.min(restoredTime, audioRef.current.duration);
                                    setCurrentTime(audioRef.current.currentTime); // Update state too
                                }
                                audioRef.current?.removeEventListener('loadedmetadata', setRestoredTime);
                            };
                            audio.addEventListener('loadedmetadata', setRestoredTime, { once: true });
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading audio state:', error);
                localStorage.removeItem('audioPlayerState'); // Clear corrupted state
            }
        }
    }, [cleanupStorage]); // Run only once on mount


    // Save state to localStorage (throttled)
    useEffect(() => {
        // Throttle saving state
        const saveTimer = setTimeout(() => {
            if (tracks.length > 0 && currentTrackIndex !== null) {
                const stateToSave: StoredAudioState = {
                    tracks: tracks.map(trackToMinimal),
                    originalTracks: originalTracks.map(trackToMinimal),
                    currentTrackIndex,
                    volume,
                    // Use the actual audio element time for saving if available, otherwise state
                    currentTime: audioRef.current?.currentTime ?? currentTime,
                    shuffleMode,
                    repeatMode,
                };
                safelyStoreState(stateToSave);
            } else {
                // Save only preferences if no track is loaded
                const prefsOnly = { volume, shuffleMode, repeatMode };
                localStorage.setItem('audioPlayerState', JSON.stringify(prefsOnly));
            }
        }, 1000); // Save every 1 second after changes settle

        return () => clearTimeout(saveTimer);
    }, [
        tracks, originalTracks, currentTrackIndex, volume, currentTime, // Include currentTime to trigger save after seeking/updates
        shuffleMode, repeatMode, trackToMinimal, safelyStoreState
    ]);


    // Preloading (Simple metadata preloading for next track)
    useEffect(() => {
        if (!currentTrack || currentTrackIndex === null || tracks.length <= 1 || currentTrackIndex >= tracks.length - 1) {
            return; // No next track or not applicable
        }

        const nextIndex = currentTrackIndex + 1;
        const nextTrackData = tracks[nextIndex];

        if (nextTrackData) {
            // Use a temporary Audio object for preloading metadata
            const preloader = new Audio();
            preloader.preload = "metadata";
            preloader.src = nextTrackData.src;
            console.log(`Preloading metadata for next track: ${nextTrackData.title}`);

            // No need to keep the preloader object around after setting src
        }

    }, [tracks, currentTrackIndex, currentTrack]); // Re-run when track changes


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
        repeatMode,
        isLoading,
        playTrack,
        playTrackAtIndex,
        togglePlayPause,
        nextTrack,
        prevTrack,
        setVolume: setVolumeCallback, // Use the specific callback here
        seekTo,
        toggleShuffleMode,
        toggleRepeatMode,
        hasNextTrack,
        hasPrevTrack,
    }), [
        tracks, currentTrack, currentTrackIndex, isPlaying, volume, currentTime, duration,
        shuffleMode, repeatMode, isLoading, playTrack, playTrackAtIndex, togglePlayPause,
        nextTrack, prevTrack, setVolumeCallback, seekTo, toggleShuffleMode, toggleRepeatMode,
        hasNextTrack, hasPrevTrack
    ]);

    return (
        <AudioContext.Provider value={contextValue}>
            {children}
            {/* We don't render the <audio> tag directly here, it's managed by the ref */}
        </AudioContext.Provider>
    );
};