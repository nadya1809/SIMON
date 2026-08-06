import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import {
  clearNextAuthCookies,
  hasNextAuthSessionCookie
} from "@/lib/auth-cookies";

async function getReadableToken(request: NextRequest) {
  try {
    return await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });
  } catch {
    return null;
  }
}

function clearSessionJsonResponse() {
  const response = NextResponse.json({});
  clearNextAuthCookies(response.cookies);
  return response;
}

function clearSessionLoginRedirect(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  clearNextAuthCookies(response.cookies);
  return response;
}

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === "/api/auth/session") {
    if (!hasNextAuthSessionCookie(request.cookies)) {
      return NextResponse.next();
    }

    const token = await getReadableToken(request);
    return token ? NextResponse.next() : clearSessionJsonResponse();
  }

  const token = await getReadableToken(request);

  if (token) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    const response = NextResponse.json(
      { error: "UNAUTHORIZED", message: "Anda harus login terlebih dahulu." },
      { status: 401 }
    );
    clearNextAuthCookies(response.cookies);
    return response;
  }

  return clearSessionLoginRedirect(request);
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/auth/session", "/api/((?!auth).*)"]
};
