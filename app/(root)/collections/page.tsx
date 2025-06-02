import { CollectionCard } from "@/components/shared/Collections";

const Page = () => {
    return (
        <section className="flex flex-col items-center w-full pb-32">
            <div className="container">
                <div className="flex flex-col gap-8 mb-8">
                    {/* Блок заголовка */}
                    <h1 className="title-text">Подборки</h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <CollectionCard name="Айфаар" genre="classic" href="ayfar" />
                        <CollectionCard name="Ансамбль" genre="modern" href="ansamble" />
                        <CollectionCard name="Новая подборка" genre="modern" href="newCollection" />
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Page;