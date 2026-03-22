import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { Instagram, Mail } from "lucide-react";
import { postPublic, type LayoutDTO } from "../lib/public-api";

interface FooterProps {
  layout?: LayoutDTO | null;
}

export function Footer({ layout }: FooterProps) {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const footerLinks =
    layout?.footerNavigation?.length
      ? layout.footerNavigation.map((item) => ({
          label: item.label,
          href: item.url,
        }))
      : [
          { label: "Deneyimler", href: "/deneyimler" },
          { label: "Arsiv", href: "/arsiv" },
          { label: "Jurnal", href: "/jurnal" },
          { label: "Hakkinda", href: "/hakkinda" },
        ];

  const legalLinks =
    layout?.legalLinks?.length
      ? layout.legalLinks.map((item) => ({
          label: item.title,
          href: `/${item.slug}`,
        }))
      : [
          { label: "Gizlilik Politikasi", href: "/gizlilik" },
          { label: "Kullanim Sartlari", href: "/sartlar" },
        ];

  const onSubmitNewsletter = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNewsletterStatus("loading");

    try {
      await postPublic("leads/newsletter", {
        email: newsletterEmail,
        consent: true,
        sourceUrl: window.location.pathname,
      });

      setNewsletterStatus("success");
      setNewsletterEmail("");
    } catch {
      setNewsletterStatus("error");
    }
  };

  return (
    <footer className="bg-primary text-primary-foreground py-16 lg:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          <div className="lg:col-span-1">
            <h3 className="text-2xl lg:text-3xl font-serif mb-4">
              {layout?.brandName || "ANAKORA"}
            </h3>
            <p className="text-sm text-primary-foreground/80 leading-relaxed max-w-xs">
              Biz tur/kamp/tatil satmiyoruz, birlikte yasanacak bir deneyim
              sunuyoruz.
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-4 text-sm tracking-wide uppercase">
              Kesfet
            </h4>
            <nav className="flex flex-col gap-3">
              {footerLinks.map((item) => (
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
              Iletisim
            </h4>
            <div className="flex flex-col gap-3">
              <a
                href={`mailto:${layout?.contact?.email || "hello@anakora.com"}`}
                className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors flex items-center gap-2"
              >
                <Mail size={16} />
                {layout?.contact?.email || "hello@anakora.com"}
              </a>
              <a
                href={layout?.contact?.instagramUrl || "https://instagram.com/anakora"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors flex items-center gap-2"
              >
                <Instagram size={16} />
                @anakora
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-4 text-sm tracking-wide uppercase">
              Bulten
            </h4>
            <p className="text-sm text-primary-foreground/80 mb-4">
              Yeni deneyimlerden haberdar ol
            </p>
            <form className="flex flex-col gap-2" onSubmit={onSubmitNewsletter}>
              <input
                type="email"
                value={newsletterEmail}
                onChange={(event) => {
                  setNewsletterEmail(event.target.value);
                  setNewsletterStatus("idle");
                }}
                required
                placeholder="E-posta adresin"
                className="px-4 py-2.5 bg-primary-foreground/10 border border-primary-foreground/20 rounded-sm text-sm placeholder:text-primary-foreground/50 focus:outline-none focus:border-primary-foreground/40 transition-colors"
              />
              <button
                type="submit"
                disabled={newsletterStatus === "loading"}
                className="px-4 py-2.5 bg-primary-foreground text-primary rounded-sm text-sm font-medium hover:bg-primary-foreground/90 transition-colors disabled:opacity-70"
              >
                {newsletterStatus === "loading" ? "Gonderiliyor..." : "Abone Ol"}
              </button>
            </form>
            {newsletterStatus === "success" && (
              <p className="text-xs mt-2 text-primary-foreground/80">Basariyla kaydedildi.</p>
            )}
            {newsletterStatus === "error" && (
              <p className="text-xs mt-2 text-primary-foreground/80">Bir hata olustu.</p>
            )}
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/20 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-primary-foreground/60">
          <p>{layout?.footerCopyright || "© 2026 ANAKORA. Tum haklari saklidir."}</p>
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


