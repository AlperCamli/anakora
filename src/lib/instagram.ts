const INSTAGRAM_HOST_PATTERN = /(^|\.)instagram\.com$/i;
const INSTAGRAM_HANDLE_PATTERN = /^[a-z0-9._]{1,30}$/;

function cleanHandleCandidate(value: string): string {
  return value
    .trim()
    .replace(/^@+/, "")
    .replace(/^\/+/, "")
    .split(/[/?#]/)[0]
    .trim()
    .toLowerCase();
}

function extractFromUrl(value: string): string | null {
  const withProtocol = /^https?:\/\//i.test(value)
    ? value
    : `https://${value.replace(/^\/+/, "")}`;

  try {
    const parsed = new URL(withProtocol);
    if (!INSTAGRAM_HOST_PATTERN.test(parsed.hostname)) {
      return null;
    }
    const firstPathPart = parsed.pathname.split("/").filter(Boolean)[0] ?? "";
    return cleanHandleCandidate(firstPathPart);
  } catch {
    return null;
  }
}

export function extractInstagramHandle(value?: string | null): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return null;
  }

  let candidate: string | null = null;

  if (trimmed.startsWith("@") || trimmed.startsWith("/")) {
    candidate = cleanHandleCandidate(trimmed);
  } else if (!trimmed.includes("/") && !trimmed.toLowerCase().includes("instagram.com")) {
    candidate = cleanHandleCandidate(trimmed);
  } else {
    candidate = extractFromUrl(trimmed);
  }

  if (!candidate || !INSTAGRAM_HANDLE_PATTERN.test(candidate)) {
    return null;
  }

  return candidate;
}

export function normalizeInstagramUrl(value?: string | null): string | null {
  const handle = extractInstagramHandle(value);
  if (!handle) {
    return null;
  }
  return `https://instagram.com/${handle}`;
}

export function toInstagramHandleLabel(value?: string | null): string | null {
  const handle = extractInstagramHandle(value);
  if (!handle) {
    return null;
  }
  return `@${handle}`;
}
