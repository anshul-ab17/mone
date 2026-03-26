import { resolve } from "path";

// Load root .env before any test module is evaluated.
// This runs before test files are imported, so @repo/config
// won't throw when it validates env vars at module load time.
const envPath = resolve(process.cwd(), "../../.env");
const text = await Bun.file(envPath).text().catch(() => "");

for (const line of text.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx === -1) continue;
  const key = trimmed.slice(0, idx).trim();
  const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
  if (!(key in process.env)) {
    process.env[key] = val;
  }
}
