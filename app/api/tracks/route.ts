import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const res = await fetch(`https://${process.env.NEXT_PUBLIC_BACKEND_API}/api/tracks?limit=10000`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
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
  };
};