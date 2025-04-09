"use client"

import Image from 'next/image';
import Marquee from "react-fast-marquee"; // Import the marquee component
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { LikeButton } from '@/components/functions/LikeButton';
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
    const [isTitleLong, setIsTitleLong] = useState<boolean>(false); // State to check title length

    const currentTrack = tracks?.[currentTrackIndex];
    const hasShuffle = tracks && tracks.length > 1;

    // For vertical swipe gesture
    const y = useMotionValue(0);
    const playerOpacity = useTransform(y, [0, 200], [1, 0]);
    const playerScale = useTransform(y, [0, 200], [1, 0.9]);

    // Show player when there are tracks
    useEffect(() => {
        if (tracks && tracks.length > 0 && currentTrackIndex !== undefined && currentTrackIndex >= 0) {
            setIsPlayerVisible(true);
        } else {
            setIsPlayerVisible(false);
            setIsExpanded(false); // Collapse if player becomes hidden
        }
    }, [tracks, currentTrackIndex]);

    // --- Marquee Title Check ---
    // Check title length - adjust the threshold (e.g., 20) as needed
    useEffect(() => {
        if (currentTrack?.title && currentTrack.title.length > 20) { // Example threshold: 20 characters
            setIsTitleLong(true);
        } else {
            setIsTitleLong(false);
        }
    }, [currentTrack?.title]);
    // --- End Marquee Title Check ---

    // Toggle play/pause with button disable safety
    const handlePlayPauseToggle = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isButtonDisabled) return;
        setIsButtonDisabled(true);
        try {
            togglePlayPause();
        } catch (error) { console.error("Error toggling play/pause:", error); }
        finally { setTimeout(() => setIsButtonDisabled(false), 300); }
    }, [togglePlayPause, isButtonDisabled]);

    // Handle volume change
    const handleVolumeChange = useCallback((value: number[]) => {
        setVolume(value[0] / 100);
    }, [setVolume]);

    // Handle seeking
    const handleSeek = useCallback((value: number[]) => {
        setIsDragging(false);
        const newTime = (value[0] / 100) * duration;
        seekTo(newTime);
    }, [duration, seekTo]);

    // Format time
    const formatTime = useCallback((time: number): string => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, []);

    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

    // Toggle expanded view
    const toggleExpanded = useCallback(() => {
        setIsExpanded(prev => !prev);
        y.set(0); // Reset drag position
    }, [y]);

    // Handle next track
    const handleNextTrack = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isButtonDisabled || !hasNextTrack) return;
        setIsButtonDisabled(true);
        try { nextTrack(); }
        catch (error) { console.error("Error navigating to next track:", error); }
        finally { setTimeout(() => setIsButtonDisabled(false), 300); }
    }, [nextTrack, hasNextTrack, isButtonDisabled]);

    // Handle previous track
    const handlePrevTrack = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isButtonDisabled || !hasPrevTrack) return;
        setIsButtonDisabled(true);
        try { prevTrack(); }
        catch (error) { console.error("Error navigating to previous track:", error); }
        finally { setTimeout(() => setIsButtonDisabled(false), 300); }
    }, [prevTrack, hasPrevTrack, isButtonDisabled]);

    // Handle shuffle
    const handleShuffleToggle = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (hasShuffle) { toggleShuffleMode(); }
    }, [toggleShuffleMode, hasShuffle]);

    // Handle repeat
    const handleRepeatToggle = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        toggleRepeatMode();
    }, [toggleRepeatMode]);


    if (!isPlayerVisible || !currentTrack) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.footer
                // --- Height/Positioning Change for Expanded View ---
                className={`fixed bg-sidebar glassmorphism z-100 
                           ${isExpanded
                        ? 'inset-0 overflow-hidden' // Cover full screen, hide overflow initially
                        : 'bottom-20 sm:bottom-24 md:bottom-0 left-0 w-full p-4' // Original collapsed style
                    } `}
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: isExpanded ? 0 : 0, opacity: 1 }} // Keep y:0 for expanded
                exit={{ y: 300, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30, mass: 1 }}
                style={{
                    y: isExpanded ? 0 : y, // Only allow dragging when collapsed
                    opacity: isExpanded ? 1 : playerOpacity, // Full opacity when expanded
                    scale: isExpanded ? 1 : playerScale, // Full scale when expanded
                }}
                drag={!isExpanded ? "y" : false} // Disable drag when expanded
                dragConstraints={{ top: 0, bottom: 0 }}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={() => {
                    setIsDragging(false);
                    const currentY = y.get();
                    if (!isExpanded && currentY > 50) { // Only close if collapsed and dragged down
                        if (isPlaying) {
                            togglePlayPause();
                        }
                        setIsPlayerVisible(false);
                    } else {
                        y.set(0); // Snap back if not dragged far enough
                    }
                }}
            >
                {/* --- Inner Scrollable Container for Expanded View --- */}
                <div
                    className={`w-full h-full flex 
                               ${isExpanded
                            ? 'flex-col items-center justify-between p-4 pt-6 pb-32 overflow-y-auto' // Enable vertical scroll, adjust padding
                            : 'flex-col md:flex-row items-center justify-between gap-4' // Original collapsed layout
                        }`}
                >
                    {/* Drag handle indicator (only when collapsed) */}
                    {!isExpanded && (
                        <div className="w-full flex md:hidden justify-center items-center mb-2 cursor-grab pt-1">
                            <div className="w-12 h-1 bg-gray-300 rounded-full" />
                        </div>
                    )}

                    {/* Minimize Button (Expanded Only) */}
                    {isExpanded && (
                        <div className="absolute top-4 right-4 z-20"> {/* Position absolute for easy placement */}
                            <motion.button
                                className="p-3 rounded-lg bg-neutral-50 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-50 shadow-2xl"
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

                    {/* --- Track Info --- */}
                    {/* Use fixed width/flex-shrink=0 on collapsed view for stability */}
                    <div
                        className={`flex items-center gap-x-4 flex-shrink-0 order-1 md:order-1
                                   ${isExpanded
                                ? 'mt-10 flex-col justify-center text-center gap-y-4' // Expanded: Centered column
                                : 'w-full md:w-[250px] lg:w-[300px] cursor-pointer' // Collapsed: Fixed width, allow clicking to expand
                            }`}
                        onClick={isDragging ? undefined : (isExpanded ? undefined : toggleExpanded)}
                    >
                        <Image
                            src={currentTrack?.cover || '/default-cover.jpg'}
                            alt="Track Cover"
                            width={isExpanded ? 250 : 48} // Adjusted expanded size slightly
                            height={isExpanded ? 250 : 48}
                            className={`rounded-sm flex-shrink-0 ${isExpanded ? 'rounded-xl shadow-xl mb-4' : ''}`}
                            priority // Prioritize loading cover art
                        />
                        {/* --- Title and Author Container --- */}
                        <div className={`flex flex-col justify-center min-w-0 ${isExpanded ? 'items-center' : 'flex-grow'}`}>
                            {/* --- Marquee Title --- */}
                            <div className={`font-semibold ${isExpanded ? 'text-xl mb-1' : 'w-full overflow-hidden whitespace-nowrap'}`}>
                                {!isExpanded && isTitleLong ? (
                                    <Marquee gradient={false} speed={30} play={true}>
                                        {/* Add padding to the text inside marquee */}
                                        <span className="pr-4">{currentTrack?.title}</span>
                                    </Marquee>
                                ) : (
                                    <h4 className={isExpanded ? '' : 'truncate'}>
                                        {currentTrack?.title || "No Track"}
                                    </h4>
                                )}
                            </div>
                            {/* --- End Marquee Title --- */}
                            <p className={`text-sm text-gray-500 ${isExpanded ? '' : 'truncate'}`}>
                                {currentTrack?.author || "Unknown Artist"}
                            </p>
                        </div>
                        {/* --- Collapsed View Buttons (Like/Mobile Play) --- */}
                        {!isExpanded && (
                            <div className="flex items-center ml-auto md:ml-4 flex-shrink-0"> {/* Use ml-auto to push right */}
                                <LikeButton trackId={currentTrack?.id || ''} size="md" />
                                <motion.button
                                    className={`flex sm:hidden p-2 ml-1 ${isButtonDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    onClick={handlePlayPauseToggle}
                                    whileTap={!isButtonDisabled ? { scale: 0.9 } : undefined}
                                    disabled={isButtonDisabled}
                                >
                                    {isButtonDisabled ? <Loader2 className="w-6 h-6 animate-spin" /> : isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                                </motion.button>
                            </div>
                        )}
                    </div>
                    {/* --- End Track Info --- */}


                    {/* --- Player Controls - Middle --- */}
                    {/* Use flex-grow to take remaining space and center content */}
                    <div className={`flex flex-col items-center justify-center w-full order-3 md:order-2 flex-grow min-w-0
                                   ${isExpanded ? 'mt-8 mb-8' : 'hidden sm:flex'}`}> {/* Add vertical margin when expanded */}

                        <div className={`flex items-center space-x-3 md:space-x-4 ${isExpanded ? 'mb-6' : 'mb-2'}`}>
                            {/* Shuffle */}
                            <motion.button
                                className={`p-2 rounded-full ${!hasShuffle ? 'opacity-50 cursor-not-allowed' : shuffleMode ? 'text-purple-500 bg-purple-500/10' : 'hover:bg-white/10'}`}
                                onClick={handleShuffleToggle}
                                whileTap={hasShuffle ? { scale: 0.9 } : undefined}
                                disabled={!hasShuffle}
                            >
                                <Shuffle className={`font-thin w-5 h-5`} />
                            </motion.button>
                            {/* Prev */}
                            <motion.button
                                className={`p-1 rounded-full ${hasPrevTrack && !isButtonDisabled ? 'hover:bg-white/10 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                                onClick={hasPrevTrack && !isButtonDisabled ? handlePrevTrack : undefined}
                                whileTap={hasPrevTrack && !isButtonDisabled ? { scale: 0.9 } : undefined}
                                disabled={!hasPrevTrack || isButtonDisabled}
                            >
                                <ChevronLeft className={`font-thin w-8 h-8`} />
                            </motion.button>
                            {/* Play/Pause */}
                            <motion.button
                                className={`flex items-center justify-center 
                                            ${isExpanded ? 'w-14 h-14' : 'w-10 h-10'} 
                                            ${isButtonDisabled ? 'opacity-80 cursor-not-allowed' : 'hover:scale-105 active:scale-95 cursor-pointer'}`}
                                onClick={handlePlayPauseToggle}
                                whileTap={!isButtonDisabled ? { scale: 0.9 } : undefined}
                                disabled={isButtonDisabled}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            >
                                {isButtonDisabled ? (
                                    <Loader2 className={`w-7 h-7 animate-spin`} />
                                ) : isPlaying ? (
                                    <Pause className={`w-7 h-7`} />
                                ) : (
                                    <Play className={`w-7 h-7`} />
                                )}
                            </motion.button>
                            {/* Next */}
                            <motion.button
                                className={`p-1 rounded-full ${hasNextTrack && !isButtonDisabled ? 'hover:bg-white/10 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                                onClick={hasNextTrack && !isButtonDisabled ? handleNextTrack : undefined}
                                whileTap={hasNextTrack && !isButtonDisabled ? { scale: 0.9 } : undefined}
                                disabled={!hasNextTrack || isButtonDisabled}
                            >
                                <ChevronRight className={`font-thin w-8 h-8`} />
                            </motion.button>
                            {/* Repeat */}
                            <motion.div whileTap={{ scale: 0.9 }}>
                                <Toggle
                                    className={`p-2 rounded-full data-[state=on]:bg-purple-500/10 data-[state=on]:text-purple-500 hover:bg-white/10`}
                                    pressed={repeatMode}
                                    onPressedChange={() => toggleRepeatMode()}
                                >
                                    <Repeat className={`font-thin w-5 h-5`} />
                                </Toggle>
                            </motion.div>
                        </div>
                        {/* --- Song Progress Slider --- */}
                        <div className={`flex items-center w-full max-w-[500px] px-4 md:px-0 gap-x-2 ${isExpanded ? 'mt-4' : 'mt-1'}`}>
                            <span className="text-xs text-gray-400 w-8 text-right tabular-nums">{formatTime(currentTime)}</span>
                            <Slider
                                value={[progressPercentage]}
                                max={100}
                                step={0.1}
                                onValueChange={handleSeek} // Use onValueChange for intermediate updates if needed, but commit on pointer up
                                onValueCommit={handleSeek} // Use onValueCommit for final value after drag/click
                                aria-label="song progress"
                                className="flex-grow cursor-pointer"
                                disabled={isButtonDisabled || duration <= 0}
                            />
                            <span className="text-xs text-gray-400 w-8 text-left tabular-nums">{formatTime(duration || 0)}</span>
                        </div>
                    </div>
                    {/* --- End Player Controls --- */}


                    {/* --- Volume Control --- */}
                    {/* Keep fixed width for stability */}
                    <div className={`hidden md:flex items-center space-x-2 w-[150px] lg:w-[180px] justify-end order-2 md:order-3 flex-shrink-0
                                   ${isExpanded ? '!hidden' : ''}`}> {/* Hide completely when expanded */}
                        {volume === 0 ?
                            <VolumeX className='w-5 h-5 cursor-pointer text-gray-400 hover:text-white' onClick={() => setVolume(0.5)} /> :
                            volume < 0.5 ?
                                <Volume1 className='w-5 h-5 cursor-pointer text-gray-400 hover:text-white' onClick={() => setVolume(0)} /> :
                                <Volume2 className='w-5 h-5 cursor-pointer text-gray-400 hover:text-white' onClick={() => setVolume(0)} />
                        }
                        <Slider
                            value={[volume * 100]}
                            max={100}
                            step={1}
                            onValueChange={handleVolumeChange}
                            aria-label="volume"
                            className="w-24 flex-grow cursor-pointer"
                        />
                    </div>
                    {/* --- End Volume Control --- */}
                </div>
            </motion.footer>
        </AnimatePresence>
    );
};

export default memo(BottomPlayer);