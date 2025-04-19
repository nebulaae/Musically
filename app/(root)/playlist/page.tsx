import { PlaylistGrid } from "@/components/shared/PlaylistGrid";

const Page = () => {
    return (
        <section className="flex flex-col items-center w-full pb-32">
            <div className="container">
                <div className="flex flex-col gap-4 mb-8">
                    <div className="flex flex-row items-center justify-between">
                        <h1 className="title-text">Ваши плейлисты</h1>
                    </div>
                    <PlaylistGrid />
                </div>
            </div>
        </section>
    );
};

export default Page;