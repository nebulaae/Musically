"use client"

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { useSearch } from "@/hooks/useSearch";
import { FetchTracks } from "@/components/shared/FetchTracks";

const SearchPage = () => {
    const {
        searchQuery,
        searchResults,
        isLoading,
        error,
        handleSearchChange,
        handleTrackSelect
    } = useSearch();

    const [isFocused, setIsFocused] = useState(false);

    const clearSearch = () => {
        const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (inputElement) {
            inputElement.value = '';
            // Trigger the change event to update the state
            const event = new Event('input', { bubbles: true });
            inputElement.dispatchEvent(event);
        }
    };

    return (
        <section className="flex flex-col items-center w-full px-4 pb-32">
            <h1 className="mt-18 text-3xl sm:text-5xl font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent mb-6">
                Ищите песни
            </h1>
            <div className="flex flex-col mt-6 w-full max-w-[600px] mb-8 relative">
                <Input
                    type="text"
                    placeholder="Поиск песен..."
                    className="rounded-full py-6 w-full pl-12 pr-12"
                    onChange={handleSearchChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                    <Search />
                </div>
                {searchQuery && (
                    <button 
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                        onClick={clearSearch}
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            <div className="w-full max-w-[1200px]">
                {searchQuery ? (
                    <div className="mb-6">
                        <h2 className="title-text">Результаты поиска</h2>
                        <FetchTracks
                            tracks={searchResults}
                            isLoading={isLoading}
                            error={error}
                            handleTrackSelect={handleTrackSelect}
                        />
                    </div>
                ) : (
                    <div className="mb-6">
                        <h2 className="title-text">Все песни</h2>
                        <FetchTracks
                            tracks={searchResults}
                            isLoading={isLoading}
                            error={error}
                            handleTrackSelect={handleTrackSelect}
                        />
                    </div>
                )}
            </div>
        </section>
    );
};

export default SearchPage;