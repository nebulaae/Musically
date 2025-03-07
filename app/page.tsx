"use client"

import Image from 'next/image';

import { useState, useEffect } from 'react';
import { Track } from '@/app/api/tracks/route';
import { BottomPlayer } from '@/components/player/BottomPlayer';

export default function MusicPlayerPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tracks on component mount
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/tracks');

        if (!response.ok) {
          throw new Error(`Failed to fetch tracks: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          setTracks(data);
        } else {
          setError('No tracks found. Please add some music files to the tracks directory.');
        }
      } catch (err) {
        console.error('Error fetching tracks:', err);
        setError(err instanceof Error ? err.message : 'Unknown error fetching tracks');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTracks();
  }, []);

  // Handle track selection
  const handleTrackSelect = (index: number) => {
    setCurrentTrackIndex(index);
    setIsPlaying(true);
  };

  // Toggle play/pause
  const handlePlayPauseToggle = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="w-full">
      <div className="mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Music Player</h1>

        {isLoading ? (
          <div className="text-center py-10">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em]" role="status">
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
            </div>
            <p className="mt-2">Loading your tracks...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error! </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 mb-24">
            {tracks.map((track, index) => (
              <div
                key={track.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300 ${currentTrackIndex === index ? 'ring-2 ring-blue-500' : ''
                  }`}
                onClick={() => handleTrackSelect(index)}
              >
                <Image src={track?.cover || '/default-cover.png'} alt="Track Cover" width={128} height={128} className="rounded-xl" />
                <div className="p-4">
                  <h3 className="font-semibold text-lg truncate">{track.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{track.author}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {track.album && <span>{track.album} • </span>}
                    <span className="uppercase">{track.type}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {tracks.length > 0 && (
        <BottomPlayer
          tracks={tracks}
          currentTrackIndex={currentTrackIndex}
          onTrackIndexChange={setCurrentTrackIndex}
          isPlaying={isPlaying}
          onPlayPauseToggle={handlePlayPauseToggle}
        />
      )}
    </div>
  );
}