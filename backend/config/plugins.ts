const splitCsv = (value = '') =>
  value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

export default ({ env }) => ({
  upload: {
    config:
      env('AWS_ACCESS_KEY_ID') && env('AWS_ACCESS_SECRET') && env('AWS_BUCKET')
        ? {
            provider: 'aws-s3',
            providerOptions: {
              s3Options: {
                credentials: {
                  accessKeyId: env('AWS_ACCESS_KEY_ID'),
                  secretAccessKey: env('AWS_ACCESS_SECRET'),
                },
                region: env('AWS_REGION'),
                params: {
                  Bucket: env('AWS_BUCKET'),
                },
              },
              baseUrl: env('AWS_CDN_URL') || undefined,
            },
            actionOptions: {
              upload: {},
              uploadStream: {},
              delete: {},
            },
          }
        : {},
  },
  email: {
    config: env('RESEND_API_KEY')
      ? {
          provider: 'resend',
          providerOptions: {
            apiKey: env('RESEND_API_KEY'),
          },
          settings: {
            defaultFrom: env('RESEND_FROM_EMAIL', 'no-reply@anakora.com'),
            defaultReplyTo: env('RESEND_REPLY_TO', env('ADMIN_NOTIFY_EMAIL', 'hello@anakora.com')),
          },
        }
      : {
          settings: {
            defaultFrom: env('RESEND_FROM_EMAIL', 'no-reply@anakora.com'),
            defaultReplyTo: env('RESEND_REPLY_TO', env('ADMIN_NOTIFY_EMAIL', 'hello@anakora.com')),
          },
        },
  },
  i18n: {
    enabled: true,
    config: {
      defaultLocale: 'tr',
      locales: splitCsv(env('I18N_LOCALES', 'tr,en')),
    },
  },
});

