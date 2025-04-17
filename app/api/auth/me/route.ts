import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        // Get the token from cookies
        const tokenCookie = (await cookies()).get("token");
        
        if (!tokenCookie || !tokenCookie.value) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        // Fetch user details from the backend API
        const res = await fetch(
            `https://${process.env.NEXT_PUBLIC_BACKEND_API}/api/auth/me`,
            {
                headers: {
                    "Authorization": `Bearer ${tokenCookie.value}`
                }
            }
        );

        const data = await res.json();
        
        if (!res.ok) {
            return NextResponse.json({ error: data.message }, { status: res.status });
        }

        return NextResponse.json({ user: data.user });
    } catch (err) {
        console.error("Get current user error:", err);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}