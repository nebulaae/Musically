
"use client"

import { useTracks } from "@/hooks/useTracks";
import { FetchTracks } from "@/components/functions/FetchTracks";

const Page = () => {
    const all = useTracks(({
        trackNames: [], // if no names, it will render all tracks
        page: 1,
        limit: 10
    }));

    const someCollection = useTracks(({
        trackNames: ["POLO G - MARTIN AND GINA.mp3", "TEASING_REF.mp3"],
        page: 1,
        limit: 10 // если не хотите пагинацию увеличьте лимит
        // лимит это кол-во песен на одну страницу
        // можете увеличить до сотни или тысячи
    }));

    return (
        <section className="flex flex-col items-center w-full pb-32">
            <div className="container">
                <div className="flex flex-col gap-4 mb-8">
                    <div className="flex flex-row items-center justify-between">
                        {/* Блок заголовка и подзагаловка */}
                        <div className="flex flex-col gap-2">
                            <h1 className="title-text">Все</h1>
                            <h3 className="subtitle-text">Слушайте только лучшее</h3>
                        </div>
                        {/* Если вы не хотите пагинацию добавляйте этот элемент */}
                        <a className="text-sm sm:text-base purple-text-hover">Слушать все</a>
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
                        <h1 className="title-text">Все</h1>
                    </div>
                    <FetchTracks
                        tracks={someCollection.tracks}
                        isLoading={someCollection.isLoading}
                        error={someCollection.error}
                        handleTrackSelect={someCollection.handleTrackSelect}
                        layout="blocks"
                        variant="grid"
                        totalPages={someCollection.totalPages}
                        currentPage={someCollection.currentPage}
                        goToPage={someCollection.goToPage}
                    />
                </div>
            </div>
        </section>
    );
};

export default Page;