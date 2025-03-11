// /app/page.tsx
"use client"

import { useTracks } from "@/hooks/useTracks";
import { FetchTracks } from "@/components/shared/FetchTracks";

const Page = () => {
    // Each collection is now independent but connects to the global audio context
    const collection = useTracks("Fell In Love.mp3", "VOGUE - Lil Tecca.mp3");
    const cartiCollection = useTracks("Magnolia.mp3", "Racks Up.mp3");

    return (
        <div className="w-full">
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-6">Lil Tecca</h1>
                <FetchTracks
                    tracks={collection.tracks}
                    isLoading={collection.isLoading}
                    error={collection.error}
                    handleTrackSelect={collection.handleTrackSelect}
                />

                <h1 className="text-2xl font-bold mb-6 mt-8">Playboi Carti</h1>
                <FetchTracks
                    tracks={cartiCollection.tracks}
                    isLoading={cartiCollection.isLoading}
                    error={cartiCollection.error}
                    handleTrackSelect={cartiCollection.handleTrackSelect}
                />
            </div>
            {/* No need to include BottomPlayer here - it's in layout.tsx */}
        </div>
    );
};

export default Page;