"use client"

import Image from 'next/image';

import { memo } from 'react';
import { Play, Pause } from 'lucide-react';
import { SoundWave } from '../ui/magic/SoundWave';
import { PlaylistActions } from './PlaylistActions';
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
        ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4"
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
              <div className="absolute flex items-end justify-end inset-0 p-4 z-10">
                <LikeButton trackId={track.id} size="md" className="ml-2 bg-white/50 glassmorphism p-2 rounded-full shadow-lg" />
              </div>

              {isTrackPlaying(track) &&
                <div className="absolute flex items-center justify-center inset-0 transition-opacity duration-200 bg-black/20 backdrop-blur-[3px] rounded-lg">
                  <SoundWave dark />
                </div>
              }

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
              <PlaylistActions trackId={track.id} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Render tracks in list layout (Spotify-like list)
  return (
    <div className="bg-sidebar glassmorphism w-full border border-neutral-200 rounded-xl divide-y">
      {tracks.map((track, index) => (
        <div
          key={track.id}
          className={`flex items-center p-3 hover:bg-neutral-100 hover:rounded-xl cursor-pointer ${isTrackPlaying(track) ? 'bg-neutral-100 rounded-xl' : ''}`}
        >
          <div
            className="flex items-center flex-1 min-w-0"
            onClick={() => handleTrackSelect(index)}
          >
            <div className="relative flex-shrink-0 w-12 h-12 mr-3">
              <Image
                src={track.cover!}
                alt={track.title}
                width={48}
                height={48}
                className="rounded object-cover"
              />

              {isTrackPlaying(track) &&
                <div className="absolute flex items-center justify-center inset-0 transition-opacity duration-200 bg-black/20 backdrop-blur-[3px] rounded-sm">
                  <SoundWave dark />
                </div>
              }
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="font-medium truncate">{track.title}</h4>
              <p className="text-sm text-gray-500 truncate">{track.author}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <LikeButton trackId={track.id} size="md" />
            <PlaylistActions trackId={track.id} />
          </div>
        </div>
      ))}
    </div>
  );
});