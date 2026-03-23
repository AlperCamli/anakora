import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

interface ExperienceCardProps {
  id: string;
  title: string;
  category: string;
  image: string;
  description: string;
  featured?: boolean;
  ctaLabel?: string;
}

export function ExperienceCard({
  id,
  title,
  category,
  image,
  description,
  featured = false,
  ctaLabel = "Deneyimi Incele",
}: ExperienceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={`group ${featured ? "md:col-span-2" : ""}`}
    >
      <Link to={`/deneyimler/${id}`} className="block">
        <div className="relative overflow-hidden bg-muted rounded-sm">
          <div className={`aspect-[4/5] ${featured ? "md:aspect-[16/9]" : ""}`}>
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent opacity-60 group-hover:opacity-70 transition-opacity duration-300" />
          <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8 text-white">
            <p className="text-xs tracking-widest uppercase mb-2 opacity-90">
              {category}
            </p>
            <h3 className="text-2xl lg:text-3xl font-serif mb-3">{title}</h3>
            <p className="text-sm opacity-90 line-clamp-2 mb-4">{description}</p>
            <div className="flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all">
              {ctaLabel}
              <ArrowRight size={16} />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
