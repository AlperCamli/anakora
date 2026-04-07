import { useState } from "react";
import { Link } from "react-router";
import { Instagram, Mail } from "lucide-react";
import { useSiteData } from "../context/SiteDataContext";
import { submitLeadSubmission } from "../lib/lead-submissions";
import { ClearableInput } from "./ClearableField";
import { normalizeInstagramUrl, toInstagramHandleLabel } from "../../lib/instagram";

export function Footer() {
  const { locale, layout } = useSiteData();
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const instagramUrl = normalizeInstagramUrl(layout?.instagramUrl);
  const instagramLabel = toInstagramHandleLabel(layout?.instagramUrl) ?? "@instagram";

  const links =
    layout?.navigation?.length && layout.navigation.length > 0
      ? layout.navigation
      : [
          {
            label: locale === "en" ? "Experiences" : "Deneyimler",
            href: "/deneyimler",
          },
          { label: locale === "en" ? "Archive" : "Arsiv", href: "/arsiv" },
          { label: locale === "en" ? "Journal" : "Jurnal", href: "/jurnal" },
          { label: locale === "en" ? "About" : "Hakkinda", href: "/hakkinda" },
        ];

  const legalLinks =
    layout?.legalLinks?.length && layout.legalLinks.length > 0
      ? layout.legalLinks
      : [
          {
            label: locale === "en" ? "Privacy Policy" : "Gizlilik Politikasi",
            href: "/gizlilik",
          },
          {
            label: locale === "en" ? "Terms of Use" : "Kullanim Sartlari",
            href: "/sartlar",
          },
        ];

  async function handleNewsletterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setIsSubmitting(true);

    const result = await submitLeadSubmission({
      source: "newsletter",
      locale,
      email,
      honeypot,
      consentMarketing: true,
      metadata: { surface: "footer_newsletter" },
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setFormError(
        result.fieldErrors?.email ??
          result.errorMessage ??
          "Abonelik su an tamamlanamadi.",
      );
      return;
    }

    setEmail("");
    setHoneypot("");
    setFormSuccess(
      locale === "en"
        ? "Thanks, you're subscribed."
        : "Tesekkurler, aboneliginiz alindi.",
    );
  }

  return (
    <footer id="site-footer" className="bg-primary text-primary-foreground py-16 lg:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          <div className="lg:col-span-1">
            <h3 className="text-2xl lg:text-3xl font-serif mb-4">
              {layout?.logoText ?? layout?.siteName ?? "ANAKORA"}
            </h3>
            <p className="text-sm text-primary-foreground/80 leading-relaxed max-w-xs">
              {layout?.tagline ??
                (locale === "en"
                  ? "We curate experiences to be lived together."
                  : "Birlikte yasanacak deneyimler sunuyoruz.")}
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-4 text-sm tracking-wide uppercase">
              {locale === "en" ? "Explore" : "Kesfet"}
            </h4>
            <nav className="flex flex-col gap-3">
              {links.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h4 className="font-medium mb-4 text-sm tracking-wide uppercase">
              {locale === "en" ? "Contact" : "Iletisim"}
            </h4>
            <div className="flex flex-col gap-3">
              {layout?.contactEmail && (
                <a
                  href={`mailto:${layout.contactEmail}`}
                  className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors flex items-center gap-2"
                >
                  <Mail size={16} />
                  {layout.contactEmail}
                </a>
              )}
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors flex items-center gap-2"
                >
                  <Instagram size={16} />
                  {instagramLabel}
                </a>
              )}
            </div>
          </div>

          {layout?.footerNewsletterEnabled !== false && (
            <div>
              <h4 className="font-medium mb-4 text-sm tracking-wide uppercase">
                {locale === "en" ? "Newsletter" : "Bulten"}
              </h4>
              <p className="text-sm text-primary-foreground/80 mb-4">
                {locale === "en"
                  ? "Get updates about new experiences."
                  : "Yeni deneyimlerden haberdar ol."}
              </p>
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col gap-2">
                <input
                  type="text"
                  value={honeypot}
                  onChange={(event) => setHoneypot(event.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden="true"
                />
                <ClearableInput
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder={
                    locale === "en"
                      ? "Email address for newsletter updates"
                      : "Bulten guncellemeleri icin e-posta adresi"
                  }
                  clearLabel={
                    locale === "en"
                      ? "Clear email address"
                      : "E-posta adresini temizle"
                  }
                  className="px-4 py-2.5 bg-primary-foreground/10 border border-primary-foreground/20 rounded-sm text-sm placeholder:text-primary-foreground/50 focus:outline-none focus:border-primary-foreground/40 transition-colors"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2.5 bg-primary-foreground text-primary rounded-sm text-sm font-medium hover:bg-primary-foreground/90 transition-colors disabled:opacity-70"
                >
                  {isSubmitting
                    ? locale === "en"
                      ? "Submitting..."
                      : "Gonderiliyor..."
                    : locale === "en"
                      ? "Subscribe"
                      : "Abone Ol"}
                </button>
                {formError && (
                  <p className="text-xs text-destructive-foreground bg-destructive/70 rounded-sm px-2 py-1 mt-1">
                    {formError}
                  </p>
                )}
                {formSuccess && (
                  <p className="text-xs text-primary bg-primary-foreground/90 rounded-sm px-2 py-1 mt-1">
                    {formSuccess}
                  </p>
                )}
              </form>
            </div>
          )}
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/20 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-primary-foreground/60">
          <p>
            {locale === "en"
              ? "(c) 2026 ANAKORA. All rights reserved."
              : "(c) 2026 ANAKORA. Tum haklari saklidir."}
          </p>
          <div className="flex gap-6">
            {legalLinks.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="hover:text-primary-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
