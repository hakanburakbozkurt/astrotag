export function normalizeExternalUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export function externalLinkLabel(url: string): string {
  try {
    const parsed = new URL(normalizeExternalUrl(url) ?? url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url.trim();
  }
}
