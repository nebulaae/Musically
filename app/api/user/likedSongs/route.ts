import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        // Get the token from cookies
        const tokenCookie = (await cookies()).get("token");
        
        if (!tokenCookie || !tokenCookie.value) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }
        
        const res = await fetch(`https://${process.env.NEXT_PUBLIC_BACKEND_API}/api/users/likes`, {
            headers: {
                "Authorization": `Bearer ${tokenCookie.value}`
            },
        });

        const data = await res.json();
        
        if (!res.ok) {
            return NextResponse.json({ error: data.message }, { status: res.status });
        }

        // Just pass the data through as is
        return NextResponse.json(data);
    } catch (err) {
        console.error("Get liked tracks error:", err);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}