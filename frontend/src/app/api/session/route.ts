import { NextRequest, NextResponse } from "next/server";

const cookieName = "campusfix_session";

export async function POST(request: NextRequest) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Firebase is not configured." }, { status: 503 });

  let idToken = "";
  try {
    const body: unknown = await request.json();
    if (body && typeof body === "object" && "idToken" in body && typeof body.idToken === "string") idToken = body.idToken;
  } catch {
    return NextResponse.json({ error: "A Firebase ID token is required." }, { status: 400 });
  }
  if (!idToken || idToken.length > 10000) return NextResponse.json({ error: "A Firebase ID token is required." }, { status: 400 });

  try {
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      cache: "no-store",
    });
    if (!response.ok) return NextResponse.json({ error: "Firebase could not verify this account." }, { status: 401 });
    const result = NextResponse.json({ ok: true });
    result.cookies.set(cookieName, idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    });
    return result;
  } catch {
    return NextResponse.json({ error: "Firebase verification is temporarily unavailable." }, { status: 502 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieName, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
