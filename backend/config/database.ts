export default ({ env }) => {
  const client = env('DATABASE_CLIENT', 'postgres');

  return {
    connection: {
      client,
      connection: {
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'anakora'),
        user: env('DATABASE_USERNAME', 'postgres'),
        password: env('DATABASE_PASSWORD', 'postgres'),
        ssl: env.bool('DATABASE_SSL', false) ? { rejectUnauthorized: false } : false,
      },
      pool: { min: 2, max: 10 },
      acquireConnectionTimeout: 60000,
    },
  };
};

