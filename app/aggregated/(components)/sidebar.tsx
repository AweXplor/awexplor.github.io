"use client";
import {
  Accordion,
  ActionIcon,
  Checkbox,
  NavLink,
  Popover,
  Radio,
  Select,
  Stack,
  Switch,
  TextInput,
  Tooltip,
} from "@mantine/core";

import {
  IconBrandTelegram,
  IconBrandTwitter,
  IconExternalLink,
  IconSettings,
} from "@tabler/icons-react";
import { PropsWithChildren, useEffect } from "react";
import { useSnapshot } from "valtio";
import { MoreItem } from "../[slug]/page";
import { ExplorerState } from "./state";
import { usePathname } from "next/navigation";

export const WellMaintainedThresholdEditor = (
  props: PropsWithChildren<{ disabled?: boolean }>
) => {
  const state = useSnapshot(ExplorerState.wellMaintainedThreshold);
  return (
    <Popover
      width={350}
      position="bottom"
      trapFocus
      withArrow
      shadow="md"
      disabled={props.disabled}
    >
      <Popover.Target>{props.children}</Popover.Target>
      <Popover.Dropdown>
        <div className="text-sm flex flex-row  gap-2 items-center">
          <span className="flex-none">Last pushed before</span>
          <TextInput
            variant="filled"
            size="xs"
            value={state.count || ""}
            onChange={(v) =>
              (ExplorerState.wellMaintainedThreshold.count =
                parseInt(v.target.value, 10) ?? 2)
            }
          />
          <Select
            size="xs"
            value={state.unit}
            comboboxProps={{ withinPortal: false }}
            onChange={(v) =>
              (ExplorerState.wellMaintainedThreshold.unit =
                (v as any) ?? "year")
            }
            data={["year", "month", "day"]}
          />
        </div>
      </Popover.Dropdown>
    </Popover>
  );
};
export const PopularThresholdEditor = (
  props: PropsWithChildren<{ disabled?: boolean }>
) => {
  const state = useSnapshot(ExplorerState.popularThreshold);
  return (
    <Popover
      width={400}
      trapFocus
      position="bottom"
      withArrow
      shadow="md"
      disabled={props.disabled}
    >
      <Popover.Target>{props.children}</Popover.Target>
      <Popover.Dropdown>
        <div className="text-sm flex flex-row  gap-2 items-center">
          <span className="flex-none">Stars more than</span>
          <TextInput
            variant="filled"
            size="xs"
            value={state.starsMoreThan || ""}
            onChange={(v) =>
              (ExplorerState.popularThreshold.starsMoreThan =
                parseInt(v.target.value, 10) ?? 3000)
            }
          />
          <span className="flex-none">or forks more than</span>
          <TextInput
            variant="filled"
            size="xs"
            value={state.forksMoreThan || ""}
            onChange={(v) =>
              (ExplorerState.popularThreshold.forksMoreThan =
                parseInt(v.target.value, 10) ?? 3000)
            }
          />
        </div>
      </Popover.Dropdown>
    </Popover>
  );
};

export const SideBar = (props: {
  sources: { name: string; license: string | null }[];
  more: MoreItem[];
}) => {
  const state = useSnapshot(ExplorerState);
  useEffect(() => {
    if (ExplorerState.sources === null) {
      ExplorerState.sources = props.sources.map((x) => x.name);
    }
  }, []);
  const searchEnable = state.search !== "";
  const pathname = usePathname();

  return (
    <>
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <Accordion
            multiple
            defaultValue={["sort", "filter", "source", "more"]}
            classNames={{
              item: "border-none",
              control: "text-zinc-500 dark:text-zinc-300",
              label: " font-semibold text-sm ",
            }}
          >
            <Accordion.Item value="sort">
              <Accordion.Control>Sort</Accordion.Control>
              <Accordion.Panel>
                <Radio.Group
                  value={state.sort}
                  onChange={(v) => {
                    ExplorerState.sort = v as any;
                  }}
                >
                  <Stack gap="0">
                    {[
                      { value: "original", label: "Original" },
                      { value: "popularity", label: "Popularity" },
                      { value: "activity", label: "Activity" },
                    ].map((x) => (
                      <Radio
                        disabled={searchEnable}
                        key={x.value}
                        classNames={{
                          radio: "scale-90",
                          labelWrapper: "w-full ",
                          body: "h-9 mantine-hover flex items-center",
                        }}
                        {...x}
                      />
                    ))}
                  </Stack>
                </Radio.Group>
              </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="filter">
              <Accordion.Control>Filter</Accordion.Control>
              <Accordion.Panel>
                <Stack gap="0">
                  <Switch
                    disabled={searchEnable}
                    classNames={{
                      track: "scale-90",
                      labelWrapper: "flex-1",
                      body: "h-9 flex items-center px-1",
                    }}
                    checked={state.wellMaintainedOnly}
                    onChange={(ev) =>
                      (ExplorerState.wellMaintainedOnly =
                        ev.currentTarget.checked)
                    }
                    labelPosition="left"
                    label={
                      <div className="flex flex-row items-center gap-2">
                        <span>Well maintained only</span>
                        <WellMaintainedThresholdEditor disabled={searchEnable}>
                          <ActionIcon
                            variant="subtle"
                            size="md"
                            color="gray"
                            disabled={searchEnable}
                          >
                            <IconSettings className="size-4" />
                          </ActionIcon>
                        </WellMaintainedThresholdEditor>
                      </div>
                    }
                  />
                  <Switch
                    disabled={searchEnable}
                    classNames={{
                      track: "scale-90",
                      labelWrapper: "flex-1",
                      body: "h-9  flex items-center px-1",
                    }}
                    checked={state.popularOnly}
                    onChange={(ev) =>
                      (ExplorerState.popularOnly = ev.currentTarget.checked)
                    }
                    labelPosition="left"
                    label={
                      <div className="flex flex-row items-center gap-2">
                        <span>Popular only</span>
                        <PopularThresholdEditor disabled={searchEnable}>
                          <ActionIcon
                            variant="subtle"
                            size="md"
                            color="gray"
                            disabled={searchEnable}
                          >
                            <IconSettings className="size-4" />
                          </ActionIcon>
                        </PopularThresholdEditor>
                      </div>
                    }
                  />
                  {pathname === "/aggregated/macos" && (
                    <Switch
                      disabled={searchEnable}
                      classNames={{
                        track: "scale-90",
                        labelWrapper: "flex-1",
                        body: "h-9  flex items-center px-1",
                      }}
                      checked={state.macosNativeOnly}
                      onChange={(ev) =>
                        (ExplorerState.macosNativeOnly =
                          ev.currentTarget.checked)
                      }
                      labelPosition="left"
                      label="Native MacOS Apps"
                    />
                  )}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="source">
              <Accordion.Control>Source</Accordion.Control>
              <Accordion.Panel>
                <Stack gap="1">
                  {props.sources.map((source) => {
                    const included =
                      state.sources?.includes(source.name) ?? false;
                    return (
                      <div
                        key={source.name}
                        className=" mantine-hover flex flex-row h-10 items-center"
                      >
                        <Checkbox
                          classNames={{
                            inner: "scale-90",
                            labelWrapper: "flex-1",
                            body: "h-9  flex items-center px-1",
                          }}
                          // checked={state.sources ? included : true}
                          checked
                          // readOnly={included && state.sources!.length === 1}
                          readOnly
                          onChange={(ev) => {
                            if (ev.currentTarget.checked) {
                              if (!included)
                                ExplorerState.sources!.push(source.name);
                            } else {
                              if (included && state.sources!.length > 1)
                                ExplorerState.sources =
                                  ExplorerState.sources!.filter(
                                    (x) => x !== source.name
                                  );
                            }
                          }}
                          className="flex-1"
                          label={
                            <div className="flex flex-col">
                              <span className="mr-2">{source.name}</span>
                              {source.license && (
                                <span className=" text-xs">
                                  {source.license}
                                </span>
                              )}
                            </div>
                          }
                        />
                        <a
                          className="px-2 h-full flex items-center text-gray-600 hover:text-gray-950"
                          target="_blank"
                          href={`https://github.com/${source.name}`}
                        >
                          <IconExternalLink className="size-5  " />
                        </a>
                      </div>
                    );
                  })}

                  {/* <Checkbox
                        defaultChecked
                        label="sdsd/vodddwls"
                    /> */}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="more">
              <Accordion.Control>More</Accordion.Control>
              <Accordion.Panel>
                {props.more.slice(0, 5).map((x) => (
                  <MoreNavLink more={x} key={x.name} />
                ))}

                <NavLink
                  href="/#1417a7280fe58075ac27e84a8878e9b0"
                  label="More awesome lists"
                  leftSection={<IconExternalLink size="1rem" stroke={1.5} />}
                />
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </div>
        <div className="flex-none h-12 w-full border-t border-t-gray-200 dark:border-t-gray-700 flex flex-row items-center justify-end gap-3 pr-2">
          <span className="text-xs">
            Made with{" "}
            <a href="https://mantine.dev/" target="_blank">
              MantineUI
            </a>{" "}
            by <a href="https://github.com/adevday">@adevday</a>
          </span>
          <Tooltip label="Feedback on Telegram group">
            <ActionIcon
              size="md"
              variant="subtle"
              color="dark.2"
              component="a"
              href="https://t.me/getawep"
              target="_blank"
            >
              <IconBrandTelegram className="size-5" />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Subscribe for updates">
            <ActionIcon
              size="md"
              variant="subtle"
              color="dark.2"
              component="a"
              href="https://x.com/adevday"
              target="_blank"
            >
              <IconBrandTwitter className="size-5" />
            </ActionIcon>
          </Tooltip>
        </div>
      </div>
    </>
  );
};

export const MoreNavLink = (props: { more: MoreItem }) => (
  <NavLink
    key={props.more.name}
    href={`/aggregated/${props.more.name.toLowerCase()}`}
    label={props.more.name}
    leftSection={props.more.icon}
  />
);

export default SideBar;
