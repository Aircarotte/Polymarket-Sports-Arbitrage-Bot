import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { logger } from "../utils/logger.js";

function parseArg(name: string, fallback: string): string {
  const i = process.argv.indexOf(name);
  return i >= 0 ? (process.argv[i + 1] ?? fallback) : fallback;
}

function readJsonl(filePath: string): any[] {
  if (!fs.existsSync(filePath)) return [];
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean);
  return lines.map((l) => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
}

async function main(): Promise<void> {
  const dir = parseArg("--journal-dir", "data/trading");
  const orders = readJsonl(path.join(dir, "orders.jsonl"));
  const fills = readJsonl(path.join(dir, "fills.jsonl"));
  const positions = readJsonl(path.join(dir, "positions.jsonl"));
  const risks = readJsonl(path.join(dir, "risk_events.jsonl"));
  const denies = risks.filter((r) => r.allow === false);

  const reasonCount = new Map<string, number>();
  for (const d of denies) {
    const k = String(d.reason_code ?? "unknown");
    reasonCount.set(k, (reasonCount.get(k) ?? 0) + 1);
  }

  logger.info("=".repeat(80));
  logger.info("Trading Session Summary");
  logger.info("=".repeat(80));
  logger.info(`Journal dir: ${path.resolve(dir)}`);
  logger.info(`Orders: ${orders.length}`);
  logger.info(`Fills: ${fills.length}`);
  logger.info(`Positions opened: ${positions.filter((p) => p.event === "opened").length}`);
  logger.info(`Positions closed: ${positions.filter((p) => p.event === "closed").length}`);
  logger.info("Top risk deny reasons:");
  for (const [reason, count] of [...reasonCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)) {
    logger.info(`  - ${reason}: ${count}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
