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

async function fileHash(filePath: string): Promise<string> {
  const fileBuffer = await fs.readFile(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

const coverCache: { [key: string]: string } = {};

async function getCoverFromCache(hash: string, coverFilename: string, imageBuffer: Buffer): Promise<string> {
  if (!coverCache[hash]) {
    await fs.writeFile(path.join(process.cwd(), 'public', 'covers', coverFilename), imageBuffer);
    coverCache[hash] = `/covers/${coverFilename}`;
  }
  return coverCache[hash];
}

async function getTracks(requestedTracks?: string[]): Promise<Track[]> {
  const tracksDirectory = path.join(process.cwd(), 'public', 'tracks');

  try {
    const filenames = await fs.readdir(tracksDirectory);
    const tracksData: Track[] = [];

    // Filter filenames if requestedTracks is provided
    const filteredFilenames = requestedTracks && requestedTracks.length > 0
      ? filenames.filter(filename => requestedTracks.includes(filename))
      : filenames;

    for (const filename of filteredFilenames) {
      if (['.mp3', '.wav', '.flac', '.m4a'].includes(path.extname(filename).toLowerCase())) {
        const filePath = path.join(tracksDirectory, filename);
        const stats = await fs.stat(filePath);
        
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
                  const coverPath = path.join(process.cwd(), 'public', 'covers');
                  await fs.mkdir(coverPath, { recursive: true });

                  if (!coverCache[hash]) {
                    // Save the cover to public folder for serving only if it's not in the cache
                    try {
                      cover = await getCoverFromCache(hash, coverFilename, tags.image.imageBuffer);
                    } catch (err) {
                      console.error(`Error saving cover image for ${filename}:`, err);
                      cover = `/default-cover.png`;
                    }
                  } else {
                    cover = coverCache[hash];
                  }
                } catch (err) {
                  console.error(`Error saving cover image for ${filename}:`, err);
                }
              }
            }
          } catch (error) {
            console.error(`Error reading ID3 tags from ${filename}:`, error);
          }
        }

        tracksData.push({
          id: fileId,
          title: title,
          author: author || 'Unknown Artist',
          album: album || 'Unknown Album',
          src: `/tracks/${filename}`,
          cover: cover,
          type: fileType,
        });
      }
    }

    return tracksData;
  } catch (error) {
    console.error("Error reading tracks directory:", error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const requestedTracks = searchParams.getAll('tracks');

  const tracks = await getTracks(requestedTracks.length > 0 ? requestedTracks : undefined);
  return NextResponse.json(tracks);
}