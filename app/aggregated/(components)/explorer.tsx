"use client";
import { type GitHubRepo } from "@/lib/db/schema";
import {
  ActionIcon,
  Affix,
  AppShell,
  AppShellHeader,
  Burger,
  Transition,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconArrowUp } from "@tabler/icons-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import dynamic from "next/dynamic";
import { PropsWithChildren, useRef } from "react";
import { MoreItem } from "../[slug]/page";
import Card from "./card";

export const CardsList = (props: { items: GitHubRepo[] }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  // The virtualizer
  const rowVirtualizer = useVirtualizer({
    count: props.items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 144,
  });

  return (
    <>
      <Affix position={{ bottom: 20, right: 20 }}>
        <Transition
          transition="slide-up"
          mounted={(rowVirtualizer?.scrollOffset || 0) > 300}
        >
          {(transitionStyles) => (
            <ActionIcon
              size="xl"
              radius="100"
              className="shadow !opacity-50 hover:!opacity-100"
              style={transitionStyles}
              onClick={() => rowVirtualizer.scrollToIndex(0)}
            >
              <IconArrowUp />
            </ActionIcon>
          )}
        </Transition>
      </Affix>
      <div
        ref={parentRef}
        style={{
          height: `calc(100vh - 60px)`,
          overflow: "auto", // Make it scroll!
        }}
      >
        {/* The large inner element to hold all of the items */}
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {/* Only the visible items in the virtualizer, manually positioned to be in view */}
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const repo = props.items[virtualItem.index];
            return (
              <div
                key={virtualItem.key}
                className="pr-1.5"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <Card key={repo.id} repo={repo} />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export const ContentDynamic = dynamic(() => import("../(components)/content"), {
  ssr: false,
});
export const SidebarDynamic = dynamic(() => import("../(components)/sidebar"), {
  ssr: false,
});

export const HeaderDynamic = dynamic(() => import("../(components)/header"), {
  ssr: false,
});

export const Explorer = (
  props: PropsWithChildren<{
    slug: string;
    url: string;
    more: MoreItem[];
    name: string;
    icon?: string;
  }>,
) => {
  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 330,
        breakpoint: "md",
        collapsed: { mobile: !opened },
      }}
    >
      <AppShellHeader>
        <div className="flex-row flex items-center h-full px-4 gap-3">
          <Burger opened={opened} onClick={toggle} hiddenFrom="md" size="sm" />
          <a
            className="font-mono text-md group hover:bg-slate-100 hover:dark:bg-slate-700 p-2 rounded-lg transition max-sm:hidden"
            href="/"
          >
            <span className="group-hover:opacity-0 opacity-100 mr-1 transition-opacity ">
              😎
            </span>
            Awesome
          </a>

          <HeaderDynamic
            name={props.name}
            more={props.more}
            icon={props.icon}
          />
        </div>
      </AppShellHeader>

      {props.children}
    </AppShell>
  );
};
