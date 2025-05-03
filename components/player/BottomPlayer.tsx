"use client"

import Image from 'next/image';
import Marquee from "react-fast-marquee";

import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import {
    Volume1,
    Volume2,
    VolumeX,
    ChevronLeft,
    ChevronRight,
    Play,
    Pause,
    Minimize2,
    Repeat,
    Shuffle,
} from 'lucide-react';

import { useAudio } from './AudioContext';
import {
    useState,
    useCallback,
    memo,
    useEffect,
    useRef
} from 'react';
import {
    motion,
    AnimatePresence,
    PanInfo
} from 'framer-motion';
import { getProxiedImageUrl } from '@/lib/utils';
import { TrackActions } from '../functions/TrackActions';
import { Progress } from "@/components/ui/progress";

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
    const [isTitleLong, setIsTitleLong] = useState<boolean>(false);

    // Gallery swipe state
    const [swipeDirection, setSwipeDirection] = useState<string | null>(null);
    const [swipeProgress, setSwipeProgress] = useState<number>(0);
    const swipeThreshold = 80; // Minimum distance for track change
    const swipeCooldown = useRef<boolean>(false);
    const dragConstraintsRef = useRef(null);


    // For mobile
    const [isBottomPlayerVisible, setIsBottomPlayerVisible] = useState(true);
    const [prevScrollPos, setPrevScrollPos] = useState(0);

    const currentTrack = tracks?.[currentTrackIndex!];
    // const prevTrackData = hasPrevTrack ? tracks?.[currentTrackIndex! - 1] : null;
    // const nextTrackData = hasNextTrack ? tracks?.[currentTrackIndex! + 1] : null;
    const hasShuffle = tracks && tracks.length > 1;

    // Show player when there are tracks
    useEffect(() => {
        if (tracks && tracks.length > 0 && currentTrackIndex !== undefined && currentTrackIndex! >= 0) {
            setIsPlayerVisible(true);
        } else {
            setIsPlayerVisible(false);
            setIsExpanded(false); // Collapse if player becomes hidden
        }

        // Always reset swipe state when track changes to ensure clean positions
        setSwipeDirection(null);
        setSwipeProgress(0);
    }, [tracks, currentTrackIndex]);

    // Check title length
    useEffect(() => {
        if (currentTrack?.title && currentTrack.title.length > 20) {
            setIsTitleLong(true);
        } else {
            setIsTitleLong(false);
        }
    }, [currentTrack?.title]);

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
        // Reset gallery state
        setSwipeDirection(null);
        setSwipeProgress(0);
    }, []);

    // Handle next track
    const handleNextTrack = useCallback(async (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (isButtonDisabled || !hasNextTrack) return;
        setIsButtonDisabled(true);
        try {
            // Reset gallery state first to ensure clean position state
            setSwipeDirection(null);
            setSwipeProgress(0);
            // Then change track
            nextTrack();
        }
        catch (error) { console.error("Error navigating to next track:", error); }
        finally { setTimeout(() => setIsButtonDisabled(false), 300); }
    }, [nextTrack, hasNextTrack, isButtonDisabled]);

    // Handle previous track
    const handlePrevTrack = useCallback(async (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (isButtonDisabled || !hasPrevTrack) return;
        setIsButtonDisabled(true);
        try {
            // Reset gallery state first to ensure clean position state
            setSwipeDirection(null);
            setSwipeProgress(0);
            // Then change track
            prevTrack();
        }
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

    // Gallery swipe handlers
    const handleDragStart = useCallback(() => {
        if (isExpanded || swipeCooldown.current) return;
        // Disable dragging if there is no previous or next track
        if (!hasNextTrack && !hasPrevTrack) return;

        setIsDragging(true);
    }, [isExpanded]);

    const handleDrag = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (isExpanded || swipeCooldown.current) return;

        const xOffset = info.offset.x;
        // Limit the drag distance for better control
        const clampedOffset = Math.max(-100, Math.min(100, xOffset));

        // Calculate progress as percentage of threshold
        const progress = Math.abs(clampedOffset) / swipeThreshold;
        setSwipeProgress(Math.min(1, progress));

        if (xOffset < -10 && hasNextTrack) {
            setSwipeDirection('next');
        } else if (xOffset > 10 && hasPrevTrack) {
            setSwipeDirection('prev');
        } else {
            setSwipeDirection(null);
        }
    }, [isExpanded, hasNextTrack, hasPrevTrack]);

    const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        // if no next or previous track, disable dragging
        if (isExpanded || swipeCooldown.current || (!hasNextTrack && !hasPrevTrack)) return;


        setIsDragging(false);
        const xOffset = info.offset.x;
        const xVelocity = info.velocity.x;

        // Use velocity for more natural gallery feel - faster swipe requires less distance
        const effectiveThreshold = Math.abs(xVelocity) > 500 ? swipeThreshold * 0.7 : swipeThreshold;

        if (xOffset < -effectiveThreshold && hasNextTrack) {
            // Set cooldown to prevent multiple rapid swipes
            swipeCooldown.current = true;
            setTimeout(() => {
                swipeCooldown.current = false;
            }, 500);

            // Switch to next track
            handleNextTrack();
        } else if (xOffset > effectiveThreshold && hasPrevTrack) {
            // Set cooldown to prevent multiple rapid swipes
            swipeCooldown.current = true;
            setTimeout(() => {
                swipeCooldown.current = false;
            }, 500);

            // Switch to previous track
            handlePrevTrack();
        }

        // Always reset position and swipe state regardless of whether track changed
        setSwipeDirection(null);
        setSwipeProgress(0);
    }, [isExpanded, hasNextTrack, hasPrevTrack, handleNextTrack, handlePrevTrack]);

    // Bottom player scroll down-up
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollPos = window.scrollY;

            if (currentScrollPos > prevScrollPos && currentScrollPos > 100) {
                setIsBottomPlayerVisible(false);
            } else {
                setIsBottomPlayerVisible(true);
            }

            setPrevScrollPos(currentScrollPos);
        };

        window.addEventListener('scroll', handleScroll);

        return () => window.removeEventListener('scroll', handleScroll);
    }, [prevScrollPos]);

    if (!isPlayerVisible || !currentTrack) {
        return null;
    }

    // Get track cover images
    const currentCoverSrc = getProxiedImageUrl(currentTrack?.cover || '/default-cover.jpg');
    // const prevCoverSrc = prevTrackData ? getProxiedImageUrl(prevTrackData?.cover || '/default-cover.jpg') : null;
    // const nextCoverSrc = nextTrackData ? getProxiedImageUrl(nextTrackData?.cover || '/default-cover.jpg') : null;

    return (
        <AnimatePresence>
            <motion.footer
                ref={dragConstraintsRef}
                className={`fixed bg-sidebar glassmorphism z-100 select-none
                          ${isExpanded
                        ? 'inset-0 overflow-hidden' // Cover full screen when expanded
                        : `transition-all ease-in-out duration-300 left-0 w-full p-4
                          ${isBottomPlayerVisible
                            ? 'bottom-14 sm:bottom-20 md:bottom-0'
                            : 'bottom-0 sm:bottom-0 md:bottom-0'}`
                    }`}
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 300, opacity: 0 }}
                transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    mass: 1
                }}
            >

                {/* Gallery Track Preview - Only shown during horizontal swipe */}
                {/* 
                {!isExpanded && swipeDirection && (
                    <div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none w-full h-full"
                        style={{
                            opacity: swipeProgress,
                            zIndex: 10
                        }}
                    >
                        <div className="flex flex-col items-center justify-center p-6 rounded-xl glassmorphism">
                            <Image
                                src={swipeDirection === 'next' ? nextCoverSrc! : prevCoverSrc!}
                                alt={`${swipeDirection === 'next' ? 'Next' : 'Previous'} Track Cover`}
                                width={120}
                                height={120}
                                className="rounded-lg mb-3 shadow-lg"
                                draggable={false}
                            />
                            <h4 className="font-semibold text-white truncate max-w-xs mb-1">
                                {swipeDirection === 'next'
                                    ? nextTrackData?.title || "Next Track"
                                    : prevTrackData?.title || "Previous Track"}
                            </h4>
                            <p className="text-sm text-gray-300 truncate max-w-xs">
                                {swipeDirection === 'next'
                                    ? nextTrackData?.author || "Unknown Artist"
                                    : prevTrackData?.author || "Unknown Artist"}
                            </p>
                        </div>
                    </div>
                )} 
                */}

                {/* Main player content */}
                <motion.div
                    className={`w-full h-full flex 
                               ${isExpanded
                            ? 'flex-col items-center justify-between p-4 pt-6 pb-32 overflow-y-auto' // Expanded layout
                            : 'flex-col md:flex-row items-center justify-between gap-4' // Collapsed layout
                        }`}
                    drag={!isExpanded ? "x" : false} // Only allow horizontal drag when collapsed
                    dragConstraints={dragConstraintsRef}
                    dragElastic={0.1} // Less elastic for more control
                    dragTransition={{ bounceStiffness: 600, bounceDamping: 30 }}
                    onDragStart={handleDragStart}
                    onDrag={handleDrag}
                    onDragEnd={handleDragEnd}
                    initial={{ x: 0 }} // Always start from default position
                    animate={{
                        x: swipeDirection === 'next' ? -swipeProgress * 20 :
                            swipeDirection === 'prev' ? swipeProgress * 20 : 0
                    }}
                    transition={{
                        x: { type: "spring", stiffness: 500, damping: 30 } // Quick spring-back 
                    }}
                >
                    {/* Minimize Button (Expanded Only) */}
                    {isExpanded && (
                        <div className="absolute top-4 right-4 z-20">
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

                    {/* Track Info */}
                    <div
                        className={`flex items-center gap-x-4 flex-shrink-0 order-1 md:order-1
                                   ${isExpanded
                                ? 'mt-10 flex-col justify-center text-center gap-y-4' // Expanded: Centered column
                                : 'w-full md:w-[250px] lg:w-[300px] cursor-pointer' // Collapsed: Fixed width
                            }`}
                    >
                        <Image
                            src={currentCoverSrc}
                            alt="Track Cover"
                            width={isExpanded ? 250 : 48}
                            height={isExpanded ? 250 : 48}
                            className={`rounded-sm flex-shrink-0 ${isExpanded ? 'rounded-xl shadow-xl mb-4' : ''}`}
                            priority
                            onClick={isDragging ? undefined : (isExpanded ? undefined : toggleExpanded)}
                            draggable={false}
                        />

                        {/* Title and Author Container */}
                        <div
                            className={`flex flex-col justify-center min-w-0 ${isExpanded ? 'items-center' : 'flex-grow'}`}
                            onClick={isDragging ? undefined : (isExpanded ? undefined : toggleExpanded)}
                        >
                            {/* Marquee Title */}
                            <div className={`font-semibold ${isExpanded ? 'text-xl mb-1' : 'w-full overflow-hidden whitespace-nowrap'}`}>
                                {!isExpanded && isTitleLong ? (
                                    <Marquee gradient={false} speed={30} play={true}>
                                        <span className="pr-4">{currentTrack?.title}</span>
                                    </Marquee>
                                ) : (
                                    <h4 className={isExpanded ? '' : 'truncate'}>
                                        {currentTrack?.title || "No Track"}
                                    </h4>
                                )}
                            </div>
                            <p className={`text-sm text-gray-500 ${isExpanded ? '' : 'truncate'}`}>
                                {currentTrack?.author || "Unknown Artist"}
                            </p>
                        </div>

                        {/* Collapsed View Buttons (Like/Mobile Play) */}
                        {!isExpanded && (
                            <div className="flex items-center ml-auto md:ml-4 flex-shrink-0">
                                <TrackActions trackId={currentTrack?.id || ''} heart={true} />
                                <motion.button
                                    className={`flex sm:hidden p-2 ml-1 ${isButtonDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    onClick={handlePlayPauseToggle}
                                    whileTap={!isButtonDisabled ? { scale: 0.9 } : undefined}
                                    disabled={isButtonDisabled}
                                >
                                    {isPlaying ? (
                                        <Pause className={`w-6 h-6`} />
                                    ) : (
                                        <Play className={`w-6 h-6`} />
                                    )}
                                    {isButtonDisabled ? <div className="absolute w-6 h-6 opacity-0"></div> : <></>}
                                </motion.button>
                            </div>
                        )}
                    </div>

                    {/* Player Controls - Middle */}
                    <div className={`flex flex-col items-center justify-center w-full order-3 md:order-2 flex-grow min-w-0
                                   ${isExpanded ? 'mt-8 mb-8' : 'hidden sm:flex'}`}>

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
                                {isPlaying ? (
                                    <Pause className={`w-7 h-7`} />
                                ) : (
                                    <Play className={`w-7 h-7`} />
                                )}
                                {isButtonDisabled ? <div className="absolute w-7 h-7 opacity-0"></div> : <></>}
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

                        {/* Song Progress Slider */}
                        <div className={`flex items-center w-full max-w-[500px] px-4 md:px-0 gap-x-2 ${isExpanded ? 'mt-4' : 'mt-1'}`}>
                            <span className="text-xs text-gray-400 w-8 text-right tabular-nums">{formatTime(currentTime)}</span>
                            <Slider
                                value={[progressPercentage]}
                                max={100}
                                step={0.1}
                                onValueChange={handleSeek}
                                onValueCommit={handleSeek}
                                aria-label="song progress"
                                className="flex-grow cursor-pointer"
                                disabled={isButtonDisabled || duration <= 0}
                            />
                            <span className="text-xs text-gray-400 w-8 text-left tabular-nums">{formatTime(duration || 0)}</span>
                        </div>
                    </div>

                    {/* Volume Control */}
                    <div className={`hidden md:flex items-center space-x-2 w-[150px] lg:w-[180px] justify-end order-2 md:order-3 flex-shrink-0
                                   ${isExpanded ? '!hidden' : ''}`}>
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

                    {/* Mobile Progress Bar */}
                    {!isExpanded && (
                        <div className="flex sm:hidden w-full order-4">
                            <Progress
                                value={progressPercentage}
                                className="w-full h-0.5 rounded-full"
                            />
                        </div>
                    )}
                </motion.div>
            </motion.footer>
        </AnimatePresence>
    );
};

export default memo(BottomPlayer);