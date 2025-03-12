import db from '../index';
import { Track } from '../models/model.tracks';

// Fetch tracks from the API and store them in the database
export async function syncTracksFromAPI(): Promise<Track[]> {
    try {
        // Fetch tracks from the API
        const response = await fetch('/api/tracks');
        if (!response.ok) {
            throw new Error(`Failed to fetch tracks: ${response.status}`);
        }

        const tracks = await response.json();

        // Store tracks in the database
        await db.transaction('rw', db.tracks, async () => {
            // Clear existing tracks
            await db.tracks.clear();
            // Add new tracks
            await db.tracks.bulkAdd(tracks);
        });

        return tracks;
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