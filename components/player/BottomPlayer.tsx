"use client"

import Image from 'next/image';

import { Track } from '@/app/api/tracks/route';
import { motion } from 'framer-motion';
import { Slider } from "@/components/ui/slider";
import {
    useState,
    useRef,
    useEffect,
    useCallback
} from 'react';
import {
    Volume1,
    Volume2,
    VolumeX,
    ChevronLeft,
    ChevronRight,
    Play,
    Pause
} from 'lucide-react';

interface BottomPlayerProps {
    tracks: Track[];
    currentTrackIndex: number;
    onTrackIndexChange: (index: number) => void;
    isPlaying: boolean;
    onPlayPauseToggle: () => void;
}

export const BottomPlayer: React.FC<BottomPlayerProps> = ({
    tracks,
    currentTrackIndex,
    onTrackIndexChange,
    isPlaying,
    onPlayPauseToggle
}) => {
    const [volume, setVolume] = useState<number>(0.5);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlayerVisible, setIsPlayerVisible] = useState<boolean>(false);

    const currentTrack = tracks[currentTrackIndex];

    // Handle metadata loading to set duration
    const handleLoadedMetadata = useCallback(() => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration || 0);
        }
    }, []);

    // Handle time update to track current playback position
    const handleTimeUpdate = useCallback(() => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime || 0);
        }
    }, []);

    // Handle track ending
    const handleTrackEnded = useCallback(() => {
        nextTrack();
    }, [/* nextTrack will be defined below and added to dependencies */]);

    // Navigate to next track
    const nextTrack = useCallback(() => {
        onTrackIndexChange((currentTrackIndex + 1) % tracks.length);
        setIsPlayerVisible(true);
    }, [tracks.length, onTrackIndexChange, currentTrackIndex]);

    // Navigate to previous track
    const prevTrack = useCallback(() => {
        onTrackIndexChange((currentTrackIndex - 1 + tracks.length) % tracks.length);
        setIsPlayerVisible(true);
    }, [tracks.length, onTrackIndexChange, currentTrackIndex]);

    // Initialize audio and handle track changes
    useEffect(() => {
        // Reset current time when track changes
        setCurrentTime(0);
        
        // Create audio element if it doesn't exist
        if (!audioRef.current) {
            audioRef.current = new Audio();
        }
        
        const audio = audioRef.current;
        
        // Set up the audio element
        audio.src = currentTrack?.src || '';
        audio.volume = volume;
        
        // Add event listeners
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleTrackEnded);
        
        // Play if needed
        if (isPlaying) {
            audio.play().catch(e => console.error("Play failed:", e));
        } else {
            audio.pause();
        }
        
        // Clean up function
        return () => {
            audio.pause();
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleTrackEnded);
        };
    }, [currentTrackIndex, currentTrack?.src, handleLoadedMetadata, handleTimeUpdate, handleTrackEnded, isPlaying, volume]);

    // Update audio playback state when isPlaying changes
    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.play().catch(e => console.error("Play failed:", e));
                setIsPlayerVisible(true);
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying]);

    // Update volume when it changes
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    // Toggle play/pause
    const togglePlay = () => {
        onPlayPauseToggle();
        setIsPlayerVisible(true);
    };

    // Handle volume change from slider
    const handleVolumeChange = (value: number[]) => {
        setVolume(value[0] / 100);
    };

    // Format time display (e.g., 01:45)
    const formatTime = (time: number): string => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    if (!isPlayerVisible) {
        return null;
    }

    return (
        <motion.footer
            className="fixed bottom-20 sm:bottom-28 md:bottom-0 left-0 w-full bg-sidebar glassmorphism p-4"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="container max-w-7xl mx-auto flex items-center justify-between flex-col md:flex-row gap-4">
                {/* Track Info */}
                <div className="flex items-center space-x-4 flex-grow md:flex-grow-0 order-1 md:order-none">
                    <Image src={currentTrack?.cover || '/default-cover.png'} alt="Track Cover" width={36} height={36} className="rounded-xl" />
                    <div>
                        <h4 className="font-semibold">{currentTrack?.title || 'No Track'}</h4>
                        <p className="text-sm text-gray-500 truncate max-w-[200px] md:max-w-full">{currentTrack?.author}</p>
                        {/* Time Display for Mobile */}
                        <div className="md:hidden text-sm text-gray-500 mt-1">
                            {formatTime(currentTime)} / {formatTime(duration || 0)}
                        </div>
                    </div>
                </div>

                {/* Player Controls - Middle */}
                <div className="flex items-center space-x-6 order-2 flex-col md:flex-row md:flex-1 justify-center">
                    {/* Time Display for Desktop */}
                    <div className="hidden md:block text-sm text-gray-500 min-w-[100px] text-center">
                        {formatTime(currentTime)} / {formatTime(duration || 0)}
                    </div>
                    <div className="flex items-center space-x-6">
                        <motion.button
                            className="p-2 rounded-full hover:bg-gray-100"
                            onClick={prevTrack}
                            whileTap={{ scale: 0.9 }}
                        >
                            <ChevronLeft />
                        </motion.button>

                        <motion.button
                            className="p-3 rounded-full bg-gray-100 hover:bg-gray-200"
                            onClick={togglePlay}
                            whileTap={{ scale: 0.9 }}
                        >
                            {isPlaying ? (
                                <Pause className='w-5 h-5' />
                            ) : (
                                <Play className='w-5 h-5' />
                            )}
                        </motion.button>

                        <motion.button
                            className="p-2 rounded-full hover:bg-gray-100"
                            onClick={nextTrack}
                            whileTap={{ scale: 0.9 }}
                        >
                            <ChevronRight />
                        </motion.button>
                    </div>
                </div>

                {/* Volume Control - End */}
                <div className="hidden md:items-center space-x-2 w-full md:w-40 justify-end order-3 md:flex">
                    {volume === 0 ? <VolumeX className='w-5 h-5' /> : volume < 0.5 ? <Volume1 className='w-5 h-5' /> : <Volume2 className='w-5 h-5' />}
                    <Slider
                        defaultValue={[volume * 100]}
                        max={100}
                        step={1}
                        onValueChange={handleVolumeChange}
                        aria-label="volume"
                        className="w-24 flex-grow md:flex-grow-0"
                    />
                </div>
            </div>
        </motion.footer>
    );
};