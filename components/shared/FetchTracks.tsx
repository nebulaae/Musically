"use client"

import Image from 'next/image';

import { memo, useCallback } from 'react';
import { Play, Pause, Music } from 'lucide-react';
import { useAudio } from '@/components/player/AudioContext';
import { LikeButton } from '@/components/shared/LikeButton';

interface FetchTracksProps {
  tracks: Track[];
  isLoading: boolean;
  error: string | null;
  handleTrackSelect: (index: number) => void;
  layout?: 'blocks' | 'list';
  variant?: 'flex' | 'grid';
}

export const FetchTracks = memo(({
  tracks,
  isLoading,
  error,
  handleTrackSelect,
  layout = 'blocks',
  variant = 'flex'
}: FetchTracksProps) => {
  const { isPlaying, currentTrackIndex, tracks: currentTracks } = useAudio();

  // Format time display (e.g., 01:45)
  const formatTime = useCallback((time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, []);

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

  // Render tracks in block layout (grid or flex of cards)
  if (layout === 'blocks') {
    return (
      <div className={variant === 'grid'
        ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        : "flex flex-row overflow-x-auto overflow-y-hidden gap-4 w-full"
      }>
        {tracks.map((track, index) => (
          <div
            key={track.id}
            className="relative flex flex-col items-start group cursor-pointer min-w-[150px] sm:min-w-[200px]"
          >
            <div
              className="relative w-full"
              onClick={() => handleTrackSelect(index)}
            >
              <Image
                src={track.cover || '/default-cover.jpg'}
                alt={track.title}
                width={200}
                height={200}
                className="rounded-lg w-full object-cover"
              />
              <div className="absolute flex items-center justify-center inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20 backdrop-blur-[3px] rounded-lg">
                {isTrackPlaying(track) ? (
                  <Pause className="w-8 h-8 text-white" />
                ) : (
                  <Play className="w-8 h-8 text-white" />
                )}
              </div>
            </div>
            <div className="mt-2 sm:mt-4 text-start w-full flex items-center justify-between">
              <div onClick={() => handleTrackSelect(index)}>
                <h3 className="font-semibold">{track.title}</h3>
                <p className="text-sm text-gray-500">{track.author}</p>
              </div>
              <LikeButton trackId={track.id} size="md" className="ml-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Render tracks in list layout (Spotify-like list)
  return (
    <div className="w-full border border-gray-200 rounded-md divide-y">
      {tracks.map((track, index) => (
        <div
          key={track.id}
          className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer ${isTrackPlaying(track) ? 'bg-gray-50' : ''}`}
        >
          <div
            className="flex items-center flex-1 min-w-0"
            onClick={() => handleTrackSelect(index)}
          >
            <div className="relative flex-shrink-0 w-12 h-12 mr-3">
              {track.cover ? (
                <Image
                  src={track.cover}
                  alt={track.title}
                  width={48}
                  height={48}
                  className="rounded object-cover"
                />
              ) : (
                <div className="flex items-center justify-center bg-gray-200 rounded w-full h-full">
                  <Music className="w-6 h-6 text-gray-500" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                {isTrackPlaying(track) ? (
                  <Pause className="w-6 h-6 text-white" />
                ) : (
                  <Play className="w-6 h-6 text-white" />
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="font-medium truncate">{track.title}</h4>
              <p className="text-sm text-gray-500 truncate">{track.author}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {isTrackPlaying(track) ? (
              <span className="text-xs font-medium text-green-600 w-16 text-right">Playing</span>
            ) : (
              <span className="text-xs text-gray-500 w-16 text-right"></span>
            )}
            <LikeButton trackId={track.id} size="md" />
          </div>
        </div>
      ))}
    </div>
  );
});