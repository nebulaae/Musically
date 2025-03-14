import { useState, useEffect, useCallback } from 'react';
import {
    createPlaylist,
    addTrackToPlaylist,
    getAllPlaylists,
    getPlaylistWithTracks,
    removeTrackFromPlaylist,
    deletePlaylist,
    renamePlaylist as renamePlaylistDb,
} from '@/db/actions/user.actions';
import { Playlist } from '@/db/models/user.model';

export const usePlaylist = (trackId?: string) => {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPlaylists = useCallback(async () => {
        try {
            setIsLoading(true);
            const userPlaylists = await getAllPlaylists();
            setPlaylists(userPlaylists);
        } catch (error) {
            console.error('Error loading playlists:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPlaylists();
    }, [fetchPlaylists]);

    const addToPlaylist = useCallback(async (playlistId: string) => {
        if (!trackId) return false;

        try {
            await addTrackToPlaylist(playlistId, trackId);
            // Refresh playlists to reflect the changes
            await fetchPlaylists();
            return true;
        } catch (error) {
            console.error('Error adding to playlist:', error);
            return false;
        }
    }, [trackId, fetchPlaylists]);

    const removeFromPlaylist = useCallback(async (playlistId: string) => {
        if (!trackId) return false;

        try {
            await removeTrackFromPlaylist(playlistId, trackId);
            // Refresh playlists to reflect the changes
            await fetchPlaylists();
            return true;
        } catch (error) {
            console.error('Error removing from playlist:', error);
            return false;
        }
    }, [trackId, fetchPlaylists]);

    const createNewPlaylist = useCallback(async (name: string) => {
        try {
            const newPlaylist = await createPlaylist(name);

            if (trackId) {
                await addTrackToPlaylist(newPlaylist.id, trackId);
            }

            // Refresh playlists to reflect the changes
            await fetchPlaylists();
            return newPlaylist;
        } catch (error) {
            console.error('Error creating playlist:', error);
            return null;
        }
    }, [trackId, fetchPlaylists]);

    const removePlaylist = useCallback(async (playlistId: string) => {
        try {
            await deletePlaylist(playlistId);
            await fetchPlaylists();
            return true;
        } catch (error) {
            console.error('Error deleting playlist:', error);
            return false;
        }
    }, [fetchPlaylists]);

    // Then in the hook
    const renamePlaylist = useCallback(async (playlistId: string, newName: string) => {
        try {
            await renamePlaylistDb(playlistId, newName); // Use the renamed import
            await fetchPlaylists();
            return true;
        } catch (error) {
            console.error('Error renaming playlist:', error);
            return false;
        }
    }, [fetchPlaylists]);


    const isTrackInPlaylist = useCallback((playlistId: string): boolean => {
        if (!trackId) return false;

        const playlist = playlists.find(p => p.id === playlistId);
        return playlist ? playlist.tracks.includes(trackId) : false;
    }, [playlists, trackId]);

    const getPlaylistById = useCallback(async (playlistId: string) => {
        try {
            return await getPlaylistWithTracks(playlistId);
        } catch (error) {
            console.error('Error getting playlist:', error);
            return null;
        }
    }, []);

    return {
        playlists,
        isLoading,
        addToPlaylist,
        removeFromPlaylist,
        createNewPlaylist,
        removePlaylist,
        renamePlaylist,
        isTrackInPlaylist,
        getPlaylistById,
        refreshPlaylists: fetchPlaylists
    };
};