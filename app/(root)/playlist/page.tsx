"use client"

import { useToken } from "@/app/providers/TokenProvider";
import { Authorise } from "@/components/shared/Authorise";
import { PlaylistGrid } from "@/components/shared/PlaylistGrid";

const Page = () => {
    const { isTokenExist } = useToken();

    return (
        <section className="flex flex-col items-center w-full pb-32">
            <div className="container">
                {!isTokenExist ? (
                    <Authorise />
                ) : (
                    <div className="flex flex-col gap-4 mb-8">
                        <div className="flex flex-col items-start">
                            <h1 className="title-text">Ваши плейлисты</h1>
                        </div>
                        <PlaylistGrid />
                    </div>
                )
                }
            </div>
        </section>
    );
};

export default Page;