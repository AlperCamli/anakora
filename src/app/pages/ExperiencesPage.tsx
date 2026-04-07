import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Filter, SlidersHorizontal } from "lucide-react";
import { ProgramCard } from "../components/ProgramCard";
import { useSiteData } from "../context/SiteDataContext";
import {
  LEAD_FULL_NAME_MAX_LENGTH,
  LEAD_MESSAGE_MAX_LENGTH,
  filterPhoneInput,
  submitLeadSubmission,
} from "../lib/lead-submissions";
import { toProgramCardViewModel } from "../lib/formatters";
import { ClearableInput, ClearableTextarea } from "../components/ClearableField";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../components/ui/drawer";
import {
  getProgramCategoryFilters,
  getProgramsList,
  type ProgramCardDTO,
  type ProgramCategoryFilterDTO,
} from "../../server/data";

interface FilterOption {
  id: string;
  label: string;
  count: number;
}

export function ExperiencesPage() {
  const { locale } = useSiteData();
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [programs, setPrograms] = useState<ProgramCardDTO[]>([]);
  const [categories, setCategories] = useState<ProgramCategoryFilterDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactHoneypot, setContactHoneypot] = useState("");
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const [programData, categoryData] = await Promise.all([
          getProgramsList(locale, {
            statuses: ["upcoming", "published"],
          }),
          getProgramCategoryFilters(locale, { activeOnly: true }),
        ]);

        if (!isMounted) {
          return;
        }

        setPrograms(programData);
        setCategories(categoryData);
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Program verileri alinamadi.",
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void run();
    return () => {
      isMounted = false;
    };
  }, [locale]);

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();

    for (const program of programs) {
      const uniqueProgramCategorySlugs = new Set(
        program.categories.map((category) => category.slug),
      );
      for (const categorySlug of uniqueProgramCategorySlugs) {
        map.set(categorySlug, (map.get(categorySlug) ?? 0) + 1);
      }
    }

    return map;
  }, [programs]);

  const filters = useMemo<FilterOption[]>(() => {
    const base = [
      {
        id: "all",
        label: locale === "en" ? "All" : "Tumu",
        count: programs.length,
      },
    ];

    const dynamic = categories
      .map((category) => ({
        id: category.slug,
        label: category.name,
        count: categoryCounts.get(category.slug) ?? 0,
      }))
      .filter((category) => category.count > 0);

    return [...base, ...dynamic];
  }, [categories, categoryCounts, locale, programs.length]);

  useEffect(() => {
    if (!filters.some((filter) => filter.id === activeFilter)) {
      setActiveFilter("all");
    }
  }, [activeFilter, filters]);

  const filteredPrograms = useMemo(() => {
    if (activeFilter === "all") {
      return programs;
    }
    return programs.filter((program) =>
      program.categories.some((category) => category.slug === activeFilter),
    );
  }, [activeFilter, programs]);

  const activeFilterItem =
    filters.find((filter) => filter.id === activeFilter) ?? filters[0] ?? null;

  function applyFilter(filterId: string) {
    setActiveFilter(filterId);
    setIsFilterDrawerOpen(false);
  }

  async function handleContactSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setContactError(null);
    setContactSuccess(null);
    setContactSubmitting(true);

    const result = await submitLeadSubmission({
      source: "general_contact",
      locale,
      fullName: contactName,
      email: contactEmail,
      phone: contactPhone,
      message: contactMessage,
      honeypot: contactHoneypot,
      metadata: {
        surface: "experiences_contact_section",
      },
    });

    setContactSubmitting(false);
    if (!result.ok) {
      setContactError(
        result.fieldErrors?.fullName ??
          result.fieldErrors?.email ??
          result.fieldErrors?.phone ??
          result.fieldErrors?.message ??
          result.errorMessage ??
          (locale === "en"
            ? "Message could not be sent right now."
            : "Mesaj su an gonderilemedi."),
      );
      return;
    }

    setContactName("");
    setContactEmail("");
    setContactPhone("");
    setContactMessage("");
    setContactHoneypot("");
    setContactSuccess(
      locale === "en"
        ? "Thanks, we will contact you shortly."
        : "Tesekkurler, en kisa surede sizinle iletisime gececegiz.",
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
              {locale === "en" ? "Experiences" : "Deneyimler"}
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed">
              {locale === "en"
                ? "Carefully curated, transformational nature experiences."
                : "Ozenle tasarlanmis, donusturucu doga deneyimleri."}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-6 border-b border-border sticky top-20 lg:top-24 bg-background/95 backdrop-blur-md z-30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="hidden md:flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <Filter size={20} className="text-muted-foreground flex-shrink-0" />
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => applyFilter(filter.id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  activeFilter === filter.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <span>{filter.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    activeFilter === filter.id
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-background text-muted-foreground"
                  }`}
                >
                  {filter.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between md:hidden">
            <div>
              <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
                {locale === "en" ? "Filter" : "Filtre"}
              </p>
              <p className="text-sm font-medium">
                {activeFilterItem?.label} ({activeFilterItem?.count ?? 0})
              </p>
            </div>

            <Drawer open={isFilterDrawerOpen} onOpenChange={setIsFilterDrawerOpen}>
              <DrawerTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <SlidersHorizontal size={16} />
                  {locale === "en" ? "Categories" : "Kategoriler"}
                </button>
              </DrawerTrigger>

              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>
                    {locale === "en" ? "Filter Experiences" : "Deneyimleri Filtrele"}
                  </DrawerTitle>
                  <DrawerDescription>
                    {locale === "en"
                      ? "Pick a category to narrow the list."
                      : "Listeyi daraltmak icin bir kategori secin."}
                  </DrawerDescription>
                </DrawerHeader>

                <div className="max-h-[55vh] space-y-2 overflow-y-auto px-4 pb-2">
                  {activeFilter !== "all" && (
                    <button
                      type="button"
                      onClick={() => applyFilter("all")}
                      className="w-full rounded-md border border-border bg-muted/40 px-3 py-2 text-sm font-medium"
                    >
                      {locale === "en" ? "Reset to All" : "Tumune Sifirla"}
                    </button>
                  )}

                  {filters.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => applyFilter(filter.id)}
                      className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm ${
                        activeFilter === filter.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background"
                      }`}
                    >
                      <span>{filter.label}</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {filter.count}
                      </span>
                    </button>
                  ))}
                </div>

                <DrawerFooter>
                  <DrawerClose asChild>
                    <button
                      type="button"
                      className="w-full rounded-md border border-border px-4 py-2 text-sm"
                    >
                      {locale === "en" ? "Close" : "Kapat"}
                    </button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {loading && (
            <p className="mb-6 text-sm text-muted-foreground">
              {locale === "en" ? "Loading programs..." : "Programlar yukleniyor..."}
            </p>
          )}
          {error && (
            <p className="mb-6 text-sm text-destructive">
              {locale === "en"
                ? "Programs could not be loaded."
                : "Programlar su an yuklenemedi."}
            </p>
          )}
          {!loading && !error && (
            <div className="mb-6 text-sm text-muted-foreground">
              {filteredPrograms.length} {locale === "en" ? "programs found" : "program bulundu"}
            </div>
          )}

          {!loading && !error && filteredPrograms.length === 0 && (
            <div className="rounded-sm border border-border p-6 text-sm text-muted-foreground">
              {locale === "en"
                ? "No programs match this filter yet."
                : "Bu filtre icin henuz program bulunmuyor."}
            </div>
          )}

          {!loading && !error && filteredPrograms.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {filteredPrograms.map((program, index) => (
                <motion.div
                  key={program.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <ProgramCard {...toProgramCardViewModel(program, locale)} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl lg:text-4xl font-serif mb-4">
            {locale === "en"
              ? "Need help choosing your program?"
              : "Programlar hakkinda soru mu var?"}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            {locale === "en"
              ? "Send us a quick note and we will guide you."
              : "Kisa bir mesaj birakin, size en uygun deneyimi birlikte bulalim."}
          </p>

          <form
            onSubmit={handleContactSubmit}
            className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 text-left"
          >
            <input
              type="text"
              value={contactHoneypot}
              onChange={(event) => setContactHoneypot(event.target.value)}
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
            />
            <ClearableInput
              type="text"
              value={contactName}
              onChange={setContactName}
              maxLength={LEAD_FULL_NAME_MAX_LENGTH}
              placeholder={
                locale === "en" ? "Name" : "Adiniz"
              }
              clearLabel={
                locale === "en" ? "Clear full name" : "Ad soyad alanini temizle"
              }
              className="px-4 py-3 border border-border rounded-sm bg-background"
            />
            <ClearableInput
              type="email"
              value={contactEmail}
              onChange={setContactEmail}
              placeholder={
                locale === "en"
                  ? "E-mail"
                  : "E-posta"
              }
              clearLabel={
                locale === "en" ? "Clear email address" : "E-posta adresini temizle"
              }
              className="px-4 py-3 border border-border rounded-sm bg-background"
            />
            <ClearableInput
              type="tel"
              value={contactPhone}
              onChange={(nextValue) => setContactPhone(filterPhoneInput(nextValue))}
              wrapperClassName="sm:col-span-2"
              placeholder={
                locale === "en"
                  ? "Phone Number"
                  : "Telefon Numarasi"
              }
              clearLabel={
                locale === "en" ? "Clear phone number" : "Telefon numarasini temizle"
              }
              className="px-4 py-3 border border-border rounded-sm bg-background"
            />
            <ClearableTextarea
              value={contactMessage}
              onChange={setContactMessage}
              maxLength={LEAD_MESSAGE_MAX_LENGTH}
              wrapperClassName="sm:col-span-2"
              placeholder={
                locale === "en" ? "How can we help you?" : "Size nasil yardimci olabiliriz?"
              }
              clearLabel={locale === "en" ? "Clear message" : "Mesaj alanini temizle"}
              rows={4}
              className="px-4 py-3 border border-border rounded-sm bg-background resize-none"
            />
            <button
              type="submit"
              disabled={contactSubmitting}
              className="sm:col-span-2 inline-flex justify-center px-8 py-3 bg-primary text-primary-foreground rounded-sm hover:bg-accent transition-all duration-300 text-base font-medium tracking-wide disabled:opacity-70"
            >
              {contactSubmitting
                ? locale === "en"
                  ? "Sending..."
                  : "Gonderiliyor..."
                : locale === "en"
                  ? "Send Message"
                  : "Mesaji Gonder"}
            </button>
            <p className="sm:col-span-2 text-xs text-muted-foreground">
              {locale === "en"
                ? "Full name and at least one contact method (email or phone) are required."
                : "Ad soyad ve en az bir iletisim bilgisi (e-posta veya telefon) zorunludur."}
            </p>
          </form>

          {contactError && <p className="mt-3 text-sm text-destructive">{contactError}</p>}
          {contactSuccess && <p className="mt-3 text-sm text-primary">{contactSuccess}</p>}
        </div>
      </section>
    </div>
  );
}
