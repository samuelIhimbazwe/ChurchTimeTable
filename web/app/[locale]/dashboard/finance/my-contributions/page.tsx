import { redirect } from "@/i18n/routing";

/** Legacy path — Contribution Center (10.3.1). */
export default async function LegacyMyContributionsPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  redirect({ href: "/dashboard/contributions", locale });
}
