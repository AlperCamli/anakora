import { motion } from "motion/react";
import { useMemo, useState, useEffect } from "react";
import { getPublic, resolveMediaUrl } from "../lib/public-api";

type ArchiveDTO = {
  header?: { title?: string; description?: string };
  years: string[];
  groups: Array<{
    year: string;
    items: Array<{
      title: string;
      slug: string;
      location: string;
      date: string;
      participants?: number | null;
      description?: string | null;
      image?: { url: string } | null;
    }>;
  }>;
  stats: Array<{ value: string; label: string }>;
  cta?: { title?: string; description?: string; primaryButton?: { url: string; label: string } };
};

export function ArchivePage() {
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [data, setData] = useState<ArchiveDTO | null>(null);

  useEffect(() => {
    let mounted = true;

    getPublic<ArchiveDTO>("archive")
      .then((payload) => {
        if (!mounted) return;
        setData(payload);
        setSelectedYear(payload.years?.[0] || "");
      })
      .catch(() => {
        // Keep page stable on API failure.
      });

    return () => {
      mounted = false;
    };
  }, []);

  const years = data?.years || [];
  const selectedItems = useMemo(() => {
    const group = (data?.groups || []).find((item) => item.year === selectedYear);
    return group?.items || [];
  }, [data?.groups, selectedYear]);

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
            <h1 className="text-4xl lg:text-6xl font-serif mb-6">{data?.header?.title || "Arsiv"}</h1>
            <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed">
              {data?.header?.description ||
                "Birlikte yasadigimiz anlarin gorsel hafizasi."}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-8 border-b border-border sticky top-20 lg:top-24 bg-background/95 backdrop-blur-md z-30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center gap-4">
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
                {year}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {selectedItems.map((item, index) => (
              <motion.article
                key={`${item.slug}-${index}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: index * 0.1 }}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center ${
                  index % 2 === 1 ? "lg:direction-rtl" : ""
                }`}
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-muted">
                  <img
                    src={resolveMediaUrl(item.image as any) || ""}
                    alt={item.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                  {!!item.participants && (
                    <div className="absolute top-4 right-4 px-4 py-2 bg-background/90 backdrop-blur-sm rounded-full text-sm font-medium">
                      {item.participants} katilimci
                    </div>
                  )}
                </div>

                <div className={index % 2 === 1 ? "lg:direction-ltr" : ""}>
                  <p className="text-sm text-muted-foreground mb-2 tracking-wide">
                    {item.date} • {item.location}
                  </p>
                  <h2 className="text-3xl lg:text-4xl font-serif mb-4 text-foreground">
                    {item.title}
                  </h2>
                  <p className="text-lg text-foreground/80 leading-relaxed mb-6">
                    {item.description}
                  </p>
                  <div className="h-px w-24 bg-secondary" />
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto text-center">
            {(data?.stats || []).map((item, index) => (
              <motion.div
                key={`${item.label}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <p className="text-4xl lg:text-5xl font-serif mb-2">{item.value}</p>
                <p className="text-sm opacity-90">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-5xl font-serif mb-6">
            {data?.cta?.title || "Bir Sonraki Hikayeye Dahil Ol"}
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            {data?.cta?.description || "2026 takvimimiz acildi."}
          </p>
          <a
            href={data?.cta?.primaryButton?.url || "/deneyimler"}
            className="inline-flex px-8 py-4 bg-primary text-primary-foreground rounded-sm hover:bg-accent transition-all duration-300 text-base font-medium tracking-wide"
          >
            {data?.cta?.primaryButton?.label || "Yaklasan Programlar"}
          </a>
        </div>
      </section>
    </div>
  );
}
