"use client"

import Image from 'next/image';

import { memo, useEffect } from 'react';
import { Button } from '../ui/button';
import { Play, Pause, Music, Heart } from 'lucide-react';
import { useMusicActions } from '@/hooks/useMusicActions';
import { useAudio } from '@/components/player/AudioContext';

interface FetchTracksProps {
  tracks: Track[];
  isLoading: boolean;
  error: string | null;
  handleTrackSelect: (index: number) => void;
  layout?: 'blocks' | 'list'; // New prop for different layouts
  variant?: 'flex' | 'grid'; // New prop for flex or grid layout
}

export const FetchTracks = memo(({
  tracks,
  isLoading,
  error,
  handleTrackSelect,
  layout = 'blocks', // Default to blocks layout
  variant = 'flex' // Default to flex variant
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
        ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        : "flex flex-row overflow-x-auto overflow-y-hidden gap-4 w-full"
      }>
        {tracks.map((track, index) => (
          <div
            key={track.id}
            className="relative flex flex-col items-start group cursor-pointer min-w-[150px] sm:min-w-[200px]"
            onClick={() => handleTrackSelect(index)}
          >
            <div className="relative w-full">
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

              {/* Like Button Overlay */}
              <LikeButton trackId={track.id} className="absolute bottom-2 right-2" />
            </div>
            <div className="mt-2 sm:mt-4 text-start w-full">
              <h3 className="font-semibold">{track.title}</h3>
              <p className="text-sm text-gray-500">{track.author}</p>
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
          onClick={() => handleTrackSelect(index)}
        >
          <div className="flex items-center flex-1 min-w-0">
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
            <LikeButton trackId={track.id} />
            {isTrackPlaying(track) ? (
              <span className="text-xs font-medium text-green-600 w-16 text-right">Playing</span>
            ) : (
              <span className="text-xs text-gray-500 w-16 text-right">
                { } {/* Placeholder duration */}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
});

const LikeButton = ({ trackId, className = '' }: { trackId: string, className?: string }) => {
  const { isLiked, toggleLike, refreshLikedSongs } = useMusicActions(trackId);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleLike();
    // Force a refresh of all liked songs to update UI everywhere
    await refreshLikedSongs();
  };

  return (
    <button
      className={`p-2 rounded-full bg-white/80 hover:bg-white ${isLiked ? 'text-red-500' : 'text-gray-600'} ${className}`}
      onClick={handleClick}
      aria-label={isLiked ? 'Unlike' : 'Like'}
    >
      <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
    </button>
  );
};