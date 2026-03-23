import type { TestimonialRow, TestimonialTranslationRow } from "../db-rows";
import type { TestimonialDTO } from "../types";
import { normalizeMedia } from "../utils";

export function mapTestimonialDTO(
  testimonial: TestimonialRow,
  translation: TestimonialTranslationRow | null,
  relatedProgramSlug: string | null,
): TestimonialDTO {
  return {
    id: testimonial.id,
    slug: testimonial.slug,
    quote: translation?.quote ?? "",
    authorName: translation?.author_name ?? "",
    authorTitle: translation?.author_title ?? null,
    rating: testimonial.rating,
    date: testimonial.testimonial_date,
    image: normalizeMedia(
      testimonial.author_image_url,
      translation?.author_name ?? null,
    ),
    isFeatured: testimonial.is_featured,
    relatedProgramSlug,
  };
}
