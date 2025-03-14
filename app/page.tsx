"use client"

import { useTracks } from "@/hooks/useTracks";
import { FetchTracks } from "@/components/shared/FetchTracks";

const Page = () => {
    const collection = useTracks("Fell In Love.mp3", "VOGUE - Lil Tecca.mp3");
    const cartiCollection = useTracks("Magnolia.mp3", "Racks Up.mp3");
    const all = useTracks();

    return (
        <section className="flex flex-col w-full">
            <div className="container">
                <div className="flex flex-col gap-4 mb-8">
                    <div className="flex flex-row items-center justify-between">
                        <h1 className="title-text">Все</h1>
                        <p className="link-text">Смотреть все</p>
                    </div>
                    <FetchTracks
                        tracks={all.tracks}
                        isLoading={all.isLoading}
                        error={all.error}
                        handleTrackSelect={all.handleTrackSelect}
                    />
                </div>
                <div className="flex flex-col gap-4 mb-8">
                    <div className="flex flex-row items-center justify-between">
                        <h1 className="title-text">Lil Tecca</h1>
                        <p className="link-text">Смотреть все</p>
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
                        <p className="link-text">Смотреть все</p>
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