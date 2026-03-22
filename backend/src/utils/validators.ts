import { z } from 'zod';

export const bookingLeadSchema = z.object({
  programSlug: z.string().min(1),
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  note: z.string().optional(),
  consent: z.boolean().refine((value) => value === true),
  honeypot: z.string().optional(),
  captchaToken: z.string().optional(),
  sourceUrl: z.string().optional(),
});

export const contactLeadSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().min(5),
  consent: z.boolean().refine((value) => value === true),
  honeypot: z.string().optional(),
  captchaToken: z.string().optional(),
  sourceUrl: z.string().optional(),
});

export const newsletterSchema = z.object({
  email: z.string().email(),
  consent: z.boolean().refine((value) => value === true),
  honeypot: z.string().optional(),
  captchaToken: z.string().optional(),
  sourceUrl: z.string().optional(),
});

export const zodToFieldErrors = (error: z.ZodError) => {
  return error.issues.reduce<Record<string, string>>((acc, issue) => {
    const key = issue.path.join('.') || 'root';
    acc[key] = issue.message;
    return acc;
  }, {});
};

