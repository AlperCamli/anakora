const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:1337/api').replace(/\/$/, '');

type ApiEnvelope<T> = {
  data: T;
};

export type MediaDTO = {
  url: string;
  alt: string | null;
  width?: number;
  height?: number;
  mime?: string;
};

export type ButtonDTO = {
  label: string;
  url: string;
  variant?: 'primary' | 'secondary' | 'link';
  openInNewTab?: boolean;
};

export type CtaDTO = {
  title: string;
  description?: string | null;
  primaryButton?: ButtonDTO | null;
  secondaryButton?: ButtonDTO | null;
};

export type LayoutDTO = {
  brandName: string;
  contact: {
    email?: string | null;
    instagramUrl?: string | null;
  };
  headerNavigation: Array<{ label: string; url: string; sortOrder?: number }>;
  footerNavigation: Array<{ label: string; url: string; sortOrder?: number }>;
  mobileStickyCta?: CtaDTO | null;
  legalLinks: Array<{ title: string; slug: string }>;
  footerCopyright?: string | null;
};

export const resolveMediaUrl = (media?: MediaDTO | null): string | undefined => {
  if (!media?.url) return undefined;
  if (media.url.startsWith('http')) return media.url;
  return `${API_BASE.replace(/\/api$/, '')}${media.url}`;
};

const toQueryString = (query?: Record<string, string | number | boolean | undefined>) => {
  if (!query) return '';

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    params.set(key, String(value));
  });

  const qs = params.toString();
  return qs ? `?${qs}` : '';
};

export const getPublic = async <T>(
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
): Promise<T> => {
  const res = await fetch(`${API_BASE}/public/${path}${toQueryString(query)}`);

  if (!res.ok) {
    throw new Error(`GET /public/${path} failed with ${res.status}`);
  }

  const json = (await res.json()) as ApiEnvelope<T>;
  return json.data;
};

export const postPublic = async <T>(path: string, body: Record<string, unknown>): Promise<T> => {
  const res = await fetch(`${API_BASE}/public/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();

  if (!res.ok) {
    const message = json?.error?.message || `POST /public/${path} failed`;
    throw new Error(message);
  }

  return json.data as T;
};

