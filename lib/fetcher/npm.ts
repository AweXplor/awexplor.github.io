import ky, { HTTPError } from "ky";
import * as v from "valibot";
const NpmPackageSchema = v.object({
  name: v.string(),
  homepage: v.string(),
  repository: v.object({
    url: v.string(),
  }),
});

async function getNpmPackageDetail(pkg: string) {
  const data = await ky.get(`https://replicate.npmjs.com/${pkg}`).json();
  return v.parse(NpmPackageSchema, data);
}

export async function getNpmPackageLastMonthDownloads(pkg: string) {
  const data: any = await ky
    .get(`https://api.npmjs.org/downloads/point/last-month/${pkg}`)
    .json();
  return data["downloads"] as number;
}
export async function tryGetNpmPackageName(id: string) {
  const check = (detail: Awaited<ReturnType<typeof getNpmPackageDetail>>) =>
    detail?.repository.url.includes(id);

  // first try the repo name
  try {
    const [owner, repo] = id.split("/");
    let detail = await getNpmPackageDetail(repo);
    if (detail && check(detail)) return repo;
    if (repo.endsWith(".js")) {
      detail = await getNpmPackageDetail(repo.slice(0, -3));
      if (detail && check(detail)) return repo;
    }
  } catch (e) {
    if (e instanceof HTTPError) {
      if (e.response.status === 404) {
        return undefined;
      }
    }
    throw e;
  }

  // try package.json @ root
  try {
    const data: any = await ky
      .get(`https://raw.githubusercontent.com/${id}/HEAD/package.json`)
      .json();
    const name = data["name"];
    let detail = await getNpmPackageDetail(name);
    if (detail && check(detail)) return name as string;
  } catch (e) {
    if (e instanceof HTTPError) {
      if (e.response.status === 404) {
        return undefined;
      }
    }
    throw e;
  }

  return undefined;
}
