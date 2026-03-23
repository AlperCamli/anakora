import type {
  JournalPostPreviewDTO,
  Locale,
  ProgramCardDTO,
  ProgramDetailDTO,
  TestimonialDTO,
} from "../../server/data";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1567463330419-d65c673554c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

function localeTag(locale: Locale): string {
  return locale === "en" ? "en-US" : "tr-TR";
}

export function formatDateRange(
  startsAt: string,
  endsAt: string | null,
  locale: Locale,
): string {
  const start = new Date(startsAt);
  const end = endsAt ? new Date(endsAt) : null;
  const formatter = new Intl.DateTimeFormat(localeTag(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (!end) {
    return formatter.format(start);
  }

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

export function formatDuration(
  days: number | null,
  nights: number | null,
  locale: Locale,
): string {
  if (!days && !nights) {
    return locale === "en" ? "Program duration" : "Program suresi";
  }

  const dayPart = days
    ? locale === "en"
      ? `${days} days`
      : `${days} gun`
    : null;
  const nightPart = nights
    ? locale === "en"
      ? `${nights} nights`
      : `${nights} gece`
    : null;

  return [dayPart, nightPart].filter(Boolean).join(" / ");
}

export function formatReadTime(
  minutes: number | null,
  locale: Locale,
): string {
  if (!minutes) {
    return locale === "en" ? "Read" : "Okuma";
  }
  return locale === "en" ? `${minutes} min` : `${minutes} dk`;
}

export function formatPrice(
  amount: number | null,
  currency: string | null,
  locale: Locale,
): string | null {
  if (amount == null || !currency) {
    return null;
  }

  try {
    return new Intl.NumberFormat(localeTag(locale), {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export function toProgramCardViewModel(program: ProgramCardDTO, locale: Locale) {
  return {
    id: program.slug,
    title: program.title,
    location:
      [program.locationName, program.city].filter(Boolean).join(", ") ||
      program.locationName,
    date: formatDateRange(program.startsAt, program.endsAt, locale),
    duration: formatDuration(program.durationDays, program.durationNights, locale),
    category: program.categories[0]?.name ?? (locale === "en" ? "Program" : "Program"),
    image: program.coverImage?.url ?? FALLBACK_IMAGE,
    spotsLeft: program.spotsLeft ?? undefined,
    spotsLeftLabel: locale === "en" ? "spots left" : "yer kaldi",
    ctaLabel: locale === "en" ? "Reserve Spot" : "Yerini Ayirt",
    separator: "-",
  };
}

export function toExperienceCardViewModel(program: ProgramCardDTO, locale: Locale) {
  return {
    id: program.slug,
    title: program.title,
    category: program.categories[0]?.name ?? "ANAKORA",
    image: program.coverImage?.url ?? FALLBACK_IMAGE,
    description: program.summary ?? "",
    ctaLabel: locale === "en" ? "View Experience" : "Deneyimi Incele",
  };
}

export function toTestimonialCardViewModel(
  testimonial: TestimonialDTO,
  locale: Locale,
) {
  return {
    quote: testimonial.quote,
    author: testimonial.authorName,
    program:
      testimonial.authorTitle ??
      (locale === "en" ? "ANAKORA participant" : "ANAKORA katilimcisi"),
    image: testimonial.image?.url ?? undefined,
  };
}

export function toJournalPreviewViewModel(post: JournalPostPreviewDTO, locale: Locale) {
  return {
    id: post.slug,
    title: post.title,
    excerpt: post.excerpt ?? "",
    image: post.coverImage?.url ?? FALLBACK_IMAGE,
    date: post.publishedAt
      ? new Intl.DateTimeFormat(localeTag(locale), {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date(post.publishedAt))
      : "",
    category: post.categories[0]?.name ?? "",
    readTime: formatReadTime(post.readTimeMinutes, locale),
  };
}

export function deriveProgramCategoryLabel(program: ProgramDetailDTO, locale: Locale) {
  return program.categories[0]?.name ?? (locale === "en" ? "Program" : "Program");
}
