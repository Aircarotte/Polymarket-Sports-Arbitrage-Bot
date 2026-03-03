import { detectSportKey } from "./sportDetection.js";
import type { MatchResult } from "../types.js";

export function normalizeTeamName(name: string | null | undefined): string {
  if (!name) return "";
  return String(name).toLowerCase().trim();
}

function simpleSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.95;
  const aSet = new Set(a.split(/\s+/).filter(Boolean));
  const bSet = new Set(b.split(/\s+/).filter(Boolean));
  const inter = [...aSet].filter((w) => bSet.has(w)).length;
  const union = new Set([...aSet, ...bSet]).size || 1;
  return inter / union;
}

export function calculateMatchScore(pmEvent: Record<string, any>, oddsEvent: Record<string, any>): number {
  const pmSport = detectSportKey(pmEvent);
  const oddsSport = String(oddsEvent.sport_key ?? "");
  if (pmSport && oddsSport && pmSport !== oddsSport) return 0;

  const pmHome = normalizeTeamName(pmEvent.homeTeamName);
  const pmAway = normalizeTeamName(pmEvent.awayTeamName);
  const oddsHome = normalizeTeamName(oddsEvent.home_team);
  const oddsAway = normalizeTeamName(oddsEvent.away_team);
  if (!pmHome && !pmAway) return 0;

  const team1 = (simpleSimilarity(pmHome, oddsHome) + simpleSimilarity(pmAway, oddsAway)) / 2;
  const team2 = (simpleSimilarity(pmHome, oddsAway) + simpleSimilarity(pmAway, oddsHome)) / 2;
  const teamScore = Math.max(team1, team2);

  const pmDateRaw = String(pmEvent.startTime ?? pmEvent.eventDate ?? "");
  const oddsDateRaw = String(oddsEvent.commence_time ?? "");
  let dateScore = 1;
  if (pmDateRaw && oddsDateRaw) {
    const pmDate = new Date(pmDateRaw).toISOString().slice(0, 10);
    const odDate = new Date(oddsDateRaw).toISOString().slice(0, 10);
    dateScore = pmDate === odDate ? 1 : 0;
  }
  return teamScore * dateScore;
}

export function matchEvents(polymarketEvents: Record<string, any>[], oddsApiEvents: Record<string, any>[], minConfidence = 0.8): MatchResult[] {
  const matches: MatchResult[] = [];
  for (const pmEvent of polymarketEvents) {
    let best: Record<string, any> | null = null;
    let bestScore = 0;
    for (const oddsEvent of oddsApiEvents) {
      const s = calculateMatchScore(pmEvent, oddsEvent);
      if (s > bestScore) {
        bestScore = s;
        best = oddsEvent;
      }
      if (s === 1) break;
    }
    if (best && bestScore >= minConfidence) {
      matches.push({ pmEvent, oddsEvent: best, confidence: bestScore });
    }
  }
  return matches;
}
