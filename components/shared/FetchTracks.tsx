// /components/shared/FetchTracks.tsx
"use client"

import Image from 'next/image';

import { memo } from 'react';
import { Play, Pause } from 'lucide-react';
import { useAudio } from '@/components/player/AudioContext';

interface FetchTracksProps {
  tracks: Track[];
  isLoading: boolean;
  error: string | null;
  handleTrackSelect: (index: number) => void;
}

export const FetchTracks = memo(({ 
  tracks, 
  isLoading, 
  error, 
  handleTrackSelect 
}: FetchTracksProps) => {
  const { isPlaying, currentTrackIndex, tracks: currentTracks } = useAudio();

  // Check if a track is the currently playing track
  const isTrackPlaying = (track: Track) => {
    if (!isPlaying) return false;
    
    const currentTrack = currentTracks[currentTrackIndex];
    return currentTrack && currentTrack.id === track.id;
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading tracks...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-4">{error}</div>;
  }

  if (tracks.length === 0) {
    return <div className="text-center py-4">No tracks found</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tracks.map((track, index) => (
        <div 
          key={track.id} 
          className="flex flex-col md:flex-row items-center bg-white/40 border border-neutral-200 group rounded-lg overflow-hidden cursor-pointer transition-colors hover:bg-white/20 relative"
          onClick={() => handleTrackSelect(index)}
        >
          <div className="relative">
            <Image
              src={track.cover || '/default-cover.jpg'}
              alt={track.title}
              width={128}
              height={128}
            />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20 backdrop-blur-[3px] flex items-center justify-center">
              {isTrackPlaying(track) ? (
                <Pause className="w-8 h-8 text-white" />
              ) : (
                <Play className="w-8 h-8 text-white" />
              )}
            </div>
          </div>
          <div className="ml-4">
            <h3 className="font-medium">{track.title}</h3>
            <p className="text-sm text-gray-500">{track.author}</p>
          </div>
          {isTrackPlaying(track) && (
            <div className="ml-auto">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

FetchTracks.displayName = 'FetchTracks';