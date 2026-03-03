import "dotenv/config";
import { runFetchAndSave, runFilter } from "../data/fetchSportsMarkets.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args[0] === "filter") {
    const input = args[1] ?? "data/arbitrage_data.json";
    const out = args[2] ?? "data";
    await runFilter(input, out);
    return;
  }
  const gamma = process.env.GAMMA_API_URL ?? "https://gamma-api.polymarket.com";
  const outputDir = process.env.OUTPUT_DIR ?? "data";
  await runFetchAndSave(outputDir, gamma);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
