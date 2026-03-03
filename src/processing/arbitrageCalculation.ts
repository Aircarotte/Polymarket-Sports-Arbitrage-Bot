import type { Opportunity } from "../types.js";

export function detectMarketType(outcomes: string[]): "2-way" | "3-way" | null {
  if (outcomes.length === 2) return "2-way";
  if (outcomes.length === 3) return "3-way";
  return null;
}

export function calculateSellPoints(buyPrice: number, targetProb: number): Opportunity["sell_points"] {
  if (buyPrice <= 0) return [];
  const fair = Math.max(0, Math.min(1, targetProb));
  return [
    { description: "Fair value", target_price: fair, profit_percentage: (fair - buyPrice) / buyPrice, confidence: "high" },
    { description: "5% profit target", target_price: buyPrice * 1.05, profit_percentage: 0.05, confidence: "medium" },
    { description: "10% profit target", target_price: buyPrice * 1.1, profit_percentage: 0.1, confidence: "medium" },
    { description: "20% profit target", target_price: buyPrice * 1.2, profit_percentage: 0.2, confidence: "low" }
  ];
}

export function detectArbitrageOpportunities(
  comparisonData: Record<string, any>[],
  minProfitThreshold = 0.02,
  minLiquidity = 1000
): Opportunity[] {
  const opportunities: Opportunity[] = [];
  for (const entry of comparisonData) {
    const outcomesRaw = entry.pm_market_outcomes;
    const pricesRaw = entry.pm_market_outcomePrices;
    const sbOutcomes = entry.sportsbook_outcomes ?? [];
    if (!outcomesRaw || !pricesRaw || !Array.isArray(sbOutcomes) || sbOutcomes.length === 0) continue;
    let outcomes: string[] = [];
    let prices: number[] = [];
    try {
      outcomes = Array.isArray(outcomesRaw) ? outcomesRaw : JSON.parse(outcomesRaw);
      prices = (Array.isArray(pricesRaw) ? pricesRaw : JSON.parse(pricesRaw)).map((x: string | number) => Number(x));
    } catch {
      continue;
    }
    const mType = detectMarketType(outcomes);
    for (let i = 0; i < outcomes.length; i += 1) {
      const outcome = outcomes[i];
      const pmPrice = prices[i];
      if (!Number.isFinite(pmPrice) || pmPrice < 0.01) continue;
      const sb = sbOutcomes.find((s: any) => {
        const a = String(outcome).toLowerCase();
        const b = String(s.name ?? "").toLowerCase();
        return a.includes(b) || b.includes(a);
      });
      if (!sb) continue;
      const sbProb = Number(sb.avg_implied_probability);
      if (!Number.isFinite(sbProb) || sbProb <= pmPrice) continue;
      const profit = (sbProb - pmPrice) / pmPrice;
      if (profit < minProfitThreshold) continue;
      const liquidity = Number(entry.pm_market_liquidityNum ?? entry.pm_liquidity ?? 0);
      if (liquidity < minLiquidity) continue;
      opportunities.push({
        pm_event_id: entry.pm_event_id,
        pm_market_id: entry.pm_market_id,
        odds_api_event_id: entry.odds_api_event_id,
        match_confidence: Number(entry.match_confidence ?? 0),
        opportunity_type: "directional",
        market_type: mType,
        profit_margin: profit,
        liquidity,
        pm_spread: Number(entry.pm_spread ?? 0),
        matched_outcomes: [{
          pm_outcome: outcome,
          sb_outcome: sb.name,
          pm_price: pmPrice,
          sb_implied_prob: sbProb,
          match_confidence: Number(entry.match_confidence ?? 0)
        }],
        sell_points: calculateSellPoints(pmPrice, sbProb)
      });
    }
  }
  return opportunities.sort((a, b) => b.profit_margin - a.profit_margin);
}
