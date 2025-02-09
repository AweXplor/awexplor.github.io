import { proxy } from "valtio";

export const ExplorerState = proxy({
  sort: "original" as null | "popularity" | "original" | "activity",
  wellMaintainedOnly: false as boolean,
  search: "" as string,
  popularOnly: false as boolean,
  popularThreshold: {
    starsMoreThan: 3000,
    forksMoreThan: 3000
  },
  macosNativeOnly: true as boolean,
  wellMaintainedThreshold: {
    count: 2,
    unit: 'year' as 'year' | 'month' | 'day'
  },
  topics: null as string[] | null,
  sources: null as string[] | null,
});
