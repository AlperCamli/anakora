export default {
  routes: [
    {
      method: 'GET',
      path: '/public/layout',
      handler: 'public.layout',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/public/home',
      handler: 'public.home',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/public/experiences',
      handler: 'public.experiences',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/public/programs/:slug',
      handler: 'public.program',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/public/archive',
      handler: 'public.archive',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/public/journal',
      handler: 'public.journal',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/public/journal/:slug',
      handler: 'public.journalPost',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/public/about',
      handler: 'public.about',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/public/legal/:slug',
      handler: 'public.legal',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/public/leads/booking',
      handler: 'public.submitBookingLead',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/public/leads/contact',
      handler: 'public.submitContactLead',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/public/leads/newsletter',
      handler: 'public.submitNewsletterLead',
      config: { auth: false },
    }
  ]
}

