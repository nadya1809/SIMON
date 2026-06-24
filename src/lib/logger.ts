type LogMeta = Record<string, unknown>;

function formatMeta(meta?: LogMeta) {
  if (!meta) {
    return "";
  }

  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return " [meta-unserializable]";
  }
}

export function logServerError(scope: string, error: unknown, meta?: LogMeta) {
  const message =
    error instanceof Error ? error.message : "Unknown server error";
  const stack = error instanceof Error ? error.stack : undefined;

  if (process.env.NODE_ENV === "production") {
    console.error(`[server-error] ${scope}: ${message}${formatMeta(meta)}`);
    return;
  }

  console.error(`[server-error] ${scope}: ${message}${formatMeta(meta)}`);

  if (stack) {
    console.error(stack);
  }
}
