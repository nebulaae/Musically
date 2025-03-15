"use client"

import { LoaderCircle } from 'lucide-react';
import { useDbInit } from '@/hooks/useDbInit';
import { useEffect, useState, ReactNode, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { hasCompletedOnboarding } from '@/db/actions/user.actions';

interface AuthGuardProps {
    children: ReactNode;
}

// Create a cache for onboarding status
const onboardingCache = {
    status: null as boolean | null,
    lastChecked: 0,
    expiryTime: 60 * 60 * 1000, // 1 hour in milliseconds
    isStale() {
        return Date.now() - this.lastChecked > this.expiryTime;
    },
    set(status: boolean) {
        this.status = status;
        this.lastChecked = Date.now();
    }
};

export const AuthGuard = ({ children }: AuthGuardProps) => {
    const router = useRouter();
    const pathname = usePathname();
    const { isInitializing, error } = useDbInit();
    const [isChecking, setIsChecking] = useState(true);

    // Memoize whether we're on the onboarding page
    const isOnboardingPage = useMemo(() => pathname === '/onboarding', [pathname]);

    useEffect(() => {
        let isMounted = true;

        async function checkOnboarding() {
            if (isInitializing) return;

            try {
                // Skip the check if we have a recent cached value
                if (onboardingCache.status !== null && !onboardingCache.isStale()) {
                    // Only redirect if needed
                    if (!onboardingCache.status && !isOnboardingPage) {
                        router.push('/onboarding');
                    } else if (onboardingCache.status && isOnboardingPage) {
                        router.push('/');
                    }
                    
                    if (isMounted) setIsChecking(false);
                    return;
                }

                const onboardingCompleted = await hasCompletedOnboarding();
                
                // Cache the result
                onboardingCache.set(onboardingCompleted);

                // If component has been unmounted, don't update state or redirect
                if (!isMounted) return;

                // If onboarding is not completed and we're not already on the onboarding page
                if (!onboardingCompleted && !isOnboardingPage) {
                    router.push('/onboarding');
                }
                // If onboarding is completed and we're on the onboarding page
                else if (onboardingCompleted && isOnboardingPage) {
                    router.push('/');
                }
            } catch (err) {
                console.error('Error checking onboarding status:', err);
            } finally {
                if (isMounted) setIsChecking(false);
            }
        }

        checkOnboarding();

        // Cleanup function to prevent state updates if component unmounts
        return () => {
            isMounted = false;
        };
    }, [isInitializing, isOnboardingPage, router]);

    // Memoize loading state
    const isLoading = isInitializing || isChecking;

    if (isLoading) {
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