"use client"

import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeSwitcher } from "@/components/functions/ThemeSwitcher";

const Page = () => {
    const router = useRouter()

    const logout = async () => {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            // TODO MAKE A TOAST
            if (!response.ok) {
                toast.error("Ошибка при выходе из аккаунта.")
            } else {
                toast.success("Вы успешно вышли из аккаунта.")
                router.push('/')
                router.refresh()
            }
        } catch (err) {
            console.error('Logout Error:', err);
        };
    };

    return (
        <section className="flex flex-col items-center w-full pb-32 px-4">
            <div className="w-full max-w-2xl">
                <div className="flex flex-col gap-4 mb-8">
                    <div className="flex flex-row items-center justify-center mt-4">
                        {/* Блок заголовка */}
                        <h1 className="title-text">Настройки</h1>
                    </div>

                    <Separator orientation="horizontal" className="bg-secondary" />

                    {/* TABLE */}
                    <div className="flex flex-col gap-4 mb-8">
                        {/* CELL */}
                        <div className="flex items-center justify-between">
                            <h3>Тема:</h3>
                            <ThemeSwitcher />
                        </div>
                    </div>

                    <Separator orientation="horizontal" className="bg-secondary" />
                    {/* LOG OUT BUTTON */}
                    <Button className="button-danger" onClick={() => { logout() }}>
                        Выйти из аккаунта
                    </Button>
                </div>
            </div>
        </section>
    );
};

export default Page;