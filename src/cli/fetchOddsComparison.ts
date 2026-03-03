import "dotenv/config";
import path from "node:path";
import { loadJson, saveCsv, saveJson } from "../utils/fileUtils.js";
import { logger } from "../utils/logger.js";
import { fetchOddsForPolymarketEvents } from "../data/fetchOddsData.js";

async function main(): Promise<void> {
  const outputDir = process.env.OUTPUT_DIR ?? "data";
  const inputPath = path.join(outputDir, "arbitrage_data_filtered.json");
  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) throw new Error("ODDS_API_KEY is required");

  logger.info(`Loading arbitrage data from ${inputPath}...`);
  const arbitrageData = loadJson<Record<string, any>[]>(inputPath);
  if (!Array.isArray(arbitrageData) || !arbitrageData.length) {
    throw new Error("No arbitrage_data_filtered.json found or file is empty");
  }

  const comparison = await fetchOddsForPolymarketEvents(
    arbitrageData,
    apiKey,
    (process.env.ODDS_API_REGIONS ?? "us,us_ex").split(",").map((x) => x.trim()),
    (process.env.ODDS_API_MARKETS ?? "h2h").split(",").map((x) => x.trim()),
    Number(process.env.ODDS_API_MIN_CONFIDENCE ?? 0.5),
    String(process.env.USE_STORED_EVENTS ?? "true").toLowerCase() === "true",
    process.env.EVENTS_DIR ?? "data/sportsbook_data/events"
  );

  saveJson(comparison, path.join(outputDir, "arbitrage_comparison.json"));
  saveCsv(comparison, path.join(outputDir, "arbitrage_comparison.csv"));
  logger.info(`Successfully matched ${comparison.length} events with sportsbook odds`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
