import type { Preview } from "@storybook/react";
import { NextIntlClientProvider } from "next-intl";
import "../app/globals.css";
import en from "../messages/en.json";

const preview: Preview = {  parameters: {
    layout: "padded",
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#f8fafc" },
        { name: "dark", value: "#0b1220" },
      ],
    },
  },
  decorators: [
    (Story, context) => {
      const isDark = context.globals.theme === "dark";
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", isDark);
      }
      return (
        <NextIntlClientProvider locale="en" messages={en}>
          <div className="min-h-[200px] bg-[var(--background)] p-6 text-[var(--foreground)]">
            <Story />
          </div>
        </NextIntlClientProvider>
      );    },
  ],
  globalTypes: {
    theme: {
      description: "Color theme",
      toolbar: {
        title: "Theme",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
      },
    },
  },
};

export default preview;
