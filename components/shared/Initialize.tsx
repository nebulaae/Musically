"use client"

import { ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useDbInit } from '@/hooks/useDbInit';

export const Initialize = ({ children }: { children: ReactNode}) => {
    const { isInitializing, error } = useDbInit();

    if (isInitializing) {
        return (
            <div className="absolute flex items-center justify-center w-full h-full">
                <LoaderCircle className="animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="absolute flex flex-col items-center justify-center w-full h-full bg-white p-4">
                <div className="text-red-500 mb-4">Ошибка при инициализации. Попробуйте обновить веб-сайт.</div>
            </div>
        );
    }

    return <>{children}</>;
};