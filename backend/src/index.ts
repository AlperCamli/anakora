import { seedData } from '../data/seed-data';

const ensureAdminRoles = async (strapi: any) => {
  const roles = [
    {
      name: 'Owner',
      code: 'owner',
      description: 'Full access role for ANAKORA owner',
    },
    {
      name: 'Editor',
      code: 'editor',
      description: 'Content/media/lead management without system settings',
    },
  ];

  for (const role of roles) {
    const existing = await strapi.db.query('admin::role').findOne({
      where: { code: role.code },
    });

    if (!existing) {
      await strapi.db.query('admin::role').create({ data: role });
      strapi.log.info(`Created admin role: ${role.name}`);
    }
  }
};

const upsertSingleType = async (strapi: any, uid: string, data: Record<string, any>) => {
  const existing = await strapi.entityService.findMany(uid);

  if (existing?.id) {
    return strapi.entityService.update(uid, existing.id, { data });
  }

  return strapi.entityService.create(uid, { data });
};

const findBySlug = async (strapi: any, uid: string, slug: string) => {
  const rows = await strapi.entityService.findMany(uid, {
    filters: { slug },
    limit: 1,
  });

  return rows?.[0] || null;
};

const seed = async (strapi: any) => {
  const shouldSeed = process.env.SEED_DEMO_DATA === 'true';
  if (!shouldSeed) {
    return;
  }

  strapi.log.info('SEED_DEMO_DATA=true, seeding demo content...');

  for (const category of seedData.categories) {
    const existing = await findBySlug(strapi, 'api::category.category', category.slug);

    if (!existing) {
      await strapi.entityService.create('api::category.category', {
        data: {
          ...category,
          publishedAt: new Date(),
        },
      });
    }
  }

  const categories = await strapi.entityService.findMany('api::category.category', {
    filters: { publishedAt: { $notNull: true } },
  });

  const categoryBySlug = new Map<string, any>();
  for (const category of categories) {
    categoryBySlug.set(category.slug, category);
  }

  for (const program of seedData.programs) {
    const existing = await findBySlug(strapi, 'api::program.program', program.slug);

    if (!existing) {
      await strapi.entityService.create('api::program.program', {
        data: {
          title: program.title,
          slug: program.slug,
          subtitle: program.subtitle,
          shortDescription: program.shortDescription,
          story: program.story,
          status: program.status,
          location: program.location,
          startDate: program.startDate,
          endDate: program.endDate,
          dateLabel: program.dateLabel,
          durationLabel: program.durationLabel,
          priceAmount: program.priceAmount,
          priceCurrency: program.priceCurrency,
          capacity: program.capacity,
          spotsLeft: program.spotsLeft,
          participantCount: program.participantCount,
          category: categoryBySlug.get(program.categorySlug)?.id,
          whoIsItFor: program.whoIsItFor.map((text) => ({ text })),
          included: program.included.map((text) => ({ text })),
          notIncluded: program.notIncluded.map((text) => ({ text })),
          faqs: program.faqs,
          programFlow: program.programFlow,
          guide: program.guide,
          archiveSummary: program.archiveSummary,
          isFeaturedHome: program.isFeaturedHome,
          isFeaturedExperience: program.isFeaturedExperience,
          publishedAt: new Date(),
        },
      });
    }
  }

  const programs = await strapi.entityService.findMany('api::program.program', {
    fields: ['id', 'slug'],
  });

  const programBySlug = new Map<string, any>();
  for (const program of programs) {
    programBySlug.set(program.slug, program);
  }

  for (const testimonial of seedData.testimonials) {
    const existing = await strapi.entityService.findMany('api::testimonial.testimonial', {
      filters: {
        author: testimonial.author,
        quote: testimonial.quote,
      },
      limit: 1,
    });

    if (!existing?.[0]) {
      await strapi.entityService.create('api::testimonial.testimonial', {
        data: {
          quote: testimonial.quote,
          author: testimonial.author,
          displayOrder: testimonial.displayOrder,
          program: programBySlug.get(testimonial.programSlug)?.id,
          publishedAt: new Date(),
        },
      });
    }
  }

  for (const post of seedData.journalPosts) {
    const existing = await findBySlug(strapi, 'api::journal-post.journal-post', post.slug);

    if (!existing) {
      await strapi.entityService.create('api::journal-post.journal-post', {
        data: {
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          authorName: post.authorName,
          publishedDate: post.publishedDate,
          readTimeMinutes: post.readTimeMinutes,
          featured: post.featured,
          category: categoryBySlug.get(post.categorySlug)?.id,
          publishedAt: new Date(),
        },
      });
    }
  }

  for (const legal of seedData.legalPages) {
    const existing = await findBySlug(strapi, 'api::legal-page.legal-page', legal.slug);

    if (!existing) {
      await strapi.entityService.create('api::legal-page.legal-page', {
        data: {
          ...legal,
          publishedAt: new Date(),
        },
      });
    }
  }

  const legalPages = await strapi.entityService.findMany('api::legal-page.legal-page', {
    fields: ['id'],
  });

  await upsertSingleType(strapi, 'api::site-settings.site-settings', {
    ...seedData.siteSettings,
    legalPages: legalPages.map((item: any) => item.id),
    publishedAt: new Date(),
  });

  await upsertSingleType(strapi, 'api::home-page.home-page', {
    hero: {
      title: 'ANAKORA',
      subtitle: 'Biz tur/kamp/tatil satmıyoruz, birlikte yaşanacak bir deneyim sunuyoruz.',
      buttons: [
        { label: 'Programları Keşfet', url: '/deneyimler', variant: 'primary' },
        { label: 'Hikayemizi Oku', url: '/hakkinda', variant: 'secondary' },
      ],
    },
    manifestoHeader: {
      eyebrow: 'Ana • Kora',
      title: 'Kökten Gelen, Yolda Devam Eden',
      description: 'Bize güvenen kurumlar ve topluluklar',
    },
    manifestoBody: 'ANAKORA, doğayla ve özle yeniden bağ kurmak için tasarlanmış deneyimler sunar.',
    experiencesHeader: {
      title: 'Deneyimler',
      description: 'Her biri özenle küratörlenen, dönüştürücü doğa deneyimleri',
    },
    upcomingProgramsHeader: {
      title: 'Yaklaşan Programlar',
      description: '2026 takvimi açıldı, yerini ayırt',
    },
    whyHeader: {
      title: 'Neden ANAKORA?',
      description: 'Bu bir tatil değil, bir dönüşüm yolculuğu',
    },
    whyItems: [
      { icon: { type: 'lucide', lucideName: 'Heart' }, title: 'Küratörlü Deneyim', description: 'Her program özenle tasarlanır.' },
      { icon: { type: 'lucide', lucideName: 'Users' }, title: 'Topluluk', description: 'Birlikte büyüyen bağlar kurun.' },
      { icon: { type: 'lucide', lucideName: 'Leaf' }, title: 'Doğayla Bağ', description: 'Doğanın ritmine uyum sağlayın.' },
      { icon: { type: 'lucide', lucideName: 'Compass' }, title: 'İç Yolculuk', description: 'Kendinize dönün.' },
    ],
    archiveHeader: {
      title: 'Geçmiş Deneyimler',
      description: 'Birlikte yaşadığımız anların görsel arşivi',
    },
    testimonialsHeader: {
      title: 'Katılımcılarımızdan',
      description: 'Deneyimlerin yankıları',
    },
    journalHeader: {
      title: 'Jürnal',
      description: 'Doğa, yolculuk ve iç keşif üzerine yazılar',
    },
    finalCta: {
      title: 'Yolculuğa Hazır mısın?',
      description: 'Doğaya dön, kendine dön, topluluğa dön.',
      primaryButton: { label: 'Yerini Ayırt', url: '/deneyimler', variant: 'primary' },
    },
    publishedAt: new Date(),
  });

  await upsertSingleType(strapi, 'api::about-page.about-page', {
    hero: {
      title: 'ANAKORA',
      subtitle: 'Kökten gelen, yolda devam eden.',
    },
    storyHeader: {
      title: 'Hikayemiz',
      description: 'ANAKORA, modern yaşamın hızına karşı yavaşlama alanı açmak için doğdu.',
    },
    storyBody:
      'ANAKORA, bir tur şirketi değil; doğayla, toplulukla ve iç sesle yeniden temas edilecek bir deneyim alanıdır.',
    valuesHeader: {
      title: 'Değerlerimiz',
      description: 'ANAKORA\'yı ANAKORA yapan değerler',
    },
    values: [
      { icon: { type: 'lucide', lucideName: 'Heart' }, title: 'Topluluk & Bağ', description: 'Derin bağlar kurmak için bir araya geliyoruz.' },
      { icon: { type: 'lucide', lucideName: 'Compass' }, title: 'İçsel Yolculuk', description: 'Dışa doğru giderken içe de dönüyoruz.' },
      { icon: { type: 'lucide', lucideName: 'Leaf' }, title: 'Doğayla Uyum', description: 'Doğanın elementleriyle yeniden tanışıyoruz.' },
      { icon: { type: 'lucide', lucideName: 'Users' }, title: 'Küratörlü Deneyim', description: 'Her detay özenle tasarlanır.' },
    ],
    founderEyebrow: 'Kurucu & Rehber',
    founderName: 'Elif Yılmaz',
    founderBody: 'ANAKORA bir işten öte bir çağrı ve yaşam biçimi olarak doğdu.',
    philosophyHeader: {
      title: 'Felsefemiz',
      description: 'Doğa öğretmendir, topluluk destektir, yolculuk iç keşiftir.',
    },
    philosophyBody:
      'Modern yaşam bizi hızlandırdı; ANAKORA yavaşlamayı, bütünleşmeyi ve yeniden bağlanmayı önerir.',
    cta: {
      title: 'Bize Katıl',
      description: 'Bir sonraki deneyimde sen de ol.',
      primaryButton: { label: 'Deneyimleri Keşfet', url: '/deneyimler', variant: 'primary' },
      secondaryButton: { label: 'Bize Ulaş', url: 'mailto:hello@anakora.com', variant: 'secondary' },
    },
    publishedAt: new Date(),
  });

  await upsertSingleType(strapi, 'api::experiences-page-settings.experiences-page-settings', {
    header: {
      title: 'Deneyimler',
      description: 'Her biri özenle tasarlanmış, dönüştürücü doğa deneyimleri.',
    },
    bottomContact: {
      title: 'Programlar Hakkında Soru mu Var?',
      description: 'Size en uygun deneyimi bulmak için buradayız.',
      email: 'hello@anakora.com',
    },
    publishedAt: new Date(),
  });

  await upsertSingleType(strapi, 'api::journal-page-settings.journal-page-settings', {
    header: {
      title: 'Jürnal',
      description: 'Doğa, yolculuk, topluluk ve iç keşif üzerine düşünceler.',
    },
    newsletterCta: {
      title: 'Yeni Yazılardan Haberdar Ol',
      description: 'ANAKORA jürnalinden yeni içerikler e-postana gelsin.',
      primaryButton: {
        label: 'Abone Ol',
        url: '#newsletter',
        variant: 'primary',
      },
    },
    newsletterPlaceholder: 'E-posta adresin',
    newsletterButtonLabel: 'Abone Ol',
    publishedAt: new Date(),
  });

  await upsertSingleType(strapi, 'api::archive-page-settings.archive-page-settings', {
    header: {
      title: 'Arşiv',
      description: 'Birlikte yaşadığımız, paylaştığımız, büyüdüğümüz anların görsel hafızası.',
    },
    stats: [
      { value: '12+', label: 'Gerçekleşen Deneyim' },
      { value: '200+', label: 'Katılımcı' },
      { value: '8', label: 'Farklı Lokasyon' },
      { value: '3', label: 'Yıllık Tecrübe' },
    ],
    cta: {
      title: 'Bir Sonraki Hikayeye Dahil Ol',
      description: '2026 takvimimiz açıldı.',
      primaryButton: {
        label: 'Yaklaşan Programlar',
        url: '/deneyimler',
        variant: 'primary',
      },
    },
    publishedAt: new Date(),
  });

  strapi.log.info('Demo seed finished.');
};

export default {
  register() {},

  async bootstrap({ strapi }) {
    await ensureAdminRoles(strapi);
    await seed(strapi);
  },
};

