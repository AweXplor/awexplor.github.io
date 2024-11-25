import ky, { HTTPError } from "ky";

export async function getGoImportedBy(pkg: string) {
  const RE = /Imported By: ([\d,]*)/;
  const controller = new AbortController();
  const resp = await ky.get(`https://pkg.go.dev/${pkg}`, {
    signal: controller.signal,
    timeout: false,
  });
  const stream = resp.body!;
  const decoderStream = stream.pipeThrough(new TextDecoderStream("utf-8"));
  const reader = decoderStream.getReader();
  let ring = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) return 0;
    ring.push(value);
    const matched = ring.join("").match(RE);
    if (matched) {
      controller.abort();
      return parseInt(matched[1].replaceAll(",", ""), 10);
    }
    ring.shift();
  }
}

export async function tryGetGoPackageNameAndImportedCount(
  id: string,
): Promise<[string, number] | undefined> {
  const RE = /^module (.*)\s?/;
  try {
    const data = await ky
      .get(`https://raw.githubusercontent.com/${id}/HEAD/go.mod`, {
        timeout: false,
      })
      .text();
    const matched = data.match(RE);
    if (!matched) return undefined;
    let name = matched[1];
    if (name.startsWith('"') || name.startsWith("'")) name = name.slice(1);
    if (name.endsWith('"') || name.endsWith("'")) name = name.slice(0, -1);
    const importedBy = await getGoImportedBy(name);
    return [name, importedBy];
  } catch (e) {
    if (e instanceof HTTPError) {
      if (e.response.status === 404 || e.response.status === 500) {
        return undefined;
      }
    }
    throw e;
  }

  return undefined;
}
