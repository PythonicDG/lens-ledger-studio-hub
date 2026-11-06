import { createFileRoute } from "@tanstack/react-router";
import { PlatformApp } from "@/components/platform-app";

export const Route = createFileRoute("/app/$section")({
  component: AppSection,
});

function AppSection() {
  const { section } = Route.useParams();
  return <PlatformApp section={section} />;
}
