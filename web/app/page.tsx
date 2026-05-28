import { redirect } from "next/navigation";

import { siteConfig } from "@/core/config/site";

export default function RootPage() {
  redirect(`/${siteConfig.defaultLocale}`);
}
