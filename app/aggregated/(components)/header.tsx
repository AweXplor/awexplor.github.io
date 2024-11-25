"use client";
import {
  ActionIcon,
  Menu,
  ScrollArea,
  Space,
  TextInput,
  Tooltip,
  useMantineColorScheme,
} from "@mantine/core";
import { useDisclosure, useMounted } from "@mantine/hooks";
import {
  IconBrandGithub,
  IconExternalLink,
  IconMoon,
  IconSearch,
  IconSelector,
  IconSun,
  IconX,
} from "@tabler/icons-react";
import cx from "clsx";
import { PropsWithChildren } from "react";
import { useSnapshot } from "valtio";
import { MoreItem } from "../[slug]/page";
import { ExplorerState } from "./state";
export const SearchInput = () => {
  const state = useSnapshot(ExplorerState);
  return (
    <TextInput
      size="sm"
      visibleFrom="xs"
      value={state.search}
      onChange={(x) => (ExplorerState.search = x.target.value)}
      leftSection={<IconSearch className="size-4" />}
      rightSection={
        state.search !== "" && (
          <IconX
            className="size-4"
            onClick={() => (ExplorerState.search = "")}
          />
        )
      }
    />
  );
};
export const DarkModeSwitcher = () => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const mounted = useMounted();
  return (
    mounted && (
      <ActionIcon
        onClick={toggleColorScheme}
        variant="outline"
        className="!border-zinc-300 dark:!border-zinc-600"
        size="lg"
      >
        {colorScheme === "dark" ? (
          <IconSun className="size-5 text-zinc-200" />
        ) : (
          <IconMoon className="size-5 text-zinc-600" />
        )}
      </ActionIcon>
    )
  );
};

const AwesomeSwitcher = (props: {
  name: string;
  icon?: string;
  more: MoreItem[];
}) => {
  const [opened, { close, open }] = useDisclosure(false);
  return (
    <Menu
      trigger="hover"
      openDelay={100}
      width="10rem"
      opened={opened}
      onOpen={open}
      onClose={close}
    >
      <Menu.Target>
        <span
          className={cx(
            `font-mono text-md group  p-2 rounded-lg transition -ml-2 cursor-pointer`,
            opened && "bg-slate-100 dark:bg-slate-700",
          )}
        >
          {props.name}

          <span className={cx(`mr-1`)}>
            {" "}
            {opened ? (
              props.icon
            ) : (
              <IconSelector className="size-4 inline-block -mt-0.5" />
            )}
          </span>
        </span>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection={<IconExternalLink size="1rem" stroke={1.5} />}
          component="a"
          href="/#1417a7280fe58075ac27e84a8878e9b0"
        >
          Show all
        </Menu.Item>
        <Menu.Divider />
        <ScrollArea h="50vh" scrollbars="y">
          {props.more.map((x) => (
            <Menu.Item
              leftSection={x.icon}
              key={x.name}
              component="a"
              href={`/aggregated/${x.name.toLowerCase()}`}
            >
              {x.name}
            </Menu.Item>
          ))}
        </ScrollArea>
      </Menu.Dropdown>
    </Menu>
  );
};

export default function Header(
  props: PropsWithChildren<{
    more: MoreItem[];
    name: string;
    icon?: string;
  }>,
) {
  return (
    <>
      <AwesomeSwitcher more={props.more} name={props.name} icon={props.icon} />
      <span className="font-mono text-sm text-gray-600 dark:text-gray-400 hidden xl:block">
        Discover and Explore the Best GitHub Repositories.
      </span>
      <Space flex="1" />
      <Tooltip label="🌟">
        <ActionIcon
          component="a"
          href="https://github.com/AweXplor/AweXplor.github.io"
          target="_blank"
          size="lg"
          variant="subtle"
          color="dark.4"
        >
          <IconBrandGithub className="size-5" />
        </ActionIcon>
      </Tooltip>

      <SearchInput />
      <DarkModeSwitcher />
    </>
  );
}
