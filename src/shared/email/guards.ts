export function isOriginAllowed(
  url: string,
  allowedOrigins: string[],
): boolean {
  try {
    return allowedOrigins.includes(new URL(url).origin);
  } catch {
    return false;
  }
}

export function isResetUrlAllowed(
  url: string,
  allowedOrigins: string[],
  apiOrigin: string,
): boolean {
  try {
    const parsed = new URL(url);
    const callbackUrl = parsed.searchParams.get('callbackURL');
    if (callbackUrl !== null) {
      return isOriginAllowed(callbackUrl, allowedOrigins);
    }
    return parsed.origin === apiOrigin;
  } catch {
    return false;
  }
}
