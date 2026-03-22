import { Outlet } from "react-router";
import { useEffect, useState } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileStickyCTA } from "./MobileStickyCTA";
import { getPublic, type LayoutDTO } from "../lib/public-api";

export function Layout() {
  const [layout, setLayout] = useState<LayoutDTO | null>(null);

  useEffect(() => {
    let mounted = true;

    getPublic<LayoutDTO>("layout")
      .then((data) => {
        if (mounted) {
          setLayout(data);
        }
      })
      .catch(() => {
        // Keep fallback static content in components when CMS is unavailable.
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header layout={layout} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer layout={layout} />
      <MobileStickyCTA layout={layout} />
    </div>
  );
}

