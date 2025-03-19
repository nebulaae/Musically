# NextJS Music Player - Technical Documentation

## Overview

This music player is a Next.js application that allows users to browse, search, and play audio tracks. It includes features such as playlists, liked songs, and an onboarding process for new users. The application uses a combination of server-side API routes and client-side state management to provide a seamless music playback experience.

## Architecture

The application follows a modern web architecture with these key components:

1. **API Layer**: Next.js API routes to serve track data from the server
2. **Database Layer**: IndexedDB via Dexie.js for client-side persistent storage
3. **UI Layer**: React components with context-based state management
4. **Caching**: Client-side caching for improved performance

## Core Components

### Database Schema

The application uses Dexie.js (IndexedDB wrapper) with two main tables:

- **Tracks**: Stores information about audio files
  ```typescript
  interface Track {
    id: string;
    title: string;
    author: string;
    album?: string;
    src: string;
    cover?: string;
    type?: string;
  }
  ```

- **Users**: Stores user data and preferences
  ```typescript
  interface User {
    id: string;
    name: string;
    likedSongs: string[]; // Array of track IDs
    playlists: Playlist[];
    onboarding: boolean;
  }

  interface Playlist {
    id: string;
    name: string;
    tracks: string[]; // Array of track IDs
    createdAt: Date;
  }
  ```

### API Endpoints

#### GET /api/tracks

Fetches tracks with optional filtering and pagination.

**Parameters:**
- `tracks` (optional): Filter by specific track filenames
- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of items per page (default: 10)

**Response:**
```json
{
  "tracks": [Track],
  "total": number,
  "page": number,
  "limit": number,
  "totalPages": number
}
```

### Client-Side Hooks

#### useTracks

The main hook for accessing and manipulating tracks.

```typescript
const {
  tracks,             // Current page of tracks
  allTracks,          // All loaded tracks
  isPlaying,          // Playback state
  isLoading,          // Loading state
  error,              // Error state
  currentTime,        // Current playback position
  duration,           // Track duration
  totalTracks,        // Total number of tracks
  totalPages,         // Total number of pages
  currentPage,        // Current page number
  goToPage,           // Function to navigate between pages
  handleTrackSelect,  // Function to select and play a track
  handlePlayPauseToggle // Function to toggle play/pause
} = useTracks({
  trackNames?: string[], // Optional filter by track names
  page?: number,         // Page number
  limit?: number         // Items per page
});
```

## User Management Features

### User Actions

The application provides the following user-related actions:

- **getCurrentUser()**: Get (or create) the current user
- **completeOnboarding(name)**: Update user name and complete onboarding
- **hasCompletedOnboarding()**: Check if user has completed onboarding
- **likeSong(trackId)**: Add a track to liked songs
- **unlikeSong(trackId)**: Remove a track from liked songs
- **isSongLiked(trackId)**: Check if a song is liked
- **getLikedSongs()**: Get all liked songs

### Playlist Management

The application provides these playlist-related functions:

- **createPlaylist(name)**: Create a new playlist
- **addTrackToPlaylist(playlistId, trackId)**: Add a track to a playlist
- **removeTrackFromPlaylist(playlistId, trackId)**: Remove a track from a playlist
- **deletePlaylist(playlistId)**: Delete a playlist
- **renamePlaylist(playlistId, newName)**: Rename a playlist
- **getPlaylistWithTracks(playlistId)**: Get a playlist with its tracks
- **getAllPlaylists()**: Get all playlists

## Track Management

### Track Actions

- **syncTracksFromAPI()**: Synchronize tracks from the API to the local database
- **getAllTracks()**: Get all tracks from the database
- **getTrackById(id)**: Get a track by ID
- **getTracksByIds(ids)**: Get tracks by IDs
- **searchTracks(query)**: Search tracks by title or author

## Implementation Examples

### Basic Usage - Display All Tracks

```jsx
import { useTracks } from "@/hooks/useTracks";
import { FetchTracks } from "@/components/shared/FetchTracks";

const AllTracksPage = () => {
  const { 
    tracks, 
    isLoading, 
    error, 
    handleTrackSelect,
    totalPages,
    currentPage,
    goToPage
  } = useTracks({
    page: 1,
    limit: 10
  });

  return (
    <div>
      <h1>All Tracks</h1>
      <FetchTracks
        tracks={tracks}
        isLoading={isLoading}
        error={error}
        handleTrackSelect={handleTrackSelect}
        totalPages={totalPages}
        currentPage={currentPage}
        goToPage={goToPage}
      />
    </div>
  );
};
```

### Display Specific Tracks

```jsx
const ArtistPage = () => {
  const { 
    tracks, 
    isLoading, 
    error, 
    handleTrackSelect 
  } = useTracks({
    trackNames: ["Artist1.mp3", "Artist2.mp3"],
    page: 1,
    limit: 10
  });

  return (
    <div>
      <h1>Artist Tracks</h1>
      <FetchTracks
        tracks={tracks}
        isLoading={isLoading}
        error={error}
        handleTrackSelect={handleTrackSelect}
      />
    </div>
  );
};
```

## Advanced Usage

### Track Caching

The player implements client-side caching to improve performance:

- Tracks are cached in memory and localStorage
- Cache entries expire after 1 hour (configurable via `CACHE_EXPIRY`)
- Cached data includes track information and pagination metadata

### Cover Image Handling

The application handles cover images from ID3 tags in two ways:

- In production: Converts images to data URLs
- In development: Saves images to the filesystem and serves them as static files

## Technical Details

### Track ID Generation

Track IDs are generated consistently based on filename and file size:

```typescript
function generateConsistentId(filename: string, fileSize: number): string {
  const hash = crypto.createHash('md5');
  hash.update(`${filename}-${fileSize}`);
  return hash.digest('hex');
}
```

### Metadata Extraction

The application extracts metadata from audio files (currently supports MP3):

- Title, artist, and album information from ID3 tags
- Cover images from ID3 tags

## Component Configuration

### FetchTracks Component

This reusable component displays track lists with configurable layouts:

```jsx
<FetchTracks
  tracks={tracks}
  isLoading={isLoading}
  error={error}
  handleTrackSelect={handleTrackSelect}
  layout="blocks" // or "list"
  variant="grid" // or "carousel"
  totalPages={totalPages}
  currentPage={currentPage}
  goToPage={goToPage}
/>
```

## Setup Requirements

1. Place audio files in the `public/tracks` directory
2. The application supports MP3, WAV, FLAC, and M4A file formats
3. For best results, ensure MP3 files have proper ID3 tags for metadata