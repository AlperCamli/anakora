import { Link } from "react-router";
import { Calendar, MapPin } from "lucide-react";
import { motion } from "motion/react";

interface ProgramCardProps {
  id: string;
  title: string;
  location: string;
  date: string;
  duration: string;
  image: string;
  category: string;
  spotsLeft?: number;
  spotsLeftLabel?: string;
  ctaLabel?: string;
  separator?: string;
}

export function ProgramCard({
  id,
  title,
  location,
  date,
  duration,
  image,
  category,
  spotsLeft,
  spotsLeftLabel = "yer kaldi",
  ctaLabel = "Yerini Ayirt",
  separator = "-",
}: ProgramCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="group bg-card border border-border rounded-sm overflow-hidden hover:shadow-lg transition-all duration-300"
    >
      <Link to={`/deneyimler/${id}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {spotsLeft && spotsLeft <= 3 && (
            <div className="absolute top-4 right-4 px-3 py-1.5 bg-accent text-accent-foreground text-xs font-medium rounded-full">
              {spotsLeft} {spotsLeftLabel}
            </div>
          )}
        </div>
        <div className="p-5 lg:p-6">
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-2">
            {category}
          </p>
          <h3 className="text-xl lg:text-2xl font-serif mb-3 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-secondary" />
              <span>{date}</span>
              <span className="text-border">{separator}</span>
              <span>{duration}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-secondary" />
              <span>{location}</span>
            </div>
          </div>
          <button className="w-full py-2.5 border border-primary text-primary rounded-sm text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-all duration-300">
            {ctaLabel}
          </button>
        </div>
      </Link>
    </motion.div>
  );
}
