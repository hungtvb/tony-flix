import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/lib/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://tonyflix:tonyflix123@127.0.0.1:5432/tonyflix',
  },
  verbose: true,
  strict: true,
})
