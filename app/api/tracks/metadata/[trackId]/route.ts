import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ trackId: string }> }
) {
    try {
        const { trackId } = await params;

        if (!trackId) {
            return new NextResponse('Track ID is required', { status: 400 });
        }

        console.log(`[Metadata Request] Fetching metadata for track: ${trackId}`);

        // Build the backend URL for metadata endpoint
        const backendUrl = `https://${process.env.NEXT_PUBLIC_BACKEND_API}/api/tracks/metadata/${trackId}`;

        // Fetch metadata from backend
        const response = await fetch(backendUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            cache: 'no-store', // Don't cache this request in Next.js
        });

        // Check if the backend responded successfully
        if (!response.ok) {
            const errorStatus = response.status;
            const errorBody = await response.text().catch(() => 'Could not read backend error body');
            console.error(`[Metadata Error] Backend error: ${errorStatus} ${response.statusText}. Body: ${errorBody}`);

            return new NextResponse(errorBody || `Backend Error: ${errorStatus}`, {
                status: errorStatus,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get the metadata JSON from the backend
        const metadata = await response.json();

        console.log(`[Metadata Response] Successfully retrieved metadata for track ${trackId}: duration=${metadata.duration}, format=${metadata.format}`);

        // Return the metadata
        return NextResponse.json(metadata, {
            headers: {
                'Cache-Control': 'public, max-age=3600', // Cache metadata for 1 hour
            }
        });

    } catch (error) {
        console.error(`[Metadata Error] Error fetching track metadata:`, error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}