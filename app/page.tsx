"use client"

import { useTracks } from "@/hooks/useTracks";
import { FetchTracks } from "@/components/shared/FetchTracks";
import { useState, useCallback } from 'react'; // Import useState and useCallback
import { BottomPlayer } from "@/components/player/BottomPlayer"; // Import BottomPlayer

const Page = () => {
    const collection = useTracks("Fell In Love.mp3", "VOGUE - Lil Tecca.mp3");
    const cartiCollection = useTracks("Magnolia.mp3", "Racks Up.mp3");

    // Centralized Player State
    const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [currentTracks, setCurrentTracks] = useState<Track[]>([]); // To hold the tracks for the BottomPlayer

    // Play Pause Toggle - Centralized
    const handlePlayPauseToggle = useCallback(() => {
        setIsPlaying(!isPlaying);
    }, [isPlaying]);

    // Track Select Handler - Centralized
    const handleTrackSelect = useCallback((index: number, tracksSource: Track[]) => {
        setCurrentTrackIndex(index);
        setCurrentTracks(tracksSource); // Set the tracks for the BottomPlayer
        setIsPlaying(true); // Auto-play when a track is selected
    }, []);

    return (
        <div className="w-full">
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-6">Lil Tecca</h1>
                <FetchTracks
                    tracks={collection.tracks}
                    currentTrackIndex={currentTrackIndex} // Pass centralized state
                    isPlaying={isPlaying}             // Pass centralized state
                    isLoading={collection.isLoading}
                    error={collection.error}
                    handleTrackSelect={(index) => handleTrackSelect(index, collection.tracks)} // Pass modified handler
                    handlePlayPauseToggle={handlePlayPauseToggle} // Pass centralized handler
                    setCurrentTrackIndex={() => {}} //  No need to set index from here directly
                />
                <h1 className="text-2xl font-bold mb-6">PlayboiCarti</h1>
                <FetchTracks
                    tracks={cartiCollection.tracks}
                    currentTrackIndex={currentTrackIndex} // Pass centralized state
                    isPlaying={isPlaying}             // Pass centralized state
                    isLoading={cartiCollection.isLoading}
                    error={cartiCollection.error}
                    handleTrackSelect={(index) => handleTrackSelect(index, cartiCollection.tracks)} // Pass modified handler
                    handlePlayPauseToggle={handlePlayPauseToggle} // Pass centralized handler
                    setCurrentTrackIndex={() => {}} // No need to set index from here directly
                />
            </div>
            {/* Single BottomPlayer instance */}
            {currentTracks.length > 0 && (
                <BottomPlayer
                    tracks={currentTracks} // Use the currently active track list
                    currentTrackIndex={currentTrackIndex} // Pass centralized state
                    onTrackIndexChange={setCurrentTrackIndex} // Pass centralized setter - might need to adjust this logic
                    isPlaying={isPlaying}             // Pass centralized state
                    onPlayPauseToggle={handlePlayPauseToggle} // Pass centralized handler
                />
            )}
        </div>
    );
};

export default Page;