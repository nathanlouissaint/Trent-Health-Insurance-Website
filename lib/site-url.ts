export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configuredUrl) return undefined;

  try {
    return new URL(configuredUrl.endsWith("/") ? configuredUrl : `${configuredUrl}/`);
  } catch {
    return undefined;
  }
}

export function getSiteUrlForPath(path: string) {
  const siteUrl = getSiteUrl();
  return siteUrl ? new URL(path, siteUrl).toString() : undefined;
}
