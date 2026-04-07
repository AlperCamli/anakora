import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useSiteData } from "../context/SiteDataContext";

export function MobileStickyCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();
  const { locale } = useSiteData();

  useEffect(() => {
    const handleScroll = () => {
      const footer = document.getElementById("site-footer");
      const nearPageBottom =
        document.documentElement.scrollHeight - (window.innerHeight + window.scrollY) < 180;
      const nearFooter = footer
        ? footer.getBoundingClientRect().top <= window.innerHeight - 140
        : nearPageBottom;

      setIsVisible(window.scrollY > 300 && !nearFooter);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [location.pathname]);

  if (location.pathname.includes("/deneyimler")) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 p-4 bg-background/95 backdrop-blur-md border-t border-border shadow-lg"
        >
          <Link
            to="/deneyimler"
            className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-primary text-primary-foreground rounded-sm text-sm font-medium tracking-wide"
          >
            {locale === "en" ? "Explore Experiences" : "Deneyimleri Kesfet"}
            <ArrowRight size={18} />
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
