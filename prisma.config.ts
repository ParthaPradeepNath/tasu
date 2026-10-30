import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "bun prisma/seed.ts",
  },
  datasource: {
    // Prisma CLI (migrations, studio) uses the direct, non-pooled connection.
    url: env("DATABASE_URL_UNPOOLED"),
  },
});
