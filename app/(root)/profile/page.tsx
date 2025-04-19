'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, UserRound } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { PlaylistGrid } from '@/components/shared/PlaylistGrid';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GetLikedSongs } from '@/components/functions/GetLikedSongs';

interface User {
    username: string;
    email: string;
}

const Page = () => {
    // FETCH USER
    const [user, setUser] = useState<User | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const getMe = async () => {
            try {
                const response = await fetch('/api/auth/me', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });
                // TODO MAKE A TOAST

                if (!response.ok) {
                    throw new Error('Failed to fetch user');
                }

                const data = await response.json();
                setUser(data.user);
            } catch (err) {
                console.error('Error fetching current user:', err);
                setError('Failed to fetch tracks');
            } finally {
                setLoading(false);
            }
        };

        getMe();
    }, []);

    // TODO MAKE NORMAL FETCHING
    if (loading) {
        return (
            <div>Loading...</div>
        )
    };

    if (error) return <div className="flex items-center justify-center w-full text-red-500">Ошибка: {error}</div>;

    if (!user) return <div>Not authenticated</div>;


    return (
        <section className="flex flex-col items-center w-full pb-32">
            <div className="flex flex-col gap-6 container">
                {/* SETTINGS CONTAINER */}
                <div className="flex items-center justify-end lg:hidden">
                    {/* SETTINGS */}
                    <Button className="button-neutral">
                        <Settings />
                        Настройки
                    </Button>
                </div>
                {/* HEADER */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* USER DATA CONTAINER */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        {/* PROFILE PHOTO */}
                        <div className="bg-secondary p-6 rounded-full">
                            <UserRound className="size-24" />
                        </div>
                        {/* USER DATA */}
                        <div className="flex flex-col items-start gap-4">
                            <h1 className="text-xl sm:text-4xl font-bold">Добро пожаловать, {user.username}!</h1>
                            <div className="flex justify-start md:justify-center gap-4">
                                <p className="text-gray-500">Лайки: 999</p>
                                <p className="text-gray-500">Плейлисты: 999</p>
                            </div>
                        </div>
                    </div>
                    <div className="hidden lg:flex ">
                        {/* SETTINGS */}
                        <Button className="button-neutral">
                            <Settings />
                            Настройки
                        </Button>
                    </div>
                </div>

                {/* SEPARATOR */}
                <Separator orientation='horizontal' className="bg-secondary" />

                {/* TABS */}
                <Tabs defaultValue="favorite">
                    <TabsList className="w-full">
                        <TabsTrigger value="favorite">Понравившееся</TabsTrigger>
                        <TabsTrigger value="playlists">Плейлисты</TabsTrigger>
                    </TabsList>
                    <TabsContent value="favorite">
                        <GetLikedSongs />
                    </TabsContent>
                    <TabsContent value="playlists">
                        <PlaylistGrid />
                    </TabsContent>
                </Tabs>
            </div>
        </section>
    );
};

export default Page;