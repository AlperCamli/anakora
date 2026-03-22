import { checkRateLimit } from '../../../utils/rate-limit';
import {
  bookingLeadSchema,
  contactLeadSchema,
  newsletterSchema,
  zodToFieldErrors,
} from '../../../utils/validators';
import { verifyCaptchaIfEnabled } from '../../../utils/captcha';
import {
  getAboutDTO,
  getArchiveDTO,
  getExperiencesDTO,
  getHomeDTO,
  getJournalListDTO,
  getJournalPostDTO,
  getLayoutDTO,
  getLegalPageDTO,
  getProgramDetailDTO,
  getSiteSettings,
} from '../services/public';

const sendAdminNotification = async (strapi: any, subject: string, html: string, text: string) => {
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!to) return;

  try {
    await strapi.plugin('email').service('email').send({
      to,
      subject,
      html,
      text,
    });
  } catch (error) {
    strapi.log.error('Admin notification send failed');
    strapi.log.error(error);
  }
};

const isRateLimited = (ctx: any, action: string) => {
  const ip = ctx.request.ip || 'unknown';
  return !checkRateLimit({
    key: `${action}:${ip}`,
    limit: 10,
    windowMs: 60 * 1000,
  });
};

const mapValidationError = (ctx: any, fieldErrors: Record<string, string>) => {
  ctx.status = 400;
  ctx.body = {
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid payload',
      fieldErrors,
    },
  };
};

const forbiddenSpam = (ctx: any) => {
  ctx.status = 400;
  ctx.body = {
    error: {
      code: 'SPAM_DETECTED',
      message: 'Invalid submission.',
    },
  };
};

const tooManyRequests = (ctx: any) => {
  ctx.status = 429;
  ctx.body = {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.',
    },
  };
};

const internalError = (ctx: any) => {
  ctx.status = 500;
  ctx.body = {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Unexpected server error.',
    },
  };
};

export default {
  async layout(ctx: any) {
    const data = await getLayoutDTO(strapi);
    ctx.body = { data };
  },

  async home(ctx: any) {
    const data = await getHomeDTO(strapi);
    ctx.body = { data };
  },

  async experiences(ctx: any) {
    const data = await getExperiencesDTO(strapi, {
      category: ctx.query.category,
      status: ctx.query.status,
      featured: ctx.query.featured,
      page: Number(ctx.query.page || 1),
      pageSize: Number(ctx.query.pageSize || 9),
    });

    ctx.body = { data };
  },

  async program(ctx: any) {
    const data = await getProgramDetailDTO(strapi, ctx.params.slug);

    if (!data) {
      ctx.notFound('Program not found');
      return;
    }

    ctx.body = { data };
  },

  async archive(ctx: any) {
    const data = await getArchiveDTO(strapi);
    ctx.body = { data };
  },

  async journal(ctx: any) {
    const data = await getJournalListDTO(strapi, {
      category: ctx.query.category,
      page: Number(ctx.query.page || 1),
      pageSize: Number(ctx.query.pageSize || 9),
    });

    ctx.body = { data };
  },

  async journalPost(ctx: any) {
    const data = await getJournalPostDTO(strapi, ctx.params.slug);

    if (!data) {
      ctx.notFound('Journal post not found');
      return;
    }

    ctx.body = { data };
  },

  async about(ctx: any) {
    const data = await getAboutDTO(strapi);
    ctx.body = { data };
  },

  async legal(ctx: any) {
    const data = await getLegalPageDTO(strapi, ctx.params.slug);

    if (!data) {
      ctx.notFound('Legal page not found');
      return;
    }

    ctx.body = { data };
  },

  async submitBookingLead(ctx: any) {
    if (isRateLimited(ctx, 'booking')) {
      return tooManyRequests(ctx);
    }

    const parsed = bookingLeadSchema.safeParse(ctx.request.body || {});
    if (!parsed.success) {
      return mapValidationError(ctx, zodToFieldErrors(parsed.error));
    }

    const payload = parsed.data;

    if (payload.honeypot) {
      return forbiddenSpam(ctx);
    }

    try {
      const settings = await getSiteSettings(strapi);
      const captchaOk = await verifyCaptchaIfEnabled(settings, payload.captchaToken);
      if (!captchaOk) {
        return forbiddenSpam(ctx);
      }

      const programRows = await strapi.entityService.findMany('api::program.program', {
        filters: { slug: payload.programSlug },
        fields: ['id', 'title'],
        limit: 1,
      });

      const program = programRows[0];
      if (!program) {
        return mapValidationError(ctx, { programSlug: 'Program not found' });
      }

      await strapi.entityService.create('api::lead-submission.lead-submission', {
        data: {
          type: 'booking',
          status: 'new',
          fullName: payload.fullName,
          email: payload.email,
          phone: payload.phone,
          message: payload.note || null,
          consent: payload.consent,
          sourceUrl: payload.sourceUrl || ctx.request.header.referer || null,
          payload,
          program: program.id,
        },
      });

      await sendAdminNotification(
        strapi,
        `New booking lead: ${program.title}`,
        `<h2>New booking lead</h2><p><strong>Name:</strong> ${payload.fullName}</p><p><strong>Email:</strong> ${payload.email}</p><p><strong>Phone:</strong> ${payload.phone}</p><p><strong>Program:</strong> ${program.title}</p><p><strong>Note:</strong> ${payload.note || '-'}</p>`,
        `New booking lead\nName: ${payload.fullName}\nEmail: ${payload.email}\nPhone: ${payload.phone}\nProgram: ${program.title}\nNote: ${payload.note || '-'}`,
      );

      ctx.body = {
        data: {
          accepted: true,
          message: 'Booking lead submitted.',
        },
      };
    } catch (error) {
      strapi.log.error(error);
      return internalError(ctx);
    }
  },

  async submitContactLead(ctx: any) {
    if (isRateLimited(ctx, 'contact')) {
      return tooManyRequests(ctx);
    }

    const parsed = contactLeadSchema.safeParse(ctx.request.body || {});
    if (!parsed.success) {
      return mapValidationError(ctx, zodToFieldErrors(parsed.error));
    }

    const payload = parsed.data;

    if (payload.honeypot) {
      return forbiddenSpam(ctx);
    }

    try {
      const settings = await getSiteSettings(strapi);
      const captchaOk = await verifyCaptchaIfEnabled(settings, payload.captchaToken);
      if (!captchaOk) {
        return forbiddenSpam(ctx);
      }

      await strapi.entityService.create('api::lead-submission.lead-submission', {
        data: {
          type: 'contact',
          status: 'new',
          fullName: payload.fullName,
          email: payload.email,
          phone: payload.phone || null,
          message: payload.message,
          consent: payload.consent,
          sourceUrl: payload.sourceUrl || ctx.request.header.referer || null,
          payload,
        },
      });

      await sendAdminNotification(
        strapi,
        `New contact lead: ${payload.fullName}`,
        `<h2>New contact lead</h2><p><strong>Name:</strong> ${payload.fullName}</p><p><strong>Email:</strong> ${payload.email}</p><p><strong>Phone:</strong> ${payload.phone || '-'}</p><p><strong>Message:</strong> ${payload.message}</p>`,
        `New contact lead\nName: ${payload.fullName}\nEmail: ${payload.email}\nPhone: ${payload.phone || '-'}\nMessage: ${payload.message}`,
      );

      ctx.body = {
        data: {
          accepted: true,
          message: 'Contact lead submitted.',
        },
      };
    } catch (error) {
      strapi.log.error(error);
      return internalError(ctx);
    }
  },

  async submitNewsletterLead(ctx: any) {
    if (isRateLimited(ctx, 'newsletter')) {
      return tooManyRequests(ctx);
    }

    const parsed = newsletterSchema.safeParse(ctx.request.body || {});
    if (!parsed.success) {
      return mapValidationError(ctx, zodToFieldErrors(parsed.error));
    }

    const payload = parsed.data;

    if (payload.honeypot) {
      return forbiddenSpam(ctx);
    }

    try {
      const settings = await getSiteSettings(strapi);
      const captchaOk = await verifyCaptchaIfEnabled(settings, payload.captchaToken);
      if (!captchaOk) {
        return forbiddenSpam(ctx);
      }

      const existing = await strapi.entityService.findMany(
        'api::newsletter-subscriber.newsletter-subscriber',
        {
          filters: { email: payload.email },
          limit: 1,
        },
      );

      if (existing?.length > 0) {
        await strapi.entityService.update(
          'api::newsletter-subscriber.newsletter-subscriber',
          existing[0].id,
          {
            data: {
              status: 'subscribed',
              source: payload.sourceUrl || ctx.request.header.referer || null,
            },
          },
        );
      } else {
        await strapi.entityService.create('api::newsletter-subscriber.newsletter-subscriber', {
          data: {
            email: payload.email,
            status: 'subscribed',
            source: payload.sourceUrl || ctx.request.header.referer || null,
            tags: ['web-form'],
          },
        });
      }

      await strapi.entityService.create('api::lead-submission.lead-submission', {
        data: {
          type: 'newsletter',
          status: 'new',
          email: payload.email,
          consent: payload.consent,
          sourceUrl: payload.sourceUrl || ctx.request.header.referer || null,
          payload,
        },
      });

      await sendAdminNotification(
        strapi,
        `New newsletter subscriber: ${payload.email}`,
        `<h2>New newsletter subscriber</h2><p>${payload.email}</p>`,
        `New newsletter subscriber: ${payload.email}`,
      );

      ctx.body = {
        data: {
          accepted: true,
          message: 'Newsletter subscription received.',
        },
      };
    } catch (error) {
      strapi.log.error(error);
      return internalError(ctx);
    }
  },
};

