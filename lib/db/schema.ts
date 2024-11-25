import { InferSelectModel } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import * as v from "valibot";

// Define the AwesomeGithubItemStars schema using valibot
export const GithubRepoStarsSchema = v.object({
  total: v.number(),
  week: v.optional(v.number()),
  month: v.optional(v.number()),
  year: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
});
export type GithubRepoStarsSchema = v.InferInput<typeof GithubRepoStarsSchema>;

// Define the AwesomeGithubRepository table
export const awesomeRepoTable = sqliteTable("awesome_repo", {
  id: text("id").primaryKey().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$default(() => new Date())
    .$onUpdate(() => new Date()),
  readmeDigest: text("readme_digest").notNull(),
  items: text("items", { mode: "json" }).$type<string[]>().notNull(),
});

// Define the AwesomeGithubItem table
export const githubRepoTable = sqliteTable("github_repo", {
  id: text("id").primaryKey().notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  topics: text("topics", { mode: "json" }).$type<string[]>(),
  owner: text("owner", { mode: "json" })
    .$type<{ name: string; avatarUrl: string }>()
    .notNull(),

  stars: integer("stars").notNull(),
  starsDetail: text("stars_detail", {
    mode: "json",
  }).$type<GithubRepoStarsSchema>(),
  license: text("license"),
  forks: integer("forks").notNull(),
  primaryLanguage: text("primary_language").notNull(),
  pushedAt: integer("pushed_at", { mode: "timestamp" }).notNull(),
  archived: integer("archived", { mode: "boolean" }),

  npmPackage: text("npm_package"),
  npmLastMonthDownloads: integer("npm_package_downloads_last_month"),

  goPackage: text("go_package"),
  goImportedBy: integer("go_imported_by"),

  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$default(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$default(() => new Date()),
});

export type GitHubRepo = InferSelectModel<typeof githubRepoTable>;
