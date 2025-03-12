import { useState, useEffect, useCallback } from 'react';
import {
    isSongLiked,
    likeSong,
    unlikeSong,
    createPlaylist,
    addTrackToPlaylist,
    getAllPlaylists
} from '@/db/actions/action.user';
import { Playlist } from '@/db/models/model.user';

export const useMusicActions = (trackId?: string) => {
    const [isLiked, setIsLiked] = useState(false);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            if (!trackId) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);

                // Check if song is liked
                const liked = await isSongLiked(trackId);
                setIsLiked(liked);

                // Get all playlists
                const userPlaylists = await getAllPlaylists();
                setPlaylists(userPlaylists);
            } catch (error) {
                console.error('Error loading music actions data:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadData();
    }, [trackId]);

    const toggleLike = useCallback(async () => {
        if (!trackId) return;

        try {
            if (isLiked) {
                await unlikeSong(trackId);
            } else {
                await likeSong(trackId);
            }

            setIsLiked(!isLiked);
        } catch (error) {
            console.error('Error toggling like status:', error);
        }
    }, [trackId, isLiked]);

    const addToPlaylist = useCallback(async (playlistId: string) => {
        if (!trackId) return;

        try {
            await addTrackToPlaylist(playlistId, trackId);
            return true;
        } catch (error) {
            console.error('Error adding to playlist:', error);
            return false;
        }
    }, [trackId]);

    const createNewPlaylist = useCallback(async (name: string) => {
        try {
            const newPlaylist = await createPlaylist(name);

            if (trackId) {
                await addTrackToPlaylist(newPlaylist.id, trackId);
            }

            setPlaylists(prev => [...prev, newPlaylist]);
            return newPlaylist;
        } catch (error) {
            console.error('Error creating playlist:', error);
            return null;
        }
    }, [trackId]);

    return {
        isLiked,
        playlists,
        isLoading,
        toggleLike,
        addToPlaylist,
        createNewPlaylist
    };
}