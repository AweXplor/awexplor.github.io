"use client";
import type { GitHubRepo } from "@/lib/db/schema";
import { Badge, Skeleton } from "@mantine/core";
import cx from "clsx";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { PropsWithChildren } from "react";
dayjs.extend(relativeTime);
import {
  IconActivity,
  IconGitFork,
  IconSkull,
  IconStarFilled,
} from "@tabler/icons-react";
// @ts-ignore
import huamanReadableNumbers from "human-readable-numbers";
import { ExplorerState } from "./state";
const { toHumanString } = huamanReadableNumbers;
import { Highlight } from "@mantine/core";
import { useSnapshot } from "valtio";
const HighlightText = (props: { children: string; className?: string }) => {
  const { search } = useSnapshot(ExplorerState);
  return (
    <Highlight className={props.className} highlight={search} color="blue.1">
      {props.children}
    </Highlight>
  );
};

const Label = ({
  children,
  content,
  highlight,
  className,
}: PropsWithChildren<{
  content: string;
  highlight: boolean;
  className?: string;
}>) => (
  <div
    className={cx(
      "flex-none flex flex-row rounded border-2 items-center text-sm gap-1 pl-1 overflow-hidden",
      {
        "border-blue-800 bg-blue-800 text-white": highlight,
        "border-gray-200 bg-gray-200 dark:bg-gray-600 dark:border-gray-600":
          !highlight,
      },
      className,
    )}
  >
    {children}
    <span
      className={cx(
        "bg-white px-2 mr-[1px] py-0.5 dark:bg-gray-800 dark:text-blue-50",
        {
          "text-blue-800": highlight,
        },
      )}
    >
      {content}
    </span>
  </div>
);

export const CardSkeleton = () => {
  return (
    <div className="h-[128px] flex flex-col my-[8px] mx-[8px] rounded border p-2 max-sm:gap-1 gap-2 dark:border-zinc-700">
      <div className="flex flex-row gap-2 items-center mb-3">
        <Skeleton width="50%" height="1.5rem" />
        <div className="flex-1" />
        <Skeleton width="10rem" height="1.5rem" />
      </div>
      <Skeleton height="1rem" />
      <Skeleton height="1rem" />
      <Skeleton height="1rem" />
    </div>
  );
};
export default function Card({ repo }: { repo: GitHubRepo }) {
  const time = dayjs(repo.pushedAt);
  const pushedAt = {
    fromNow: time.add(1, "month").isAfter(dayjs())
      ? "Recently"
      : time.fromNow(),
    isDead: time.add(2, "year").isBefore(dayjs()),
  };
  return (
    <div className="h-[128px] flex flex-col my-[8px] mx-[8px] rounded border p-2  max-sm:gap-1 gap-2 dark:border-zinc-700">
      <div className="flex flex-row gap-2 items-center overflow-x-hidden">
        <a
          className="font-mono whitespace-nowrap hover:underline flex-shrink overflow-hidden"
          href={`https://github.com/${repo.id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <HighlightText className="font-mono truncate">
            {repo.name}
          </HighlightText>
        </a>

        {repo.primaryLanguage && (
          <Badge
            variant="outline"
            visibleFrom="md"
            size="xs"
            color="gray"
            className=" font-semibold"
          >
            {repo.primaryLanguage}
          </Badge>
        )}
        {repo.license && repo.license !== "other" && (
          <Badge
            className="max-sm:hidden font-semibold"
            visibleFrom="md"
            variant="outline"
            size="sm"
            color="gray"
          >
            {repo.license}
          </Badge>
        )}
        {repo.archived && (
          <Badge
            className="max-sm:hidden"
            visibleFrom="md"
            size="sm"
            color="black"
          >
            Archived
          </Badge>
        )}
        <div className="flex-1" />
        <Label
          highlight={repo.forks > 5000}
          content={toHumanString(repo.forks)}
          className="max-sm:hidden"
        >
          <IconGitFork className="size-4" />
          {/* <i className="icon-[tabler--git-fork]" /> */}
        </Label>
        <Label
          highlight={repo.stars > 5000}
          content={toHumanString(repo.stars || 0)}
        >
          <IconStarFilled className="size-4" />
          {/* <i className="icon-[tabler--star-filled]" /> */}
        </Label>
      </div>
      <HighlightText className="text-sm flex-1 text-pretty overflow-hidden max-sm:pt-0.5">
        {repo.description}
      </HighlightText>
      <div className="flex flex-row gap-3 ">
        <a
          className="flex flex-row items-center max-sm:flex-1"
          href={`https://github.com/${repo.owner.name}`}
        >
          <img
            src={repo.owner.avatarUrl}
            className="rounded-full w-6 h-6"
            alt={repo.owner.name}
          />
          <span className="ml-1 text-sm">{repo.owner.name}</span>
        </a>

        <div className="flex-1 overflow-hidden flex flex-row flex-wrap items-center mt-0.5 gap-1 h-7 max-sm:hidden">
          {(repo.topics || []).map((topic) => (
            <Badge
              key={topic}
              className="flex-none my-1 cursor-pointer hover:underline normal-case"
              variant="light"
              size="sm"
              color="gray"
              onClick={() => (ExplorerState.search = topic)}
            >
              <HighlightText className=" text-xs font-semibold">
                {topic}
              </HighlightText>
            </Badge>
          ))}
        </div>
        {/* <div className="flex-1" /> */}

        <Label
          content={pushedAt.fromNow}
          highlight={pushedAt.fromNow === "Recently"}
        >
          {pushedAt.isDead ? (
            <IconSkull className="size-4" />
          ) : (
            <IconActivity className="size-4" />
          )}
        </Label>
      </div>
    </div>
  );
}
