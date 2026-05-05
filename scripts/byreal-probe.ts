import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { runByrealCli, type ByrealProbeSummary } from "@clawdao/core/node";

const ROOT = resolve(process.cwd(), "..");
const WEB_PUBLIC = resolve(ROOT, "apps/web/public");
const DOCS_DIR = resolve(ROOT, "docs");
const PROBE_JSON = resolve(WEB_PUBLIC, "byreal-probe.json");
const SKILL_DOC = resolve(DOCS_DIR, "byreal-skill-output.md");
const CATALOG_DOC = resolve(DOCS_DIR, "byreal-catalog.json");

interface CommandRecord {
  label: string;
  command: string[];
  exitCode: number;
  stdout: string;
  stderr: string;
}

function sha256Hex(value: string): `0x${string}` {
  return `0x${createHash("sha256").update(value).digest("hex")}`;
}

function parseJson<T>(stdout: string): T | undefined {
  try {
    return JSON.parse(stdout) as T;
  } catch {
    return undefined;
  }
}

async function capture(
  label: string,
  args: string[],
  extraArgs: string[] = ["-o", "json"]
): Promise<CommandRecord> {
  const run = await runByrealCli(args, {
    binary: process.env.BYREAL_BINARY ?? "byreal-cli",
    extraArgs,
    timeoutMs: 20_000
  });
  return { label, ...run };
}

function summarize(record: CommandRecord): string {
  if (record.exitCode !== 0) return record.stderr.trim() || "command failed without stderr";
  const parsed = parseJson<{ data?: Record<string, unknown>; meta?: { version?: string } }>(record.stdout);
  if (!parsed?.data) return `${record.stdout.length} bytes captured`;
  const data = parsed.data;
  if (Array.isArray(data.capabilities)) return `${data.capabilities.length} capabilities discovered`;
  if (Array.isArray(data.pools)) return `${data.pools.length} pools returned`;
  if (typeof data.tvl === "number") return `TVL $${Math.round(data.tvl).toLocaleString()}, pools ${data.pools_count ?? "n/a"}`;
  if (typeof data.pool === "object") return "pool analysis captured";
  return "JSON captured";
}

function numberFrom(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

async function main(): Promise<void> {
  const generatedAt = new Date().toISOString();
  const commands: CommandRecord[] = [];

  const version = await capture("version", ["--version"], []);
  commands.push(version);

  const skill = await capture("skill-doc", ["skill"], []);
  commands.push(skill);

  const catalog = await capture("catalog", ["catalog", "list"]);
  commands.push(catalog);

  const overview = await capture("overview", ["overview"]);
  commands.push(overview);

  const pools = await capture("top-pools", [
    "pools",
    "list",
    "--sort-field",
    "tvl",
    "--sort-type",
    "desc",
    "--page",
    "1",
    "--page-size",
    "5"
  ]);
  commands.push(pools);

  const poolsJson = parseJson<{ data?: { pools?: Array<Record<string, unknown>> } }>(pools.stdout);
  const topPool = poolsJson?.data?.pools?.[0];
  let analysis: CommandRecord | undefined;
  if (topPool?.id) {
    analysis = await capture("top-pool-analysis", [
      "pools",
      "analyze",
      String(topPool.id),
      "--amount",
      "100"
    ]);
    commands.push(analysis);
  }

  const catalogJson = parseJson<{ data?: { capabilities?: unknown[] }; meta?: { version?: string } }>(catalog.stdout);
  const overviewJson = parseJson<{
    data?: {
      tvl?: number;
      volume_24h_usd?: number;
      fee_24h_usd?: number;
      pools_count?: number;
    };
  }>(overview.stdout);
  const analysisJson = analysis
    ? parseJson<{
        data?: {
          pool?: { address?: string; pair?: string };
          rangeAnalysis?: unknown[];
          riskFactors?: { summary?: string[] };
        };
      }>(analysis.stdout)
    : undefined;

  const summary: ByrealProbeSummary = {
    generatedAt,
    cliVersion: version.stdout.trim() || catalogJson?.meta?.version || "unknown",
    status: commands.every((c) => c.exitCode === 0) ? "pass" : commands.some((c) => c.exitCode === 0) ? "warn" : "fail",
    commands: commands.map((record) => ({
      label: record.label,
      command: record.command,
      exitCode: record.exitCode,
      stdoutHash: record.stdout ? sha256Hex(record.stdout) : undefined,
      summary: summarize(record)
    })),
    capabilityCount: catalogJson?.data?.capabilities?.length ?? 0,
    dexOverview: overviewJson?.data
      ? {
          tvl: numberFrom(overviewJson.data.tvl),
          volume24hUsd: numberFrom(overviewJson.data.volume_24h_usd),
          fee24hUsd: numberFrom(overviewJson.data.fee_24h_usd),
          poolsCount: numberFrom(overviewJson.data.pools_count)
        }
      : undefined,
    topPools: (poolsJson?.data?.pools ?? []).map((pool) => ({
      id: String(pool.id ?? ""),
      pair: String(pool.pair ?? "unknown"),
      tvlUsd: numberFrom(pool.tvl_usd),
      volume24hUsd: numberFrom(pool.volume_24h_usd),
      totalApr: numberFrom(pool.total_apr)
    })),
    analysis: analysisJson?.data
      ? {
          poolId: analysisJson.data.pool?.address ?? String(topPool?.id ?? ""),
          pair: analysisJson.data.pool?.pair,
          riskSummary: analysisJson.data.riskFactors?.summary ?? [],
          rangeCount: analysisJson.data.rangeAnalysis?.length ?? 0
        }
      : undefined,
    note:
      "The public Byreal RealClaw CLI is currently Solana CLMM-native. ClawDAO uses it as a real Scout/Sentinel research probe and capability manifest today, while Mantle Sepolia treasury execution remains on Mantle."
  };

  await mkdir(dirname(PROBE_JSON), { recursive: true });
  await mkdir(DOCS_DIR, { recursive: true });
  await writeFile(PROBE_JSON, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  await writeFile(SKILL_DOC, skill.stdout, "utf8");
  await writeFile(CATALOG_DOC, catalog.stdout, "utf8");

  // eslint-disable-next-line no-console
  console.log(`[byreal-probe] ${summary.status}: ${summary.capabilityCount} capabilities, ${summary.topPools.length} pools`);
  // eslint-disable-next-line no-console
  console.log(`[byreal-probe] wrote ${PROBE_JSON}`);
  if (!existsSync(SKILL_DOC) || !existsSync(CATALOG_DOC)) {
    throw new Error("Byreal docs were not written");
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
