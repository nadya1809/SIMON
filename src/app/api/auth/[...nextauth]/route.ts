import NextAuth from "next-auth";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import {
  clearNextAuthCookies,
  hasNextAuthSessionCookie
} from "@/lib/auth-cookies";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

type RouteContext = {
  params: Promise<{
    nextauth: string[];
  }>;
};

async function sessionCookieIsReadable(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    return Boolean(token);
  } catch {
    return false;
  }
}

function clearSessionResponse() {
  const response = NextResponse.json({});
  clearNextAuthCookies(response.cookies);
  return response;
}

export async function GET(request: NextRequest, context: RouteContext) {
  if (
    request.nextUrl.pathname === "/api/auth/session" &&
    hasNextAuthSessionCookie(request.cookies) &&
    !(await sessionCookieIsReadable(request))
  ) {
    return clearSessionResponse();
  }

  return handler(request, context);
}

export { handler as POST };
