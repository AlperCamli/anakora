export type AdminRole = "owner" | "editor" | "author" | "operations";

export type AppLocale = "tr" | "en";

export type ProgramStatus = "upcoming" | "published" | "completed" | "cancelled";

export type BookingMode = "direct" | "application" | "external";
export type JournalPostStatus = "draft" | "published" | "archived";

export type HomepageSectionKey =
  | "hero"
  | "brand_manifesto"
  | "experience_categories"
  | "upcoming_programs"
  | "why_anakora"
  | "archive_preview"
  | "testimonials"
  | "journal_preview"
  | "final_cta";

export type LeadSource =
  | "newsletter"
  | "program_booking"
  | "journal_newsletter"
  | "general_contact"
  | "waitlist";

export type LeadStatus =
  | "new"
  | "reviewed"
  | "contacted"
  | "qualified"
  | "converted"
  | "archived"
  | "spam";

export interface AdminProfile {
  id: string;
  email: string;
  fullName: string | null;
  role: AdminRole;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GuideOption {
  id: string;
  slug: string;
  name: string;
}

export interface ProgramOption {
  id: string;
  slug: string;
  title: string;
}

export interface ProgramTranslationValue {
  title: string;
  subtitle: string;
  summary: string;
  storyMarkdown: string;
  archiveRecapMarkdown: string;
  archiveHighlights: string;
  coverImageAlt: string;
  whoIsItFor: string;
  itineraryJson: string;
  includedItems: string;
  excludedItems: string;
  seoTitle: string;
  seoDescription: string;
}

export interface ProgramFaqValue {
  id?: string;
  sortOrder: number;
  isActive: boolean;
  trQuestion: string;
  trAnswer: string;
  enQuestion: string;
  enAnswer: string;
}

export interface ProgramEditorValue {
  id?: string;
  slug: string;
  status: ProgramStatus;
  bookingMode: BookingMode;
  externalBookingUrl: string;
  startsAt: string;
  endsAt: string;
  locationName: string;
  city: string;
  countryCode: string;
  durationDays: string;
  durationNights: string;
  capacity: string;
  spotsLeft: string;
  priceAmount: string;
  priceCurrency: string;
  primaryGuideId: string;
  isFeatured: boolean;
  coverImageUrl: string;
  categoryIds: string[];
  tr: ProgramTranslationValue;
  en: ProgramTranslationValue;
  faqs: ProgramFaqValue[];
}

export interface ProgramListItem {
  id: string;
  slug: string;
  status: ProgramStatus;
  bookingMode: BookingMode;
  startsAt: string;
  endsAt: string | null;
  locationName: string;
  city: string | null;
  isFeatured: boolean;
  priceAmount: number | null;
  priceCurrency: string | null;
  trTitle: string | null;
  enTitle: string | null;
  updatedAt: string;
}

export interface ProgramCategoryOption {
  id: string;
  slug: string;
  trName: string | null;
  enName: string | null;
}

export interface GuideTranslationValue {
  fullName: string;
  title: string;
  bio: string;
}

export interface GuideEditorValue {
  id?: string;
  slug: string;
  email: string;
  instagramHandle: string;
  avatarUrl: string;
  isFeatured: boolean;
  isActive: boolean;
  tr: GuideTranslationValue;
  en: GuideTranslationValue;
}

export interface GuideListItem {
  id: string;
  slug: string;
  email: string | null;
  instagramHandle: string | null;
  avatarUrl: string | null;
  isFeatured: boolean;
  isActive: boolean;
  trName: string | null;
  enName: string | null;
  linkedProgramCount: number;
  updatedAt: string;
}

export interface LeadListItem {
  id: string;
  source: LeadSource;
  status: LeadStatus;
  locale: AppLocale;
  programId: string | null;
  programSlug: string | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  submittedAt: string;
  updatedAt: string;
}

export interface LeadDetail extends LeadListItem {
  message: string | null;
  metadata: Record<string, unknown>;
  consentMarketing: boolean;
  internalNote: string;
}

export interface DashboardOverview {
  totalPrograms: number;
  draftPrograms: number;
  featuredPrograms: number;
  totalGuides: number;
  activeGuides: number;
  totalLeads: number;
  newLeads: number;
  inProgressLeads: number;
}

export interface TestimonialTranslationValue {
  authorName: string;
  authorTitle: string;
  quote: string;
}

export interface TestimonialEditorValue {
  id?: string;
  slug: string;
  primaryProgramId: string;
  linkedProgramIds: string[];
  guideId: string;
  authorImageUrl: string;
  rating: string;
  testimonialDate: string;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: string;
  tr: TestimonialTranslationValue;
  en: TestimonialTranslationValue;
}

export interface TestimonialListItem {
  id: string;
  slug: string | null;
  authorImageUrl: string | null;
  primaryProgramId: string | null;
  linkedProgramCount: number;
  guideId: string | null;
  rating: number;
  testimonialDate: string | null;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  trAuthorName: string | null;
  enAuthorName: string | null;
  trQuote: string | null;
  enQuote: string | null;
  updatedAt: string;
}

export interface JournalPostTranslationValue {
  title: string;
  excerpt: string;
  contentMarkdown: string;
  coverImageAlt: string;
  seoTitle: string;
  seoDescription: string;
}

export interface JournalPostEditorValue {
  id?: string;
  slug: string;
  status: JournalPostStatus;
  coverImageUrl: string;
  isFeatured: boolean;
  readingTimeMinutes: string;
  publishedAt: string;
  primaryGuideId: string;
  categoryIds: string[];
  tr: JournalPostTranslationValue;
  en: JournalPostTranslationValue;
}

export interface JournalPostListItem {
  id: string;
  slug: string;
  status: JournalPostStatus;
  coverImageUrl: string | null;
  isFeatured: boolean;
  readingTimeMinutes: number | null;
  publishedAt: string | null;
  categoryCount: number;
  trTitle: string | null;
  enTitle: string | null;
  updatedAt: string;
}

export interface JournalCategoryEditorValue {
  id?: string;
  slug: string;
  sortOrder: string;
  isFeatured: boolean;
  isActive: boolean;
  trName: string;
  trDescription: string;
  enName: string;
  enDescription: string;
}

export interface JournalCategoryListItem {
  id: string;
  slug: string;
  sortOrder: number;
  isFeatured: boolean;
  isActive: boolean;
  trName: string | null;
  enName: string | null;
  updatedAt: string;
}

export interface HomepageSectionLocaleValue {
  id?: string;
  title: string;
  subtitle: string;
  payloadJson: string;
  mediaUrl: string;
  mediaAlt: string;
  isActive: boolean;
  sortOrder: string;
}

export interface HomepageSectionEditorValue {
  key: HomepageSectionKey;
  tr: HomepageSectionLocaleValue;
  en: HomepageSectionLocaleValue;
}

export interface HomepageTrustedOrganizationEditorValue {
  id?: string;
  organizationName: string;
  logoUrl: string;
  logoAlt: string;
  websiteUrl: string;
  sortOrder: string;
  isActive: boolean;
}

export interface SiteSettingsLocaleValue {
  id?: string;
  locale: AppLocale;
  siteName: string;
  logoText: string;
  tagline: string;
  contactEmail: string;
  contactPhone: string;
  instagramUrl: string;
  defaultSeoTitle: string;
  defaultSeoDescription: string;
  globalSeoImageUrl: string;
  reservationNotificationEmail: string;
  headerNavigationJson: string;
  footerLegalLinksJson: string;
  socialLinksJson: string;
  notificationSettingsJson: string;
  footerNewsletterEnabled: boolean;
}

export interface SiteSettingsEditorValue {
  tr: SiteSettingsLocaleValue;
  en: SiteSettingsLocaleValue;
}

export type MediaVisibility = "public" | "private";
export type MediaModule =
  | "journal"
  | "program"
  | "guide"
  | "testimonials"
  | "homepage"
  | "logo";

export interface MediaLibraryItem {
  bucket: string;
  path: string;
  name: string;
  size: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  publicUrl: string | null;
  reference: string;
}
