"use client"

import { Track } from '@/lib/tracks';
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
}

export const BottomPlayer: React.FC<BottomPlayerProps> = ({ tracks }) => {
    const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [volume, setVolume] = useState<number>(0.5);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const currentTrack = tracks[currentTrackIndex];

    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio(currentTrack?.src);
            audioRef.current.volume = volume;
            audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
            audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
            audioRef.current.addEventListener('ended', handleTrackEnded);
        } else {
            audioRef.current.src = currentTrack?.src;
            audioRef.current.load(); // Important to load new source
            audioRef.current.volume = volume;
            if (isPlaying) {
                audioRef.current.play().catch(e => console.error("Play failed:", e)); // Auto-play if was playing
            }
        }
        return () => { // Cleanup on unmount and track change
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
                audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
                audioRef.current.removeEventListener('ended', handleTrackEnded);
                audioRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTrackIndex]); // Only re-run when track index changes

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    useEffect(() => {
        if (audioRef.current && isPlaying) {
            audioRef.current.play().catch(e => console.error("Play failed:", e));
        } else if (audioRef.current) {
            audioRef.current.pause();
        }
    }, [isPlaying]);


    const handleLoadedMetadata = () => {
        setDuration(audioRef.current?.duration || 0);
    };

    const handleTimeUpdate = () => {
        setCurrentTime(audioRef.current?.currentTime || 0);
    };

    const handleTrackEnded = () => {
        nextTrack();
    };


    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    const nextTrack = useCallback(() => {
        setCurrentTrackIndex((prevIndex) => (prevIndex + 1) % tracks.length);
        setIsPlaying(true); // Auto-play next track
    }, [tracks.length]);

    const prevTrack = useCallback(() => {
        setCurrentTrackIndex((prevIndex) => (prevIndex - 1 + tracks.length) % tracks.length);
        setIsPlaying(true); // Auto-play previous track
    }, [tracks.length]);


    const handleVolumeChange = (value: number[]) => { // Slider value is number array
        setVolume(value[0] / 100); // Slider value is 0-100
    };


    const formatTime = (time: number): string => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };


    return (
        <motion.footer
            className="fixed bottom-20 sm:bottom-28 md:bottom-0 left-0 w-full bg-sidebar glassmorphism p-4"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="container max-w-7xl mx-auto flex items-center justify-between flex-col md:flex-row gap-4"> {/* Added container and flex-col to flex-row for responsiveness */}
                {/* Track Info */}
                <div className="flex items-center space-x-4 flex-grow md:flex-grow-0 order-1 md:order-none"> {/* Track Info takes space on smaller screens but not grow on medium+ */}
                    <img src={currentTrack?.cover || '/default-cover.png'} alt="Track Cover" className="w-12 h-12 rounded" />
                    <div>
                        <h4 className="font-semibold">{currentTrack?.title || 'No Track'}</h4>
                        <p className="text-sm text-gray-500 truncate max-w-[200px] md:max-w-full">Artist Name (You can add artist info to track object)</p> {/* Added truncate for long artist names on smaller screens */}
                    </div>
                </div>

                {/* Player Controls - Middle */}
                <div className="flex items-center space-x-6 order-2">
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
                            <Play />
                        ) : (
                            <Pause />
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

                {/* Volume Control - End */}
                <div className="hidden items-center space-x-2 w-full md:w-40 justify-end order-3 md:order-none md:flex">
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