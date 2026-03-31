import { getSupabaseBrowserClient } from "../../lib/supabase/browser-client";
import type { Locale } from "../../server/data";

const CAPTCHA_ENABLED = import.meta.env.VITE_ENABLE_CAPTCHA === "true";

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

function trimOrUndefined(value?: string): string | undefined {
  const next = value?.trim();
  return next ? next : undefined;
}

function validateLeadInput(input: SubmitLeadInput): ValidationResult {
  const fieldErrors: Record<string, string> = {};
  const email = trimOrUndefined(input.email);
  const phone = trimOrUndefined(input.phone);
  const isNewsletterFlow =
    input.source === "newsletter" || input.source === "journal_newsletter";
  const isGeneralContact = input.source === "general_contact";

  if (isGeneralContact) {
    if (!email && !phone) {
      const message = "Iletisim icin e-posta veya telefon alanindan birini doldurun.";
      fieldErrors.email = message;
      fieldErrors.phone = message;
    } else if (email && !isValidEmail(email)) {
      fieldErrors.email = "Gecerli bir e-posta adresi girin.";
    }
  } else if (!email) {
    fieldErrors.email = "E-posta alani zorunludur.";
  } else if (!isValidEmail(email)) {
    fieldErrors.email = "Gecerli bir e-posta adresi girin.";
  }

  if (!isNewsletterFlow) {
    const name = input.fullName?.trim();
    if (!name) {
      fieldErrors.fullName = "Isim soyisim alani zorunludur.";
    } else if (name.length < 2) {
      fieldErrors.fullName = "Isim soyisim en az 2 karakter olmali.";
    }
  }

  if (CAPTCHA_ENABLED && !input.captchaToken) {
    fieldErrors.captcha = "Guvenlik dogrulamasi gereklidir.";
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
  const payload = {
    source: input.source,
    status: "new",
    locale: input.locale,
    program_id: input.programId ?? null,
    full_name: trimOrUndefined(input.fullName) ?? null,
    email: normalizedEmail ?? null,
    phone: trimOrUndefined(input.phone) ?? null,
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
