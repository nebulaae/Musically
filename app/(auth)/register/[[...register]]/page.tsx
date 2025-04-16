import { RegisterPage } from "@/components/pages/RegisterPage";

const Page = () => {
    return (
        <section className="absolute inset-0 flex flex-col gap-2 items-center justify-center w-full h-full z-[200] bg-main">
            <RegisterPage />
        </section>
    );
};

export default Page;