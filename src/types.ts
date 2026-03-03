export type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

export interface MatchResult {
  pmEvent: Record<string, any>;
  oddsEvent: Record<string, any>;
  confidence: number;
}

export interface Opportunity {
  pm_event_id?: string;
  pm_market_id?: string;
  odds_api_event_id?: string;
  match_confidence?: number;
  opportunity_type: "directional";
  market_type?: string | null;
  profit_margin: number;
  liquidity?: number;
  pm_spread?: number;
  matched_outcomes: Array<{
    pm_outcome: string;
    sb_outcome: string;
    pm_price: number;
    sb_implied_prob: number;
    match_confidence: number;
  }>;
  sell_points: Array<{
    description: string;
    target_price: number;
    profit_percentage: number;
    confidence: "high" | "medium" | "low";
  }>;
}
