import { createFileRoute } from "@tanstack/react-router";
import { PlatformApp } from "@/components/platform-app";

export const Route = createFileRoute("/welcome")({
  head: () => ({ meta: [{ title: "Studio overview — FrameFlow" }] }),
  component: () => <PlatformApp section="dashboard" />,
});
