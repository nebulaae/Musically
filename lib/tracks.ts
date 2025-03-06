import fs from 'fs/promises';
import path from 'path';

export interface Track {
    title: string;
    src: string;
    cover?: string; // Cover is optional
}

export async function getTracks(): Promise<Track[]> {
    const tracksDirectory = path.join(process.cwd(), 'tracks');
    try {
        const filenames = await fs.readdir(tracksDirectory);
        const tracksData: Track[] = filenames
            .filter(filename => ['.mp3', '.wav', '.flac'].includes(path.extname(filename).toLowerCase())) // Filter for audio files
            .map(filename => ({
                title: filename.replace(/\.[^.]+$/, '').replace(/_/g, ' '), // Remove extension and replace underscores with spaces for title
                src: `/tracks/${filename}`, // Public path to the track
                cover: '/default-cover.png' // Placeholder, you can enhance this
            }));
        return tracksData;
    } catch (error) {
        console.error("Error reading tracks directory:", error);
        return [];
    }
}