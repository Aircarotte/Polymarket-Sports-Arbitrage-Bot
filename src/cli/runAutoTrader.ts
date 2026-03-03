import "dotenv/config";
import { logger } from "../utils/logger.js";
import { loadTradingConfig } from "../trading/config.js";
import { AutoTraderEngine } from "../trading/engine.js";

function parseNumberArg(name: string, fallback: number): number {
  const i = process.argv.indexOf(name);
  if (i < 0) return fallback;
  const n = Number(process.argv[i + 1]);
  return Number.isFinite(n) ? n : fallback;
}

async function main(): Promise<void> {
  const cycles = parseNumberArg("--cycles", 0);
  const forceDryRun = process.argv.includes("--dry-run");

  let cfg;
  try {
    cfg = loadTradingConfig();
  } catch (e) {
    logger.error(String(e));
    logger.error("Auto Trader blocked by configuration guardrails.");
    process.exit(1);
  }

  if (forceDryRun) cfg.dryRun = true;

  if (cfg.tradingMode === "live") {
    logger.error("Live execution adapter is not implemented in this TS build. Use paper mode.");
    process.exit(1);
  }

  const engine = new AutoTraderEngine(cfg);
  logger.info("=".repeat(80));
  logger.info("Auto Trader Started");
  logger.info("=".repeat(80));
  logger.info(`mode=${cfg.tradingMode} dry_run=${cfg.dryRun} interval=${cfg.cycleIntervalSeconds}s`);

  let ran = 0;
  while (true) {
    if (cycles > 0 && ran >= cycles) break;
    try {
      engine.runCycle();
    } catch (err) {
      logger.error(`Auto-trader cycle failed: ${String(err)}`);
      logger.error("Tip: run pipeline first (fetch:markets -> filter:markets -> fetch:odds-comparison).");
      process.exit(1);
    }
    ran += 1;
    if (cycles > 0 && ran >= cycles) break;
    await new Promise((r) => setTimeout(r, Math.max(1, cfg.cycleIntervalSeconds) * 1000));
  }

  logger.info(`Auto Trader stopped after ${ran} cycle(s)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
