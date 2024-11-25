import { defineConfig } from "drizzle-kit";
export default defineConfig({
  dialect: "sqlite",
  schema: "./lib/db/schema.mts",
  out: "./migration",
  dbCredentials: {
    url: "sqlite.db",
  },
});