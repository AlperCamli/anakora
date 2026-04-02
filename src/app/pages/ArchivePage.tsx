import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Link } from "react-router";
import { ArrowRight, Calendar, MapPin, Users } from "lucide-react";
import { getArchive, type ArchiveDTO } from "../../server/data";
import { useSiteData } from "../context/SiteDataContext";
import { formatDateRange } from "../lib/formatters";

export function ArchivePage() {
  const { locale } = useSiteData();
  const [archive, setArchive] = useState<ArchiveDTO | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const data = await getArchive(locale);
        if (!isMounted) {
          return;
        }
        setArchive(data);
        if (data.years[0]) {
          setSelectedYear(String(data.years[0].year));
        }
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : locale === "en"
              ? "Archive could not be loaded."
              : "Arsiv verisi yuklenemedi.",
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

  const years = useMemo(
    () => archive?.years.map((year) => String(year.year)) ?? [],
    [archive?.years],
  );

  const yearCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const year of archive?.years ?? []) {
      counts.set(String(year.year), year.programs.length);
    }
    return counts;
  }, [archive?.years]);

  const selectedItems = useMemo(() => {
    return (
      archive?.years.find((year) => String(year.year) === selectedYear)?.programs ?? []
    );
  }, [archive?.years, selectedYear]);

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
              {locale === "en" ? "Archive" : "Arsiv"}
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed">
              {locale === "en"
                ? "A visual memory of past ANAKORA gatherings."
                : "Birlikte yasadigimiz anlarin gorsel hafizasi."}
            </p>
          </motion.div>
        </div>
      </section>

      {!loading && years.length > 0 && (
        <section className="py-8 border-b border-border sticky top-20 lg:top-24 bg-background/95 backdrop-blur-md z-30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center gap-4 overflow-x-auto pb-2">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-6 py-2 rounded-full text-base font-medium transition-all duration-300 ${
                    selectedYear === year
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {year} ({yearCounts.get(year) ?? 0})
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {loading && (
            <p className="rounded-sm border border-border px-4 py-3 text-sm text-muted-foreground">
              {locale === "en" ? "Loading archive..." : "Arsiv yukleniyor..."}
            </p>
          )}
          {error && (
            <p className="rounded-sm border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}
          {!loading && !error && selectedItems.length === 0 && (
            <p className="rounded-sm border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
              {locale === "en"
                ? "No archive entries yet."
                : "Arsivde henuz gosterilecek deneyim yok."}
            </p>
          )}

          <div className="space-y-16">
            {selectedItems.map((item, index) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: index * 0.05 }}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center ${
                  index % 2 === 1 ? "lg:direction-rtl" : ""
                }`}
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-muted">
                  <img
                    src={
                      item.coverImage?.url ??
                      "https://images.unsplash.com/photo-1567463330419-d65c673554c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
                    }
                    alt={item.coverImage?.alt ?? item.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                  {item.capacity != null && (
                    <div className="absolute top-4 right-4 px-4 py-2 bg-background/90 backdrop-blur-sm rounded-full text-sm font-medium">
                      {item.capacity} {locale === "en" ? "participants" : "katilimci"}
                    </div>
                  )}
                </div>

                <div className={index % 2 === 1 ? "lg:direction-ltr" : ""}>
                  <div className="mb-4 space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2 tracking-wide">
                      <Calendar size={16} className="text-secondary" />
                      <span>{formatDateRange(item.startsAt, item.endsAt, locale)}</span>
                    </p>
                    <p className="flex items-center gap-2 tracking-wide">
                      <MapPin size={16} className="text-secondary" />
                      <span>{[item.locationName, item.city].filter(Boolean).join(", ")}</span>
                    </p>
                    <p className="flex items-center gap-2 tracking-wide">
                      <Users size={16} className="text-secondary" />
                      <span>
                        {item.capacity != null
                          ? locale === "en"
                            ? `Capacity context: ${item.capacity} participants`
                            : `Kapasite baglami: ${item.capacity} katilimci`
                          : locale === "en"
                            ? "Participant capacity not specified"
                            : "Katilimci kapasitesi belirtilmedi"}
                      </span>
                    </p>
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-serif mb-4 text-foreground">
                    {item.title}
                  </h2>
                  {item.recapMarkdown ? (
                    <p className="text-lg text-foreground/80 leading-relaxed mb-6">
                      {item.recapMarkdown}
                    </p>
                  ) : item.summary ? (
                    <p className="text-lg text-foreground/80 leading-relaxed mb-6">
                      {item.summary}
                    </p>
                  ) : null}
                  {item.highlights.length > 0 && (
                    <ul className="mb-6 space-y-2">
                      {item.highlights.slice(0, 4).map((highlight, highlightIndex) => (
                        <li
                          key={`${highlight}-${highlightIndex}`}
                          className="text-sm text-foreground/80"
                        >
                          - {highlight}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="h-px w-24 bg-secondary" />
                    <Link
                      to={`/deneyimler/${item.slug}`}
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-accent transition-colors"
                    >
                      {locale === "en" ? "Read Full Program Story" : "Tum Program Hikayesini Oku"}
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto text-center">
            <div>
              <p className="text-4xl lg:text-5xl font-serif mb-2">
                {archive?.totalPrograms ?? 0}
              </p>
              <p className="text-sm opacity-90">
                {locale === "en" ? "Completed Programs" : "Gerceklesen Deneyim"}
              </p>
            </div>
            <div>
              <p className="text-4xl lg:text-5xl font-serif mb-2">
                {archive?.years.length ?? 0}
              </p>
              <p className="text-sm opacity-90">{locale === "en" ? "Years" : "Yil"}</p>
            </div>
            <div>
              <p className="text-4xl lg:text-5xl font-serif mb-2">
                {archive?.years.flatMap((year) => year.programs).length ?? 0}
              </p>
              <p className="text-sm opacity-90">
                {locale === "en" ? "Archive Entries" : "Arsiv Girisi"}
              </p>
            </div>
            <div>
              <p className="text-4xl lg:text-5xl font-serif mb-2">ANAKORA</p>
              <p className="text-sm opacity-90">
                {locale === "en" ? "Community Journey" : "Topluluk Yolculugu"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-5xl font-serif mb-6">
            {locale === "en"
              ? "Join the Next Story"
              : "Bir Sonraki Hikayeye Dahil Ol"}
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            {locale === "en"
              ? "Explore upcoming experiences."
              : "Yaklasan deneyimleri kesfedin."}
          </p>
          <Link
            to="/deneyimler"
            className="inline-flex px-8 py-4 bg-primary text-primary-foreground rounded-sm hover:bg-accent transition-all duration-300 text-base font-medium tracking-wide"
          >
            {locale === "en" ? "Upcoming Programs" : "Yaklasan Programlar"}
          </Link>
        </div>
      </section>
    </div>
  );
}
