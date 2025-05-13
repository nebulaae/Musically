import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Get the URL and parse it to extract query parameters
    const url = new URL(req.url);
    const searchParams = url.searchParams;

    // Construct the backend API URL with all the same parameters
    const backendUrl = new URL(`https://${process.env.NEXT_PUBLIC_BACKEND_API}/api/tracks`);

    // Copy all query parameters from the frontend request to the backend request
    searchParams.forEach((value, key) => {
      backendUrl.searchParams.append(key, value);
    });

    // Make the request to the backend
    const res = await fetch(backendUrl.toString(), {
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
    console.error("Get tracks error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}