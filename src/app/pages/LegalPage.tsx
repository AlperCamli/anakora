import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router";
import { getPublic } from "../lib/public-api";

type LegalDTO = {
  title: string;
  slug: string;
  content: string;
};

export function LegalPage() {
  const { slug } = useParams();
  const location = useLocation();
  const effectiveSlug = slug || location.pathname.replace("/", "");
  const [page, setPage] = useState<LegalDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!effectiveSlug) return;

    let mounted = true;
    setLoading(true);

    getPublic<LegalDTO>(`legal/${effectiveSlug}`)
      .then((data) => {
        if (mounted) {
          setPage(data);
          setError(null);
        }
      })
      .catch(() => {
        if (mounted) {
          setError("Sayfa bulunamadi.");
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
  }, [effectiveSlug]);

  if (loading) {
    return <div className="pt-32 px-6">Yukleniyor...</div>;
  }

  if (error || !page) {
    return <div className="pt-32 px-6">{error || "Sayfa bulunamadi."}</div>;
  }

  return (
    <div className="pt-24 min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <h1 className="text-3xl lg:text-5xl font-serif mb-8">{page.title}</h1>
        <div className="prose prose-lg max-w-none text-foreground/90 whitespace-pre-line">
          {page.content}
        </div>
      </div>
    </div>
  );
}
