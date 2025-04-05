import { ThemeSwitcher } from "@/components/functions/ThemeSwitcher";

const Page = () => {
    return (
        <section className="flex flex-col items-center w-full pb-32">
            <div className="container">
                <div className="flex flex-col gap-4 mb-8">
                    <ThemeSwitcher />
                </div>
            </div>
        </section>

    );
};

export default Page;