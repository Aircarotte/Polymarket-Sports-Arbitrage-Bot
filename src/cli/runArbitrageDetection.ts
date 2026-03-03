import "dotenv/config";
import path from "node:path";
import { detectArbitrageOpportunities } from "../processing/arbitrageCalculation.js";
import { loadJson, saveJson } from "../utils/fileUtils.js";
import { logger } from "../utils/logger.js";

function getArg(name: string, fallback: string): string {
  const idx = process.argv.indexOf(name);
  return idx >= 0 ? (process.argv[idx + 1] ?? fallback) : fallback;
}

async function main(): Promise<void> {
  const sortBy = getArg("--sort-by", "profit_margin");
  const comparisonPath = path.join(process.env.OUTPUT_DIR ?? "data", "arbitrage_comparison.json");
  const data = loadJson<Record<string, any>[]>(comparisonPath);
  const opportunities = detectArbitrageOpportunities(
    data,
    Number(process.env.TRADING_MIN_PROFIT ?? 0.02),
    Number(process.env.TRADING_MIN_LIQUIDITY_USD ?? 1000)
  );

  const sorted = [...opportunities].sort((a, b) => Number((b as any)[sortBy] ?? b.profit_margin) - Number((a as any)[sortBy] ?? a.profit_margin));
  saveJson(sorted, path.join(process.env.OUTPUT_DIR ?? "data", "directional_arbitrage.json"));
  logger.info(`Found ${sorted.length} opportunities`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
