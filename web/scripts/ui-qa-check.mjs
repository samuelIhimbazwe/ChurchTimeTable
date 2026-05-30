#!/usr/bin/env node
/**
 * UI consistency check (Sprint 9.1 complete).
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const FEATURES = path.join(import.meta.dirname, "..", "features");
const COMPONENTS = path.join(import.meta.dirname, "..", "components", "ui");

const BANNED = [
  { pattern: /text-slate-\d+/g, message: "Use text-[var(--muted-foreground)] design tokens" },
  { pattern: /bg-rose-50 px-3 py-2 text-sm text-rose-800/g, message: "Use CmmsAlert for inline messages" },
];

const ENCOURAGED = [
  { pattern: /CmmsEmptyState|emptyState=\{/, name: "empty states" },
  { pattern: /CmmsFormField|OperationalScreen|CmmsTabs/, name: "design system components" },
];

async function walk(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, files);
    else if (entry.name.endsWith(".tsx")) files.push(full);
  }
  return files;
}

const issues = [];
const featureFiles = await walk(FEATURES);

for (const file of featureFiles) {
  const content = await readFile(file, "utf8");
  for (const rule of BANNED) {
    if (rule.pattern.test(content)) {
      issues.push(`${path.relative(process.cwd(), file)}: ${rule.message}`);
    }
    rule.pattern.lastIndex = 0;
  }
}

const denseScreens = [
  "attendance/components/attendance-engine.tsx",
  "events/components/event-engine.tsx",
  "governance/components/committee-governance-admin.tsx",
  "coverage/components/coverage-engine.tsx",
  "finance/components/finance-stewardship-dashboard.tsx",
  "finance/components/my-contributions-dashboard.tsx",
];

for (const rel of denseScreens) {
  const full = path.join(FEATURES, rel);
  let content;
  try {
    content = await readFile(full, "utf8");
  } catch {
    issues.push(`Missing dense screen: ${rel}`);
    continue;
  }
  const hasDs = ENCOURAGED.some((e) => e.pattern.test(content));
  if (!hasDs) {
    issues.push(`${rel}: Should use OperationalScreen, CmmsTabs, or CmmsFormField`);
  }
}

const uiFiles = await walk(COMPONENTS);
const requiredUi = [
  "cmms-empty-state.tsx",
  "cmms-form-field.tsx",
  "cmms-tabs.tsx",
  "operational-screen.tsx",
  "cmms-alert.tsx",
];
for (const name of requiredUi) {
  if (!uiFiles.some((f) => f.endsWith(name))) {
    issues.push(`Missing UI component: ${name}`);
  }
}

if (issues.length) {
  console.error("UI QA check failed:\n" + issues.join("\n"));
  process.exit(1);
}

console.log(`UI QA check passed (${featureFiles.length} feature files, design system OK).`);
