import { Track } from '../models/track';
import { Playlist } from '../models/playlist';

// Helper function to safely parse JSON responses
async function safeJsonParse(response: Response) {
    try {
        return await response.json();
    } catch (e) {
        console.warn("Failed to parse JSON response:", e);
        return { error: "Invalid response from server" };
    }
}

// Create a new playlist
export async function createPlaylist(name: string): Promise<Playlist> {
    try {
        const response = await fetch('/api/playlist/createPlaylist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ playlistName: name }),
        });

        const data = await safeJsonParse(response);

        if (!response.ok) {
            console.warn(data.error || data.message || 'Failed to create playlist');
        }

        return data.playlist;
    } catch (error) {
        console.warn("Create playlist error:", error);
        throw error;
    }
}

// Add a track to a playlist
export async function addTrackToPlaylist(playlistId: string, trackId: string): Promise<void> {
    try {
        const response = await fetch('/api/playlist/addTrackToPlaylist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ playlistId, trackId }),
        });

        const data = await safeJsonParse(response);

        if (!response.ok) {
            console.warn(`Failed to add track to playlist: ${data.error}, ${data.message}`);
        }
    } catch (error) {
        console.warn("Add track to playlist error:", error);
        throw error;
    }
}

// Remove a track from a playlist
export async function removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
    try {
        const response = await fetch('/api/playlist/deleteTrackFromPlaylist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ playlistId, trackId }),
        });

        const data = await safeJsonParse(response);

        if (!response.ok) {
            console.warn(data.error || data.message || 'Failed to remove track from playlist');
        }
    } catch (error) {
        console.warn("Remove track from playlist error:", error);
        throw error;
    }
}

// Delete a playlist
export async function deletePlaylist(playlistId: string): Promise<void> {
    try {
        const response = await fetch('/api/playlist/deletePlaylist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ playlistId }),
        });

        const data = await safeJsonParse(response);

        if (!response.ok) {
            console.warn(data.error || data.message || 'Failed to delete playlist');
        }
    } catch (error) {
        console.warn("Delete playlist error:", error);
        throw error;
    }
}

// Rename a playlist
export async function renamePlaylist(playlistId: string, newName: string): Promise<void> {
    try {
        const response = await fetch('/api/playlist/renamePlaylist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ playlistId, name: newName }),
        });

        const data = await safeJsonParse(response);

        if (!response.ok) {
            console.warn(data.error || data.message || 'Failed to rename playlist');
        }
    } catch (error) {
        console.warn("Rename playlist error:", error);
        throw error;
    }
}

// Get a playlist by ID with its tracks
export async function getPlaylistWithTracks(playlistId: string): Promise<{ playlist: Playlist, tracks: Track[] } | null> {
    try {
        const response = await fetch(`/api/playlist/getPlaylist?id=${playlistId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            console.warn('API error:', data.error || data.message || 'Failed to get playlist');
            throw new Error(data.error || data.message || 'Failed to get playlist');
        }

        // Make sure data has the expected structure
        if (!data.playlist) {
            console.warn('API returned unexpected data structure, missing playlist:', data);
            // Attempt to adapt to potential different structure
            if (data.id && data.name) {
                // If the API returns the playlist directly instead of in a playlist property
                return {
                    playlist: data,
                    tracks: data.tracks || []
                };
            }
            return null;
        }

        return data;
    } catch (error) {
        console.warn("Get playlist error:", error);
        throw error;
    }
}

// Get all playlists
export async function getAllPlaylists(): Promise<Playlist[]> {
    try {
        const response = await fetch('/api/playlist/getAllPlaylists', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await safeJsonParse(response);

        if (!response.ok) {
            console.warn(data.error || data.message || 'Failed to get playlists');
        }

        return data.playlists;
    } catch (error) {
        console.warn("Get all playlists error:", error);
        throw error;
    }
}