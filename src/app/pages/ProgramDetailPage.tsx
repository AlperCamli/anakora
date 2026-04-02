import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import {
  Calendar,
  Check,
  ChevronDown,
  Clock,
  MapPin,
  Users,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import { useSiteData } from "../context/SiteDataContext";
import { formatDateRange, formatDuration, formatPrice } from "../lib/formatters";
import { submitLeadSubmission } from "../lib/lead-submissions";
import { getProgramDetailBySlug, type ProgramDetailDTO } from "../../server/data";

function toDisplayItinerary(itinerary: unknown[]) {
  return itinerary.map((entry, index) => {
    if (typeof entry === "string") {
      return {
        day: entry,
        activities: [] as string[],
      };
    }
    if (entry && typeof entry === "object") {
      const value = entry as Record<string, unknown>;
      return {
        day:
          (typeof value.day === "string" && value.day) ||
          (typeof value.title === "string" && value.title) ||
          `${index + 1}. Gun`,
        activities: Array.isArray(value.activities)
          ? value.activities.filter((item): item is string => typeof item === "string")
          : [],
      };
    }
    return {
      day: `${index + 1}. Gun`,
      activities: [],
    };
  });
}

export function ProgramDetailPage() {
  const { slug } = useParams();
  const resolvedSlug = slug ?? "";
  const { locale, layout } = useSiteData();

  const [program, setProgram] = useState<ProgramDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function run() {
      if (!resolvedSlug) {
        setError("Program slug bulunamadi.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await getProgramDetailBySlug(resolvedSlug, locale);
        if (!isMounted) {
          return;
        }

        if (!data) {
          setError(locale === "en" ? "Program not found." : "Program bulunamadi.");
          setProgram(null);
          return;
        }

        setProgram(data);
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : locale === "en"
              ? "Program data could not be loaded."
              : "Program verisi yuklenemedi.",
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
  }, [locale, resolvedSlug]);

  const itinerary = useMemo(
    () => toDisplayItinerary(program?.itinerary ?? []),
    [program?.itinerary],
  );

  async function handleBookingSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!program) {
      return;
    }

    setSubmissionError(null);
    setSubmissionSuccess(null);
    setSubmitting(true);

    const result = await submitLeadSubmission({
      source: "program_booking",
      locale,
      programId: program.id,
      fullName,
      email,
      phone,
      message,
      honeypot,
      metadata: {
        surface: "program_detail_modal",
        booking_mode: program.bookingMode,
      },
    });

    setSubmitting(false);
    if (!result.ok) {
      setSubmissionError(
        result.fieldErrors?.fullName ??
          result.fieldErrors?.email ??
          result.errorMessage ??
          (locale === "en"
            ? "Booking request could not be sent."
            : "Basvuru su an gonderilemedi."),
      );
      return;
    }

    setFullName("");
    setEmail("");
    setPhone("");
    setMessage("");
    setHoneypot("");
    setSubmissionSuccess(
      locale === "en"
        ? "Thanks, we received your interest."
        : "Tesekkurler, basvurunuz alindi.",
    );
  }

  if (loading) {
    return (
      <div className="pt-20 lg:pt-24 min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-muted-foreground">
          {locale === "en" ? "Loading program..." : "Program yukleniyor..."}
        </div>
      </div>
    );
  }

  if (!program || error) {
    return (
      <div className="pt-20 lg:pt-24 min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <p className="text-destructive mb-6">
            {error ??
              (locale === "en" ? "Program not found." : "Program bulunamadi.")}
          </p>
          <Link
            to="/deneyimler"
            className="inline-flex px-6 py-3 bg-primary text-primary-foreground rounded-sm"
          >
            {locale === "en" ? "Back to Programs" : "Programlara Don"}
          </Link>
        </div>
      </div>
    );
  }

  const guide = program.guides[0] ?? null;
  const price = formatPrice(program.priceAmount, program.priceCurrency, locale);
  const dateLabel = formatDateRange(program.startsAt, program.endsAt, locale);
  const durationLabel = formatDuration(
    program.durationDays,
    program.durationNights,
    locale,
  );
  const categoryLabel = program.categories[0]?.name ?? "ANAKORA";
  const isCompleted = program.status === "completed";

  return (
    <div className="pt-20 lg:pt-24 min-h-screen bg-background">
      <section className="relative h-[50vh] lg:h-[70vh]">
        <img
          src={
            program.coverImage?.url ??
            "https://images.unsplash.com/photo-1567463330419-d65c673554c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
          }
          alt={program.coverImage?.alt ?? program.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-12 text-white">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <p className="text-xs lg:text-sm tracking-widest uppercase mb-3 opacity-90">
                {categoryLabel}
              </p>
              <h1 className="text-4xl lg:text-6xl font-serif mb-4">{program.title}</h1>
              {program.subtitle && (
                <p className="text-lg lg:text-xl opacity-90 max-w-2xl">
                  {program.subtitle}
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground py-4 lg:py-6 sticky top-20 lg:top-24 z-30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-wrap items-center gap-4 lg:gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Calendar size={18} />
                <span>{dateLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={18} />
                <span>{durationLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={18} />
                <span>{[program.locationName, program.city].filter(Boolean).join(", ")}</span>
              </div>
              {program.spotsLeft != null && (
                <div className="flex items-center gap-2">
                  <Users size={18} />
                  <span>
                    {program.spotsLeft}{" "}
                    {locale === "en" ? "spots left" : "yer kaldi"}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              {price && <span className="text-xl lg:text-2xl font-serif">{price}</span>}
              {!isCompleted ? (
                <button
                  onClick={() => setShowBookingForm(true)}
                  className="px-6 py-2.5 bg-primary-foreground text-primary rounded-sm font-medium hover:bg-primary-foreground/90 transition-all"
                >
                  {locale === "en"
                    ? program.bookingMode === "direct"
                      ? "Book Now"
                      : "Apply"
                    : program.bookingMode === "direct"
                      ? "Hemen Rezerve Et"
                      : "Basvuru Yap"}
                </button>
              ) : (
                <Link
                  to="/deneyimler"
                  className="px-6 py-2.5 border border-primary-foreground/40 rounded-sm text-sm font-medium hover:bg-primary-foreground/10 transition-all"
                >
                  {locale === "en" ? "See Upcoming Programs" : "Yaklasan Programlari Gor"}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
          <div className="lg:col-span-2 space-y-12">
            {(program.archiveRecapMarkdown || program.archiveHighlights.length > 0) && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-2xl lg:text-4xl font-serif mb-6">
                  {locale === "en" ? "Event Recap" : "Etkinlik Ozeti"}
                </h2>
                {program.archiveRecapMarkdown && (
                  <div className="prose prose-lg max-w-none text-foreground/80 leading-relaxed space-y-4 mb-6">
                    {program.archiveRecapMarkdown
                      .split("\n\n")
                      .map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                  </div>
                )}
                {program.archiveHighlights.length > 0 && (
                  <ul className="space-y-2">
                    {program.archiveHighlights.map((item, index) => (
                      <li key={`${item}-${index}`} className="flex items-start gap-2">
                        <Check size={18} className="text-secondary mt-1 flex-shrink-0" />
                        <span className="text-foreground/80">{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.section>
            )}

            {program.storyMarkdown && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-2xl lg:text-4xl font-serif mb-6">
                  {locale === "en" ? "Story" : "Deneyimin Hikayesi"}
                </h2>
                <div className="prose prose-lg max-w-none text-foreground/80 leading-relaxed space-y-4">
                  {program.storyMarkdown.split("\n\n").map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </motion.section>
            )}

            {program.whoIsItFor.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-2xl lg:text-4xl font-serif mb-6">
                  {locale === "en" ? "Who is this for?" : "Bu deneyim kimin icin?"}
                </h2>
                <ul className="space-y-3">
                  {program.whoIsItFor.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check size={20} className="text-secondary mt-1 flex-shrink-0" />
                      <span className="text-foreground/80">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.section>
            )}

            {itinerary.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-2xl lg:text-4xl font-serif mb-6">
                  {locale === "en" ? "Program Flow" : "Program Akisi"}
                </h2>
                <div className="space-y-6">
                  {itinerary.map((day, index) => (
                    <div key={index} className="border-l-2 border-secondary pl-6 pb-6">
                      <h3 className="text-xl font-serif mb-3 text-primary">{day.day}</h3>
                      {day.activities.length > 0 && (
                        <ul className="space-y-2">
                          {day.activities.map((activity, activityIndex) => (
                            <li
                              key={activityIndex}
                              className="text-foreground/80 flex items-start gap-2"
                            >
                              <span className="text-secondary mt-1.5">-</span>
                              <span>{activity}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {guide && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-muted/50 rounded-sm p-6 lg:p-8"
              >
                <h2 className="text-2xl lg:text-4xl font-serif mb-6">
                  {locale === "en" ? "Guide" : "Rehber"}
                </h2>
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex-shrink-0">
                    {guide.avatar?.url && (
                      <img
                        src={guide.avatar.url}
                        alt={guide.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-serif mb-1">{guide.name}</h3>
                    {guide.title && (
                      <p className="text-sm text-muted-foreground mb-3">{guide.title}</p>
                    )}
                  </div>
                </div>
              </motion.section>
            )}

            {program.faqs.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-2xl lg:text-4xl font-serif mb-6">
                  {locale === "en" ? "Frequently Asked Questions" : "Sikca Sorulan Sorular"}
                </h2>
                <Accordion type="single" collapsible className="space-y-4">
                  {program.faqs.map((faq) => (
                    <AccordionItem
                      key={faq.id}
                      value={faq.id}
                      className="border border-border rounded-sm px-6"
                    >
                      <AccordionTrigger className="text-left hover:no-underline py-4">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-foreground/80 pb-4">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.section>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-40 space-y-6">
              <div className="bg-card border border-border rounded-sm p-6">
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-2">
                    {locale === "en" ? "Price" : "Fiyat"}
                  </p>
                  <p className="text-3xl font-serif text-primary">
                    {price ?? (locale === "en" ? "On request" : "Talep uzerine")}
                  </p>
                </div>

                {!isCompleted && program.spotsLeft != null && program.spotsLeft <= 3 && (
                  <div className="mb-6 px-4 py-3 bg-accent/10 border border-accent rounded-sm">
                    <p className="text-sm font-medium text-accent-foreground">
                      {locale === "en"
                        ? `Only ${program.spotsLeft} spots left`
                        : `Son ${program.spotsLeft} yer kaldi`}
                    </p>
                  </div>
                )}

                {!isCompleted ? (
                  <>
                    <button
                      onClick={() => setShowBookingForm(true)}
                      className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-sm font-medium hover:bg-accent transition-all mb-4"
                    >
                      {locale === "en" ? "Send Interest" : "Ilgi Formu Gonder"}
                    </button>
                    <p className="text-xs text-muted-foreground mt-4 text-center">
                      {locale === "en"
                        ? "No immediate payment required."
                        : "Hemen odeme yapmaniza gerek yok."}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="mb-4 rounded-sm border border-border bg-muted/40 px-4 py-3 text-sm text-foreground/80">
                      {locale === "en"
                        ? "This experience is completed. You can review recap details below."
                        : "Bu deneyim tamamlandi. Asagida etkinlik ozeti detaylarini gorebilirsiniz."}
                    </div>
                    <Link
                      to="/deneyimler"
                      className="inline-flex w-full justify-center rounded-sm border border-primary px-6 py-3 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                    >
                      {locale === "en" ? "Explore Upcoming Programs" : "Yaklasan Programlari Kesfet"}
                    </Link>
                  </>
                )}
              </div>

              <div className="bg-card border border-border rounded-sm p-6">
                {program.includedItems.length > 0 && (
                  <>
                    <h3 className="font-serif text-lg mb-4">
                      {locale === "en" ? "Included" : "Fiyata Dahil"}
                    </h3>
                    <ul className="space-y-2 mb-6">
                      {program.includedItems.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Check
                            size={16}
                            className="text-secondary mt-0.5 flex-shrink-0"
                          />
                          <span className="text-foreground/80">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {program.excludedItems.length > 0 && (
                  <>
                    <h3 className="font-serif text-lg mb-4">
                      {locale === "en" ? "Not Included" : "Fiyata Dahil Degil"}
                    </h3>
                    <ul className="space-y-2">
                      {program.excludedItems.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <X
                            size={16}
                            className="text-muted-foreground mt-0.5 flex-shrink-0"
                          />
                          <span className="text-foreground/80">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              <div className="bg-muted/50 rounded-sm p-6">
                <h3 className="font-serif text-lg mb-3">
                  {locale === "en" ? "Need help?" : "Sorulariniz mi var?"}
                </h3>
                <p className="text-sm text-foreground/80 mb-4">
                  {locale === "en"
                    ? "We are here to help."
                    : "Size yardimci olmaktan mutluluk duyariz."}
                </p>
                {layout?.contactEmail && (
                  <a
                    href={`mailto:${layout.contactEmail}`}
                    className="text-sm text-primary hover:text-accent transition-colors font-medium"
                  >
                    {layout.contactEmail}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {!isCompleted && showBookingForm && (
        <div
          className="fixed inset-0 bg-foreground/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowBookingForm(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background rounded-sm p-8 max-w-md w-full"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-2xl font-serif mb-4">
              {locale === "en" ? "Booking Interest" : "Rezervasyon Ilgi Formu"}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {locale === "en"
                ? "Share your details and we will get back to you shortly."
                : "Bilgilerinizi birakin, size en kisa surede donelim."}
            </p>
            <form className="space-y-4" onSubmit={handleBookingSubmit}>
              <input
                type="text"
                value={honeypot}
                onChange={(event) => setHoneypot(event.target.value)}
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder={locale === "en" ? "Full name" : "Adiniz soyadiniz"}
                className="w-full px-4 py-3 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={locale === "en" ? "Email" : "E-posta"}
                className="w-full px-4 py-3 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder={locale === "en" ? "Phone" : "Telefon"}
                className="w-full px-4 py-3 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={locale === "en" ? "Notes (optional)" : "Not (opsiyonel)"}
                rows={3}
                className="w-full px-4 py-3 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
              {submissionError && (
                <p className="text-sm text-destructive">{submissionError}</p>
              )}
              {submissionSuccess && (
                <p className="text-sm text-primary">{submissionSuccess}</p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowBookingForm(false)}
                  className="flex-1 px-6 py-3 border border-border rounded-sm hover:bg-muted transition-all"
                >
                  {locale === "en" ? "Cancel" : "Iptal"}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-sm hover:bg-accent transition-all disabled:opacity-70"
                >
                  {submitting
                    ? locale === "en"
                      ? "Sending..."
                      : "Gonderiliyor..."
                    : locale === "en"
                      ? "Send"
                      : "Gonder"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <section className="py-16 lg:py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-5xl font-serif mb-8 text-center">
            {locale === "en" ? "Other Experiences" : "Diger Deneyimler"}
          </h2>
          <div className="flex justify-center">
            <Link
              to="/deneyimler"
              className="inline-flex items-center gap-2 text-primary hover:text-accent font-medium transition-colors"
            >
              {locale === "en" ? "See All Programs" : "Tum Programlari Gor"}
              <ChevronDown size={20} className="rotate-[-90deg]" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
