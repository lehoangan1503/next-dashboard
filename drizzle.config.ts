import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
  schema: './app/lib/drizzle/schema.ts',
  out: './app/lib/drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DB_URL as string,
  },
  verbose: true,
  strict: true,
});
