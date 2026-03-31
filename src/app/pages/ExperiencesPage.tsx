import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Filter } from "lucide-react";
import { ProgramCard } from "../components/ProgramCard";
import { useSiteData } from "../context/SiteDataContext";
import { submitLeadSubmission } from "../lib/lead-submissions";
import { toProgramCardViewModel } from "../lib/formatters";
import { getProgramsList, type ProgramCardDTO } from "../../server/data";

export function ExperiencesPage() {
  const { locale } = useSiteData();
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [programs, setPrograms] = useState<ProgramCardDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactHoneypot, setContactHoneypot] = useState("");
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const data = await getProgramsList(locale, {
          statuses: ["upcoming", "published"],
        });
        if (!isMounted) {
          return;
        }
        setPrograms(data);
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Program verileri alinamadi.",
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    run();
    return () => {
      isMounted = false;
    };
  }, [locale]);

  const filters = useMemo(() => {
    const base = [{ id: "all", label: locale === "en" ? "All" : "Tumu" }];
    const dynamic = Array.from(
      new Map(
        programs
          .flatMap((program) => program.categories)
          .map((category) => [category.slug, { id: category.slug, label: category.name }]),
      ).values(),
    );
    return [...base, ...dynamic];
  }, [locale, programs]);

  const filteredPrograms = useMemo(() => {
    if (activeFilter === "all") {
      return programs;
    }
    return programs.filter((program) =>
      program.categories.some((category) => category.slug === activeFilter),
    );
  }, [activeFilter, programs]);

  async function handleContactSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setContactError(null);
    setContactSuccess(null);
    setContactSubmitting(true);

    const result = await submitLeadSubmission({
      source: "general_contact",
      locale,
      fullName: contactName,
      email: contactEmail,
      phone: contactPhone,
      message: contactMessage,
      honeypot: contactHoneypot,
      metadata: {
        surface: "experiences_contact_section",
      },
    });

    setContactSubmitting(false);
    if (!result.ok) {
      setContactError(
        result.fieldErrors?.fullName ??
          result.fieldErrors?.email ??
          result.fieldErrors?.phone ??
          result.errorMessage ??
          (locale === "en"
            ? "Message could not be sent right now."
            : "Mesaj su an gonderilemedi."),
      );
      return;
    }

    setContactName("");
    setContactEmail("");
    setContactPhone("");
    setContactMessage("");
    setContactHoneypot("");
    setContactSuccess(
      locale === "en"
        ? "Thanks, we will contact you shortly."
        : "Tesekkurler, en kisa surede sizinle iletisime gececegiz.",
    );
  }

  return (
    <div className="pt-20 lg:pt-24 min-h-screen bg-background">
      <section className="py-16 lg:py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl lg:text-6xl font-serif mb-6">
              {locale === "en" ? "Experiences" : "Deneyimler"}
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed">
              {locale === "en"
                ? "Carefully curated, transformational nature experiences."
                : "Ozenle tasarlanmis, donusturucu doga deneyimleri."}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-8 border-b border-border sticky top-20 lg:top-24 bg-background/95 backdrop-blur-md z-30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
            <Filter size={20} className="text-muted-foreground flex-shrink-0" />
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  activeFilter === filter.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {loading && (
            <p className="mb-6 text-sm text-muted-foreground">
              {locale === "en" ? "Loading programs..." : "Programlar yukleniyor..."}
            </p>
          )}
          {error && (
            <p className="mb-6 text-sm text-destructive">
              {locale === "en"
                ? "Programs could not be loaded."
                : "Programlar su an yuklenemedi."}
            </p>
          )}
          {!loading && !error && (
            <div className="mb-6 text-sm text-muted-foreground">
              {filteredPrograms.length}{" "}
              {locale === "en" ? "programs found" : "program bulundu"}
            </div>
          )}

          {!loading && !error && filteredPrograms.length === 0 && (
            <div className="rounded-sm border border-border p-6 text-sm text-muted-foreground">
              {locale === "en"
                ? "No programs match this filter yet."
                : "Bu filtre icin henuz program bulunmuyor."}
            </div>
          )}

          {!loading && !error && filteredPrograms.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {filteredPrograms.map((program, index) => (
                <motion.div
                  key={program.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <ProgramCard {...toProgramCardViewModel(program, locale)} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl lg:text-4xl font-serif mb-4">
            {locale === "en"
              ? "Need help choosing your program?"
              : "Programlar hakkinda soru mu var?"}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            {locale === "en"
              ? "Send us a quick note and we will guide you."
              : "Kisa bir mesaj birakin, size en uygun deneyimi birlikte bulalim."}
          </p>

          <form
            onSubmit={handleContactSubmit}
            className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 text-left"
          >
            <input
              type="text"
              value={contactHoneypot}
              onChange={(event) => setContactHoneypot(event.target.value)}
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
            />
            <input
              type="text"
              value={contactName}
              onChange={(event) => setContactName(event.target.value)}
              placeholder={locale === "en" ? "Full name" : "Adiniz soyadiniz"}
              className="px-4 py-3 border border-border rounded-sm bg-background"
            />
            <input
              type="email"
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              placeholder={locale === "en" ? "Email (or phone)" : "E-posta (veya telefon)"}
              className="px-4 py-3 border border-border rounded-sm bg-background"
            />
            <input
              type="tel"
              value={contactPhone}
              onChange={(event) => setContactPhone(event.target.value)}
              placeholder={locale === "en" ? "Phone (or email)" : "Telefon (veya e-posta)"}
              className="px-4 py-3 border border-border rounded-sm bg-background"
            />
            <textarea
              value={contactMessage}
              onChange={(event) => setContactMessage(event.target.value)}
              placeholder={locale === "en" ? "Your message" : "Mesajiniz"}
              rows={4}
              className="sm:col-span-2 px-4 py-3 border border-border rounded-sm bg-background resize-none"
            />
            <button
              type="submit"
              disabled={contactSubmitting}
              className="sm:col-span-2 inline-flex justify-center px-8 py-3 bg-primary text-primary-foreground rounded-sm hover:bg-accent transition-all duration-300 text-base font-medium tracking-wide disabled:opacity-70"
            >
              {contactSubmitting
                ? locale === "en"
                  ? "Sending..."
                  : "Gonderiliyor..."
                : locale === "en"
                  ? "Send Message"
                  : "Mesaji Gonder"}
            </button>
            <p className="sm:col-span-2 text-xs text-muted-foreground">
              {locale === "en"
                ? "Full name and at least one contact method (email or phone) are required."
                : "Ad soyad ve en az bir iletisim bilgisi (e-posta veya telefon) zorunludur."}
            </p>
          </form>

          {contactError && (
            <p className="mt-3 text-sm text-destructive">{contactError}</p>
          )}
          {contactSuccess && (
            <p className="mt-3 text-sm text-primary">{contactSuccess}</p>
          )}
        </div>
      </section>
    </div>
  );
}
