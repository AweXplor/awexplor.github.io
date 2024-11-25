import { loadConfig } from "#awep/lib/config";
import RandomRediect from "./random-rediect";

export default async function Lucky() {
  const config = await loadConfig();
  const names = config.repos.map((x) => x.name.toLowerCase());
  return <RandomRediect names={names} />;
}
