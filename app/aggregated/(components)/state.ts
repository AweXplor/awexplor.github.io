import { proxy } from "valtio";

export const ExplorerState = proxy({
  sort: "original" as null | "popularity" | "original" | "activity",
  wellMaintainedOnly: false as boolean,
  search: "" as string,
  popularOnly: false as boolean,
  topics: null as string[] | null,
  sources: null as string[] | null,
});
