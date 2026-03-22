import { normalizeMedia, normalizeMediaArray } from '../../../utils/media';

const mapIcon = (icon: any) => {
  if (!icon) {
    return null;
  }

  if (icon.type || icon.lucideName || icon.svg) {
    return {
      type: icon.type || 'lucide',
      lucideName: icon.lucideName || null,
      svgUrl: normalizeMedia(icon.svg)?.url || null,
    };
  }

  return {
    type: icon.sourceType || 'lucide',
    lucideName: icon.lucideName || null,
    svgUrl: normalizeMedia(icon.svg)?.url || null,
  };
};

const mapButton = (button: any) => {
  if (!button) return null;
  return {
    label: button.label,
    url: button.url,
    variant: button.variant || 'primary',
    openInNewTab: Boolean(button.openInNewTab),
  };
};

const mapCta = (cta: any) => {
  if (!cta) return null;
  return {
    title: cta.title,
    description: cta.description || null,
    primaryButton: mapButton(cta.primaryButton),
    secondaryButton: mapButton(cta.secondaryButton),
  };
};

const mapNavItem = (item: any) => ({
  label: item.label,
  url: item.url,
  sortOrder: item.sortOrder ?? 0,
});

const mapCategory = (category: any) => {
  if (!category) return null;
  return {
    name: category.name,
    slug: category.slug,
    type: category.type,
    icon: mapIcon(category.icon),
  };
};

const toDateLabel = (program: any) => {
  if (program.dateLabel) return program.dateLabel;
  if (!program.startDate) return null;

  const start = new Date(program.startDate).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (!program.endDate) return start;

  const end = new Date(program.endDate).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `${start} - ${end}`;
};

export const getLayoutDTO = async (strapi: any) => {
  const settings = await strapi.entityService.findMany('api::site-settings.site-settings', {
    populate: {
      defaultSeo: { populate: ['shareImage'] },
      headerNavigation: true,
      footerNavigation: true,
      mobileStickyCta: {
        populate: {
          primaryButton: true,
          secondaryButton: true,
        },
      },
      legalPages: true,
    },
  });

  return {
    brandName: settings?.brandName || 'ANAKORA',
    contact: {
      email: settings?.contactEmail || null,
      instagramUrl: settings?.instagramUrl || null,
    },
    seo: settings?.defaultSeo
      ? {
          metaTitle: settings.defaultSeo.metaTitle,
          metaDescription: settings.defaultSeo.metaDescription || null,
          ogTitle: settings.defaultSeo.ogTitle || null,
          ogDescription: settings.defaultSeo.ogDescription || null,
          shareImage: normalizeMedia(settings.defaultSeo.shareImage),
        }
      : null,
    headerNavigation: (settings?.headerNavigation || []).map(mapNavItem).sort((a: any, b: any) => a.sortOrder - b.sortOrder),
    footerNavigation: (settings?.footerNavigation || []).map(mapNavItem).sort((a: any, b: any) => a.sortOrder - b.sortOrder),
    mobileStickyCta: mapCta(settings?.mobileStickyCta),
    legalLinks:
      settings?.legalPages?.map((page: any) => ({ title: page.title, slug: page.slug })) || [],
    footerCopyright: settings?.footerCopyright || null,
  };
};

export const mapProgramCardDTO = (program: any) => ({
  id: program.id,
  title: program.title,
  slug: program.slug,
  shortDescription: program.shortDescription || null,
  location: program.location,
  date: toDateLabel(program),
  duration: program.durationLabel,
  category: program.category?.name || null,
  categorySlug: program.category?.slug || null,
  image: normalizeMedia(program.heroImage),
  spotsLeft: program.spotsLeft ?? null,
  status: program.status,
  featured: Boolean(program.isFeaturedHome || program.isFeaturedExperience),
});

export const getHomeDTO = async (strapi: any) => {
  const [home, featuredPrograms, testimonials, journalPosts] = await Promise.all([
    strapi.entityService.findMany('api::home-page.home-page', {
      populate: {
        hero: { populate: { backgroundImage: true, buttons: true } },
        manifestoHeader: true,
        partnerLogos: { populate: ['image'] },
        experiencesHeader: true,
        upcomingProgramsHeader: true,
        whyHeader: true,
        whyItems: { populate: { icon: { populate: ['svg'] } } },
        archiveHeader: true,
        archivePreviewImages: true,
        testimonialsHeader: true,
        journalHeader: true,
        finalCta: { populate: { primaryButton: true, secondaryButton: true } },
      },
    }),
    strapi.entityService.findMany('api::program.program', {
      filters: { status: 'published', isFeaturedHome: true },
      populate: { heroImage: true, category: true },
      sort: { startDate: 'asc' },
      limit: 6,
    }),
    strapi.entityService.findMany('api::testimonial.testimonial', {
      populate: { authorImage: true, program: true },
      sort: { displayOrder: 'asc' },
      limit: 6,
    }),
    strapi.entityService.findMany('api::journal-post.journal-post', {
      filters: { publishedAt: { $notNull: true } },
      populate: { featuredImage: true, category: true },
      sort: { publishedDate: 'desc' },
      limit: 4,
    }),
  ]);

  return {
    hero: home?.hero
      ? {
          title: home.hero.title,
          subtitle: home.hero.subtitle || null,
          backgroundImage: normalizeMedia(home.hero.backgroundImage),
          buttons: (home.hero.buttons || []).map(mapButton),
        }
      : null,
    manifesto: {
      header: home?.manifestoHeader || null,
      body: home?.manifestoBody || null,
      partnerLogos: (home?.partnerLogos || []).map((logo: any) => ({
        name: logo.name,
        image: normalizeMedia(logo.image),
        href: logo.href || null,
      })),
    },
    sectionHeaders: {
      experiences: home?.experiencesHeader || null,
      upcomingPrograms: home?.upcomingProgramsHeader || null,
      why: home?.whyHeader || null,
      archive: home?.archiveHeader || null,
      testimonials: home?.testimonialsHeader || null,
      journal: home?.journalHeader || null,
    },
    whyItems: (home?.whyItems || []).map((item: any) => ({
      icon: mapIcon(item.icon),
      title: item.title,
      description: item.description,
    })),
    archivePreviewImages: normalizeMediaArray(home?.archivePreviewImages),
    featuredPrograms: (featuredPrograms || []).map(mapProgramCardDTO),
    testimonials: (testimonials || []).map((item: any) => ({
      quote: item.quote,
      author: item.author,
      program: item.program?.title || null,
      image: normalizeMedia(item.authorImage),
    })),
    journalPreview: (journalPosts || []).map((post: any) => ({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      date: post.publishedDate,
      image: normalizeMedia(post.featuredImage),
    })),
    finalCta: mapCta(home?.finalCta),
  };
};

export const getExperiencesDTO = async (
  strapi: any,
  query: { category?: string; status?: string; featured?: string; page?: number; pageSize?: number },
) => {
  const page = Number(query.page || 1);
  const pageSize = Number(query.pageSize || 9);
  const start = (page - 1) * pageSize;

  const where: any = {};

  if (query.category) {
    where.category = { slug: query.category };
  }

  if (query.status) {
    where.status = query.status;
  } else {
    where.status = { $in: ['published', 'completed'] };
  }

  if (query.featured === 'true') {
    where.isFeaturedExperience = true;
  }

  const [settings, categories, items, total] = await Promise.all([
    strapi.entityService.findMany('api::experiences-page-settings.experiences-page-settings', {
      populate: { header: true, bottomContact: true },
    }),
    strapi.entityService.findMany('api::category.category', {
      filters: { type: 'program', publishedAt: { $notNull: true } },
      populate: { icon: { populate: ['svg'] } },
      sort: { sortOrder: 'asc' },
    }),
    strapi.entityService.findMany('api::program.program', {
      filters: where,
      populate: { heroImage: true, category: { populate: ['icon'] } },
      sort: [{ startDate: 'asc' }, { createdAt: 'desc' }],
      start,
      limit: pageSize,
    }),
    strapi.db.query('api::program.program').count({ where }),
  ]);

  return {
    header: settings?.header || null,
    contact: settings?.bottomContact || null,
    filters: categories.map((category: any) => ({
      id: category.slug,
      label: category.name,
      icon: mapIcon(category.icon),
    })),
    items: items.map(mapProgramCardDTO),
    pagination: {
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
      total,
    },
  };
};

export const getProgramDetailDTO = async (strapi: any, slug: string) => {
  const rows = await strapi.entityService.findMany('api::program.program', {
    filters: { slug, status: { $in: ['published', 'completed'] } },
    populate: {
      heroImage: true,
      gallery: true,
      category: { populate: { icon: { populate: ['svg'] } } },
      guide: { populate: ['image'] },
      whoIsItFor: true,
      programFlow: true,
      included: true,
      notIncluded: true,
      faqs: true,
    },
    limit: 1,
  });

  const program = rows?.[0];
  if (!program) return null;

  return {
    id: program.id,
    title: program.title,
    slug: program.slug,
    subtitle: program.subtitle || null,
    category: mapCategory(program.category),
    location: program.location,
    date: toDateLabel(program),
    duration: program.durationLabel,
    price: {
      amount: Number(program.priceAmount || 0),
      currency: program.priceCurrency || 'TRY',
      label: `${program.priceAmount || 0} ${program.priceCurrency || 'TRY'}`,
    },
    capacity: program.capacity,
    spotsLeft: program.spotsLeft,
    participantCount: program.participantCount,
    status: program.status,
    image: normalizeMedia(program.heroImage),
    gallery: normalizeMediaArray(program.gallery),
    story: program.story,
    shortDescription: program.shortDescription,
    guide: program.guide
      ? {
          name: program.guide.name,
          title: program.guide.title,
          bio: program.guide.bio,
          image: normalizeMedia(program.guide.image),
        }
      : null,
    whoIsItFor: (program.whoIsItFor || []).map((item: any) => item.text),
    programFlow: (program.programFlow || []).map((item: any) => ({
      day: item.dayTitle,
      activities: Array.isArray(item.activities) ? item.activities : [],
    })),
    included: (program.included || []).map((item: any) => item.text),
    notIncluded: (program.notIncluded || []).map((item: any) => item.text),
    faqs: (program.faqs || []).map((item: any) => ({ question: item.question, answer: item.answer })),
  };
};

export const getArchiveDTO = async (strapi: any) => {
  const [settings, completed] = await Promise.all([
    strapi.entityService.findMany('api::archive-page-settings.archive-page-settings', {
      populate: { header: true, stats: true, cta: { populate: ['primaryButton', 'secondaryButton'] } },
    }),
    strapi.entityService.findMany('api::program.program', {
      filters: { status: 'completed' },
      populate: { heroImage: true, category: true },
      sort: [{ startDate: 'desc' }, { createdAt: 'desc' }],
      limit: 100,
    }),
  ]);

  const grouped = completed.reduce<Record<string, any[]>>((acc, item) => {
    const year = item.startDate ? new Date(item.startDate).getFullYear().toString() : 'Unknown';
    if (!acc[year]) acc[year] = [];

    acc[year].push({
      title: item.title,
      slug: item.slug,
      location: item.location,
      date: toDateLabel(item),
      participants: item.participantCount || item.capacity || null,
      description: item.archiveSummary || item.shortDescription || null,
      image: normalizeMedia(item.heroImage),
      category: item.category?.name || null,
    });

    return acc;
  }, {});

  const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));

  return {
    header: settings?.header || null,
    years,
    groups: years.map((year) => ({ year, items: grouped[year] })),
    stats: (settings?.stats || []).map((item: any) => ({ value: item.value, label: item.label })),
    cta: mapCta(settings?.cta),
  };
};

export const getJournalListDTO = async (
  strapi: any,
  query: { category?: string; page?: number; pageSize?: number },
) => {
  const page = Number(query.page || 1);
  const pageSize = Number(query.pageSize || 9);
  const start = (page - 1) * pageSize;

  const where: any = {
    publishedAt: { $notNull: true },
  };

  if (query.category && query.category !== 'all') {
    where.category = { slug: query.category };
  }

  const [settings, categories, featuredRows, rows, total] = await Promise.all([
    strapi.entityService.findMany('api::journal-page-settings.journal-page-settings', {
      populate: {
        header: true,
        newsletterCta: { populate: ['primaryButton', 'secondaryButton'] },
      },
    }),
    strapi.entityService.findMany('api::category.category', {
      filters: { type: 'journal', publishedAt: { $notNull: true } },
      sort: { sortOrder: 'asc' },
    }),
    strapi.entityService.findMany('api::journal-post.journal-post', {
      filters: { featured: true, publishedAt: { $notNull: true } },
      populate: { featuredImage: true, category: true },
      sort: { publishedDate: 'desc' },
      limit: 1,
    }),
    strapi.entityService.findMany('api::journal-post.journal-post', {
      filters: where,
      populate: { featuredImage: true, category: true },
      sort: { publishedDate: 'desc' },
      start,
      limit: pageSize,
    }),
    strapi.db.query('api::journal-post.journal-post').count({ where }),
  ]);

  const mapPost = (post: any) => ({
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    author: post.authorName,
    date: post.publishedDate,
    readTimeMinutes: post.readTimeMinutes,
    readTimeLabel: `${post.readTimeMinutes} dk`,
    category: post.category?.name || null,
    categorySlug: post.category?.slug || null,
    featured: post.featured,
    image: normalizeMedia(post.featuredImage),
  });

  return {
    header: settings?.header || null,
    categories: [
      { label: 'Tümü', slug: 'all' },
      ...categories.map((category: any) => ({ label: category.name, slug: category.slug })),
    ],
    featuredPost: featuredRows[0] ? mapPost(featuredRows[0]) : null,
    items: rows.map(mapPost),
    newsletter: {
      cta: mapCta(settings?.newsletterCta),
      placeholder: settings?.newsletterPlaceholder || 'E-posta adresin',
      buttonLabel: settings?.newsletterButtonLabel || 'Abone Ol',
    },
    pagination: {
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
      total,
    },
  };
};

export const getJournalPostDTO = async (strapi: any, slug: string) => {
  const rows = await strapi.entityService.findMany('api::journal-post.journal-post', {
    filters: { slug, publishedAt: { $notNull: true } },
    populate: { featuredImage: true, category: true, seo: { populate: ['shareImage'] } },
    limit: 1,
  });

  const post = rows?.[0];
  if (!post) return null;

  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    author: post.authorName,
    date: post.publishedDate,
    readTimeMinutes: post.readTimeMinutes,
    readTimeLabel: `${post.readTimeMinutes} dk`,
    category: post.category?.name || null,
    categorySlug: post.category?.slug || null,
    image: normalizeMedia(post.featuredImage),
    seo: post.seo
      ? {
          metaTitle: post.seo.metaTitle,
          metaDescription: post.seo.metaDescription || null,
          ogTitle: post.seo.ogTitle || null,
          ogDescription: post.seo.ogDescription || null,
          shareImage: normalizeMedia(post.seo.shareImage),
        }
      : null,
  };
};

export const getAboutDTO = async (strapi: any) => {
  const about = await strapi.entityService.findMany('api::about-page.about-page', {
    populate: {
      hero: { populate: ['backgroundImage', 'buttons'] },
      storyHeader: true,
      storyImage: true,
      valuesHeader: true,
      values: { populate: { icon: { populate: ['svg'] } } },
      founderImage: true,
      philosophyHeader: true,
      cta: { populate: ['primaryButton', 'secondaryButton'] },
    },
  });

  return {
    hero: about?.hero
      ? {
          title: about.hero.title,
          subtitle: about.hero.subtitle,
          backgroundImage: normalizeMedia(about.hero.backgroundImage),
          buttons: (about.hero.buttons || []).map(mapButton),
        }
      : null,
    story: {
      header: about?.storyHeader || null,
      body: about?.storyBody || null,
      image: normalizeMedia(about?.storyImage),
    },
    values: {
      header: about?.valuesHeader || null,
      items: (about?.values || []).map((item: any) => ({
        icon: mapIcon(item.icon),
        title: item.title,
        description: item.description,
      })),
    },
    founder: {
      eyebrow: about?.founderEyebrow || null,
      name: about?.founderName || null,
      body: about?.founderBody || null,
      image: normalizeMedia(about?.founderImage),
    },
    philosophy: {
      header: about?.philosophyHeader || null,
      body: about?.philosophyBody || null,
    },
    cta: mapCta(about?.cta),
  };
};

export const getLegalPageDTO = async (strapi: any, slug: string) => {
  const rows = await strapi.entityService.findMany('api::legal-page.legal-page', {
    filters: { slug, publishedAt: { $notNull: true } },
    populate: { seo: { populate: ['shareImage'] } },
    limit: 1,
  });

  const page = rows?.[0];
  if (!page) return null;

  return {
    title: page.title,
    slug: page.slug,
    content: page.content,
    seo: page.seo
      ? {
          metaTitle: page.seo.metaTitle,
          metaDescription: page.seo.metaDescription || null,
          ogTitle: page.seo.ogTitle || null,
          ogDescription: page.seo.ogDescription || null,
          shareImage: normalizeMedia(page.seo.shareImage),
        }
      : null,
  };
};

export const getSiteSettings = async (strapi: any) =>
  strapi.entityService.findMany('api::site-settings.site-settings', {
    fields: ['contactEmail', 'spamProtectionEnabled', 'captchaProvider', 'captchaSecretKey'],
  });

