import db from '../index';
import { Track } from '../models/tracks.model';

export async function syncTracksFromAPI(): Promise<Track[]> {
    try {
        // Fetch tracks from the API
        const response = await fetch('/api/tracks');
        if (!response.ok) {
            throw new Error(`Failed to fetch tracks: ${response.status}`);
        }

        const newTracks: Track[] = await response.json();

        // Store tracks in the database while preserving existing tracks
        await db.transaction('rw', db.tracks, async () => {
            // Get existing tracks
            const existingTracks = await db.tracks.toArray();
            const existingIds = new Set(existingTracks.map(track => track.id));

            // Add only new tracks
            const tracksToAdd = newTracks.filter(track => !existingIds.has(track.id));

            // Update existing tracks
            const tracksToUpdate = newTracks.filter(track => existingIds.has(track.id));

            // Add new tracks
            if (tracksToAdd.length > 0) {
                await db.tracks.bulkAdd(tracksToAdd);
            }

            // Update existing tracks
            for (const track of tracksToUpdate) {
                await db.tracks.update(track.id, track);
            }
        });

        return newTracks;
    } catch (error) {
        console.error('Error syncing tracks:', error);
        throw error;
    }
}

// Get all tracks from the database
export async function getAllTracks(): Promise<Track[]> {
    return await db.tracks.toArray();
}

// Get a track by ID
export async function getTrackById(id: string): Promise<Track | undefined> {
    return await db.tracks.get(id);
}

// Get tracks by IDs
export async function getTracksByIds(ids: string[]): Promise<Track[]> {
    return await db.tracks.where('id').anyOf(ids).toArray();
}

// Search tracks by title or author
export async function searchTracks(query: string): Promise<Track[]> {
    const lowerQuery = query.toLowerCase();

    return await db.tracks.filter((track: Track) => {
        const titleMatch = track.title.toLowerCase().includes(lowerQuery);
        const authorMatch = track.author ? track.author.toLowerCase().includes(lowerQuery) : false;

        return titleMatch || authorMatch;
    }).toArray();
}