import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Clock } from "lucide-react";
import { motion } from "motion/react";
import { getJournalList, type JournalListDTO } from "../../server/data";
import { useSiteData } from "../context/SiteDataContext";
import { formatReadTime, toJournalPreviewViewModel } from "../lib/formatters";
import { submitLeadSubmission } from "../lib/lead-submissions";

export function JournalPage() {
  const { locale } = useSiteData();
  const [journalData, setJournalData] = useState<JournalListDTO | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);
  const [newsletterSuccess, setNewsletterSuccess] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const data = await getJournalList(locale);
        if (!isMounted) {
          return;
        }
        setJournalData(data);
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : locale === "en"
              ? "Journal could not be loaded."
              : "Jurnal verisi yuklenemedi.",
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

  const categories = useMemo(() => {
    const base = [{ slug: "all", name: locale === "en" ? "All" : "Tumu" }];
    const dynamic = journalData?.categories ?? [];
    return [...base, ...dynamic];
  }, [journalData?.categories, locale]);

  const filteredPosts = useMemo(() => {
    const posts = journalData?.posts ?? [];
    if (activeCategory === "all") {
      return posts;
    }
    return posts.filter((post) =>
      post.categories.some((category) => category.slug === activeCategory),
    );
  }, [activeCategory, journalData?.posts]);

  const featuredPost = useMemo(() => {
    const candidate = journalData?.featuredPost ?? null;
    if (!candidate) {
      return null;
    }
    if (activeCategory === "all") {
      return candidate;
    }
    return candidate.categories.some((category) => category.slug === activeCategory)
      ? candidate
      : filteredPosts[0] ?? null;
  }, [activeCategory, filteredPosts, journalData?.featuredPost]);

  async function handleNewsletterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNewsletterError(null);
    setNewsletterSuccess(null);
    setSubmitting(true);

    const result = await submitLeadSubmission({
      source: "journal_newsletter",
      locale,
      email,
      honeypot,
      consentMarketing: true,
      metadata: { surface: "journal_newsletter_section" },
    });

    setSubmitting(false);
    if (!result.ok) {
      setNewsletterError(
        result.fieldErrors?.email ??
          result.errorMessage ??
          (locale === "en" ? "Subscription failed." : "Abonelik tamamlanamadi."),
      );
      return;
    }

    setEmail("");
    setHoneypot("");
    setNewsletterSuccess(
      locale === "en"
        ? "Thanks, you are subscribed."
        : "Tesekkurler, aboneliginiz alindi.",
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
              {locale === "en" ? "Journal" : "Jurnal"}
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed">
              {locale === "en"
                ? "Thoughts on nature, journey, and inner exploration."
                : "Doga, yolculuk, topluluk ve ic kesif uzerine dusunceler."}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-6 border-b border-border bg-background/95 backdrop-blur-md sticky top-20 lg:top-24 z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category.slug}
                onClick={() => setActiveCategory(category.slug)}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  activeCategory === category.slug
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading && (
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-sm text-muted-foreground">
            {locale === "en" ? "Loading journal..." : "Jurnal yukleniyor..."}
          </div>
        </section>
      )}
      {error && (
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-sm text-destructive">
            {error}
          </div>
        </section>
      )}

      {!loading && !error && featuredPost && (
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
                  src={
                    featuredPost.coverImage?.url ??
                    "https://images.unsplash.com/photo-1605377555936-5693af33592d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
                  }
                  alt={featuredPost.coverImage?.alt ?? featuredPost.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4 px-4 py-2 bg-primary text-primary-foreground text-xs font-medium tracking-wide rounded-full">
                  {locale === "en" ? "Featured" : "One Cikan"}
                </div>
              </Link>

              <div>
                <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">
                  {featuredPost.categories[0]?.name ?? "ANAKORA"}
                </p>
                <Link to={`/jurnal/${featuredPost.slug}`}>
                  <h2 className="text-3xl lg:text-5xl font-serif mb-4 hover:text-primary transition-colors">
                    {featuredPost.title}
                  </h2>
                </Link>
                {featuredPost.excerpt && (
                  <p className="text-lg text-foreground/80 leading-relaxed mb-6">
                    {featuredPost.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                  {featuredPost.publishedAt && (
                    <span>
                      {new Intl.DateTimeFormat(locale === "en" ? "en-US" : "tr-TR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }).format(new Date(featuredPost.publishedAt))}
                    </span>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{formatReadTime(featuredPost.readTimeMinutes, locale)}</span>
                  </div>
                </div>
                <Link
                  to={`/jurnal/${featuredPost.slug}`}
                  className="inline-flex items-center gap-2 text-primary hover:text-accent font-medium transition-colors"
                >
                  {locale === "en" ? "Read Post" : "Yaziyi Oku"}
                  <ArrowRight size={20} />
                </Link>
              </div>
            </motion.article>
          </div>
        </section>
      )}

      {!loading && !error && (
        <section className="py-12 lg:py-16 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {filteredPosts.length === 0 ? (
              <div className="text-sm text-muted-foreground rounded-sm border border-border p-6">
                {locale === "en"
                  ? "No journal post in this category yet."
                  : "Bu kategori icin henuz jurnal yazisi yok."}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
                {filteredPosts.map((post, index) => {
                  const journalCard = toJournalPreviewViewModel(post, locale);
                  return (
                    <motion.article
                      key={post.slug}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.06 }}
                      className="group"
                    >
                      <Link to={`/jurnal/${post.slug}`}>
                        <div className="aspect-[4/3] overflow-hidden rounded-sm bg-muted mb-4">
                          <img
                            src={journalCard.image}
                            alt={journalCard.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        </div>
                        <p className="text-xs tracking-widest uppercase text-muted-foreground mb-2">
                          {post.categories[0]?.name ?? "ANAKORA"}
                        </p>
                        <h3 className="text-xl lg:text-2xl font-serif mb-3 group-hover:text-primary transition-colors">
                          {journalCard.title}
                        </h3>
                        <p className="text-foreground/80 leading-relaxed mb-4 line-clamp-2">
                          {journalCard.excerpt}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{journalCard.date}</span>
                          <span>-</span>
                          <div className="flex items-center gap-1">
                            <Clock size={12} />
                            <span>{journalCard.readTime}</span>
                          </div>
                        </div>
                      </Link>
                    </motion.article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="py-16 lg:py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl mx-auto text-center"
          >
            <h2 className="text-3xl lg:text-5xl font-serif mb-6">
              {locale === "en"
                ? "Stay Updated"
                : "Yeni Yazilardan Haberdar Ol"}
            </h2>
            <p className="text-lg opacity-90 mb-8">
              {locale === "en"
                ? "Receive new ANAKORA journal posts in your inbox."
                : "ANAKORA jurnalinden yeni icerikler e-postana gelsin."}
            </p>
            <form
              onSubmit={handleNewsletterSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
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
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={locale === "en" ? "Your email" : "E-posta adresin"}
                className="flex-1 px-5 py-3 rounded-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-foreground/50"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-primary-foreground text-primary rounded-sm font-medium hover:bg-primary-foreground/90 transition-colors whitespace-nowrap disabled:opacity-70"
              >
                {submitting
                  ? locale === "en"
                    ? "Submitting..."
                    : "Gonderiliyor..."
                  : locale === "en"
                    ? "Subscribe"
                    : "Abone Ol"}
              </button>
            </form>
            {newsletterError && (
              <p className="text-sm mt-3 text-destructive-foreground">{newsletterError}</p>
            )}
            {newsletterSuccess && (
              <p className="text-sm mt-3 text-primary-foreground">{newsletterSuccess}</p>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
