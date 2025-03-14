import { useState, useEffect } from 'react';
import { syncTracksFromAPI } from '@/db/actions/tracks.actions';
import { getCurrentUser } from '@/db/actions/user.actions';

export function useDbInit() {
    const [isInitializing, setIsInitializing] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function initializeDatabase() {
            try {
                // Initialize the user (creates one if it doesn't exist)
                await getCurrentUser();

                // Fetch tracks from API and store them in the database
                await syncTracksFromAPI();

                setIsInitializing(false);
            } catch (err) {
                console.error('Error initializing database:', err);
                setError(err instanceof Error ? err : new Error('Unknown error during database initialization'));
                setIsInitializing(false);
            }
        }

        initializeDatabase();
    }, []);

    return { isInitializing, error };
}