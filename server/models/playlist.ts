export interface Playlist {
    id: string;
    name: string;
    tracks: string[]; // Array of track IDs
    createdAt: Date;
}