export type Locale = "tr" | "en";

export const DEFAULT_LOCALE: Locale = "tr";

export interface MediaDTO {
  url: string;
  alt: string | null;
  type: "image" | "video";
}

export interface LinkDTO {
  label: string;
  href: string;
}

export interface CategoryDTO {
  slug: string;
  name: string;
  description: string | null;
}

export interface GuidePreviewDTO {
  slug: string;
  name: string;
  title: string | null;
  avatar: MediaDTO | null;
}

export interface TestimonialDTO {
  id: string;
  slug: string | null;
  quote: string;
  authorName: string;
  authorTitle: string | null;
  rating: number;
  date: string | null;
  image: MediaDTO | null;
  isFeatured: boolean;
  relatedProgramSlug: string | null;
}

export interface LayoutDTO {
  locale: Locale;
  siteName: string;
  logoText: string | null;
  tagline: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  instagramUrl: string | null;
  navigation: LinkDTO[];
  legalLinks: LinkDTO[];
  footerNewsletterEnabled: boolean;
}

export interface ProgramCardDTO {
  id: string;
  slug: string;
  status: "upcoming" | "published" | "completed" | "cancelled";
  bookingMode: "direct" | "application" | "external";
  title: string;
  subtitle: string | null;
  summary: string | null;
  locationName: string;
  city: string | null;
  countryCode: string | null;
  startsAt: string;
  endsAt: string | null;
  durationDays: number | null;
  durationNights: number | null;
  priceAmount: number | null;
  priceCurrency: string | null;
  capacity: number | null;
  spotsLeft: number | null;
  isFeatured: boolean;
  coverImage: MediaDTO | null;
  categories: CategoryDTO[];
  guides: GuidePreviewDTO[];
}

export interface ProgramGalleryItemDTO {
  id: string;
  sortOrder: number;
  media: MediaDTO;
  caption: string | null;
  isFeatured: boolean;
}

export interface ProgramFAQDTO {
  id: string;
  sortOrder: number;
  question: string;
  answer: string;
}

export interface ProgramDetailDTO extends ProgramCardDTO {
  storyMarkdown: string | null;
  archiveRecapMarkdown: string | null;
  archiveHighlights: string[];
  whoIsItFor: string[];
  itinerary: unknown[];
  includedItems: string[];
  excludedItems: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  gallery: ProgramGalleryItemDTO[];
  faqs: ProgramFAQDTO[];
  testimonials: TestimonialDTO[];
}

export interface ArchiveProgramDTO {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  locationName: string;
  city: string | null;
  countryCode: string | null;
  startsAt: string;
  endsAt: string | null;
  capacity: number | null;
  coverImage: MediaDTO | null;
  recapMarkdown: string | null;
  highlights: string[];
}

export interface ArchiveYearDTO {
  year: number;
  programs: ArchiveProgramDTO[];
}

export interface ArchiveDTO {
  locale: Locale;
  years: ArchiveYearDTO[];
  totalPrograms: number;
}

export interface JournalPostPreviewDTO {
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: string | null;
  readTimeMinutes: number | null;
  coverImage: MediaDTO | null;
  categories: CategoryDTO[];
  isFeatured: boolean;
}

export interface JournalListDTO {
  locale: Locale;
  categories: CategoryDTO[];
  featuredPost: JournalPostPreviewDTO | null;
  posts: JournalPostPreviewDTO[];
}

export interface JournalPostDTO {
  slug: string;
  title: string;
  excerpt: string | null;
  contentMarkdown: string;
  publishedAt: string | null;
  readTimeMinutes: number | null;
  coverImage: MediaDTO | null;
  categories: CategoryDTO[];
  seoTitle: string | null;
  seoDescription: string | null;
  authorGuide: GuidePreviewDTO | null;
}

export interface GuideDTO {
  slug: string;
  name: string;
  title: string | null;
  bio: string | null;
  avatar: MediaDTO | null;
  isFeatured: boolean;
}

export interface HomePageSectionDTO {
  key:
    | "hero"
    | "brand_manifesto"
    | "experience_categories"
    | "upcoming_programs"
    | "why_anakora"
    | "archive_preview"
    | "testimonials"
    | "journal_preview"
    | "final_cta";
  title: string | null;
  subtitle: string | null;
  media: MediaDTO | null;
  payload: Record<string, unknown>;
  sortOrder: number;
}

export interface TrustedOrganizationDTO {
  id: string;
  organizationName: string;
  logo: MediaDTO;
  websiteUrl: string | null;
  sortOrder: number;
}

export interface HomePageDTO {
  locale: Locale;
  sections: HomePageSectionDTO[];
  trustedOrganizations: TrustedOrganizationDTO[];
  featuredPrograms: ProgramCardDTO[];
  featuredTestimonials: TestimonialDTO[];
  journalPreview: JournalPostPreviewDTO[];
}
