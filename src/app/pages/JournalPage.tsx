import { useEffect, useMemo, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { Link } from "react-router";
import { ArrowRight, Clock } from "lucide-react";
import { getPublic, postPublic, resolveMediaUrl } from "../lib/public-api";

type JournalDTO = {
  header?: { title?: string; description?: string };
  categories: Array<{ label: string; slug: string }>;
  featuredPost?: {
    title: string;
    slug: string;
    excerpt: string;
    author: string;
    date: string;
    readTimeLabel: string;
    category: string;
    image?: { url: string } | null;
  } | null;
  items: Array<{
    title: string;
    slug: string;
    excerpt: string;
    date: string;
    readTimeLabel: string;
    category: string;
    image?: { url: string } | null;
  }>;
  newsletter?: {
    cta?: { title?: string; description?: string };
    placeholder?: string;
    buttonLabel?: string;
  };
};

export function JournalPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [data, setData] = useState<JournalDTO | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    let mounted = true;

    getPublic<JournalDTO>("journal", { category: selectedCategory, pageSize: 12 })
      .then((payload) => {
        if (mounted) {
          setData(payload);
        }
      })
      .catch(() => {
        // Keep page usable on API failure.
      });

    return () => {
      mounted = false;
    };
  }, [selectedCategory]);

  const featuredPost = data?.featuredPost || null;
  const posts = data?.items || [];

  const categories = useMemo(() => {
    if (!data?.categories?.length) {
      return [{ label: "Tumu", slug: "all" }];
    }

    return data.categories;
  }, [data?.categories]);

  const onSubmitNewsletter = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNewsletterStatus("loading");

    try {
      await postPublic("leads/newsletter", {
        email: newsletterEmail,
        consent: true,
        sourceUrl: window.location.pathname,
      });
      setNewsletterEmail("");
      setNewsletterStatus("success");
    } catch {
      setNewsletterStatus("error");
    }
  };

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
            <h1 className="text-4xl lg:text-6xl font-serif mb-6">{data?.header?.title || "Jurnal"}</h1>
            <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed">
              {data?.header?.description ||
                "Doga, yolculuk, topluluk ve ic kesif uzerine dusunceler."}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-6 border-b border-border bg-background/95 backdrop-blur-md sticky top-20 z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-3 overflow-x-auto pb-1">
            {categories.map((category) => (
              <button
                key={category.slug}
                onClick={() => setSelectedCategory(category.slug)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === category.slug
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {featuredPost && (
        <section className="py-12 lg:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.article
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center max-w-7xl mx-auto"
            >
              <Link
                to={`/jurnal/${featuredPost.slug}`}
                className="relative aspect-[4/3] lg:aspect-square overflow-hidden rounded-sm bg-muted group"
              >
                <img
                  src={resolveMediaUrl(featuredPost.image as any) || ""}
                  alt={featuredPost.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4 px-4 py-2 bg-primary text-primary-foreground text-xs font-medium tracking-wide rounded-full">
                  One Cikan
                </div>
              </Link>

              <div>
                <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">
                  {featuredPost.category}
                </p>
                <Link to={`/jurnal/${featuredPost.slug}`}>
                  <h2 className="text-3xl lg:text-5xl font-serif mb-4 hover:text-primary transition-colors">
                    {featuredPost.title}
                  </h2>
                </Link>
                <p className="text-lg text-foreground/80 leading-relaxed mb-6">
                  {featuredPost.excerpt}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                  <span>{featuredPost.author}</span>
                  <span>•</span>
                  <span>{featuredPost.date}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{featuredPost.readTimeLabel}</span>
                  </div>
                </div>
                <Link
                  to={`/jurnal/${featuredPost.slug}`}
                  className="inline-flex items-center gap-2 text-primary hover:text-accent font-medium transition-colors"
                >
                  Yaziyi Oku
                  <ArrowRight size={20} />
                </Link>
              </div>
            </motion.article>
          </div>
        </section>
      )}

      <section className="py-12 lg:py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {posts.map((post, index) => (
              <motion.article
                key={post.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <Link to={`/jurnal/${post.slug}`}>
                  <div className="aspect-[4/3] overflow-hidden rounded-sm bg-muted mb-4">
                    <img
                      src={resolveMediaUrl(post.image as any) || ""}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <p className="text-xs tracking-widest uppercase text-muted-foreground mb-2">
                    {post.category}
                  </p>
                  <h3 className="text-xl lg:text-2xl font-serif mb-3 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-foreground/80 leading-relaxed mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{post.date}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{post.readTimeLabel}</span>
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-primary text-primary-foreground" id="newsletter">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl mx-auto text-center"
          >
            <h2 className="text-3xl lg:text-5xl font-serif mb-6">
              {data?.newsletter?.cta?.title || "Yeni Yazilardan Haberdar Ol"}
            </h2>
            <p className="text-lg opacity-90 mb-8">
              {data?.newsletter?.cta?.description ||
                "ANAKORA jurnalinden yeni icerikler dogrudan e-postana gelsin."}
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={onSubmitNewsletter}>
              <input
                type="email"
                value={newsletterEmail}
                onChange={(event) => {
                  setNewsletterEmail(event.target.value);
                  setNewsletterStatus("idle");
                }}
                required
                placeholder={data?.newsletter?.placeholder || "E-posta adresin"}
                className="flex-1 px-5 py-3 rounded-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-foreground/50"
              />
              <button
                type="submit"
                disabled={newsletterStatus === "loading"}
                className="px-6 py-3 bg-primary-foreground text-primary rounded-sm font-medium hover:bg-primary-foreground/90 transition-colors whitespace-nowrap disabled:opacity-70"
              >
                {newsletterStatus === "loading"
                  ? "Gonderiliyor..."
                  : data?.newsletter?.buttonLabel || "Abone Ol"}
              </button>
            </form>
            {newsletterStatus === "success" && <p className="text-sm mt-3">Basariyla kaydedildi.</p>}
            {newsletterStatus === "error" && <p className="text-sm mt-3">Bir hata olustu.</p>}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
