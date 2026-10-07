import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // `prisma generate` does not need a live database, so CI can generate the
    // client without DATABASE_URL. Migrations fail loudly if it is missing.
    url: process.env.DATABASE_URL ?? "",
  },
});
