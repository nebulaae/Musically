"use client"

import Image from 'next/image';
import { Play } from 'lucide-react';
import { BottomPlayer } from '../player/BottomPlayer'; // You can remove this import

interface TrackInterface {
    tracks: { id: string; title: string; author: string; album: string; cover: string }[];
    currentTrackIndex: number; // Receive from Page
    isPlaying: boolean;     // Receive from Page
    isLoading: boolean;
    error: string | null;
    handleTrackSelect: (index: number) => void; // Receive modified handler from Page
    handlePlayPauseToggle: () => void; // Receive from Page
    setCurrentTrackIndex: (index: number) => void; // Receive empty function from Page - you might remove this if not needed
};

export const FetchTracks = ({
    tracks,
    currentTrackIndex,
    isPlaying,
    isLoading,
    error,
    handleTrackSelect, // Use prop handler
    handlePlayPauseToggle,
    setCurrentTrackIndex, // You might remove this if not needed
}: TrackInterface) => {
    return (
        <div>
            {isLoading ? (
                <div className="text-center">
                    <p className="">Загружаем музыку...</p>
                </div>
            ) : error ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Ошибка! </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-24">
                    {tracks.map((track, index) => (
                        <div
                            key={track.id}
                            className="flex flex-col md:flex-row items-center bg-white/40 border border-neutral-200 group rounded-lg overflow-hidden cursor-pointer transition-colors hover:bg-white/20 relative"
                            onClick={() => handleTrackSelect(index)} // Call the prop handler
                        >
                            <Image src={track?.cover || '/default-cover.jpg'} alt="Track Cover" width={128} height={180} />
                            <div className="p-4 flex flex-col justify-end">
                                <h3 className="font-semibold text-base truncate">{track.title}</h3>
                                <p className="text-sm text-gray-400 truncate">{track.author}</p>
                                <p className="text-sm text-gray-400 truncate">{track.album}</p>
                            </div>
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20 backdrop-blur-[3px] flex items-center justify-center">
                                <Play className='w-5 h-5' />
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {/* Remove BottomPlayer from here */}
            {/* {tracks.length > 0 && (
                <BottomPlayer
                    tracks={tracks}
                    currentTrackIndex={currentTrackIndex}
                    onTrackIndexChange={setCurrentTrackIndex}
                    isPlaying={isPlaying}
                    onPlayPauseToggle={handlePlayPauseToggle}
                />
            )} */}
        </div>
    );
};