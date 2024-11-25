import YAML from "yaml";
import * as fs from "fs/promises";
import * as v from "valibot";

const ConfigSchema = v.object({
  repos: v.array(
    v.object({
      name: v.string(),
      url: v.union([v.string(), v.array(v.string())]),
      icon: v.optional(v.string()),
      firends: v.optional(v.array(v.string())),
    }),
  ),
});
export const GITHUB_PREFIX = "https://github.com/";
export async function loadConfig() {
  return v.parse(
    ConfigSchema,
    YAML.parse(await fs.readFile("config.yaml", "utf8")),
  );
}

export type Config = Awaited<ReturnType<typeof loadConfig>>;
