import { NextRequest, NextResponse } from "next/server";
import { normalizeCallbackPath } from "@/lib/auth-callback";
import { clearNextAuthCookies } from "@/lib/auth-cookies";

export function GET(request: NextRequest) {
  const callbackUrl = normalizeCallbackPath(
    request.nextUrl.searchParams.get("callbackUrl"),
    "/login"
  );
  const protocol = request.headers.get("x-forwarded-proto") ?? "http";
  const host = request.headers.get("host") ?? request.nextUrl.host;
  const response = NextResponse.redirect(
    new URL(callbackUrl, `${protocol}://${host}`)
  );

  clearNextAuthCookies(response.cookies);

  return response;
}
