import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/routing";

export default async function LocalizedNotFoundPage() {
  const t = await getTranslations();

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="max-w-lg space-y-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          404
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
          {t("common.notFound")}
        </h1>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-300"
        >
          {t("common.backHome")}
        </Link>
      </div>
    </main>
  );
}
