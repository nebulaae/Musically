"use client"

import { Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { isSongLiked, likeSong, unlikeSong } from '@/db/actions/user.actions';

interface LikeButtonProps {
    trackId: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    onLikeStateChange?: (isLiked: boolean) => void;
}

export const LikeButton = ({ trackId, size = 'md', className = '', onLikeStateChange }: LikeButtonProps) => {
    const [isLiked, setIsLiked] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Get sizes based on the size prop
    const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';

    // Check initial like status
    useEffect(() => {
        const checkLikeStatus = async () => {
            if (!trackId) return;

            try {
                setIsLoading(true);
                const liked = await isSongLiked(trackId);
                setIsLiked(liked);
            } catch (error) {
                console.error('Error checking if song is liked:', error);
            } finally {
                setIsLoading(false);
            }
        };

        checkLikeStatus();
    }, [trackId]);

    const toggleLike = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent event bubbling (important for track selection)

        if (!trackId || isLoading) return;

        try {
            setIsLoading(true);

            if (isLiked) {
                await unlikeSong(trackId);
            } else {
                await likeSong(trackId);
            }

            const newLikedState = !isLiked;
            setIsLiked(newLikedState);

            // Notify parent component if callback provided
            if (onLikeStateChange) {
                onLikeStateChange(newLikedState);
            }
        } catch (error) {
            console.error('Error toggling like status:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={toggleLike}
            disabled={isLoading}
            className={`transition-all duration-200 ${className}`}
            aria-label={isLiked ? "Unlike" : "Like"}
            title={isLiked ? "Unlike" : "Like"}
        >
            <Heart
                className={`${sizeClass} ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-500 hover:text-gray-700'} ${isLoading ? 'opacity-50' : ''}`}
            />
        </button>
    );
};