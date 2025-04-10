"use client"

import Image from 'next/image';

import { Skeleton } from '../ui/skeleton';
import { Play, Pause } from 'lucide-react';
import { SoundWave } from '../ui/magic/SoundWave';
import { LikeButton } from '@/components/functions/LikeButton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";

import { PlaylistActions } from './PlaylistActions';
import { useAudio } from '@/components/player/AudioContext';
import {
  memo,
  useEffect,
  useCallback,
} from 'react';

interface TrackItemProps {
  track: Track;
  index: number;
  isPlaying: boolean;
  handleTrackSelect: (index: number) => void;
}

// Memoized TrackItem component to prevent unnecessary re-renders
const TrackItem = memo(({ track, index, isPlaying, handleTrackSelect }: TrackItemProps) => {
  // Use useCallback for event handlers to maintain referential equality
  const handleClick = useCallback(() => {
    handleTrackSelect(index);
  }, [handleTrackSelect, index]);

  // Rest of TrackItem component stays the same
  return (
    <div
      className="relative flex flex-col items-start group cursor-pointer min-w-[150px] sm:min-w-[200px]"
    >
      <div
        className="relative w-full"
        onClick={handleClick}
      >
        <Image
          src={track.cover || '/default-cover.jpg'}
          alt={track.title}
          width={200}
          height={200}
          className="rounded-lg w-full object-cover"
          priority={index < 4}
          loading={index < 8 ? "eager" : "lazy"}
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFeAJ5gMtG4AAAAABJRU5ErkJggg=="
        />

        {isPlaying && (
          <div className="absolute flex items-center justify-center inset-0 transition-opacity duration-200 bg-black/20 backdrop-blur-[3px] rounded-lg">
            <SoundWave dark />
          </div>
        )}

        <div className="absolute flex items-center justify-center inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20 backdrop-blur-[3px] rounded-lg">
          {isPlaying ? (
            <Pause className="w-8 h-8 text-white" />
          ) : (
            <Play className="w-8 h-8 text-white" />
          )}
        </div>
      </div>

      <div className="mt-2 sm:mt-4 text-start w-full flex items-center justify-between">
        <div onClick={handleClick}>
          <h3 className="font-semibold">{track.title}</h3>
          <p className="text-sm text-gray-500">{track.author}</p>
        </div>
        <div className="flex items-center gap-2">
          <LikeButton
            trackId={track.id}
            size="md"
          />
          <PlaylistActions trackId={track.id} />
        </div>
      </div>
    </div>
  );
});

TrackItem.displayName = 'TrackItem';

// Memoized ListTrackItem component
const ListTrackItem = memo(({ track, index, isPlaying, handleTrackSelect }: TrackItemProps) => {
  const handleClick = useCallback(() => {
    handleTrackSelect(index);
  }, [handleTrackSelect, index]);

  // Rest of the ListTrackItem remains the same
  return (
    <div
      className={`flex items-center p-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:rounded-xl cursor-pointer ${isPlaying ? 'bg-neutral-100 dark:bg-neutral-700 rounded-xl' : ''}`}
    >
      <div
        className="flex items-center flex-1 min-w-0"
        onClick={handleClick}
      >
        <div className="relative flex-shrink-0 w-12 h-12 mr-3">
          <Image
            src={track.cover || '/default-cover.jpg'}
            alt={track.title}
            width={48}
            height={48}
            className="rounded object-cover"
            priority={index < 5}
          />

          {isPlaying && (
            <div className="absolute flex items-center justify-center inset-0 transition-opacity duration-200 bg-black/20 backdrop-blur-[3px] rounded-sm">
              <SoundWave dark />
            </div>
          )}
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
  );
});

ListTrackItem.displayName = 'ListTrackItem';

// Create a global cache for track states
const trackStateCache = new Map<string, { isPlaying: boolean }>();

interface FetchTracksProps {
  tracks: Track[];
  isLoading: boolean;
  error: string | null;
  handleTrackSelect: (index: number, trackList?: Track[]) => void;
  layout?: 'blocks' | 'list';
  variant?: 'flex' | 'grid';
  totalPages?: number;
  currentPage?: number;
  goToPage?: (page: number) => void;
};

export const FetchTracks = memo(({
  tracks,
  isLoading,
  error,
  handleTrackSelect,
  layout = 'blocks',
  variant = 'flex',
  totalPages = 1,
  currentPage = 1,
  goToPage = () => { }
}: FetchTracksProps) => {
  const { isPlaying, currentTrackIndex, tracks: currentTracks } = useAudio();

  // Check if a track is the currently playing track (memoized)
  const getTrackPlayingState = useCallback((track: Track) => {
    if (!isPlaying) return false;
    const currentTrack = currentTracks[currentTrackIndex];
    return currentTrack && currentTrack.id === track.id;
  }, [isPlaying, currentTrackIndex, currentTracks]);

  // Add this useEffect to update the trackStateCache when tracks or playing state changes
  useEffect(() => {
    // Update cache when tracks change or playing state changes
    tracks.forEach(track => {
      const isTrackPlaying = getTrackPlayingState(track);
      trackStateCache.set(track.id, {
        isPlaying: isTrackPlaying
      });
    });
  }, [tracks, getTrackPlayingState]);

  // Optional: Add this to use the cache for performance optimization
  const isTrackPlaying = useCallback((track: Track) => {
    // Check cache first
    const cachedState = trackStateCache.get(track.id);
    if (cachedState !== undefined) {
      return cachedState.isPlaying;
    }
    // Fall back to computing the value
    const isPlaying = getTrackPlayingState(track);
    // Update cache
    trackStateCache.set(track.id, { isPlaying });
    return isPlaying;
  }, [getTrackPlayingState]);

  // Handle track selection - passing only the current page's tracks
  // This is the key fix - we're not trying to calculate absolute indexes anymore
  const handleTrackSelection = useCallback((index: number) => {
    // Simply pass the index within the current page's tracks array
    handleTrackSelect(index, tracks);
  }, [handleTrackSelect, tracks]);

  // For loading state
  if (isLoading) {
    if (layout === 'blocks') {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="w-full h-[250px] rounded-xl" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      )
    }

    if (layout === "list") {
      return (
        <div className="flex flex-col w-full gap-4">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="flex flex-row gap-2">
              <Skeleton className="w-12 h-12" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      )
    }
  }

  // For error state
  if (error) {
    return <div className="text-center text-red-500 py-4">{error}</div>;
  }

  // For empty state
  if (tracks.length === 0) {
    return <div className="text-start py-4">Песни не найдены.</div>;
  }

  // Render pagination component
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <Pagination className="mt-6">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => goToPage(Math.max(1, currentPage - 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50 purple-text" : "cursor-pointer purple-accent"}
            />
          </PaginationItem>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => goToPage(page)}
                isActive={currentPage === page}
                className="cursor-pointer"
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
              className={currentPage === totalPages ? "pointer-events-none opacity-50 purple-text" : "cursor-pointer purple-accent"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  // Render tracks in block layout (grid or flex of cards)
  if (layout === 'blocks') {
    return (
      <div className="flex flex-col w-full">
        <div className={variant === 'grid'
          ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          : "flex flex-row overflow-x-auto overflow-y-hidden gap-4 w-full"
        }>
          {tracks.map((track, index) => (
            <TrackItem
              key={track.id}
              track={track}
              index={index}
              isPlaying={isTrackPlaying(track)}
              handleTrackSelect={handleTrackSelection}
            />
          ))}
        </div>
        {renderPagination()}
      </div>
    );
  }

  // Render List layout
  return (
    <div className="flex flex-col w-full">
      <div className="bg-sidebar glassmorphism w-full border-style rounded-xl divide-y">
        {tracks.map((track, index) => (
          <ListTrackItem
            key={track.id}
            track={track}
            index={index}
            isPlaying={isTrackPlaying(track)}
            handleTrackSelect={handleTrackSelection}
          />
        ))}
      </div>
      {renderPagination()}
    </div>
  );
});

FetchTracks.displayName = 'FetchTracks';