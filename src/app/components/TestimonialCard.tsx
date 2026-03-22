import { motion } from "motion/react";
import { Quote } from "lucide-react";

interface TestimonialCardProps {
  quote: string;
  author: string;
  program: string;
  image?: string;
}

export function TestimonialCard({
  quote,
  author,
  program,
  image,
}: TestimonialCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="bg-card border border-border rounded-sm p-6 lg:p-8 relative"
    >
      <Quote
        size={32}
        className="text-secondary/30 mb-4"
        strokeWidth={1.5}
      />
      <blockquote className="text-base lg:text-lg leading-relaxed mb-6 italic text-foreground/90">
        "{quote}"
      </blockquote>
      <div className="flex items-center gap-4">
        {image && (
          <div className="w-12 h-12 rounded-full overflow-hidden bg-muted">
            <img
              src={image}
              alt={author}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div>
          <p className="font-medium text-foreground">{author}</p>
          <p className="text-sm text-muted-foreground">{program}</p>
        </div>
      </div>
    </motion.div>
  );
}
