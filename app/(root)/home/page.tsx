"use client"

import { useTracks } from "@/hooks/useTracks";
import { FetchTracks } from "@/components/functions/FetchTracks";
import { CollectionLink } from "@/components/shared/Collections";

const Page = () => {

    const all = useTracks(({
        trackNames: [], // if no names, it will render all tracks
        page: 1,
        limit: 10
    }));

    const someCollection = useTracks(({
        trackNames: ["6e845139983cb5b131542dc028af8303", '89e15d83498a252730be17161fe3b4e1'], // it should render the selected track
        page: 1,
        limit: 10
    }));

    const newCollection = useTracks(({
        trackNames: ["6e845139983cb5b131542dc028af8303", '89e15d83498a252730be17161fe3b4e1'], // it should render the selected track
        page: 1,
        limit: 10
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
                        <CollectionLink href="ayfar" />
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

                    <div className="flex flex-row items-center justify-between">
                        {/* Блок заголовка и подзагаловка */}
                        <div className="flex flex-col gap-2">
                            <h1 className="title-text">Подборка</h1>
                            <h3 className="subtitle-text">Слушайте только лучшее</h3>
                        </div>
                        {/* Если вы не хотите пагинацию добавляйте этот элемент */}
                        <CollectionLink href="ansamble" title="Перейти к подборке" />
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


                    <div className="flex flex-row items-center justify-between">
                        {/* Блок заголовка и подзагаловка */}
                        <div className="flex flex-col gap-2">
                            <h1 className="title-text">Новая подборка</h1>
                            <h3 className="subtitle-text">Слушайте только лучшее</h3>
                        </div>
                        {/* Если вы не хотите пагинацию добавляйте этот элемент */}
                        <CollectionLink href="newCollection" title="Перейти к подборке" />
                    </div>
                    <FetchTracks
                        tracks={newCollection.tracks}
                        isLoading={newCollection.isLoading}
                        error={newCollection.error}
                        handleTrackSelect={newCollection.handleTrackSelect}
                        layout="blocks"
                        variant="grid"
                        totalPages={newCollection.totalPages}
                        currentPage={newCollection.currentPage}
                        goToPage={newCollection.goToPage}
                    />
                </div>
            </div>
        </section>
    );
};

export default Page;