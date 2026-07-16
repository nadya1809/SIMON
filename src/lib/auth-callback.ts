export function normalizeCallbackPath(
  callbackUrl: string | null | undefined,
  fallback = "/dashboard"
) {
  if (!callbackUrl) {
    return fallback;
  }

  if (callbackUrl.startsWith("/")) {
    return callbackUrl;
  }

  try {
    const parsed = new URL(callbackUrl);
    const nextPath = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    return nextPath.startsWith("/") ? nextPath : fallback;
  } catch {
    return fallback;
  }
}
