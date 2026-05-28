import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

import { siteConfig } from "@/core/config/site";

export const routing = defineRouting({
  locales: [...siteConfig.locales],
  defaultLocale: siteConfig.defaultLocale,
  localePrefix: "always",
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
