"use client"

import { LoaderCircle } from 'lucide-react';
import { useDbInit } from '@/hooks/useDbInit';
import { useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { hasCompletedOnboarding } from '@/db/actions/user.actions';

interface AuthGuardProps {
    children: ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
    const router = useRouter();
    const pathname = usePathname();
    const { isInitializing, error } = useDbInit();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        async function checkOnboarding() {
            if (isInitializing) return;

            try {
                const onboardingCompleted = await hasCompletedOnboarding();

                // If onboarding is not completed and we're not already on the onboarding page
                if (!onboardingCompleted && pathname !== '/onboarding') {
                    router.push('/onboarding');
                }
                // If onboarding is completed and we're on the onboarding page
                else if (onboardingCompleted && pathname === '/onboarding') {
                    router.push('/');
                }
            } catch (err) {
                console.error('Error checking onboarding status:', err);
            } finally {
                setIsChecking(false);
            }
        }

        checkOnboarding();
    }, [isInitializing, pathname, router]);

    if (isInitializing || isChecking) {
        return (
            <div className="absolute flex items-center justify-center w-full h-full">
                <LoaderCircle className="animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="absolute flex flex-col items-center justify-center w-full h-full bg-white p-4">
                <div className="text-red-500 mb-4">Ошибка при инициализации приложения</div>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                    Обновить
                </button>
            </div>
        );
    }

    return <>{children}</>;
};