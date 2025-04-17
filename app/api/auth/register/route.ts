import { cookies } from "next/headers";
import { registerSchema } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const body = await req.json();

    const parse = registerSchema.safeParse(body);
    if (!parse.success) {
        return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
    }

    try {
        const res = await fetch(
            `https://${process.env.NEXT_PUBLIC_BACKEND_API}/api/auth/register`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            }
        );

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json({ error: data.message }, { status: res.status });
        }

        // Set cookie with token from backend response
        (await
            // Set cookie with token from backend response
            cookies()).set("token", data.token, {
            httpOnly: true,
            path: "/",
            secure: process.env.NODE_ENV === "production",
            maxAge: 365 * 24 * 60 * 60, // 365 days
        });

        return NextResponse.json({ message: "Registered successfully", user: data.user });
    } catch (err) {
        console.error("Registration error:", err);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}