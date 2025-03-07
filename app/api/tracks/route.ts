import fs from 'fs/promises';
import path from 'path';
import * as NodeID3 from 'node-id3';
import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from 'next/server';

export interface Track {
  id: string;
  title: string;
  author?: string;
  album?: string;
  src: string;
  cover?: string;
  type?: string;
}

export async function getTracks(): Promise<Track[]> {
  const tracksDirectory = path.join(process.cwd(), 'public', 'tracks');
  
  try {
    const filenames = await fs.readdir(tracksDirectory);
    const tracksData: Track[] = [];
    
    for (const filename of filenames) {
      if (['.mp3', '.wav', '.flac', '.m4a'].includes(path.extname(filename).toLowerCase())) {
        const filePath = path.join(tracksDirectory, filename);
        const id = uuidv4();
        const fileType = path.extname(filename).toLowerCase().substring(1); // Extract type without '.'
        let title = filename.replace(/\.[^.]+$/, '').replace(/_/g, ' ');
        let author: string | undefined;
        let album: string | undefined;
        let cover: string | undefined = '/default-cover.png';
        
        if (path.extname(filename).toLowerCase() === '.mp3') {
          try {
            const tags = NodeID3.read(filePath);
            if (tags) {
              title = tags.title || title;
              author = tags.artist || tags.composer;
              album = tags.album;
              
              // Handle cover image from ID3 tags
              if (tags.image && typeof tags.image !== 'string' && tags.image.imageBuffer) {
                // Save the cover to public folder for serving
                const coverFilename = `${id}-cover.jpg`;
                const coverPath = path.join(process.cwd(), 'public', 'covers', coverFilename);
                
                try {
                  // Make sure the covers directory exists
                  await fs.mkdir(path.join(process.cwd(), 'public', 'covers'), { recursive: true });
                  // Write the cover image to file
                  await fs.writeFile(coverPath, tags.image.imageBuffer);
                  cover = `/covers/${coverFilename}`;
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
          id: id,
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

export async function GET() {
  const tracks = await getTracks();
  return NextResponse.json(tracks);
}