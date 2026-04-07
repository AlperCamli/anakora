import { getSupabaseBrowserClient } from "../../lib/supabase/browser-client";
import type { Locale } from "../../server/data";

const CAPTCHA_ENABLED = import.meta.env.VITE_ENABLE_CAPTCHA === "true";
const PHONE_ALLOWED_CHARS_PATTERN = /^[0-9+\s().-]+$/;

export const LEAD_FULL_NAME_MAX_LENGTH = 80;
export const LEAD_MESSAGE_MAX_LENGTH = 500;
const LEAD_PHONE_MIN_DIGITS = 7;
const LEAD_PHONE_MAX_DIGITS = 15;

export type LeadSource =
  | "newsletter"
  | "program_booking"
  | "journal_newsletter"
  | "general_contact"
  | "waitlist";

interface ValidationResult {
  isValid: boolean;
  fieldErrors: Record<string, string>;
}

export interface SubmitLeadInput {
  source: LeadSource;
  locale: Locale;
  email?: string;
  fullName?: string;
  phone?: string;
  message?: string;
  consentMarketing?: boolean;
  programId?: string;
  metadata?: Record<string, unknown>;
  honeypot?: string;
  captchaToken?: string;
}

export interface SubmitLeadResult {
  ok: boolean;
  ignoredAsSpam?: boolean;
  fieldErrors?: Record<string, string>;
  errorMessage?: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function translate(locale: Locale, tr: string, en: string): string {
  return locale === "en" ? en : tr;
}

function trimOrUndefined(value?: string): string | undefined {
  const next = value?.trim();
  return next ? next : undefined;
}

export function filterPhoneInput(value: string): string {
  const filtered = value.replace(/[^0-9+\s().-]/g, "");
  const hasPlus = filtered.includes("+");
  const withoutPlus = filtered.replace(/\+/g, "");
  const normalized = withoutPlus.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return hasPlus ? "+" : "";
  }
  return hasPlus ? `+${normalized}` : normalized;
}

function normalizePhoneForValidation(value?: string): string | undefined {
  const trimmed = trimOrUndefined(value);
  if (!trimmed) {
    return undefined;
  }
  return filterPhoneInput(trimmed);
}

function phoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function validateLeadInput(input: SubmitLeadInput): ValidationResult {
  const fieldErrors: Record<string, string> = {};
  const email = trimOrUndefined(input.email);
  const rawPhone = trimOrUndefined(input.phone);
  const phone = normalizePhoneForValidation(input.phone);
  const fullName = trimOrUndefined(input.fullName);
  const message = trimOrUndefined(input.message);
  const isNewsletterFlow =
    input.source === "newsletter" || input.source === "journal_newsletter";
  const isGeneralContact = input.source === "general_contact";

  if (fullName && fullName.length > LEAD_FULL_NAME_MAX_LENGTH) {
    fieldErrors.fullName = translate(
      input.locale,
      `Isim soyisim en fazla ${LEAD_FULL_NAME_MAX_LENGTH} karakter olabilir.`,
      `Full name must be at most ${LEAD_FULL_NAME_MAX_LENGTH} characters.`,
    );
  }

  if (message && message.length > LEAD_MESSAGE_MAX_LENGTH) {
    fieldErrors.message = translate(
      input.locale,
      `Mesaj en fazla ${LEAD_MESSAGE_MAX_LENGTH} karakter olabilir.`,
      `Message must be at most ${LEAD_MESSAGE_MAX_LENGTH} characters.`,
    );
  }

  if (rawPhone) {
    if (!PHONE_ALLOWED_CHARS_PATTERN.test(rawPhone)) {
      fieldErrors.phone = translate(
        input.locale,
        "Telefon alaninda yalnizca rakam, bosluk ve + ()-. karakterleri kullanilabilir.",
        "Phone can only include digits, spaces, and + ()-. characters.",
      );
    } else if (!phone) {
      fieldErrors.phone = translate(
        input.locale,
        "Telefon numarasi gecersiz.",
        "Phone number is invalid.",
      );
    } else {
      const digits = phoneDigits(phone);
      if (digits.length < LEAD_PHONE_MIN_DIGITS || digits.length > LEAD_PHONE_MAX_DIGITS) {
        fieldErrors.phone = translate(
          input.locale,
          `Telefon numarasi ${LEAD_PHONE_MIN_DIGITS}-${LEAD_PHONE_MAX_DIGITS} rakam icermelidir.`,
          `Phone number must contain ${LEAD_PHONE_MIN_DIGITS}-${LEAD_PHONE_MAX_DIGITS} digits.`,
        );
      }
    }
  }

  if (isGeneralContact) {
    if (!email && !rawPhone) {
      const contactError = translate(
        input.locale,
        "Iletisim icin e-posta veya telefon alanindan birini doldurun.",
        "Provide either an email address or a phone number.",
      );
      fieldErrors.email = contactError;
      fieldErrors.phone = contactError;
    } else if (email && !isValidEmail(email)) {
      fieldErrors.email = translate(
        input.locale,
        "Gecerli bir e-posta adresi girin.",
        "Enter a valid email address.",
      );
    }
  } else if (!email) {
    fieldErrors.email = translate(
      input.locale,
      "E-posta alani zorunludur.",
      "Email is required.",
    );
  } else if (!isValidEmail(email)) {
    fieldErrors.email = translate(
      input.locale,
      "Gecerli bir e-posta adresi girin.",
      "Enter a valid email address.",
    );
  }

  if (!isNewsletterFlow) {
    if (!fullName) {
      fieldErrors.fullName = translate(
        input.locale,
        "Isim soyisim alani zorunludur.",
        "Full name is required.",
      );
    } else if (fullName.length < 2) {
      fieldErrors.fullName = translate(
        input.locale,
        "Isim soyisim en az 2 karakter olmali.",
        "Full name must be at least 2 characters.",
      );
    }
  }

  if (CAPTCHA_ENABLED && !input.captchaToken) {
    fieldErrors.captcha = translate(
      input.locale,
      "Guvenlik dogrulamasi gereklidir.",
      "Security verification is required.",
    );
  }

  return {
    isValid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
  };
}

export async function submitLeadSubmission(
  input: SubmitLeadInput,
): Promise<SubmitLeadResult> {
  if (input.honeypot && input.honeypot.trim().length > 0) {
    return {
      ok: true,
      ignoredAsSpam: true,
    };
  }

  const validation = validateLeadInput(input);
  if (!validation.isValid) {
    return {
      ok: false,
      fieldErrors: validation.fieldErrors,
    };
  }

  const supabase = getSupabaseBrowserClient();
  const normalizedEmail = trimOrUndefined(input.email);
  const normalizedPhone = normalizePhoneForValidation(input.phone);
  const payload = {
    source: input.source,
    status: "new",
    locale: input.locale,
    program_id: input.programId ?? null,
    full_name: trimOrUndefined(input.fullName) ?? null,
    email: normalizedEmail ?? null,
    phone: normalizedPhone ?? null,
    message: trimOrUndefined(input.message) ?? null,
    metadata: {
      ...(input.metadata ?? {}),
      captcha_enabled: CAPTCHA_ENABLED,
      captcha_provider: "placeholder",
    },
    consent_marketing: Boolean(input.consentMarketing),
    submitted_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("lead_submissions").insert(payload);
  if (error) {
    return {
      ok: false,
      errorMessage:
        "Su an gonderim yapilamadi. Lutfen tekrar deneyin veya e-posta ile ulasin.",
    };
  }

  return { ok: true };
}
