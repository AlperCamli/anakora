import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Compass, Heart, Leaf, Users } from "lucide-react";
import { getGuides, type GuideDTO } from "../../server/data";
import { useSiteData } from "../context/SiteDataContext";

const VALUES = [
  {
    icon: Heart,
    titleTr: "Topluluk ve Bag",
    titleEn: "Community and Connection",
    descriptionTr:
      "Her deneyim, insanlarin bir araya gelip derin baglar kurmasi icin tasarlanir.",
    descriptionEn:
      "Each experience is designed to help people build deep and meaningful connection.",
  },
  {
    icon: Compass,
    titleTr: "Icssel Yolculuk",
    titleEn: "Inner Journey",
    descriptionTr:
      "Disa dogru yolculuk yaparken, ice dogru da yolculuk ediyoruz.",
    descriptionEn:
      "Every outward journey is also an inward journey.",
  },
  {
    icon: Leaf,
    titleTr: "Dogayla Uyum",
    titleEn: "Harmony with Nature",
    descriptionTr:
      "Toprak, su, ates ve hava ile yeniden bag kuruyoruz.",
    descriptionEn:
      "We rebuild our relationship with land, water, fire, and air.",
  },
  {
    icon: Users,
    titleTr: "Kuratorlu Deneyim",
    titleEn: "Curated Experience",
    descriptionTr:
      "Kitlesel turizm degil, donusturucu ve ozenli deneyimler.",
    descriptionEn:
      "Not mass tourism, but intentional and transformative experiences.",
  },
];

export function AboutPage() {
  const { locale, layout } = useSiteData();
  const [guides, setGuides] = useState<GuideDTO[]>([]);
  const [loadingGuides, setLoadingGuides] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function run() {
      setLoadingGuides(true);
      try {
        const data = await getGuides(locale);
        if (!isMounted) {
          return;
        }
        setGuides(data);
      } finally {
        if (isMounted) {
          setLoadingGuides(false);
        }
      }
    }

    run();
    return () => {
      isMounted = false;
    };
  }, [locale]);

  const featuredGuide = useMemo(() => {
    return guides.find((guide) => guide.isFeatured) ?? guides[0] ?? null;
  }, [guides]);

  return (
    <div className="pt-20 lg:pt-24 min-h-screen bg-background">
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img
            src="https://images.unsplash.com/photo-1770625467655-65fa3a256ccb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
            alt="Texture"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-5xl lg:text-7xl font-serif mb-8">
              {layout?.siteName ?? "ANAKORA"}
            </h1>
            <div className="space-y-4 text-lg lg:text-xl text-foreground/80 leading-relaxed">
              <p>
                {locale === "en"
                  ? "Rooted in origin, always moving through the journey."
                  : "Kokten gelen, yolda devam eden."}
              </p>
              {layout?.tagline && (
                <p className="text-2xl lg:text-3xl font-serif text-foreground mt-8 italic">
                  {layout.tagline}
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl lg:text-5xl font-serif mb-6">
                {locale === "en" ? "Our Story" : "Hikayemiz"}
              </h2>
              <div className="prose prose-lg max-w-none text-foreground/80 leading-relaxed space-y-4">
                <p>
                  {locale === "en"
                    ? "ANAKORA was founded to create intentional spaces where people reconnect with nature, themselves, and meaningful community."
                    : "ANAKORA, insanlarin dogayla, kendileriyle ve toplulukla yeniden bag kurabilmesi icin dogdu."}
                </p>
                <p>
                  {locale === "en"
                    ? "We do not sell generic tourism packages; we curate experiences with depth, rhythm, and care."
                    : "Biz kitlesel turizm degil, ritmi ve derinligi olan deneyimler kuratorluyoruz."}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative aspect-[3/4] overflow-hidden rounded-sm"
            >
              <img
                src="https://images.unsplash.com/photo-1758274526671-ad18176acb01?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
                alt="ANAKORA Experience"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12 lg:mb-16"
          >
            <h2 className="text-3xl lg:text-5xl font-serif mb-6">
              {locale === "en" ? "Our Values" : "Degerlerimiz"}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
            {VALUES.map((value, index) => (
              <motion.div
                key={value.titleTr}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-card border border-border rounded-sm p-8"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 mb-6 bg-primary/10 rounded-full">
                  <value.icon size={28} className="text-primary" />
                </div>
                <h3 className="text-2xl font-serif mb-4">
                  {locale === "en" ? value.titleEn : value.titleTr}
                </h3>
                <p className="text-foreground/80 leading-relaxed">
                  {locale === "en" ? value.descriptionEn : value.descriptionTr}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative aspect-[3/4] overflow-hidden rounded-sm order-2 lg:order-1"
            >
              <img
                src={
                  featuredGuide?.avatar?.url ??
                  "https://images.unsplash.com/photo-1589395595310-ecf612c64942?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
                }
                alt={featuredGuide?.name ?? "Guide"}
                className="w-full h-full object-cover"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="order-1 lg:order-2"
            >
              <p className="text-sm tracking-widest uppercase mb-4 opacity-90">
                {locale === "en" ? "Founder and Guide" : "Kurucu ve Rehber"}
              </p>
              <h2 className="text-3xl lg:text-5xl font-serif mb-6">
                {loadingGuides
                  ? locale === "en"
                    ? "Loading..."
                    : "Yukleniyor..."
                  : featuredGuide?.name ?? "ANAKORA"}
              </h2>
              <div className="prose prose-lg max-w-none opacity-90 leading-relaxed space-y-4">
                <p>
                  {featuredGuide?.title ??
                    (locale === "en"
                      ? "Guiding people through intentional nature experiences."
                      : "Insanlari niyetli doga deneyimlerinde bulusturan rehberlik anlayisi.")}
                </p>
                {featuredGuide?.bio && <p>{featuredGuide.bio}</p>}
              </div>
            </motion.div>
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
              {locale === "en" ? "Join the Journey" : "Bize Katil"}
            </h2>
            <p className="text-lg lg:text-xl max-w-2xl mx-auto mb-10 leading-relaxed opacity-90">
              {locale === "en"
                ? "ANAKORA community is growing. Join the next experience."
                : "ANAKORA ailesi buyuyor. Bir sonraki deneyimde sen de ol."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/deneyimler"
                className="inline-flex px-10 py-4 bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-all duration-300 text-base font-medium tracking-wide"
              >
                {locale === "en" ? "Explore Experiences" : "Deneyimleri Kesfet"}
              </a>
              {layout?.contactEmail && (
                <a
                  href={`mailto:${layout.contactEmail}`}
                  className="inline-flex px-10 py-4 bg-transparent border-2 border-foreground/20 rounded-sm hover:bg-foreground/5 transition-all duration-300 text-base font-medium tracking-wide"
                >
                  {locale === "en" ? "Contact Us" : "Bize Ulas"}
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
