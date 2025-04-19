import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const tokenCookie = (await cookies()).get("token");

        if (!tokenCookie || !tokenCookie.value) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const body = await req.json();
        const { playlistId } = body;

        if (!playlistId) {
            return NextResponse.json({ error: "Playlist ID is required" }, { status: 400 });
        }
        
        const res = await fetch(`https://${process.env.NEXT_PUBLIC_BACKEND_API}/api/playlists/${playlistId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${tokenCookie.value}`
            }
        });

        const data = await res.json();
        
        if (!res.ok) {
            return NextResponse.json({ error: data.message || "Failed to delete playlist" }, { status: res.status });
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error("Delete playlist error:", err);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}