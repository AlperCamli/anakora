import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Clock } from "lucide-react";
import { motion } from "motion/react";
import { getJournalDetailBySlug, type JournalPostDTO } from "../../server/data";
import { useSiteData } from "../context/SiteDataContext";
import { formatReadTime } from "../lib/formatters";

function toParagraphs(content: string): string[] {
  return content
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function JournalDetailPage() {
  const { slug } = useParams();
  const { locale } = useSiteData();
  const [post, setPost] = useState<JournalPostDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function run() {
      if (!slug) {
        setError("Slug bulunamadi.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await getJournalDetailBySlug(slug, locale);
        if (!isMounted) {
          return;
        }
        if (!data) {
          setError(locale === "en" ? "Post not found." : "Yazi bulunamadi.");
          setPost(null);
          return;
        }
        setPost(data);
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : locale === "en"
              ? "Post could not be loaded."
              : "Yazi yuklenemedi.",
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
  }, [locale, slug]);

  const paragraphs = useMemo(() => toParagraphs(post?.contentMarkdown ?? ""), [
    post?.contentMarkdown,
  ]);

  if (loading) {
    return (
      <div className="pt-20 lg:pt-24 min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-sm text-muted-foreground">
          {locale === "en" ? "Loading post..." : "Yazi yukleniyor..."}
        </div>
      </div>
    );
  }

  if (!post || error) {
    return (
      <div className="pt-20 lg:pt-24 min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <p className="text-destructive mb-6">
            {error ?? (locale === "en" ? "Post not found." : "Yazi bulunamadi.")}
          </p>
          <Link
            to="/jurnal"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-sm"
          >
            <ArrowLeft size={16} />
            {locale === "en" ? "Back to Journal" : "Jurnale Don"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 lg:pt-24 min-h-screen bg-background">
      <section className="relative h-[45vh] lg:h-[60vh]">
        <img
          src={
            post.coverImage?.url ??
            "https://images.unsplash.com/photo-1605377555936-5693af33592d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
          }
          alt={post.coverImage?.alt ?? post.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-12 text-white">
          <div className="container mx-auto max-w-5xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Link
                to="/jurnal"
                className="inline-flex items-center gap-2 text-sm opacity-90 hover:opacity-100 mb-4"
              >
                <ArrowLeft size={16} />
                {locale === "en" ? "Back to Journal" : "Jurnale Don"}
              </Link>
              <h1 className="text-4xl lg:text-6xl font-serif mb-4">{post.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm opacity-90">
                {post.publishedAt && (
                  <span>
                    {new Intl.DateTimeFormat(locale === "en" ? "en-US" : "tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }).format(new Date(post.publishedAt))}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Clock size={14} />
                  {formatReadTime(post.readTimeMinutes, locale)}
                </span>
                {post.authorGuide?.name && <span>{post.authorGuide.name}</span>}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          {post.excerpt && (
            <p className="text-lg text-muted-foreground mb-8">{post.excerpt}</p>
          )}
          <article className="prose prose-lg max-w-none text-foreground/90 leading-relaxed">
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </article>
        </div>
      </section>
    </div>
  );
}
