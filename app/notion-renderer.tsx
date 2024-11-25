"use client";
import { NotionRenderer } from "react-notion-x";
import { DarkModeSwitcher } from "./aggregated/(components)/header";
import { useMantineColorScheme } from "@mantine/core";
import { useMounted } from "@mantine/hooks";

export default ({ recordMap }: Parameters<typeof NotionRenderer>[0]) => {
  const { colorScheme } = useMantineColorScheme();
  const mounted = useMounted();
  return (
    <NotionRenderer
      recordMap={recordMap}
      fullPage={true}
      darkMode={mounted && colorScheme === "dark"}
      components={{
        PageLink: (props: any) => {
          return (
            <a href={`#${props.href.split("#")[1]}`} className="notion-link">
              {props.children}
            </a>
          );
        },
        Link: (props: any) => {
          if (props.href.startsWith(process.env.NEXT_PUBLIC_WEBSITE)) {
            return <a {...props} />;
          } else {
            return <a target="_blank" rel="noopener noreferrer" {...props} />;
          }
        },
      }}
      disableHeader
      header={
        <div className="p-2 flex flex-row justify-end items-center">
          <DarkModeSwitcher />
        </div>
      }
    />
  );
};
