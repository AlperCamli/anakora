export type NormalizedMedia = {
  url: string;
  alt: string | null;
  width?: number;
  height?: number;
  mime?: string;
};

const unwrapMedia = (media: any): any => {
  if (!media) return null;
  if (media.data) return media.data;
  return media;
};

export const normalizeMedia = (media: any): NormalizedMedia | null => {
  const raw = unwrapMedia(media);
  if (!raw) return null;

  return {
    url: raw.url,
    alt: raw.alternativeText || raw.name || null,
    width: raw.width ?? undefined,
    height: raw.height ?? undefined,
    mime: raw.mime ?? undefined,
  };
};

export const normalizeMediaArray = (media: any): NormalizedMedia[] => {
  const raw = unwrapMedia(media);
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw.map(normalizeMedia).filter(Boolean) as NormalizedMedia[];
  }

  return [normalizeMedia(raw)].filter(Boolean) as NormalizedMedia[];
};

