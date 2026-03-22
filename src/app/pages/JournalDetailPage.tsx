import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, Clock } from "lucide-react";
import { getPublic, resolveMediaUrl } from "../lib/public-api";

type JournalPostDTO = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  readTimeLabel: string;
  category?: string | null;
  image?: { url: string } | null;
};

export function JournalDetailPage() {
  const { slug } = useParams();
  const [post, setPost] = useState<JournalPostDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    let mounted = true;
    setLoading(true);

    getPublic<JournalPostDTO>(`journal/${slug}`)
      .then((data) => {
        if (mounted) {
          setPost(data);
          setError(null);
        }
      })
      .catch(() => {
        if (mounted) {
          setError("Yazi bulunamadi.");
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  if (loading) {
    return <div className="pt-32 px-6">Yukleniyor...</div>;
  }

  if (error || !post) {
    return <div className="pt-32 px-6">{error || "Yazi bulunamadi."}</div>;
  }

  return (
    <div className="pt-24 min-h-screen bg-background">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <Link
          to="/jurnal"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Jurnale Don
        </Link>

        <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">{post.category}</p>
        <h1 className="text-3xl lg:text-5xl font-serif mb-4">{post.title}</h1>
        <p className="text-lg text-foreground/80 leading-relaxed mb-6">{post.excerpt}</p>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
          <span>{post.author}</span>
          <span>•</span>
          <span>{post.date}</span>
          <span>•</span>
          <span className="inline-flex items-center gap-1">
            <Clock size={14} />
            {post.readTimeLabel}
          </span>
        </div>

        <div className="aspect-[16/9] overflow-hidden rounded-sm bg-muted mb-10">
          <img
            src={resolveMediaUrl(post.image as any) || ""}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="prose prose-lg max-w-none text-foreground/90 whitespace-pre-line">
          {post.content}
        </div>
      </article>
    </div>
  );
}
