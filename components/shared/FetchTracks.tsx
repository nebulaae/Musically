// /components/shared/FetchTracks.tsx
"use client"

import Image from 'next/image';

import { memo } from 'react';
import { Play, Pause } from 'lucide-react';
import { SoundWave } from '../ui/special/SoundWave';
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
    return <div className="text-start py-4">Заргужаем песни...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-4">{error}</div>;
  }

  if (tracks.length === 0) {
    return <div className="text-start py-4">Песни не найдены.</div>;
  }

  return (
    <div className="flex flex-row overflow-x-auto overflow-y-hidden">
      {tracks.map((track, index) => (
        <div
          key={track.id}
          className="relative flex flex-col items-start group p-4 cursor-pointer transition-colors hover:bg-white/20"
          onClick={() => handleTrackSelect(index)}
        >
          <div className="relative">
            <Image
              src={track.cover || '/default-cover.jpg'}
              alt={track.title}
              width={200}
              height={200}
              className="rounded-lg"
            />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20 backdrop-blur-[3px] flex items-center justify-center">
              {isTrackPlaying(track) ? (
                <Pause className="w-8 h-8 text-white" />
              ) : (
                <Play className="w-8 h-8 text-white" />
              )}
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-semibold">{track.title}</h3>
            <p className="text-sm text-gray-500">{track.author}</p>
          </div>
        </div>
      ))}
    </div>
  );
});

FetchTracks.displayName = 'FetchTracks';