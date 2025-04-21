import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const tokenCookie = (await cookies()).get("token");

        if (!tokenCookie || !tokenCookie.value) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const body = await req.json();
        const { playlistId, trackId } = body;

        if (!playlistId || !trackId) {
            return NextResponse.json({ error: "Playlist ID and Track ID are required" }, { status: 400 });
        }
        
        const res = await fetch(`https://${process.env.NEXT_PUBLIC_BACKEND_API}/api/playlists/${playlistId}/tracks/${trackId}`, {
            method: 'DELETE', // FIXED: Using DELETE method to match backend
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${tokenCookie.value}`
            }
        });

        const data = await res.json();
        
        if (!res.ok) {
            return NextResponse.json({ error: data.message || "Failed to remove track from playlist" }, { status: res.status });
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error("Remove track from playlist error:", err);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}