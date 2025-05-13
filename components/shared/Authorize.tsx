import Link from "next/link";

import { CircleUserRound, LogInIcon } from "lucide-react";
import { Button } from "../ui/button";

export const Authorize = () => {
    return (
        <div className="flex items-center justify-center w-full">
            <div className="flex flex-col gap-6 items-center glassmorphism p-6 rounded-xl">
                <CircleUserRound className="size-24" />
                <h3 className="text-base text-center text-gray-500 max-w-[250px]">Вы не авторизованы. Для отображения профиля вам необходимо зарегистрироваться.</h3>
                <Link href="/register">
                    <Button className="purple-button">
                        <LogInIcon />
                        Авторизоваться
                    </Button>
                </Link>
            </div>
        </div>
    );
};