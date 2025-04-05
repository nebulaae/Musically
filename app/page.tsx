
"use client"

import { useTracks } from "@/hooks/useTracks";
import { FetchTracks } from "@/components/functions/FetchTracks";

const Page = () => {
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
            </div>
        </section>
    );
};

export default Page;