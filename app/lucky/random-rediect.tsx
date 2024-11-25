"use client";

import { useMounted } from "@mantine/hooks";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function (props: { names: string[] }) {
  const router = useRouter();
  const mounted = useMounted();
  useEffect(() => {
    if (mounted) {
      router.replace(
        `/aggregated/${
          props.names[Math.floor(Math.random() * props.names.length)]
        }`,
      );
    }
  }, [mounted]);
  return <></>;
}
