import { createAuthClient } from "better-auth/client";
import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) return NextResponse.next();

  const auth = createAuthClient({
    baseURL: process.env["API_URL"] ?? "http://localhost:3000",
  });

  try {
    const { data: session } = await auth.getSession({
      query: { disableCookieCache: true },
      fetchOptions: {
        headers: { cookie: request.headers.get("cookie") ?? "" },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      },
    });

    if (session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  } catch {
    // A failed session check must not lock users out of the sign-in pages.
    // Access to authenticated data is enforced separately by the API.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/register"],
};

