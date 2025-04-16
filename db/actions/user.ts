import db from '../index';
import { v4 as uuidv4 } from 'uuid';
import { getTracksByIds } from './tracks';
import { Track } from '../models/tracks';
import { User, Playlist } from '../models/user';

// --- Define a constant ID for the single user ---
const CURRENT_USER_ID = 'currentUser';
// --- Or if you prefer a numeric ID (Dexie default primary key type): ---
// const CURRENT_USER_ID = 1; // Make sure 'id' in stores is '++id' if auto-incrementing

// Get the current user (create one if it doesn't exist)
export async function getCurrentUser(): Promise<User> {
    try {
        // 1. Try to get the user by the known ID
        let user = await db.users.get(CURRENT_USER_ID);

        // 2. If the user doesn't exist, create and store it
        if (!user) {
            console.log('No user found, creating default user...');
            const newUser: User = {
                // Use the constant ID
                id: CURRENT_USER_ID,
                name: 'User',
                likedSongs: [],
                playlists: [],
            };

            try {
                await db.users.put(newUser);
                user = newUser;
                console.log('Default user created successfully.');
            } catch (putError) {
                console.error('Failed to put the default user:', putError);
                throw new Error(`Database operation failed: Could not create or update user.`);
            }
        }

        return user;

    } catch (error) {
        console.error('Error in getCurrentUser:', error);
        throw error;
    }
}

// Add a track to liked songs
export async function likeSong(trackId: string): Promise<void> {
    const user = await getCurrentUser();
    // Ensure likedSongs is always an array before trying to access includes/spread
    const currentLikedSongs = user.likedSongs || [];

    if (!currentLikedSongs.includes(trackId)) {
        // Use put for consistency, updating the single user record
        await db.users.put({
            ...user,
            likedSongs: [...currentLikedSongs, trackId]
        });
        // Or use update, which might be slightly more performant
        // await db.users.update(user.id, { likedSongs: [...currentLikedSongs, trackId] });
    }
}

// Remove a track from liked songs
export async function unlikeSong(trackId: string): Promise<void> {
    const user = await getCurrentUser();
    const currentLikedSongs = user.likedSongs || []; // Ensure array
    const updatedLikedSongs = currentLikedSongs.filter(id => id !== trackId);

    // Check if the array actually changed before updating
    if (updatedLikedSongs.length !== currentLikedSongs.length) {
        await db.users.put({
            ...user,
            likedSongs: updatedLikedSongs
        });
        // Or: await db.users.update(user.id, { likedSongs: updatedLikedSongs });
    }
}

// Check if a song is liked
export async function isSongLiked(trackId: string): Promise<boolean> {
    const user = await getCurrentUser();
    // Ensure likedSongs is always an array
    return (user.likedSongs || []).includes(trackId);
}

// Get all liked songs
export async function getLikedSongs(): Promise<Track[]> {
    const user = await getCurrentUser();
    // Ensure likedSongs is always an array
    const likedSongIds = user.likedSongs || [];
    if (likedSongIds.length === 0) return []; // Optimization
    return await getTracksByIds(likedSongIds);
}

// Create a new playlist
export async function createPlaylist(name: string): Promise<Playlist> {
    const user = await getCurrentUser();
    const currentPlaylists = user.playlists || []; // Ensure array

    const newPlaylist: Playlist = {
        id: uuidv4(), // Playlists still need unique IDs
        name,
        tracks: [],
        createdAt: new Date()
    };

    await db.users.put({
        ...user,
        playlists: [...currentPlaylists, newPlaylist]
    });
    // Or: await db.users.update(user.id, { playlists: [...currentPlaylists, newPlaylist] });

    return newPlaylist;
}

// Add a track to a playlist
export async function addTrackToPlaylist(playlistId: string, trackId: string): Promise<void> {
    const user = await getCurrentUser();
    const currentPlaylists = user.playlists || []; // Ensure array

    let playlistUpdated = false;
    const updatedPlaylists = currentPlaylists.map(playlist => {
        if (playlist.id === playlistId && !(playlist.tracks || []).includes(trackId)) {
            playlistUpdated = true;
            return {
                ...playlist,
                tracks: [...(playlist.tracks || []), trackId] // Ensure tracks array
            };
        }
        return playlist;
    });

    if (playlistUpdated) {
        await db.users.put({
            ...user,
            playlists: updatedPlaylists
        });
        // Or: await db.users.update(user.id, { playlists: updatedPlaylists });
    }
}

// Remove a track from a playlist
export async function removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
    const user = await getCurrentUser();
    const currentPlaylists = user.playlists || []; // Ensure array

    let playlistUpdated = false;
    const updatedPlaylists = currentPlaylists.map(playlist => {
        if (playlist.id === playlistId) {
            const currentTracks = playlist.tracks || []; // Ensure array
            const newTracks = currentTracks.filter(id => id !== trackId);
            if (newTracks.length !== currentTracks.length) {
                playlistUpdated = true;
                return { ...playlist, tracks: newTracks };
            }
        }
        return playlist;
    });

    if (playlistUpdated) {
         await db.users.put({
            ...user,
            playlists: updatedPlaylists
        });
       // Or: await db.users.update(user.id, { playlists: updatedPlaylists });
    }
}

// Delete a playlist
export async function deletePlaylist(playlistId: string): Promise<void> {
    const user = await getCurrentUser();
    const currentPlaylists = user.playlists || []; // Ensure array
    const updatedPlaylists = currentPlaylists.filter(playlist => playlist.id !== playlistId);

    // Check if the array actually changed
    if (updatedPlaylists.length !== currentPlaylists.length) {
         await db.users.put({
            ...user,
            playlists: updatedPlaylists
        });
        // Or: await db.users.update(user.id, { playlists: updatedPlaylists });
    }
}

// Rename a playlist
export async function renamePlaylist(playlistId: string, newName: string): Promise<void> {
    const user = await getCurrentUser();
    const currentPlaylists = user.playlists || []; // Ensure array

    let playlistUpdated = false;
    const updatedPlaylists = currentPlaylists.map(playlist => {
        if (playlist.id === playlistId && playlist.name !== newName) {
             playlistUpdated = true;
            return { ...playlist, name: newName };
        }
        return playlist;
    });

     if (playlistUpdated) {
         await db.users.put({
            ...user,
            playlists: updatedPlaylists
        });
       // Or: await db.users.update(user.id, { playlists: updatedPlaylists });
    }
}

// Get a playlist by ID with its tracks
export async function getPlaylistWithTracks(playlistId: string): Promise<{ playlist: Playlist, tracks: Track[] } | null> {
    const user = await getCurrentUser();
    const currentPlaylists = user.playlists || []; // Ensure array

    const playlist = currentPlaylists.find(p => p.id === playlistId);
    if (!playlist) return null;

    const trackIds = playlist.tracks || []; // Ensure array
    if (trackIds.length === 0) {
         return { playlist, tracks: [] }; // Optimization
    }

    const tracks = await getTracksByIds(trackIds);
    return { playlist, tracks };
}

// Get all playlists
export async function getAllPlaylists(): Promise<Playlist[]> {
    const user = await getCurrentUser();
    return user.playlists || []; // Ensure array
}