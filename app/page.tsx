"use client"

import { useTracks } from "@/hooks/useTracks";
import { FetchTracks } from "@/components/shared/FetchTracks";

const Page = () => {
    const collection = useTracks(({
        trackNames: ["YVES - Lil Tecca.m4a", "1_1 - HVN ON EARTH - Lil Tecca  Kodak Black (128).mp3"], // render selected tracks
        page: 1, // default page
        limit: 10 // fetch limit for next page
    }));

    const cartiCollection = useTracks(({
        trackNames: ["Magnolia.mp3", "Cancun.mp3"],
        page: 1,
        limit: 10
    }));

    const all = useTracks(({
        trackNames: [], // if no names, it will render all tracks
        page: 1,
        limit: 10
    }));

    return (
        <section className="flex flex-col items-center w-full pb-32">
            <div className="container">
                <div className="flex flex-col gap-4 mb-8">
                    <div className="flex flex-row items-center justify-between">
                        <h1 className="title-text">Все</h1>
                    </div>
                    <FetchTracks
                        tracks={all.tracks}
                        isLoading={all.isLoading}
                        error={all.error}
                        handleTrackSelect={all.handleTrackSelect}
                        layout="blocks"
                        variant="grid"
                        totalPages={all.totalPages}
                        currentPage={all.currentPage}
                        goToPage={all.goToPage}
                    />
                </div>
                <div className="flex flex-col gap-4 mb-8">
                    <div className="flex flex-row items-center justify-between">
                        <h1 className="title-text">Lil Tecca</h1>
                    </div>
                    <FetchTracks
                        tracks={collection.tracks}
                        isLoading={collection.isLoading}
                        error={collection.error}
                        handleTrackSelect={collection.handleTrackSelect}
                    />
                </div>
                <div className="flex flex-col gap-4 mb-8">
                    <div className="flex flex-row items-center justify-between">
                        <h1 className="title-text">PlayboiCarti</h1>
                    </div>
                    <FetchTracks
                        tracks={cartiCollection.tracks}
                        isLoading={cartiCollection.isLoading}
                        error={cartiCollection.error}
                        handleTrackSelect={cartiCollection.handleTrackSelect}
                    />
                </div>
            </div>
        </section>
    );
};

export default Page;