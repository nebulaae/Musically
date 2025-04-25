'use client';

import { useEffect, useState, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '../ui/button';
import { useToken } from '@/app/providers/TokenProvider';

interface LikeButtonProps {
  trackId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onLikeStateChange?: (isLiked: boolean) => void;
}

export function LikeButton({
  trackId,
  size = 'md',
  className = '',
  onLikeStateChange,
}: LikeButtonProps) {
  const { isTokenExist } = useToken();

  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const sizeClass =
    size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';

  // Fetch like status only if authenticated
  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (!trackId || !isTokenExist) return;

      try {
        const res = await fetch('/api/user/isSongLiked', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackId }),
        });

        if (res.ok) {
          const data = await res.json();
          setIsLiked(data.isLiked);
        } else {
          console.error('Failed to fetch like status');
        }
      } catch (err) {
        console.error('Error fetching like status:', err);
      }
    };

    fetchLikeStatus();
  }, [trackId, isTokenExist]);

  const toggleLike = useCallback(async () => {
    if (!trackId || !isTokenExist || isLoading) return;

    setIsLoading(true);
    const endpoint = isLiked ? '/api/user/unlikeSong' : '/api/user/likeSong';
    const method = isLiked ? 'DELETE' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId }),
      });

      if (res.ok) {
        const newLikedState = !isLiked;
        setIsLiked(newLikedState);
        onLikeStateChange?.(newLikedState);
      } else {
        console.error(`Failed to ${isLiked ? 'unlike' : 'like'} the song`);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    } finally {
      setIsLoading(false);
    }
  }, [trackId, isLiked, isLoading, isTokenExist, onLikeStateChange]);

  return (
    <Button
      variant="ghost"
      onClick={toggleLike}
      disabled={!isTokenExist || isLoading}
      className={`transition-all duration-200 ${className}`}
      aria-label={isLiked ? 'Unlike song' : 'Like song'}
      title={isLiked ? 'Unlike song' : 'Like song'}
    >
      <Heart
        className={`${sizeClass} ${
          isLiked
            ? 'fill-red-500 text-red-500'
            : 'text-neutral-800 hover:text-neutral-700 dark:text-neutral-50 dark:hover:text-neutral-200'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
    </Button>
  );
};