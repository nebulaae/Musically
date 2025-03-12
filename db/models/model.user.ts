export interface User {
    id: string;
    name: string;
    likedSongs: string[]; // Array of track IDs
    playlists: Playlist[];
    onboarding: boolean;
}

export interface Playlist {
    id: string;
    name: string;
    tracks: string[]; // Array of track IDs
    createdAt: Date;
}