import { loadJson } from "../utils/fileUtils.js";
import { logger } from "../utils/logger.js";
import { detectArbitrageOpportunities } from "../processing/arbitrageCalculation.js";
import type { Opportunity } from "../types.js";
import type { TradingConfig } from "./config.js";
import { TradeJournal } from "./journal.js";

function nowIso(): string { return new Date().toISOString(); }

export class AutoTraderEngine {
  private readonly journal: TradeJournal;
  private openPositions: Array<{ id: string; market_id: string; opened_at: string; size_usd: number }> = [];
  private realizedPnl = 0;

  constructor(private readonly cfg: TradingConfig) {
    this.journal = new TradeJournal(cfg.journalDir);
    const s = this.journal.loadState();
    this.openPositions = Array.isArray(s.open_positions) ? s.open_positions : [];
    this.realizedPnl = Number(s.realized_pnl_usd ?? 0);
  }

  private riskAllow(opp: Opportunity): { allow: boolean; reason: string } {
    if (this.openPositions.length >= this.cfg.maxConcurrentPositions) return { allow: false, reason: "max_positions" };
    if ((opp.match_confidence ?? 0) < this.cfg.minConfidence) return { allow: false, reason: "low_confidence" };
    if ((opp.liquidity ?? 0) < this.cfg.minLiquidityUsd) return { allow: false, reason: "low_liquidity" };
    if ((opp.pm_spread ?? 0) > this.cfg.maxSpread) return { allow: false, reason: "wide_spread" };
    return { allow: true, reason: "ok" };
  }

  runCycle(): Record<string, number> {
    const comparison = loadJson<Record<string, any>[]>(this.cfg.comparisonDataPath);
    const opportunities = detectArbitrageOpportunities(comparison, this.cfg.minProfitThreshold, this.cfg.minLiquidityUsd);

    let opened = 0;
    let denied = 0;
    let closed = 0;
    let duplicates = 0;

    for (const opp of opportunities) {
      const signalId = `${opp.pm_market_id}:${opp.matched_outcomes[0]?.pm_outcome ?? ""}`;
      this.journal.signal({ timestamp: nowIso(), signal_id: signalId, ...opp });
      const risk = this.riskAllow(opp);
      this.journal.risk({ timestamp: nowIso(), signal_id: signalId, allow: risk.allow, reason_code: risk.reason });
      if (!risk.allow) {
        denied += 1;
        continue;
      }

      const positionId = `${signalId}:${Date.now()}`;
      this.journal.order({ timestamp: nowIso(), signal_id: signalId, order_type: "ENTRY", position_id: positionId, requested_size_usd: this.cfg.stakePerTradeUsd });
      if (this.cfg.dryRun) {
        this.journal.fill({ timestamp: nowIso(), signal_id: signalId, order_type: "ENTRY", status: "dry_run_skipped" });
        continue;
      }

      this.journal.fill({ timestamp: nowIso(), signal_id: signalId, order_type: "ENTRY", status: "filled", filled_size_usd: this.cfg.stakePerTradeUsd });
      this.openPositions.push({ id: positionId, market_id: String(opp.pm_market_id ?? ""), opened_at: nowIso(), size_usd: this.cfg.stakePerTradeUsd });
      this.journal.position({ timestamp: nowIso(), event: "opened", position_id: positionId, market_id: opp.pm_market_id, size_usd: this.cfg.stakePerTradeUsd });
      opened += 1;
    }

    this.journal.saveState({
      updated_at: nowIso(),
      realized_pnl_usd: this.realizedPnl,
      open_positions: this.openPositions
    });

    const summary = {
      signals: opportunities.length,
      opened,
      closed,
      denied,
      duplicates,
      open_positions: this.openPositions.length
    };
    logger.info(`Auto-trader cycle summary: ${JSON.stringify(summary)}`);
    return summary;
  }
}
