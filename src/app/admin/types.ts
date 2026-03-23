export type AdminRole = "owner" | "editor" | "author" | "operations";

export type AppLocale = "tr" | "en";

export type ProgramStatus = "upcoming" | "published" | "completed" | "cancelled";

export type BookingMode = "direct" | "application" | "external";

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

export interface ProgramTranslationValue {
  title: string;
  subtitle: string;
  summary: string;
  storyMarkdown: string;
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
  email: string;
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
