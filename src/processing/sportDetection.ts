const SERIES_TICKER_MAP: Record<string, string> = {
  nfl: "americanfootball_nfl",
  nba: "basketball_nba",
  mlb: "baseball_mlb",
  nhl: "icehockey_nhl",
  ncaaf: "americanfootball_ncaaf",
  ncaab: "basketball_ncaab",
  cbb: "basketball_ncaab",
  cfb: "americanfootball_ncaaf",
  soccer: "soccer_epl",
  mma: "mma_mixed_martial_arts",
  "soccer_epl": "soccer_epl"
};

const NFL = ["patriots", "chiefs", "cowboys", "eagles", "packers", "49ers"];
const NBA = ["lakers", "celtics", "warriors", "knicks", "nets", "bulls"];
const MLB = ["yankees", "red sox", "dodgers", "mets", "astros", "braves"];
const NHL = ["bruins", "rangers", "oilers", "canucks", "leafs", "penguins"];

export function detectSportKey(eventData: Record<string, any>): string | null {
  if (!eventData) return null;
  const ticker = String(eventData.series_ticker ?? "").toLowerCase().trim();
  if (ticker) {
    if (SERIES_TICKER_MAP[ticker]) return SERIES_TICKER_MAP[ticker];
    if (ticker.startsWith("cfb")) return "americanfootball_ncaaf";
    if (ticker.startsWith("cbb")) return "basketball_ncaab";
    if (ticker.includes("ncaa-cbb") || ticker.includes("ncaa_cbb")) return "basketball_ncaab";
  }

  const teamText = `${String(eventData.homeTeamName ?? "").toLowerCase()} ${String(eventData.awayTeamName ?? "").toLowerCase()}`;
  if (NFL.some((t) => teamText.includes(t))) return "americanfootball_nfl";
  if (NBA.some((t) => teamText.includes(t))) return "basketball_nba";
  if (MLB.some((t) => teamText.includes(t))) return "baseball_mlb";
  if (NHL.some((t) => teamText.includes(t))) return "icehockey_nhl";

  const text = `${String(eventData.question ?? "").toLowerCase()} ${String(eventData.description ?? "").toLowerCase()}`;
  if (text.includes("nfl")) return "americanfootball_nfl";
  if (text.includes("nba")) return "basketball_nba";
  if (text.includes("mlb")) return "baseball_mlb";
  if (text.includes("nhl")) return "icehockey_nhl";
  if (text.includes("ncaaf") || text.includes("college football")) return "americanfootball_ncaaf";
  if (text.includes("ncaab") || text.includes("college basketball")) return "basketball_ncaab";
  if (text.includes("soccer")) return "soccer_epl";
  if (text.includes("mma") || text.includes("ufc")) return "mma_mixed_martial_arts";
  return null;
}
