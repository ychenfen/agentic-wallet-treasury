/**
 * Minimal Node-side .env loader.
 *
 * We avoid a runtime dependency here and only support the syntax we use in
 * `.env.example`: KEY=value, optional quotes, comments, and blank lines.
 * Existing process.env values always win.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

function parseLine(line: string): [string, string] | undefined {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return undefined;
  const eq = trimmed.indexOf("=");
  if (eq <= 0) return undefined;
  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return [key, value];
}

export function loadProjectEnv(options: { includeGenerated?: boolean } = {}): string[] {
  const dirs: string[] = [];
  let current = process.cwd();
  for (let i = 0; i < 6; i += 1) {
    dirs.push(current);
    const next = dirname(current);
    if (next === current) break;
    current = next;
  }

  const candidates = dirs.map((dir) => resolve(dir, ".env"));
  if (options.includeGenerated) {
    candidates.push(...dirs.map((dir) => resolve(dir, ".env.generated")));
  }

  const loaded: string[] = [];
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    const contents = readFileSync(file, "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const parsed = parseLine(line);
      if (!parsed) continue;
      const [key, value] = parsed;
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
    loaded.push(file);
  }
  return [...new Set(loaded)];
}
