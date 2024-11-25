import "react-notion-x/src/styles.css";

import { NotionAPI } from "notion-client";
import NotionRenderer from "./notion-renderer";

export default async function HomePage() {
  const notion = new NotionAPI();
  const recordMap = await notion.getPage(
    "https://adevday.notion.site/Awesome-Explorer-1357a7280fe5807aa7a4f3c9e284ad3e",
  );

  return (
    <NotionRenderer recordMap={recordMap} fullPage={true} darkMode={false} />
  );
}
