import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { ExperienceCard } from "../components/ExperienceCard";
import { ProgramCard } from "../components/ProgramCard";
import { TestimonialCard } from "../components/TestimonialCard";
import { getPublic, resolveMediaUrl } from "../lib/public-api";

type HomeDTO = {
  hero?: {
    title?: string;
    subtitle?: string;
    backgroundImage?: { url: string } | null;
    buttons?: Array<{ label: string; url: string }>;
  };
  manifesto?: {
    header?: { eyebrow?: string; title?: string; description?: string };
    body?: string;
    partnerLogos?: Array<{ name: string }>;
  };
  sectionHeaders?: {
    experiences?: { title?: string; description?: string };
    upcomingPrograms?: { title?: string; description?: string };
    why?: { title?: string; description?: string };
    archive?: { title?: string; description?: string };
    testimonials?: { title?: string; description?: string };
    journal?: { title?: string; description?: string };
  };
  whyItems?: Array<{ title: string; description: string }>;
  archivePreviewImages?: Array<{ url: string }>;
  featuredPrograms?: Array<{
    slug: string;
    title: string;
    shortDescription?: string | null;
    category?: string;
    location: string;
    date: string;
    duration: string;
    image?: { url: string } | null;
    spotsLeft?: number | null;
  }>;
  testimonials?: Array<{
    quote: string;
    author: string;
    program: string;
    image?: { url: string } | null;
  }>;
  journalPreview?: Array<{
    title: string;
    slug: string;
    excerpt: string;
    date: string;
    image?: { url: string } | null;
  }>;
  finalCta?: {
    title?: string;
    description?: string;
    primaryButton?: { label: string; url: string };
  };
};

export function HomePage() {
  const [data, setData] = useState<HomeDTO | null>(null);

  useEffect(() => {
    let mounted = true;

    getPublic<HomeDTO>("home")
      .then((payload) => {
        if (mounted) setData(payload);
      })
      .catch(() => {
        // Keep fallback content rendering when API is unavailable.
      });

    return () => {
      mounted = false;
    };
  }, []);

  const experienceCards = useMemo(() => {
    return (data?.featuredPrograms || []).slice(0, 3).map((program, index) => ({
      id: program.slug,
      title: program.title,
      category: program.category || "Deneyim",
      image: resolveMediaUrl(program.image as any) || "",
      description: program.shortDescription || "ANAKORA deneyimi",
      featured: index === 0,
    }));
  }, [data?.featuredPrograms]);

  const programCards = useMemo(() => {
    return (data?.featuredPrograms || []).map((program) => ({
      id: program.slug,
      title: program.title,
      location: program.location,
      date: program.date,
      duration: program.duration,
      category: program.category || "Deneyim",
      image: resolveMediaUrl(program.image as any) || "",
      spotsLeft: program.spotsLeft || undefined,
    }));
  }, [data?.featuredPrograms]);

  return (
    <div className="pt-20 lg:pt-24">
      <section className="relative min-h-[85vh] lg:min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={resolveMediaUrl(data?.hero?.backgroundImage as any) || ""}
            alt="ANAKORA Hero"
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
              {data?.hero?.title || "ANAKORA"}
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl max-w-3xl mx-auto mb-8 lg:mb-12 leading-relaxed font-light">
              {data?.hero?.subtitle || "Biz tur/kamp/tatil satmiyoruz, birlikte yasanacak bir deneyim sunuyoruz"}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to={data?.hero?.buttons?.[0]?.url || "/deneyimler"}
                className="px-8 py-4 bg-primary text-primary-foreground rounded-sm hover:bg-accent transition-all duration-300 text-base font-medium tracking-wide flex items-center gap-2"
              >
                {data?.hero?.buttons?.[0]?.label || "Programlari Kesfet"}
                <ArrowRight size={20} />
              </Link>
              <Link
                to={data?.hero?.buttons?.[1]?.url || "/hakkinda"}
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-sm hover:bg-white hover:text-foreground transition-all duration-300 text-base font-medium tracking-wide"
              >
                {data?.hero?.buttons?.[1]?.label || "Hikayemizi Oku"}
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
              {data?.manifesto?.header?.eyebrow || "Ana • Kora"}
            </p>
            <h2 className="text-3xl lg:text-5xl font-serif mb-8 text-foreground">
              {data?.manifesto?.header?.title || "Kokten Gelen, Yolda Devam Eden"}
            </h2>
            <p className="text-base text-muted-foreground max-w-3xl mx-auto mb-8">
              {data?.manifesto?.body || "ANAKORA, dogayla ve kendinle yeniden bag kurman icin tasarlandi."}
            </p>
            <div className="overflow-hidden mx-auto max-w-6xl">
              <p className="text-sm text-muted-foreground mb-6 text-center">
                {data?.manifesto?.header?.description || "Bize guvenen kurumlar"}
              </p>
              <div className="relative">
                <div className="flex gap-12 lg:gap-16 items-center animate-[scroll_30s_linear_infinite]">
                  {(data?.manifesto?.partnerLogos || []).map((company, index) => (
                    <div
                      key={`logo-${index}`}
                      className="flex-shrink-0 px-6 py-3 text-muted-foreground/60 font-medium tracking-widest text-sm whitespace-nowrap"
                    >
                      {company.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl lg:text-5xl font-serif mb-4">
              {data?.sectionHeaders?.experiences?.title || "Deneyimler"}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {data?.sectionHeaders?.experiences?.description || "Donusturucu doga deneyimleri"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {experienceCards.map((experience) => (
              <ExperienceCard key={experience.id} {...experience} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/deneyimler"
              className="inline-flex items-center gap-2 text-primary hover:text-accent font-medium transition-colors"
            >
              Tum Deneyimleri Gor
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl lg:text-5xl font-serif mb-4">
              {data?.sectionHeaders?.upcomingPrograms?.title || "Yaklasan Programlar"}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {data?.sectionHeaders?.upcomingPrograms?.description || "Takvim acildi"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
            {programCards.map((program) => (
              <ProgramCard key={program.id} {...program} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/deneyimler"
              className="inline-flex px-8 py-4 bg-primary text-primary-foreground rounded-sm hover:bg-accent transition-all duration-300 text-base font-medium tracking-wide items-center gap-2"
            >
              Takvimi Gor
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl lg:text-5xl font-serif mb-4">
              {data?.sectionHeaders?.why?.title || "Neden ANAKORA?"}
            </h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              {data?.sectionHeaders?.why?.description || "Bu bir tatil degil, donusum yolculugu"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 max-w-7xl mx-auto">
            {(data?.whyItems || []).map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-primary-foreground/10 rounded-full" />
                <h3 className="text-xl font-serif mb-3">{item.title}</h3>
                <p className="text-sm opacity-90 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl lg:text-5xl font-serif mb-4">
              {data?.sectionHeaders?.archive?.title || "Gecmis Deneyimler"}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {data?.sectionHeaders?.archive?.description || "Gorsel arsiv"}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto mb-12">
            {(data?.archivePreviewImages || []).map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="aspect-square overflow-hidden rounded-sm bg-muted"
              >
                <img
                  src={resolveMediaUrl(image as any) || ""}
                  alt={`Archive ${index + 1}`}
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
              Arsivi Kesfet
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl lg:text-5xl font-serif mb-4">
              {data?.sectionHeaders?.testimonials?.title || "Katilimcilarimizdan"}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {data?.sectionHeaders?.testimonials?.description || "Deneyimlerin yankilari"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
            {(data?.testimonials || []).map((testimonial, index) => (
              <TestimonialCard
                key={index}
                quote={testimonial.quote}
                author={testimonial.author}
                program={testimonial.program}
                image={resolveMediaUrl(testimonial.image as any)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl lg:text-5xl font-serif mb-4">
              {data?.sectionHeaders?.journal?.title || "Jurnal"}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {data?.sectionHeaders?.journal?.description || "Doga, yolculuk ve ic kesif uzerine yazilar"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {(data?.journalPreview || []).map((post) => (
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
                      src={resolveMediaUrl(post.image as any) || ""}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{post.date}</p>
                  <h3 className="text-xl lg:text-2xl font-serif mb-3 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">{post.excerpt}</p>
                </Link>
              </motion.article>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/jurnal"
              className="inline-flex items-center gap-2 text-primary hover:text-accent font-medium transition-colors"
            >
              Tum Yazilari Oku
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
              {data?.finalCta?.title || "Yolculuga Hazir misin?"}
            </h2>
            <p className="text-lg lg:text-xl max-w-2xl mx-auto mb-10 leading-relaxed opacity-90">
              {data?.finalCta?.description || "Doga, topluluk ve kendinle yeniden bag kur."}
            </p>
            <Link
              to={data?.finalCta?.primaryButton?.url || "/deneyimler"}
              className="inline-flex px-10 py-4 bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-all duration-300 text-base font-medium tracking-wide items-center gap-2"
            >
              {data?.finalCta?.primaryButton?.label || "Yerini Ayirt"}
              <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
