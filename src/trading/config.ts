import "dotenv/config";

export interface TradingConfig {
  tradingMode: "paper" | "live";
  cycleIntervalSeconds: number;
  stakePerTradeUsd: number;
  maxConcurrentPositions: number;
  maxDailyLossUsd: number;
  minLiquidityUsd: number;
  maxSpread: number;
  minProfitThreshold: number;
  minConfidence: number;
  dryRun: boolean;
  comparisonDataPath: string;
  journalDir: string;
  enableLiveTrading: boolean;
  livePrivateKey: string;
  liveProxyAddress: string;
}

export function loadTradingConfig(): TradingConfig {
  const cfg: TradingConfig = {
    tradingMode: (process.env.TRADING_MODE?.toLowerCase() === "live" ? "live" : "paper"),
    cycleIntervalSeconds: Number(process.env.TRADING_CYCLE_SECONDS ?? 60),
    stakePerTradeUsd: Number(process.env.TRADING_STAKE_USD ?? 25),
    maxConcurrentPositions: Number(process.env.TRADING_MAX_POSITIONS ?? 5),
    maxDailyLossUsd: Number(process.env.TRADING_MAX_DAILY_LOSS_USD ?? 100),
    minLiquidityUsd: Number(process.env.TRADING_MIN_LIQUIDITY_USD ?? 2000),
    maxSpread: Number(process.env.TRADING_MAX_SPREAD ?? 0.03),
    minProfitThreshold: Number(process.env.TRADING_MIN_PROFIT ?? 0.02),
    minConfidence: Number(process.env.TRADING_MIN_CONFIDENCE ?? 0.75),
    dryRun: String(process.env.TRADING_DRY_RUN ?? "false").toLowerCase() === "true",
    comparisonDataPath: process.env.TRADING_COMPARISON_PATH ?? "data/arbitrage_comparison.json",
    journalDir: process.env.TRADING_JOURNAL_DIR ?? "data/trading",
    enableLiveTrading: String(process.env.ENABLE_LIVE_TRADING ?? "false").toLowerCase() === "true",
    livePrivateKey: (process.env.PRIVATE_KEY ?? process.env.PK ?? "").trim(),
    liveProxyAddress: (process.env.POLYMARKET_PROXY_ADDRESS ?? process.env.BROWSER_ADDRESS ?? "").trim()
  };
  validateConfig(cfg);
  return cfg;
}

export function validateConfig(cfg: TradingConfig): void {
  if (cfg.tradingMode === "live" && !cfg.enableLiveTrading) {
    throw new Error("Live mode requires ENABLE_LIVE_TRADING=true");
  }
  if (cfg.tradingMode === "live" && !cfg.livePrivateKey) {
    throw new Error("Live mode blocked: PRIVATE_KEY (or PK) is not set.");
  }
  if (cfg.tradingMode === "live" && !cfg.liveProxyAddress) {
    throw new Error("Live mode blocked: POLYMARKET_PROXY_ADDRESS (or BROWSER_ADDRESS) is not set.");
  }
  if (cfg.stakePerTradeUsd <= 0) throw new Error("TRADING_STAKE_USD must be > 0");
  if (cfg.maxConcurrentPositions < 1) throw new Error("TRADING_MAX_POSITIONS must be >= 1");
}
