"use client";

import Link from "next/link";

import { useEffect, useState } from "react";

import { Music2 } from "lucide-react";

interface CollectionCardProps {
    href: string;
    name: string;
    genre?: string;
};

interface CollectionLinkProps {
    href: string;
    title?: string;
}

export const CollectionCard = ({
    href,
    name,
    genre,
}: CollectionCardProps) => {
    const [color, setColor] = useState<string>("");

    useEffect(() => {
        // Generate a random gradient for each playlist
        const colors = [
            "bg-blue-500",
            "bg-green-500",
            "bg-purple-500",
            "bg-yellow-500",
            "bg-cyan-500",
            "bg-indigo-500",
            "bg-teal-500",
            "bg-orange-500",
            "bg-pink-500",
        ];

        const index = Math.floor(Math.random() * colors.length);
        setColor(colors[index]);
    }, []);

    return (
        <div className="relative">
            <Link href={`/collections/${href}`}>
                <div
                    className={`relative w-full aspect-video rounded-lg p-6 overflow-hidden cursor-pointer ${color}`}
                >
                    <h1 className=" title-text">{name}</h1>
                    <div className="absolute bottom-0 right-0 opacity-80 p-6">
                        <Music2 className="w-20 h-20 text-white opacity-50" />
                    </div>
                    {genre && (
                        <div className="absolute bottom-0 left-0 p-6">
                            <h1 className="text-white font-bold font-mono underline underline-offset-4">#{genre}</h1>
                        </div>
                    )}
                </div>
            </Link>
        </div>
    );
};

export const CollectionLink = ({
    href,
    title,
}: CollectionLinkProps) => {
    return (
        <Link
            href={`/collections/${href}`}
            className="text-sm sm:text-base text-end purple-text-hover"
        >
            {title ? `${title}` : 'Слушать все'}
        </Link>

    );
};