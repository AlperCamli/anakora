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
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
