'use client';

import { Heart } from 'lucide-react';
import {
    memo,
    useState,
    useEffect,
    useCallback,
    useTransition,
    useOptimistic
} from 'react';

interface LikeButtonProps {
    trackId: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    onLikeStateChange?: (isLiked: boolean) => void;
}

// Type for our state
interface LikeState {
    isLiked: boolean;
    isLoading: boolean;
}

const LikeButtonBase = ({
    trackId,
    size = 'md',
    className = '',
    onLikeStateChange,
}: LikeButtonProps) => {
    // Determine icon size based on the 'size' prop
    const sizeClass =
        size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';

    // Base state
    const [likeState, setLikeState] = useState<LikeState>({
        isLiked: false,
        isLoading: true
    });

    // Optimistic state updates
    const [optimisticLikeState, addOptimisticUpdate] = useOptimistic(
        likeState,
        (state, update: Partial<LikeState>) => ({
            ...state,
            ...update
        })
    );

    // For handling transitions
    const [isPending, startTransition] = useTransition();

    // Memoized fetch function to get like status
    const fetchLikeStatus = useCallback(async () => {
        // Don't fetch if trackId is not provided
        if (!trackId) {
            setLikeState(prev => ({ ...prev, isLoading: false }));
            return;
        }

        try {
            // Fetch the like status from the API
            const res = await fetch('/api/user/isSongLiked', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trackId })
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error('Failed to fetch like status:', res.status, errorData.error);
                throw new Error('Failed to fetch like status');
            }

            const data = await res.json();
            // Update the like state based on the response
            setLikeState({ isLiked: data.isLiked, isLoading: false });
        } catch (error) {
            console.error('Error fetching like status:', error);
            setLikeState({ isLiked: false, isLoading: false });
        }
    }, [trackId]);

    // Effect to fetch the initial like status when the component mounts or trackId changes
    useEffect(() => {
        setLikeState(prev => ({ ...prev, isLoading: true }));
        fetchLikeStatus();
    }, [fetchLikeStatus]);

    // Memoized toggle function to handle like/unlike action
    const toggleLike = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!trackId || optimisticLikeState.isLoading) return;

        // Get the current state for the action
        const currentIsLiked = optimisticLikeState.isLiked;

        // Wrap in startTransition to avoid the error
        startTransition(() => {
            // Apply optimistic update within transition
            addOptimisticUpdate({
                isLiked: !currentIsLiked,
                isLoading: true
            });

            // Perform the actual API call
            const performLikeAction = async () => {
                try {
                    // Determine the correct endpoint based on the current like state
                    const endpoint = currentIsLiked ? '/api/user/unlikeSong' : '/api/user/likeSong';
                    const method = currentIsLiked ? 'DELETE' : 'POST';

                    const res = await fetch(endpoint, {
                        method: method,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ trackId })
                    });

                    if (!res.ok) {
                        const errorData = await res.json();
                        console.error(
                            `Failed to ${currentIsLiked ? 'unlike' : 'like'}:`,
                            res.status,
                            errorData.error
                        );

                        // Revert on error
                        setLikeState({ isLiked: currentIsLiked, isLoading: false });
                        throw new Error(`Failed to ${currentIsLiked ? 'unlike' : 'like'}`);
                    }

                    // Success - update the actual state
                    const newLikedState = !currentIsLiked;
                    setLikeState({ isLiked: newLikedState, isLoading: false });

                    // Call the callback function if provided
                    if (onLikeStateChange) {
                        onLikeStateChange(newLikedState);
                    }
                } catch (error) {
                    console.error('Error toggling like status:', error);
                    // Error handling is done above
                }
            };

            performLikeAction();
        });
    }, [trackId, optimisticLikeState, addOptimisticUpdate, onLikeStateChange]);

    // Render the button
    return (
        <button
            onClick={toggleLike}
            disabled={optimisticLikeState.isLoading || isPending}
            className={`transition-all duration-200 cursor-pointer ${className}`}
            aria-label={optimisticLikeState.isLiked ? 'Unlike song' : 'Like song'}
            title={optimisticLikeState.isLiked ? 'Unlike song' : 'Like song'}
        >
            <Heart
                className={`${sizeClass} ${optimisticLikeState.isLiked
                    ? 'fill-red-500 text-red-500'
                    : 'text-neutral-800 hover:text-neutral-700 dark:text-neutral-50 dark:hover:text-neutral-200'
                    } ${(optimisticLikeState.isLoading || isPending) ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
        </button>
    );
};

// Memoize the component to prevent unnecessary re-renders
export const LikeButton = memo(LikeButtonBase);