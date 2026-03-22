import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { type LayoutDTO } from "../lib/public-api";

interface HeaderProps {
  layout?: LayoutDTO | null;
}

export function Header({ layout }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState<"TR" | "EN">("TR");
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const fallbackNavigation = [
    { name: "Deneyimler", href: "/deneyimler" },
    { name: "Arsiv", href: "/arsiv" },
    { name: "Jurnal", href: "/jurnal" },
    { name: "Hakkinda", href: "/hakkinda" },
  ];

  const navigation =
    layout?.headerNavigation?.length
      ? layout.headerNavigation.map((item) => ({
          name: item.label,
          href: item.url,
        }))
      : fallbackNavigation;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-background/95 backdrop-blur-md shadow-sm border-b border-border"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 lg:h-24">
            <Link
              to="/"
              className="text-2xl lg:text-3xl font-serif tracking-wide text-foreground hover:text-primary transition-colors"
            >
              {layout?.brandName || "ANAKORA"}
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`text-sm tracking-wide transition-colors ${
                    location.pathname === item.href
                      ? "text-primary font-medium"
                      : "text-foreground/80 hover:text-primary"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-4 lg:gap-6">
              <div className="flex items-center gap-1 text-sm">
                <button
                  onClick={() => setLanguage("TR")}
                  className={`px-2 py-1 transition-colors ${
                    language === "TR"
                      ? "text-primary font-medium"
                      : "text-foreground/60 hover:text-foreground"
                  }`}
                >
                  TR
                </button>
                <span className="text-foreground/40">/</span>
                <button
                  onClick={() => setLanguage("EN")}
                  className={`px-2 py-1 transition-colors ${
                    language === "EN"
                      ? "text-primary font-medium"
                      : "text-foreground/60 hover:text-foreground"
                  }`}
                >
                  EN
                </button>
              </div>

              <Link
                to="/deneyimler"
                className="hidden md:inline-flex px-6 py-2.5 bg-primary text-primary-foreground rounded-sm hover:bg-accent transition-all duration-300 text-sm tracking-wide"
              >
                Programlari Kesfet
              </Link>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-foreground"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 left-0 right-0 z-40 md:hidden bg-background border-b border-border shadow-lg"
          >
            <nav className="container mx-auto px-4 py-6 flex flex-col gap-4">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`text-base py-2 transition-colors ${
                    location.pathname === item.href
                      ? "text-primary font-medium"
                      : "text-foreground/80"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <Link
                to="/deneyimler"
                className="mt-2 px-6 py-3 bg-primary text-primary-foreground rounded-sm text-center text-sm tracking-wide"
              >
                Programlari Kesfet
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

