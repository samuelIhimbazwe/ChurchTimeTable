import { env } from "@/core/config/env";

export const siteConfig = {
  name: "CMMS Web",
  shortName: "CMMS",
  description: "Church Management and Coordination System for browser teams.",
  locales: ["en", "fr", "rw"] as const,
  defaultLocale: env.NEXT_PUBLIC_DEFAULT_LOCALE,
};

export type AppLocale = (typeof siteConfig.locales)[number];
