import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/server/auth/session";

const AUTH_PATHS = new Set(["/signin", "/signup"]);

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await getSessionFromRequest(request);

  if (pathname.startsWith("/simulation")) {
    if (!session) {
      const signInUrl = new URL("/signin", request.url);

      signInUrl.searchParams.set("next", `${pathname}${search}`);

      return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
  }

  if (AUTH_PATHS.has(pathname) && session) {
    return NextResponse.redirect(new URL("/simulation", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/simulation/:path*", "/signin", "/signup"],
};
