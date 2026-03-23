import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Compass, Heart, Leaf, Users } from "lucide-react";
import { motion } from "motion/react";
import { ExperienceCard } from "../components/ExperienceCard";
import { ProgramCard } from "../components/ProgramCard";
import { TestimonialCard } from "../components/TestimonialCard";
import { useSiteData } from "../context/SiteDataContext";
import {
  getArchive,
  getHomepage,
  getProgramsList,
  type ArchiveDTO,
  type HomePageDTO,
  type ProgramCardDTO,
} from "../../server/data";
import {
  toExperienceCardViewModel,
  toJournalPreviewViewModel,
  toProgramCardViewModel,
  toTestimonialCardViewModel,
} from "../lib/formatters";

type WhyItem = {
  title: string;
  description: string;
};

const FALLBACK_WHY_ITEMS: WhyItem[] = [
  {
    title: "Kuratorlu Deneyim",
    description: "Her program ozenle tasarlanir ve donusume alan acar.",
  },
  {
    title: "Topluluk",
    description: "Anlamli baglar kuran topluluk deneyimi.",
  },
  {
    title: "Dogayla Bag",
    description: "Doganin ritmi ile yeniden bulusma.",
  },
  {
    title: "Ic Yolculuk",
    description: "Ritueller ve paylasimla kendine donus.",
  },
];

const WHY_ICONS = [Heart, Users, Leaf, Compass];

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asLink(value: unknown): { label: string; href: string } | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const obj = value as Record<string, unknown>;
  const label = asString(obj.label);
  const href = asString(obj.href);
  if (!label || !href) {
    return null;
  }
  return { label, href };
}

function asWhyItems(value: unknown): WhyItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const obj = item as Record<string, unknown>;
      const title = asString(obj.title);
      const description = asString(obj.description);
      if (!title || !description) {
        return null;
      }
      return { title, description };
    })
    .filter((item): item is WhyItem => Boolean(item));
}

export function HomePage() {
  const { locale } = useSiteData();
  const [homeData, setHomeData] = useState<HomePageDTO | null>(null);
  const [archiveData, setArchiveData] = useState<ArchiveDTO | null>(null);
  const [programs, setPrograms] = useState<ProgramCardDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const [home, archive, livePrograms] = await Promise.all([
          getHomepage(locale),
          getArchive(locale),
          getProgramsList(locale, { statuses: ["upcoming", "published"] }),
        ]);

        if (!isMounted) {
          return;
        }
        setHomeData(home);
        setArchiveData(archive);
        setPrograms(livePrograms);
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Anasayfa verisi yuklenemedi.",
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

  const sectionMap = useMemo(() => {
    return new Map(homeData?.sections.map((section) => [section.key, section]) ?? []);
  }, [homeData?.sections]);

  const heroSection = sectionMap.get("hero");
  const brandSection = sectionMap.get("brand_manifesto");
  const experienceSection = sectionMap.get("experience_categories");
  const upcomingSection = sectionMap.get("upcoming_programs");
  const whySection = sectionMap.get("why_anakora");
  const archiveSection = sectionMap.get("archive_preview");
  const testimonialsSection = sectionMap.get("testimonials");
  const journalSection = sectionMap.get("journal_preview");
  const finalCtaSection = sectionMap.get("final_cta");

  const heroPayload = asObject(heroSection?.payload);
  const primaryHeroCta =
    asLink(heroPayload.primaryCta) ?? {
      label: locale === "en" ? "Explore Programs" : "Programlari Kesfet",
      href: "/deneyimler",
    };
  const secondaryHeroCta =
    asLink(heroPayload.secondaryCta) ?? {
      label: locale === "en" ? "Read Our Story" : "Hikayemizi Oku",
      href: "/hakkinda",
    };

  const featuredPrograms =
    homeData?.featuredPrograms.length && homeData.featuredPrograms.length > 0
      ? homeData.featuredPrograms
      : programs.slice(0, 3);

  const upcomingPrograms = programs.slice(0, 3);
  const archivePreviewImages =
    archiveData?.years.flatMap((year) => year.programs).slice(0, 4) ?? [];
  const whyItems =
    asWhyItems(asObject(whySection?.payload).items) || FALLBACK_WHY_ITEMS;
  const safeWhyItems = whyItems.length > 0 ? whyItems : FALLBACK_WHY_ITEMS;

  return (
    <div className="pt-20 lg:pt-24">
      <section className="relative min-h-[85vh] lg:min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={
              heroSection?.media?.url ??
              "https://images.unsplash.com/photo-1758742342564-027e6f391aa0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
            }
            alt={heroSection?.media?.alt ?? "ANAKORA hero"}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/40 via-foreground/30 to-background" />
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-serif mb-6 lg:mb-8 tracking-tight">
              {heroSection?.title ?? "ANAKORA"}
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl max-w-3xl mx-auto mb-8 lg:mb-12 leading-relaxed font-light">
              {heroSection?.subtitle ??
                (locale === "en"
                  ? "We do not sell tours, we curate experiences."
                  : "Biz tur satmiyoruz, birlikte yasanacak deneyimler sunuyoruz.")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to={primaryHeroCta.href}
                className="px-8 py-4 bg-primary text-primary-foreground rounded-sm hover:bg-accent transition-all duration-300 text-base font-medium tracking-wide flex items-center gap-2"
              >
                {primaryHeroCta.label}
                <ArrowRight size={20} />
              </Link>
              <Link
                to={secondaryHeroCta.href}
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-sm hover:bg-white hover:text-foreground transition-all duration-300 text-base font-medium tracking-wide"
              >
                {secondaryHeroCta.label}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <p className="text-xs tracking-widest uppercase text-muted-foreground mb-4">
              ANA - KORA
            </p>
            <h2 className="text-3xl lg:text-5xl font-serif mb-8 text-foreground">
              {brandSection?.title ??
                (locale === "en" ? "Rooted, Always in Motion" : "Kokten Gelen, Yolda Devam Eden")}
            </h2>
            <p className="text-sm text-muted-foreground mb-6 text-center">
              {brandSection?.subtitle ??
                (locale === "en"
                  ? "Communities and partners that trust ANAKORA"
                  : "Bize guvenen kurumlar ve topluluklar")}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl lg:text-5xl font-serif mb-4">
              {experienceSection?.title ?? (locale === "en" ? "Experiences" : "Deneyimler")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {experienceSection?.subtitle ??
                (locale === "en"
                  ? "Curated nature experiences built for transformation."
                  : "Her biri ozenle kuratorlenen, donusturucu doga deneyimleri.")}
            </p>
          </div>

          {loading && (
            <p className="text-center text-sm text-muted-foreground mb-8">
              {locale === "en" ? "Loading..." : "Yukleniyor..."}
            </p>
          )}
          {error && (
            <p className="text-center text-sm text-destructive mb-8">
              {locale === "en"
                ? "Homepage content is temporarily unavailable."
                : "Anasayfa icerigi su an yuklenemiyor."}
            </p>
          )}

          {!loading && featuredPrograms.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto">
              {featuredPrograms.slice(0, 3).map((program, index) => (
                <ExperienceCard
                  key={program.id}
                  {...toExperienceCardViewModel(program, locale)}
                  featured={index === 0}
                />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/deneyimler"
              className="inline-flex items-center gap-2 text-primary hover:text-accent font-medium transition-colors"
            >
              {locale === "en" ? "See All Experiences" : "Tum Deneyimleri Gor"}
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl lg:text-5xl font-serif mb-4">
              {upcomingSection?.title ??
                (locale === "en" ? "Upcoming Programs" : "Yaklasan Programlar")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {upcomingSection?.subtitle ??
                (locale === "en"
                  ? "Reserve your spot in upcoming programs."
                  : "Takvim acildi, yerini ayirt.")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
            {upcomingPrograms.map((program) => (
              <ProgramCard
                key={program.id}
                {...toProgramCardViewModel(program, locale)}
              />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/deneyimler"
              className="inline-flex px-8 py-4 bg-primary text-primary-foreground rounded-sm hover:bg-accent transition-all duration-300 text-base font-medium tracking-wide items-center gap-2"
            >
              {locale === "en" ? "See Calendar" : "Takvimi Gor"}
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl lg:text-5xl font-serif mb-4">
              {whySection?.title ?? "Neden ANAKORA?"}
            </h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              {whySection?.subtitle ??
                (locale === "en"
                  ? "Not a vacation, a transformation journey."
                  : "Bu bir tatil degil, bir donusum yolculugu.")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 max-w-7xl mx-auto">
            {safeWhyItems.slice(0, 4).map((item, index) => {
              const Icon = WHY_ICONS[index % WHY_ICONS.length];
              return (
                <motion.div
                  key={`${item.title}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-primary-foreground/10 rounded-full">
                    <Icon size={28} className="text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-serif mb-3">{item.title}</h3>
                  <p className="text-sm opacity-90 leading-relaxed">
                    {item.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl lg:text-5xl font-serif mb-4">
              {archiveSection?.title ??
                (locale === "en" ? "Past Experiences" : "Gecmis Deneyimler")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {archiveSection?.subtitle ??
                (locale === "en"
                  ? "Visual memories from previous gatherings."
                  : "Birlikte yasadigimiz anlarin gorsel arsivi.")}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto mb-12">
            {archivePreviewImages.map((program, index) => (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="aspect-square overflow-hidden rounded-sm bg-muted"
              >
                <img
                  src={
                    program.coverImage?.url ??
                    "https://images.unsplash.com/photo-1567463330419-d65c673554c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
                  }
                  alt={program.coverImage?.alt ?? program.title}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                />
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Link
              to="/arsiv"
              className="inline-flex items-center gap-2 text-primary hover:text-accent font-medium transition-colors"
            >
              {locale === "en" ? "Explore Archive" : "Arsivi Kesfet"}
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl lg:text-5xl font-serif mb-4">
              {testimonialsSection?.title ??
                (locale === "en" ? "From Participants" : "Katilimcilarimizdan")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
            {homeData?.featuredTestimonials.map((testimonial) => (
              <TestimonialCard
                key={testimonial.id}
                {...toTestimonialCardViewModel(testimonial, locale)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl lg:text-5xl font-serif mb-4">
              {journalSection?.title ?? (locale === "en" ? "Journal" : "Jurnal")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {journalSection?.subtitle ??
                (locale === "en"
                  ? "Writing on nature, journey, and inner exploration."
                  : "Doga, yolculuk ve ic kesif uzerine yazilar.")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {homeData?.journalPreview.map((post) => {
              const journalCard = toJournalPreviewViewModel(post, locale);
              return (
                <motion.article
                  key={post.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="group"
                >
                  <Link to={`/jurnal/${post.slug}`}>
                    <div className="aspect-[16/10] overflow-hidden rounded-sm bg-muted mb-4">
                      <img
                        src={journalCard.image}
                        alt={journalCard.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{journalCard.date}</p>
                    <h3 className="text-xl lg:text-2xl font-serif mb-3 group-hover:text-primary transition-colors">
                      {journalCard.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {journalCard.excerpt}
                    </p>
                  </Link>
                </motion.article>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/jurnal"
              className="inline-flex items-center gap-2 text-primary hover:text-accent font-medium transition-colors"
            >
              {locale === "en" ? "Read All Posts" : "Tum Yazilari Oku"}
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-32 bg-accent text-accent-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl lg:text-5xl font-serif mb-6">
              {finalCtaSection?.title ??
                (locale === "en" ? "Ready for the Journey?" : "Yolculuga Hazir misin?")}
            </h2>
            <p className="text-lg lg:text-xl max-w-2xl mx-auto mb-10 leading-relaxed opacity-90">
              {finalCtaSection?.subtitle ??
                (locale === "en"
                  ? "Return to nature, self, and community."
                  : "Dogaya don, kendine don, topluluga don.")}
            </p>
            <Link
              to="/deneyimler"
              className="inline-flex px-10 py-4 bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-all duration-300 text-base font-medium tracking-wide items-center gap-2"
            >
              {locale === "en" ? "Reserve Your Spot" : "Yerini Ayirt"}
              <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
