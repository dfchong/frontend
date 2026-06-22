import { createLazyFileRoute } from "@tanstack/react-router";
import ErrorLogPage from "@/sections/log/error";

export const Route = createLazyFileRoute("/dashboard/log/error")({
  component: ErrorLogPage,
});
