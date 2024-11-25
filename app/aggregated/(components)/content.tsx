import { GitHubRepo } from "@/lib/db/schema";
import dayjs from "dayjs";
import MiniSearch from "minisearch";
import { Suspense, useEffect, useMemo, useRef } from "react";
import useSWR from "swr";
import { useSnapshot } from "valtio";
import Card, { CardSkeleton } from "./card";
import { CardsList } from "./explorer";
import { ExplorerState } from "./state";
import { notifications } from "@mantine/notifications";

export function ExplorerMainContent(props: { url: string }) {
  const { data } = useSWR(
    props.url,
    async (url) => {
      const resp = await fetch(url);
      const _items: GitHubRepo[] = await resp.json();
      // const topics: Record<string, number> = {};
      const items = _items.map((x) => {
        // x.topics?.map((topic) => (topics[topic] = (topics[topic] ?? 0) + 1));
        return Object.assign(x, { time: dayjs(x.pushedAt) });
      });

      return {
        items,
        map: Object.fromEntries(items.map((x, i) => [x.id, i])),
        // topics: Object.entries(topics).toSorted((a, b) => b[1] - a[1]),
      };
    },
    { suspense: true },
  );
  const state = useSnapshot(ExplorerState);
  const searcher = useRef<MiniSearch | null>(null);
  useEffect(() => {
    if (searcher.current === null) {
      searcher.current = new MiniSearch({
        fields: ["name", "description", "tags"],
        idField: "id",
      });
      searcher.current.addAllAsync(data.items);
    }
  });
  useEffect(() => {
    if (props.url.includes("selfhosted")) {
      notifications.show({
        autoClose: 3000,
        message: (
          <span className="text-xs">
            Data under CC-BY-SA 3.0 license, by the awesome-selfhosted
            community.
          </span>
        ),
      });
    }
  }, []);
  const filtered = useMemo(() => {
    const cur = dayjs();
    return data.items.filter(({ time, stars, forks }) => {
      const wellMaintained = time.add(2, "year").isAfter(cur);
      const popular = stars > 3000 || forks > 3000;
      if (state.popularOnly && !popular) return false;
      if (state.wellMaintainedOnly && !wellMaintained) return false;
      return true;
    });
  }, [data.items, state.popularOnly, state.wellMaintainedOnly]);
  const sorted = useMemo(() => {
    if (state.search !== "" && searcher.current) {
      const result = searcher.current.search(state.search, {
        boost: { name: 2 },
        prefix: true,
      });
      return result.map(({ id }) => data.items[data.map[id]]);
    } else if (state.sort === "popularity") {
      return filtered.toSorted((a, b) => -((a.stars || 0) - (b.stars || 0)));
    } else if (state.sort === "activity") {
      return filtered.toSorted((a, b) => -dayjs(a.time).diff(b.time));
    }
    return filtered;
  }, [filtered, state.sort, state.search]);
  return <CardsList items={sorted} />;
}

export default function ExplorerMainContentSuspense(props: {
  url: string;
  trending: GitHubRepo[];
}) {
  return (
    <Suspense
      fallback={
        <>
          <div className="hidden">
            {props.trending.map((x) => (
              <Card repo={x} key={x.id} />
            ))}
          </div>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </>
      }
    >
      <ExplorerMainContent url={props.url} />
    </Suspense>
  );
}
