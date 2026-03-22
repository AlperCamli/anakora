import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Filter } from "lucide-react";
import { ProgramCard } from "../components/ProgramCard";
import { getPublic, resolveMediaUrl } from "../lib/public-api";

type ExperiencesDTO = {
  header?: { title?: string; description?: string };
  contact?: { title?: string; description?: string; email?: string };
  filters: Array<{ id: string; label: string }>;
  items: Array<{
    slug: string;
    title: string;
    location: string;
    date: string;
    duration: string;
    category: string;
    categorySlug?: string;
    image?: { url: string } | null;
    spotsLeft?: number | null;
  }>;
};

export function ExperiencesPage() {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [data, setData] = useState<ExperiencesDTO | null>(null);

  useEffect(() => {
    let mounted = true;

    getPublic<ExperiencesDTO>("experiences", { pageSize: 50 })
      .then((payload) => {
        if (mounted) {
          setData(payload);
        }
      })
      .catch(() => {
        // Keep existing UI usable with empty state when backend is unavailable.
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filters = useMemo(() => {
    const fromApi = (data?.filters || []).map((filter) => ({
      id: filter.id,
      label: filter.label,
    }));

    if (!fromApi.length) {
      return [{ id: "all", label: "Tumu" }];
    }

    return [{ id: "all", label: "Tumu" }, ...fromApi];
  }, [data]);

  const programs = useMemo(() => {
    return (data?.items || []).map((item) => ({
      id: item.slug,
      title: item.title,
      location: item.location,
      date: item.date,
      duration: item.duration,
      category: item.category,
      filter: item.categorySlug || "",
      image: resolveMediaUrl(item.image as any) || "",
      spotsLeft: item.spotsLeft || undefined,
    }));
  }, [data]);

  const filteredPrograms =
    activeFilter === "all"
      ? programs
      : programs.filter((program) => program.filter === activeFilter);

  const headerTitle = data?.header?.title || "Deneyimler";
  const headerDescription =
    data?.header?.description ||
    "Her biri ozenle tasarlanmis, donusturucu doga deneyimleri.";

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
            <h1 className="text-4xl lg:text-6xl font-serif mb-6">{headerTitle}</h1>
            <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed">
              {headerDescription}
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
          <div className="mb-6 text-sm text-muted-foreground">
            {filteredPrograms.length} program bulundu
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filteredPrograms.map((program, index) => (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <ProgramCard {...program} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl lg:text-4xl font-serif mb-4">
            {data?.contact?.title || "Programlar Hakkinda Soru mu Var?"}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            {data?.contact?.description || "Size en uygun deneyimi bulmak icin buradayiz"}
          </p>
          <a
            href={`mailto:${data?.contact?.email || "hello@anakora.com"}`}
            className="inline-flex px-8 py-3 bg-primary text-primary-foreground rounded-sm hover:bg-accent transition-all duration-300 text-base font-medium tracking-wide"
          >
            Bize Ulasin
          </a>
        </div>
      </section>
    </div>
  );
}
