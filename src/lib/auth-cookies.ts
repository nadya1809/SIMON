import type { ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies";
import type { RequestCookies } from "next/dist/compiled/@edge-runtime/cookies";

export const NEXT_AUTH_COOKIE_NAMES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
  "next-auth.pkce.code_verifier",
  "__Secure-next-auth.pkce.code_verifier",
  "next-auth.state",
  "__Secure-next-auth.state",
  "next-auth.nonce",
  "__Secure-next-auth.nonce"
] as const;

const NEXT_AUTH_SESSION_COOKIE_NAMES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token"
] as const;

export function hasNextAuthSessionCookie(cookies: RequestCookies) {
  return NEXT_AUTH_SESSION_COOKIE_NAMES.some((name) => cookies.has(name));
}

export function clearNextAuthCookies(cookies: ResponseCookies) {
  for (const name of NEXT_AUTH_COOKIE_NAMES) {
    cookies.set(name, "", {
      maxAge: 0,
      path: "/"
    });
  }
}
