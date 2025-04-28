"use client"

import Image from 'next/image';

import { Skeleton } from '../ui/skeleton';
import { Play, Pause } from 'lucide-react';
import { SoundWave } from '../ui/magic/SoundWave';
import { TrackActions } from './TrackActions';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

import { Track } from '@/server/models/track';
import { getProxiedImageUrl } from '@/lib/utils';
import { useAudio } from '@/components/player/AudioContext';
import {
  memo,
  useEffect,
  useCallback,
} from 'react';

// Common props for track items
interface BaseTrackItemProps {
  track: Track;
  index: number;
  isPlaying: boolean;
  handleTrackSelect: (index: number) => void;
}

// Track cover image component to reduce duplication
const TrackCover = memo(({
  track,
  isPlaying,
  size = 'full',
  priority = false
}: {
  track: Track,
  isPlaying: boolean,
  size?: string,
  priority?: boolean
}) => {
  const coverSrc = getProxiedImageUrl(track.cover || '/default-cover.jpg');
  const dimensions = size === 'small' ? { width: 48, height: 48 } : { width: 200, height: 200 };

  return (
    <div className={`relative ${size === 'small' ? 'w-12 h-12' : 'w-full'}`}>
      <Image
        src={coverSrc}
        alt={track.title}
        width={dimensions.width}
        height={dimensions.height}
        className={`${size === 'small' ? 'rounded' : 'rounded-lg w-full'} object-cover`}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        placeholder="blur"
        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFeAJ5gMtG4AAAAABJRU5ErkJggg=="
      />

      {isPlaying && (
        <div className={`absolute flex items-center justify-center inset-0 transition-opacity duration-200 bg-black/20 backdrop-blur-[3px] ${size === 'small' ? 'rounded-sm' : 'rounded-lg'}`}>
          <SoundWave dark />
        </div>
      )}
    </div>
  );
});

TrackCover.displayName = 'TrackCover';

// Play/Pause overlay component
const PlayPauseOverlay = memo(({ isPlaying }: { isPlaying: boolean }) => (
  <div className="absolute flex items-center justify-center inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20 backdrop-blur-[3px] rounded-lg">
    {isPlaying ? (
      <Pause className="w-8 h-8 text-white" />
    ) : (
      <Play className="w-8 h-8 text-white" />
    )}
  </div>
));

PlayPauseOverlay.displayName = 'PlayPauseOverlay';

// Memoized TrackItem component for grid/flex layout
const TrackItem = memo(({ track, index, isPlaying, handleTrackSelect }: BaseTrackItemProps) => {
  const handleClick = useCallback(() => {
    handleTrackSelect(index);
  }, [handleTrackSelect, index]);

  return (
    <div className="relative flex flex-col items-start group cursor-pointer min-w-[140px] w-full sm:min-w-[180px] md:min-w-[200px]">
      <div className="relative w-full" onClick={handleClick}>
        <TrackCover
          track={track}
          isPlaying={isPlaying}
          priority={index < 4}
        />
        <PlayPauseOverlay isPlaying={isPlaying} />
      </div>

      <div className="mt-2 sm:mt-3 text-start w-full flex items-center justify-between">
        <div onClick={handleClick} className="w-full pr-2">
          <h3 className="font-semibold text-sm sm:text-base truncate">{track.title}</h3>
          <p className="text-xs sm:text-sm text-gray-500 truncate">{track.author}</p>
        </div>
      </div>
    </div>
  );
});

TrackItem.displayName = 'TrackItem';

// Memoized ListTrackItem component
const ListTrackItem = memo(({ track, index, isPlaying, handleTrackSelect }: BaseTrackItemProps) => {
  const handleClick = useCallback(() => {
    handleTrackSelect(index);
  }, [handleTrackSelect, index]);

  return (
    <div className={`flex items-center p-2 sm:p-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:rounded-xl cursor-pointer ${isPlaying ? 'bg-neutral-100 dark:bg-neutral-700 rounded-xl' : ''}`}>
      <div className="flex items-center flex-1 min-w-0" onClick={handleClick}>
        <div className="relative flex-shrink-0 mr-2 sm:mr-3">
          <TrackCover
            track={track}
            isPlaying={isPlaying}
            size="small"
            priority={index < 5}
          />
        </div>

        <div className="min-w-0 flex-1 max-w-full">
          <h4 className="font-medium text-sm sm:text-base truncate">{track.title}</h4>
          <p className="text-xs sm:text-sm text-gray-500 truncate">{track.author}</p>
        </div>
      </div>

      <div className="flex items-center pr-2 sm:pr-4 flex-shrink-0">
        <TrackActions trackId={track.id} />
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
}

// Loading skeletons component
const LoadingSkeletons = ({ layout = 'blocks' }: { layout?: 'blocks' | 'list' }) => {
  if (layout === 'blocks') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="w-full aspect-square rounded-xl" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-3">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex flex-row gap-2 items-center">
          <Skeleton className="w-12 h-12 rounded" />
          <div className="flex-1">
            <Skeleton className="h-5 w-full mb-1" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Pagination component
const TrackPagination = memo(({
  totalPages,
  currentPage,
  goToPage
}: {
  totalPages: number,
  currentPage: number,
  goToPage: (page: number) => void
}) => {
  if (totalPages <= 1) return null;

  // Calculate which pages to show with ellipsis
  const getVisiblePages = () => {
    const maxDisplayedPages = 5;

    if (totalPages <= maxDisplayedPages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const sidePages = Math.floor((maxDisplayedPages - 3) / 2);
    const leftSide = Math.max(2, currentPage - sidePages);
    const rightSide = Math.min(totalPages - 1, currentPage + sidePages);

    const visiblePages = [1];

    if (leftSide > 2) {
      visiblePages.push(-1); // Left ellipsis
    }

    for (let i = leftSide; i <= rightSide; i++) {
      visiblePages.push(i);
    }

    if (rightSide < totalPages - 1) {
      visiblePages.push(-2); // Right ellipsis
    }

    visiblePages.push(totalPages);

    return visiblePages;
  };

  const visiblePages = getVisiblePages();

  return (
    <Pagination className="mt-6">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => goToPage(Math.max(1, currentPage - 1))}
            className={currentPage === 1 ? "pointer-events-none opacity-50 purple-text" : "cursor-pointer purple-accent"}
          />
        </PaginationItem>

        {visiblePages.map((page, index) => (
          page < 0 ? (
            <PaginationItem key={`ellipsis-${page}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => goToPage(page)}
                isActive={currentPage === page}
                className="cursor-pointer"
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          )
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
});

TrackPagination.displayName = 'TrackPagination';

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

  // Check if a track is the currently playing track
  const getTrackPlayingState = useCallback((track: Track) => {
    if (!isPlaying) return false;
    const currentTrack = currentTracks[currentTrackIndex!];
    return currentTrack && currentTrack.id === track.id;
  }, [isPlaying, currentTrackIndex, currentTracks]);

  // Update cache when tracks or playing state changes
  useEffect(() => {
    tracks.forEach(track => {
      const isTrackPlaying = getTrackPlayingState(track);
      trackStateCache.set(track.id, {
        isPlaying: isTrackPlaying
      });
    });
  }, [tracks, getTrackPlayingState]);

  // Use the cache for performance optimization
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

  // Handle track selection within current page's tracks
  const handleTrackSelection = useCallback((index: number) => {
    handleTrackSelect(index, tracks);
  }, [handleTrackSelect, tracks]);

  // For loading state
  if (isLoading) {
    return <LoadingSkeletons layout={layout} />;
  }

  // For error state
  if (error) {
    return <div className="text-center text-red-500 py-4">{error}</div>;
  }

  // For empty state
  if (tracks.length === 0) {
    return <div className="text-start py-4">Песни не найдены.</div>;
  }

  // Render tracks in block layout (grid or flex of cards)
  if (layout === 'blocks') {
    return (
      <div className="flex flex-col w-full">
        <div className={variant === 'grid'
          ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
          : "flex flex-row overflow-x-auto overflow-y-hidden gap-3 sm:gap-4 w-full pb-2 scrollbar-thin"
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
        <TrackPagination
          totalPages={totalPages}
          currentPage={currentPage}
          goToPage={goToPage}
        />
      </div>
    );
  }

  // Render List layout
  return (
    <div className="flex flex-col w-full">
      <div className="bg-sidebar glassmorphism w-full border-style rounded-lg p-2 divide-y">
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
      <TrackPagination
        totalPages={totalPages}
        currentPage={currentPage}
        goToPage={goToPage}
      />
    </div>
  );
});

FetchTracks.displayName = 'FetchTracks';