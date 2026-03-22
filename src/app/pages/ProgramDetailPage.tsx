import { useParams, Link } from "react-router";
import { Calendar, MapPin, Users, Clock, Check, X, ChevronDown } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import { getPublic, postPublic, resolveMediaUrl } from "../lib/public-api";

type ProgramDetailDTO = {
  title: string;
  slug: string;
  subtitle?: string | null;
  category?: { name?: string } | null;
  location?: string;
  date?: string;
  duration?: string;
  price?: { label?: string };
  spotsLeft?: number | null;
  capacity?: number | null;
  image?: { url: string } | null;
  story?: string | null;
  whoIsItFor?: string[];
  programFlow?: Array<{ day: string; activities: string[] }>;
  included?: string[];
  notIncluded?: string[];
  guide?: { name?: string; title?: string; bio?: string; image?: { url: string } | null };
  faqs?: Array<{ question: string; answer: string }>;
};

export function ProgramDetailPage() {
  const { id } = useParams();
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [program, setProgram] = useState<ProgramDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "success" | "error">("idle");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!id) return;

    let mounted = true;
    setLoading(true);

    getPublic<ProgramDetailDTO>(`programs/${id}`)
      .then((data) => {
        if (mounted) {
          setProgram(data);
          setError(null);
        }
      })
      .catch(() => {
        if (mounted) {
          setError("Program yuklenemedi.");
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
  }, [id]);

  const storyParagraphs = useMemo(() => {
    if (!program?.story) return [];
    return program.story.split("\n\n");
  }, [program?.story]);

  const onSubmitBooking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!program?.slug) return;

    setSubmitState("loading");

    try {
      await postPublic("leads/booking", {
        programSlug: program.slug,
        fullName,
        email,
        phone,
        note,
        consent: true,
        sourceUrl: window.location.pathname,
      });

      setSubmitState("success");
      setTimeout(() => {
        setShowBookingForm(false);
        setSubmitState("idle");
      }, 1000);
    } catch {
      setSubmitState("error");
    }
  };

  if (loading) {
    return <div className="pt-32 px-6">Yukleniyor...</div>;
  }

  if (error || !program) {
    return <div className="pt-32 px-6">{error || "Program bulunamadi."}</div>;
  }

  return (
    <div className="pt-20 lg:pt-24 min-h-screen bg-background">
      <section className="relative h-[50vh] lg:h-[70vh]">
        <img
          src={resolveMediaUrl(program.image as any) || ""}
          alt={program.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-12 text-white">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <p className="text-xs lg:text-sm tracking-widest uppercase mb-3 opacity-90">
                {program.category?.name}
              </p>
              <h1 className="text-4xl lg:text-6xl font-serif mb-4">{program.title}</h1>
              <p className="text-lg lg:text-xl opacity-90 max-w-2xl">{program.subtitle}</p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground py-4 lg:py-6 sticky top-20 lg:top-24 z-30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-wrap items-center gap-4 lg:gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Calendar size={18} />
                <span>{program.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={18} />
                <span>{program.duration}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={18} />
                <span>{program.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={18} />
                <span>{program.spotsLeft ?? "-"} yer kaldi</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xl lg:text-2xl font-serif">{program.price?.label}</span>
              <button
                onClick={() => setShowBookingForm(true)}
                className="px-6 py-2.5 bg-primary-foreground text-primary rounded-sm font-medium hover:bg-primary-foreground/90 transition-all"
              >
                Yerini Ayirt
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
          <div className="lg:col-span-2 space-y-12">
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl lg:text-4xl font-serif mb-6">Deneyimin Hikayesi</h2>
              <div className="prose prose-lg max-w-none text-foreground/80 leading-relaxed space-y-4">
                {storyParagraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl lg:text-4xl font-serif mb-6">Bu Deneyim Senin Icin Mi?</h2>
              <ul className="space-y-3">
                {(program.whoIsItFor || []).map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check size={20} className="text-secondary mt-1 flex-shrink-0" />
                    <span className="text-foreground/80">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl lg:text-4xl font-serif mb-6">Program Akisi</h2>
              <div className="space-y-6">
                {(program.programFlow || []).map((day, index) => (
                  <div key={index} className="border-l-2 border-secondary pl-6 pb-6">
                    <h3 className="text-xl font-serif mb-3 text-primary">{day.day}</h3>
                    <ul className="space-y-2">
                      {(day.activities || []).map((activity, actIndex) => (
                        <li key={actIndex} className="text-foreground/80 flex items-start gap-2">
                          <span className="text-secondary mt-1.5">•</span>
                          <span>{activity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </motion.section>

            {!!program.guide && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-muted/50 rounded-sm p-6 lg:p-8"
              >
                <h2 className="text-2xl lg:text-4xl font-serif mb-6">Rehberin</h2>
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={resolveMediaUrl(program.guide.image as any) || ""}
                      alt={program.guide.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif mb-1">{program.guide.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{program.guide.title}</p>
                    <p className="text-foreground/80 leading-relaxed">{program.guide.bio}</p>
                  </div>
                </div>
              </motion.section>
            )}

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl lg:text-4xl font-serif mb-6">Sikca Sorulan Sorular</h2>
              <Accordion type="single" collapsible className="space-y-4">
                {(program.faqs || []).map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="border border-border rounded-sm px-6"
                  >
                    <AccordionTrigger className="text-left hover:no-underline py-4">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-foreground/80 pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.section>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-40 space-y-6">
              <div className="bg-card border border-border rounded-sm p-6">
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-2">Fiyat</p>
                  <p className="text-3xl font-serif text-primary">{program.price?.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">Kisi basi, tum dahil</p>
                </div>

                {(program.spotsLeft || 0) <= 3 && (
                  <div className="mb-6 px-4 py-3 bg-accent/10 border border-accent rounded-sm">
                    <p className="text-sm font-medium text-accent-foreground">
                      Son {program.spotsLeft} yer kaldi!
                    </p>
                  </div>
                )}

                <button
                  onClick={() => setShowBookingForm(true)}
                  className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-sm font-medium hover:bg-accent transition-all mb-4"
                >
                  Yerini Ayirt
                </button>

                <button className="w-full px-6 py-2.5 border border-border text-foreground rounded-sm font-medium hover:bg-muted transition-all">
                  Basvuru Yap
                </button>

                <p className="text-xs text-muted-foreground mt-4 text-center">Hemen odeme yapmaniza gerek yok</p>
              </div>

              <div className="bg-card border border-border rounded-sm p-6">
                <h3 className="font-serif text-lg mb-4">Fiyata Dahil</h3>
                <ul className="space-y-2 mb-6">
                  {(program.included || []).map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check size={16} className="text-secondary mt-0.5 flex-shrink-0" />
                      <span className="text-foreground/80">{item}</span>
                    </li>
                  ))}
                </ul>

                <h3 className="font-serif text-lg mb-4">Fiyata Dahil Degil</h3>
                <ul className="space-y-2">
                  {(program.notIncluded || []).map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <X size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-foreground/80">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-muted/50 rounded-sm p-6">
                <h3 className="font-serif text-lg mb-3">Sorulariniz mi var?</h3>
                <p className="text-sm text-foreground/80 mb-4">Size yardimci olmaktan mutluluk duyariz</p>
                <a
                  href="mailto:hello@anakora.com"
                  className="text-sm text-primary hover:text-accent transition-colors font-medium"
                >
                  hello@anakora.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showBookingForm && (
        <div
          className="fixed inset-0 bg-foreground/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowBookingForm(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background rounded-sm p-8 max-w-md w-full"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-2xl font-serif mb-4">Rezervasyon</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Bilgilerinizi doldurun, size en kisa surede donus yapalim.
            </p>
            <form className="space-y-4" onSubmit={onSubmitBooking}>
              <input
                type="text"
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Adiniz Soyadiniz"
                className="w-full px-4 py-3 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="E-posta"
                className="w-full px-4 py-3 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                type="tel"
                required
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Telefon"
                className="w-full px-4 py-3 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Not (opsiyonel)"
                rows={3}
                className="w-full px-4 py-3 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowBookingForm(false)}
                  className="flex-1 px-6 py-3 border border-border rounded-sm hover:bg-muted transition-all"
                >
                  Iptal
                </button>
                <button
                  type="submit"
                  disabled={submitState === "loading"}
                  className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-sm hover:bg-accent transition-all disabled:opacity-70"
                >
                  {submitState === "loading" ? "Gonderiliyor" : "Gonder"}
                </button>
              </div>
              {submitState === "success" && <p className="text-sm text-primary">Basariyla gonderildi.</p>}
              {submitState === "error" && <p className="text-sm text-red-500">Gonderim basarisiz.</p>}
            </form>
          </motion.div>
        </div>
      )}

      <section className="py-16 lg:py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-5xl font-serif mb-8 text-center">Diger Deneyimler</h2>
          <div className="flex justify-center">
            <Link
              to="/deneyimler"
              className="inline-flex items-center gap-2 text-primary hover:text-accent font-medium transition-colors"
            >
              Tum Programlari Gor
              <ChevronDown size={20} className="rotate-[-90deg]" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
