import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const tokenCookie = (await cookies()).get("token");

        if (!tokenCookie || !tokenCookie.value) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const res = await fetch(`https://${process.env.NEXT_PUBLIC_BACKEND_API}/api/playlists/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${tokenCookie.value}`
            },
            cache: 'no-store'
        });

        const data = await res.json();
        
        if (!res.ok) {
            console.error("Backend API error:", data);
            return NextResponse.json({ error: data.message || "Failed to fetch playlists" }, { status: res.status });
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error("Get all playlists error:", err);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}