"use client";

import { useEffect } from "react";

export function LocaleDocumentSync({
  locale,
}: Readonly<{
  locale: string;
}>) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
