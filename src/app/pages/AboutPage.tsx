import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { getPublic, resolveMediaUrl } from "../lib/public-api";

type AboutDTO = {
  hero?: {
    title?: string;
    subtitle?: string;
    backgroundImage?: { url: string } | null;
  };
  story?: {
    header?: { title?: string; description?: string };
    body?: string;
    image?: { url: string } | null;
  };
  values?: {
    header?: { title?: string; description?: string };
    items?: Array<{ icon?: { lucideName?: string | null }; title: string; description: string }>;
  };
  founder?: {
    eyebrow?: string;
    name?: string;
    body?: string;
    image?: { url: string } | null;
  };
  philosophy?: {
    header?: { title?: string; description?: string };
    body?: string;
  };
  cta?: {
    title?: string;
    description?: string;
    primaryButton?: { label: string; url: string };
    secondaryButton?: { label: string; url: string };
  };
};

export function AboutPage() {
  const [data, setData] = useState<AboutDTO | null>(null);

  useEffect(() => {
    let mounted = true;
    getPublic<AboutDTO>("about")
      .then((payload) => {
        if (mounted) {
          setData(payload);
        }
      })
      .catch(() => {
        // Keep static-safe rendering when API is unavailable.
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="pt-20 lg:pt-24 min-h-screen bg-background">
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img
            src={resolveMediaUrl(data?.hero?.backgroundImage as any) || ""}
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
            <h1 className="text-5xl lg:text-7xl font-serif mb-8">{data?.hero?.title || "ANAKORA"}</h1>
            <div className="space-y-4 text-lg lg:text-xl text-foreground/80 leading-relaxed">
              <p>{data?.hero?.subtitle || "Kokten gelen, yolda devam eden."}</p>
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
                {data?.story?.header?.title || "Hikayemiz"}
              </h2>
              <div className="prose prose-lg max-w-none text-foreground/80 leading-relaxed space-y-4">
                <p>{data?.story?.body || "ANAKORA bir ihtiyactan dogdu."}</p>
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
                src={resolveMediaUrl(data?.story?.image as any) || ""}
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
              {data?.values?.header?.title || "Degerlerimiz"}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {data?.values?.header?.description || "ANAKORA'yi ANAKORA yapan degerler"}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
            {(data?.values?.items || []).map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-card border border-border rounded-sm p-8"
              >
                <h3 className="text-2xl font-serif mb-4">{value.title}</h3>
                <p className="text-foreground/80 leading-relaxed">{value.description}</p>
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
                src={resolveMediaUrl(data?.founder?.image as any) || ""}
                alt={data?.founder?.name || "Founder"}
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
                {data?.founder?.eyebrow || "Kurucu & Rehber"}
              </p>
              <h2 className="text-3xl lg:text-5xl font-serif mb-6">{data?.founder?.name || ""}</h2>
              <div className="prose prose-lg max-w-none opacity-90 leading-relaxed space-y-4">
                <p>{data?.founder?.body || ""}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-3xl lg:text-5xl font-serif mb-8">
              {data?.philosophy?.header?.title || "Felsefemiz"}
            </h2>
            <div className="prose prose-xl max-w-none text-foreground/80 leading-relaxed space-y-6">
              <p>{data?.philosophy?.body || ""}</p>
            </div>
          </motion.div>
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
            <h2 className="text-3xl lg:text-5xl font-serif mb-6">{data?.cta?.title || "Bize Katil"}</h2>
            <p className="text-lg lg:text-xl max-w-2xl mx-auto mb-10 leading-relaxed opacity-90">
              {data?.cta?.description || "ANAKORA ailesi buyuyor."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={data?.cta?.primaryButton?.url || "/deneyimler"}
                className="inline-flex px-10 py-4 bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-all duration-300 text-base font-medium tracking-wide"
              >
                {data?.cta?.primaryButton?.label || "Deneyimleri Kesfet"}
              </a>
              <a
                href={data?.cta?.secondaryButton?.url || "mailto:hello@anakora.com"}
                className="inline-flex px-10 py-4 bg-transparent border-2 border-foreground/20 rounded-sm hover:bg-foreground/5 transition-all duration-300 text-base font-medium tracking-wide"
              >
                {data?.cta?.secondaryButton?.label || "Bize Ulas"}
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
