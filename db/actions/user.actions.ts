import db from '../index';

import { v4 as uuidv4 } from 'uuid';
import { User, Playlist } from '../models/user.model';
import { Track } from '../models/tracks.model';
import { getTracksByIds } from './tracks.actions';

// Get the current user (create one if it doesn't exist)
export async function getCurrentUser(): Promise<User> {
    const users = await db.users.toArray();

    if (users.length === 0) {
        // Create a default user if none exists
        const newUser: User = {
            id: uuidv4(),
            name: 'User',
            likedSongs: [],
            playlists: [],
            onboarding: true
        };

        await db.users.add(newUser);
        return newUser;
    }

    // Return the first user (we're only supporting one user in this simple app)
    return users[0];
}

// Update user name and complete onboarding
export async function completeOnboarding(name: string): Promise<User> {
    const user = await getCurrentUser();

    const updatedUser: User = {
        ...user,
        name,
        onboarding: true
    };

    await db.users.update(user.id, {
        name: updatedUser.name,
        onboarding: updatedUser.onboarding
    });
    return updatedUser;
}

// Check if user has completed onboarding
export async function hasCompletedOnboarding(): Promise<boolean> {
    const user = await getCurrentUser();
    return user.onboarding;
}

// Add a track to liked songs
export async function likeSong(trackId: string): Promise<void> {
    const user = await getCurrentUser();

    if (!user.likedSongs.includes(trackId)) {
        const updatedUser: User = {
            ...user,
            likedSongs: [...user.likedSongs, trackId]
        };

        await db.users.update(user.id, {
            likedSongs: updatedUser.likedSongs
        });
    }
}

// Remove a track from liked songs
export async function unlikeSong(trackId: string): Promise<void> {
    const user = await getCurrentUser();

    const updatedUser: User = {
        ...user,
        likedSongs: user.likedSongs.filter(id => id !== trackId)
    };

    await db.users.update(user.id, {
        likedSongs: updatedUser.likedSongs
    });
}

// Check if a song is liked
export async function isSongLiked(trackId: string): Promise<boolean> {
    const user = await getCurrentUser();
    return user.likedSongs.includes(trackId);
}

// Get all liked songs
export async function getLikedSongs(): Promise<Track[]> {
    const user = await getCurrentUser();
    return await getTracksByIds(user.likedSongs);
}

// Create a new playlist
export async function createPlaylist(name: string): Promise<Playlist> {
    const user = await getCurrentUser();

    const newPlaylist: Playlist = {
        id: uuidv4(),
        name,
        tracks: [],
        createdAt: new Date()
    };

    const updatedUser: User = {
        ...user,
        playlists: [...user.playlists, newPlaylist]
    };

    await db.users.update(user.id, {
        playlists: updatedUser.playlists
    });
    return newPlaylist;
}

// Add a track to a playlist
export async function addTrackToPlaylist(playlistId: string, trackId: string): Promise<void> {
    const user = await getCurrentUser();

    const updatedPlaylists = user.playlists.map(playlist => {
        if (playlist.id === playlistId && !playlist.tracks.includes(trackId)) {
            return {
                ...playlist,
                tracks: [...playlist.tracks, trackId]
            };
        }
        return playlist;
    });

    const updatedUser: User = {
        ...user,
        playlists: updatedPlaylists
    };

    await db.users.update(user.id, {
        playlists: updatedUser.playlists
    });
}

// Remove a track from a playlist
export async function removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
    const user = await getCurrentUser();

    const updatedPlaylists = user.playlists.map(playlist => {
        if (playlist.id === playlistId) {
            return {
                ...playlist,
                tracks: playlist.tracks.filter(id => id !== trackId)
            };
        }
        return playlist;
    });

    const updatedUser: User = {
        ...user,
        playlists: updatedPlaylists
    };

    await db.users.update(user.id, {
        playlists: updatedUser.playlists
    });
}

// Delete a playlist
export async function deletePlaylist(playlistId: string): Promise<void> {
    const user = await getCurrentUser();

    const updatedUser: User = {
        ...user,
        playlists: user.playlists.filter(playlist => playlist.id !== playlistId)
    };

    await db.users.update(user.id, {
        playlists: updatedUser.playlists
    });
}

// Rename a playlist
export async function renamePlaylist(playlistId: string, newName: string): Promise<void> {
    const user = await getCurrentUser();

    const updatedPlaylists = user.playlists.map(playlist => {
        if (playlist.id === playlistId) {
            return {
                ...playlist,
                name: newName
            };
        }
        return playlist;
    });

    const updatedUser: User = {
        ...user,
        playlists: updatedPlaylists
    };

    await db.users.update(user.id, {
        playlists: updatedUser.playlists
    });
}

// Get a playlist by ID with its tracks
export async function getPlaylistWithTracks(playlistId: string): Promise<{ playlist: Playlist, tracks: Track[] } | null> {
    const user = await getCurrentUser();

    const playlist = user.playlists.find(p => p.id === playlistId);
    if (!playlist) return null;

    const tracks = await getTracksByIds(playlist.tracks);

    return { playlist, tracks };
}

// Get all playlists
export async function getAllPlaylists(): Promise<Playlist[]> {
    const user = await getCurrentUser();
    return user.playlists;
}