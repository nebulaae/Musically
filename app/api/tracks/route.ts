import path from 'path';
import crypto from 'crypto';
import fs from 'fs/promises';
import * as NodeID3 from 'node-id3';

import { NextRequest, NextResponse } from 'next/server';
import { Track } from '@/db/models/tracks.model';

// Generate a consistent ID based on the file properties
function generateConsistentId(filename: string, fileSize: number): string {
  const hash = crypto.createHash('md5');
  hash.update(`${filename}-${fileSize}`);
  return hash.digest('hex');
}

// More efficient file hash function that doesn't load entire file
async function fileHash(filePath: string): Promise<string> {
  try {
    const stats = await fs.stat(filePath);
    // Create hash based on file path, size and mtime for efficiency
    const hashInput = `${filePath}-${stats.size}-${stats.mtime.getTime()}`;
    return crypto.createHash('md5').update(hashInput).digest('hex');
  } catch (error) {
    console.error(`Error creating file hash for ${filePath}:`, error);
    return crypto.randomBytes(16).toString('hex'); // Fallback
  }
}

// Limit cover cache size
const MAX_COVER_CACHE_SIZE = 500;
const coverCache: { [key: string]: string } = {};
const coverCacheTimestamps: { [key: string]: number } = {};

async function getCoverFromCache(hash: string, coverFilename: string, imageBuffer: Buffer): Promise<string> {
  // Check if we're in a production environment
  const isProduction = process.env.NODE_ENV === 'production';

  // For production environments, use data URLs
  if (isProduction) {
    const base64Image = imageBuffer.toString('base64');
    return `data:image/jpeg;base64,${base64Image}`;
  }

  // For development, continue using file system
  if (!coverCache[hash]) {
    const coverPath = path.join(process.cwd(), 'public', 'covers');
    await fs.mkdir(coverPath, { recursive: true });
    await fs.writeFile(path.join(coverPath, coverFilename), imageBuffer);
    coverCache[hash] = `/covers/${coverFilename}`;
    coverCacheTimestamps[hash] = Date.now();

    // Clean up cache if it exceeds max size
    if (Object.keys(coverCache).length > MAX_COVER_CACHE_SIZE) {
      const oldestKey = Object.keys(coverCacheTimestamps).sort(
        (a, b) => coverCacheTimestamps[a] - coverCacheTimestamps[b]
      )[0];

      if (oldestKey) {
        delete coverCache[oldestKey];
        delete coverCacheTimestamps[oldestKey];
      }
    }
  } else {
    // Update timestamp for LRU
    coverCacheTimestamps[hash] = Date.now();
  }

  return coverCache[hash];
}

// Improved metadata cache with size limits and TTL
const MAX_METADATA_CACHE_SIZE = 1000;
const METADATA_CACHE: { [key: string]: any } = {};
const METADATA_CACHE_TIMESTAMPS: { [key: string]: number } = {};
const METADATA_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Cleanup function for metadata cache
function cleanupMetadataCache() {
  const now = Date.now();
  const keys = Object.keys(METADATA_CACHE);

  // Clean up expired entries
  keys.forEach(key => {
    if (now - METADATA_CACHE_TIMESTAMPS[key] > METADATA_CACHE_TTL) {
      delete METADATA_CACHE[key];
      delete METADATA_CACHE_TIMESTAMPS[key];
    }
  });

  // Clean up excess entries (LRU)
  if (keys.length > MAX_METADATA_CACHE_SIZE) {
    const oldestKeys = Object.keys(METADATA_CACHE_TIMESTAMPS)
      .sort((a, b) => METADATA_CACHE_TIMESTAMPS[a] - METADATA_CACHE_TIMESTAMPS[b])
      .slice(0, keys.length - MAX_METADATA_CACHE_SIZE);

    oldestKeys.forEach(key => {
      delete METADATA_CACHE[key];
      delete METADATA_CACHE_TIMESTAMPS[key];
    });
  }
}

// Run cache cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupMetadataCache, 60 * 60 * 1000);
}

async function getTracks(requestedTracks?: string[]): Promise<Track[]> {
  const tracksDirectory = path.join(process.cwd(), 'public', 'tracks');

  try {
    const filenames = await fs.readdir(tracksDirectory);

    // Filter filenames if requestedTracks is provided
    const filteredFilenames = requestedTracks && requestedTracks.length > 0
      ? filenames.filter(filename => requestedTracks.includes(filename))
      : filenames;

    const validExtensions = new Set(['.mp3', '.wav', '.flac', '.m4a']);
    const trackPromises = filteredFilenames
      .filter(filename => validExtensions.has(path.extname(filename).toLowerCase()))
      .map(async (filename) => {
        const filePath = path.join(tracksDirectory, filename);

        try {
          const stats = await fs.stat(filePath);

          // Check cache first based on filename and last modified time
          const cacheKey = `${filename}-${stats.mtime.getTime()}`;
          if (METADATA_CACHE[cacheKey]) {
            // Update timestamp for LRU
            METADATA_CACHE_TIMESTAMPS[cacheKey] = Date.now();
            return METADATA_CACHE[cacheKey];
          }

          // Generate consistent ID based on filename and filesize
          const fileId = generateConsistentId(filename, stats.size);
          const fileType = path.extname(filename).toLowerCase().substring(1);
          let title = filename.replace(/\.[^.]+$/, '').replace(/_/g, ' ').replace(/-/g, ' ');
          let author: string | undefined;
          let album: string | undefined;
          let cover: string | undefined = '/default-cover.jpg';

          if (path.extname(filename).toLowerCase() === '.mp3') {
            try {
              const tags = NodeID3.read(filePath);
              if (tags) {
                title = tags.title || title;
                author = tags.artist || tags.composer;
                album = tags.album;

                // Handle cover image from ID3 tags
                if (
                  tags.image &&
                  typeof tags.image !== 'string' &&
                  tags.image.imageBuffer
                ) {
                  try {
                    const hash = await fileHash(filePath);
                    const coverFilename = `${hash}-cover.jpg`;

                    try {
                      cover = await getCoverFromCache(hash, coverFilename, tags.image.imageBuffer);
                    } catch (err) {
                      console.error(`Error saving cover image for ${filename}:`, err);
                      cover = `/default-cover.png`;
                    }
                  } catch (err) {
                    console.error(`Error processing cover image for ${filename}:`, err);
                  }
                }
              }
            } catch (error) {
              console.error(`Error reading ID3 tags from ${filename}:`, error);
            }
          }

          const trackData = {
            id: fileId,
            title: title,
            author: author || 'Unknown Artist',
            album: album || 'Unknown Album',
            src: `/tracks/${filename}`,
            cover: cover,
            type: fileType,
          };

          // Store in cache
          METADATA_CACHE[cacheKey] = trackData;
          METADATA_CACHE_TIMESTAMPS[cacheKey] = Date.now();

          return trackData;
        } catch (err) {
          console.error(`Error processing track ${filename}:`, err);
          return null;
        }
      });

    // Process all tracks concurrently
    const resolvedTracks = await Promise.all(trackPromises);
    return resolvedTracks.filter(Boolean) as Track[];
  } catch (error) {
    console.error("Error reading tracks directory:", error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const requestedTracks = searchParams.getAll('tracks');
  const searchQuery = searchParams.get('search')?.toLowerCase();

  // Add pagination parameters
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  const allTracks = await getTracks(requestedTracks.length > 0 ? requestedTracks : undefined);

  // Apply search filter if a search query is provided
  const filteredTracks = searchQuery
    ? allTracks.filter(track =>
      track.title.toLowerCase().includes(searchQuery) ||
      track.author.toLowerCase().includes(searchQuery) ||
      (track.album && track.album.toLowerCase().includes(searchQuery)))
    : allTracks;

  // Calculate pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedTracks = filteredTracks.slice(startIndex, endIndex);

  // Return paginated data with metadata
  return NextResponse.json({
    tracks: paginatedTracks,
    total: filteredTracks.length,
    page,
    limit,
    totalPages: Math.ceil(filteredTracks.length / limit)
  });
}