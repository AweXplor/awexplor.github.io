import "react-notion-x/src/styles.css";

import { NotionAPI } from "notion-client";
import NotionRenderer from "./notion-renderer";

const NOTION_PAGE =
  "https://adevday.notion.site/Awesome-Explorer-1357a7280fe5807aa7a4f3c9e284ad3e";

// notion.so answers 403 Forbidden to the default node user agent, which fails
// the whole static export
const notion = new NotionAPI({
  kyOptions: {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    },
  },
});

/**
 * Notion wraps every record in an extra `value` level since __version__ 3,
 * react-notion-x still reads the flat `record.value` shape.
 */
function normalizeRecordMap<T>(recordMap: T) {
  for (const table of Object.values(recordMap as Record<string, unknown>)) {
    if (!table || typeof table !== "object") continue;
    for (const record of Object.values(table) as any[]) {
      if (record?.value?.value) record.value = record.value.value;
    }
  }
  return recordMap;
}

async function getPage(attempts = 3) {
  for (let attempt = 1; ; attempt++) {
    try {
      return normalizeRecordMap(await notion.getPage(NOTION_PAGE));
    } catch (error) {
      if (attempt >= attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
    }
  }
}

export default async function HomePage() {
  const recordMap = await getPage();

  return (
    <NotionRenderer recordMap={recordMap} fullPage={true} darkMode={false} />
  );
}
