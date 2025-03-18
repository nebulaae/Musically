"use client"

import Image from 'next/image';

import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { LikeButton } from '@/components/shared/LikeButton';
import {
    Volume1,
    Volume2,
    VolumeX,
    ChevronLeft,
    ChevronRight,
    Play,
    Pause,
    Minimize2,
    Loader2,
    Repeat,
    Shuffle,
} from 'lucide-react';

import { useAudio } from './AudioContext';
import {
    useState,
    useCallback,
    memo,
    useEffect
} from 'react';
import {
    motion,
    useMotionValue,
    useTransform,
    AnimatePresence
} from 'framer-motion';


const BottomPlayer = () => {
    const {
        tracks,
        currentTrackIndex,
        isPlaying,
        volume,
        currentTime,
        duration,
        togglePlayPause,
        nextTrack,
        prevTrack,
        setVolume,
        seekTo,
        hasNextTrack,
        hasPrevTrack,
        shuffleMode,
        toggleShuffleMode,
        repeatMode,
        toggleRepeatMode
    } = useAudio();

    const [isPlayerVisible, setIsPlayerVisible] = useState<boolean>(false);
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const [isButtonDisabled, setIsButtonDisabled] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const currentTrack = tracks?.[currentTrackIndex];
    const hasShuffle = tracks && tracks.length > 1;

    // For vertical swipe gesture
    const y = useMotionValue(0);
    const playerOpacity = useTransform(y, [0, 200], [1, 0]);
    const playerScale = useTransform(y, [0, 200], [1, 0.9]);

    // Show player when there are tracks
    useEffect(() => {
        if (tracks && tracks.length > 0) {
            setIsPlayerVisible(true);
        } else {
            setIsPlayerVisible(false);
        }
    }, [tracks]);

    // Make sure to add this useEffect right after your other state effects
    useEffect(() => {
        if (currentTrackIndex !== undefined && currentTrackIndex >= 0) {
            setIsPlayerVisible(true);
        }
    }, [currentTrackIndex]);


    // Toggle play/pause with button disable safety
    const handlePlayPauseToggle = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (isButtonDisabled) return;

        setIsButtonDisabled(true);

        try {
            togglePlayPause();
        } catch (error) {
            console.error("Error toggling play/pause:", error);
        } finally {
            // Re-enable button after a short delay
            setTimeout(() => setIsButtonDisabled(false), 300);
        }
    }, [togglePlayPause, isButtonDisabled]);

    // Handle volume change from slider
    const handleVolumeChange = useCallback((value: number[]) => {
        setVolume(value[0] / 100);
    }, [setVolume]);

    // Handle seeking in the song
    const handleSeek = useCallback((value: number[]) => {
        // Stop propagation of any drag events
        setIsDragging(false);
        const newTime = (value[0] / 100) * duration;
        seekTo(newTime);
    }, [duration, seekTo]);

    // Format time display (e.g., 01:45)
    const formatTime = useCallback((time: number): string => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, []);

    // Calculate the current progress percentage
    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

    // Toggle expanded view
    const toggleExpanded = useCallback(() => {
        setIsExpanded(prev => !prev);
        // Reset drag position when expanding/collapsing
        y.set(0);
    }, [y]);

    // Handle next track click with button disable safety
    const handleNextTrack = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (isButtonDisabled || !hasNextTrack) return;

        setIsButtonDisabled(true);

        try {
            nextTrack();
        } catch (error) {
            console.error("Error navigating to next track:", error);
        } finally {
            // Re-enable button after a short delay
            setTimeout(() => setIsButtonDisabled(false), 300);
        }
    }, [nextTrack, hasNextTrack, isButtonDisabled]);

    // Handle previous track click with button disable safety
    const handlePrevTrack = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (isButtonDisabled || !hasPrevTrack) return;

        setIsButtonDisabled(true);

        try {
            prevTrack();
        } catch (error) {
            console.error("Error navigating to previous track:", error);
        } finally {
            // Re-enable button after a short delay
            setTimeout(() => setIsButtonDisabled(false), 300);
        }
    }, [prevTrack, hasPrevTrack, isButtonDisabled]);

    // Handle shuffle toggle
    const handleShuffleToggle = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (hasShuffle) {
            toggleShuffleMode();
        }
    }, [toggleShuffleMode, hasShuffle]);

    // Handle repeat toggle
    const handleRepeatToggle = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        toggleRepeatMode();
    }, [toggleRepeatMode]);

    // Don't render anything if no tracks or player is hidden
    if (!isPlayerVisible || !tracks || tracks.length === 0 || !currentTrack) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.footer
                className={`fixed ${isExpanded ? 'inset-0 bg-white pb-32' : 'bottom-20 sm:bottom-24 md:bottom-0 left-0 w-full'} bg-sidebar glassmorphism border-t-[1px] border-neutral-200 p-4 z-100`}
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0 }}
                exit={{ y: 300, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30, mass: 1 }}
                style={{
                    y,
                    opacity: playerOpacity,
                    scale: playerScale
                }}
                drag={!isExpanded ? "y" : false}
                dragConstraints={{ top: 0, bottom: 0 }}
                onDragEnd={() => {
                    setIsDragging(false);
                    const currentY = y.get();
                    if (currentY > 50) {
                        // Stop music when player is closed
                        if (isPlaying) {
                            togglePlayPause();
                        }
                        setIsPlayerVisible(false);
                    } else {
                        y.set(0);
                    }
                }}
            >
                {/* Drag handle indicator */}
                {!isExpanded && (
                    <div className="w-full flex justify-center items-center mb-2">
                        <div className="w-12 h-1 bg-gray-300 rounded-full" />
                    </div>
                )}

                <div className={`flex items-center justify-between ${isExpanded ? 'flex-col h-full' : 'flex-col md:flex-row'} gap-4 w-full`}>
                    {isExpanded && (
                        <div className="self-end">
                            <motion.button
                                className="p-2 rounded-full hover:bg-gray-100"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpanded();
                                }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <Minimize2 />
                            </motion.button>
                        </div>
                    )}

                    {/* Track Info */}
                    <div
                        className={`flex items-center space-x-4 flex-grow md:flex-grow-0 order-1 md:order-none cursor-pointer ${isExpanded ? 'mt-10 flex-col justify-center space-x-0 space-y-4' : 'w-full md:w-auto justify-between sm:justify-center'}`}
                        onClick={isDragging ? undefined : (isExpanded ? undefined : toggleExpanded)}
                    >
                        <div className={`flex items-center gap-2 ${isExpanded ? 'flex-col text-center' : ''}`}>
                            <Image
                                src={currentTrack?.cover || '/default-cover.jpg'}
                                alt="Track Cover"
                                width={isExpanded ? 300 : 48}
                                height={isExpanded ? 300 : 48}
                                className={`rounded-sm ${isExpanded ? 'rounded-xl shadow-xl' : ''}`}
                            />
                            <div>
                                <h4 className={`font-semibold ${isExpanded ? 'text-xl' : 'truncate max-w-[100px]'}`}>
                                    {currentTrack?.title || "No Track"}
                                </h4>
                                <p className={`text-sm text-gray-500 ${isExpanded ? '' : 'truncate max-w-[200px] md:max-w-full'}`}>
                                    {currentTrack?.author || "Unknown Artist"}
                                </p>
                            </div>
                        </div>
                        <div className={`${isExpanded ? 'hidden' : 'flex items-center ml-6 gap-2'}`}>
                            <LikeButton
                                trackId={currentTrack?.id || ''}
                                size={isExpanded ? 'lg' : 'md'}
                            />
                            <motion.button
                                className={`flex sm:hidden p-3 font-thin ${isExpanded ? 'p-5' : 'text-gray-500'} ${isButtonDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                onClick={handlePlayPauseToggle}
                                whileTap={!isButtonDisabled ? { scale: 0.9 } : undefined}
                                disabled={isButtonDisabled}
                            >
                                {isButtonDisabled ? (
                                    <Loader2 className={`${isExpanded ? 'w-6 h-6' : 'w-6 h-6'} animate-spin`} />
                                ) : isPlaying ? (
                                    <Pause className={isExpanded ? 'w-6 h-6' : 'w-6 h-6'} />
                                ) : (
                                    <Play className={isExpanded ? 'w-6 h-6' : 'w-6 h-6'} />
                                )}
                            </motion.button>
                        </div>
                    </div>
                    {/* Player Controls - Middle */}
                    <div className={`flex items-center w-full space-x-6 order-2 flex-col ${isExpanded ? 'mb-12' : 'md:flex-row hidden sm:flex'} md:flex-1 justify-center`}>
                        <div className="flex flex-col items-center justify-center gap-2 w-full">
                            <div className={`flex items-center space-x-3 md:space-x-6 ${isExpanded ? 'mb-6' : 'mb-4'}`}>
                                {/* Shuffle Button */}
                                <motion.button
                                    className={`p-2 rounded-full ${!hasShuffle ? 'opacity-50 cursor-not-allowed' : shuffleMode ? 'cursor-pointer text-purple-800 hover:bg-gray-100' : 'cursor-pointer hover:bg-gray-100'}`}
                                    onClick={handleShuffleToggle}
                                    whileTap={hasShuffle ? { scale: 0.9 } : undefined}
                                    disabled={!hasShuffle}
                                >
                                    <Shuffle className={`font-thin w-5 h-5`} />
                                </motion.button>

                                {/* Previous Track Button */}
                                <motion.button
                                    className={`p-2 rounded-full ${hasPrevTrack && !isButtonDisabled ? 'hover:bg-gray-100 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                                    onClick={hasPrevTrack && !isButtonDisabled ? handlePrevTrack : undefined}
                                    whileTap={hasPrevTrack && !isButtonDisabled ? { scale: 0.9 } : undefined}
                                    disabled={!hasPrevTrack || isButtonDisabled}
                                >
                                    <ChevronLeft className={`font-thin ${isExpanded ? 'w-8 h-8' : 'w-8 h-8'}`} />
                                </motion.button>

                                {/* Play/Pause Button */}
                                <motion.button
                                    className={`p-3 font-thin ${isExpanded ? 'p-5' : ''} ${isButtonDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    onClick={handlePlayPauseToggle}
                                    whileTap={!isButtonDisabled ? { scale: 0.9 } : undefined}
                                    disabled={isButtonDisabled}
                                >
                                    {isButtonDisabled ? (
                                        <Loader2 className={`${isExpanded ? 'w-8 h-8' : 'w-8 h-8'} animate-spin`} />
                                    ) : isPlaying ? (
                                        <Pause className={isExpanded ? 'w-8 h-8' : 'w-8 h-8'} />
                                    ) : (
                                        <Play className={isExpanded ? 'w-8 h-8' : 'w-8 h-8'} />
                                    )}
                                </motion.button>

                                {/* Next Track Button */}
                                <motion.button
                                    className={`p-2 rounded-full ${hasNextTrack && !isButtonDisabled ? 'hover:bg-gray-100 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                                    onClick={hasNextTrack && !isButtonDisabled ? handleNextTrack : undefined}
                                    whileTap={hasNextTrack && !isButtonDisabled ? { scale: 0.9 } : undefined}
                                    disabled={!hasNextTrack || isButtonDisabled}
                                >
                                    <ChevronRight className={`font-thin ${isExpanded ? 'w-8 h-8' : 'w-8 h-8'}`} />
                                </motion.button>

                                {/* Repeat Button */}
                                <motion.div whileTap={{ scale: 0.9 }}>
                                    <Toggle
                                        className={`rounded-full`}
                                        pressed={repeatMode}
                                        onPressedChange={() => toggleRepeatMode()}
                                        size="lg"
                                    >
                                        <Repeat className={`font-thin w-10 h-10`} />
                                    </Toggle>
                                </motion.div>
                            </div>
                            {/* Song Progress Slider */}
                            <div className={`items-center w-full max-w-[500px] space-x-2 ${isExpanded ? 'flex' : 'hidden sm:flex'}`}>
                                <span className="text-sm text-gray-500">{formatTime(currentTime)}</span>
                                <Slider
                                    value={[progressPercentage]}
                                    max={100}
                                    step={0.1}
                                    onValueChange={handleSeek}
                                    aria-label="song progress"
                                    className="flex-grow"
                                    disabled={isButtonDisabled}
                                />
                                <span className="text-sm text-gray-500">{formatTime(duration || 0)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Volume Control */}
                    <div className="hidden md:flex items-center space-x-2 md:w-40 justify-end order-3">
                        {volume === 0 ? <VolumeX className='w-6 h-6' /> : volume < 0.5 ? <Volume1 className='w-6 h-6' /> : <Volume2 className='w-6 h-6' />}
                        <Slider
                            value={[volume * 100]}
                            max={100}
                            step={1}
                            onValueChange={handleVolumeChange}
                            aria-label="volume"
                            className={`${isExpanded ? 'w-full' : 'w-24'} flex-grow md:flex-grow-0`}
                        />
                    </div>
                </div>
            </motion.footer>
        </AnimatePresence>
    );
};

export default memo(BottomPlayer);