const BASE = "https://api-public.cs-prod.leetify.com";

export interface LeetifyProfile {
  privacy_mode?: string; winrate?: number; total_matches?: number; first_match_date?: string | null;
  name?: string; steam64_id?: string; id?: string | null; bans?: unknown[];
  ranks?: { leetify?: number | null; premier?: number | null; faceit?: number | null; faceit_elo?: number | null; wingman?: number | null; renown?: number | null; competitive?: unknown[] };
  rating?: Record<string, number | null>; stats?: Record<string, number | null>; recent_matches?: unknown[]; recent_teammates?: unknown[];
}

export interface MatchPlayerStats {
  steam64_id: string; name: string; mvps?: number; preaim?: number; reaction_time?: number; accuracy?: number;
  accuracy_enemy_spotted?: number; accuracy_head?: number; shots_fired_enemy_spotted?: number; shots_fired?: number;
  shots_hit_enemy_spotted?: number; shots_hit_friend?: number; shots_hit_friend_head?: number; shots_hit_foe?: number;
  shots_hit_foe_head?: number; utility_on_death_avg?: number; he_foes_damage_avg?: number; he_friends_damage_avg?: number;
  he_thrown?: number; molotov_thrown?: number; smoke_thrown?: number; counter_strafing_shots_all?: number;
  counter_strafing_shots_bad?: number; counter_strafing_shots_good?: number; counter_strafing_shots_good_ratio?: number;
  flashbang_hit_foe?: number; flashbang_leading_to_kill?: number; flashbang_hit_foe_avg_duration?: number;
  flashbang_hit_friend?: number; flashbang_thrown?: number; flash_assist?: number; score?: number; initial_team_number?: number;
  spray_accuracy?: number; total_kills?: number; total_deaths?: number; kd_ratio?: number; rounds_survived?: number;
  rounds_survived_percentage?: number; dpr?: number; total_assists?: number; total_damage?: number; leetify_rating?: number;
  ct_leetify_rating?: number; t_leetify_rating?: number; multi1k?: number; multi2k?: number; multi3k?: number;
  multi4k?: number; multi5k?: number; rounds_count?: number; rounds_won?: number; rounds_lost?: number; total_hs_kills?: number;
  trade_kill_opportunities?: number; trade_kill_attempts?: number; trade_kills_succeed?: number; trade_kill_attempts_percentage?: number;
  trade_kills_success_percentage?: number; trade_kill_opportunities_per_round?: number; traded_death_opportunities?: number;
  traded_death_attempts?: number; traded_deaths_succeed?: number; traded_death_attempts_percentage?: number;
  traded_deaths_success_percentage?: number; traded_deaths_opportunities_per_round?: number;
}

export interface LeetifyMatch { id: string; finished_at: string; data_source: string; data_source_match_id: string; map_name: string; has_banned_player?: boolean; replay_url?: string; team_scores?: { team_number: number; score: number }[]; stats?: MatchPlayerStats[]; }

function headers(): HeadersInit { const h: Record<string, string> = { "Content-Type": "application/json" }; const key = process.env.LEETIFY_API_KEY ?? process.env.LEETIFY_KEY; if (key) h.Authorization = `Bearer ${key}`; return h; }
async function get<T>(path: string, params: Record<string, string>) {
  const url = new URL(`${BASE}${path}`); for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 12000);
  try { const res = await fetch(url, { headers: headers(), cache: "no-store", signal: controller.signal }); if (!res.ok) throw new Error(`Leetify ${res.status}`); return (await res.json()) as T; }
  finally { clearTimeout(timer); }
}
export async function getLeetifyProfile(steamid64: string) { return get<LeetifyProfile>("/v3/profile", { steamId: steamid64 }); }
export async function getLeetifyMatches(steamid64: string) { return get<LeetifyMatch[]>("/v3/profile/matches", { steamId: steamid64 }); }
function finite(v: unknown): v is number { return typeof v === "number" && Number.isFinite(v); }
function sum(rows: MatchPlayerStats[], key: keyof MatchPlayerStats) { return rows.reduce((n, row) => n + (finite(row[key]) ? Number(row[key]) : 0), 0); }
function avg(rows: MatchPlayerStats[], key: keyof MatchPlayerStats) { const values = rows.map(r => r[key]).filter(finite).map(Number); return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0; }

export function buildPlayerAnalytics(profile: LeetifyProfile, matches: LeetifyMatch[], steamid64: string) {
  const playerMatches = matches.map(match => ({ match, player: match.stats?.find(s => s.steam64_id === steamid64) ?? match.stats?.find(s => s.name === profile.name) }))
    .filter((x): x is { match: LeetifyMatch; player: MatchPlayerStats } => Boolean(x.player)).slice(0, 30);
  const players = playerMatches.map(x => x.player);
  const rows = playerMatches.map(({ match, player }) => {
    const scores = match.team_scores ?? [], mine = player.initial_team_number;
    const myScore = scores.find(s => s.team_number === mine)?.score ?? null, enemyScore = scores.find(s => s.team_number !== mine)?.score ?? null;
    const result = myScore == null || enemyScore == null ? "unknown" : myScore > enemyScore ? "win" : myScore < enemyScore ? "loss" : "tie";
    return {
      id: match.id, date: match.finished_at, map: match.map_name, mode: match.data_source, result, score: myScore != null && enemyScore != null ? `${myScore}:${enemyScore}` : "—", banned: Boolean(match.has_banned_player),
      kills: player.total_kills ?? 0, deaths: player.total_deaths ?? 0, assists: player.total_assists ?? 0, headshots: player.total_hs_kills ?? 0,
      hsPercent: player.total_kills ? ((player.total_hs_kills ?? 0) / player.total_kills) * 100 : 0, kd: player.kd_ratio ?? 0, adr: player.dpr ?? 0, damage: player.total_damage ?? 0,
      rounds: player.rounds_count ?? 0, rating: player.leetify_rating ?? 0, ctRating: player.ct_leetify_rating ?? 0, tRating: player.t_leetify_rating ?? 0, scorePoints: player.score ?? 0,
      mvps: player.mvps ?? 0, accuracy: player.accuracy ?? 0, preaim: player.preaim ?? 0, reaction: player.reaction_time ?? 0, sprayAccuracy: player.spray_accuracy ?? 0,
      survived: player.rounds_survived_percentage ?? 0, multi1k: player.multi1k ?? 0, multi2k: player.multi2k ?? 0, multi3k: player.multi3k ?? 0, multi4k: player.multi4k ?? 0, multi5k: player.multi5k ?? 0,
      tradeKills: player.trade_kills_succeed ?? 0, tradeKillSuccess: player.trade_kills_success_percentage ?? 0, tradedDeaths: player.traded_deaths_succeed ?? 0, tradedDeathSuccess: player.traded_deaths_success_percentage ?? 0,
      flashAssists: player.flash_assist ?? 0, flashThrown: player.flashbang_thrown ?? 0, heThrown: player.he_thrown ?? 0, molotovThrown: player.molotov_thrown ?? 0, smokeThrown: player.smoke_thrown ?? 0,
      roundsWon: player.rounds_won ?? 0, roundsLost: player.rounds_lost ?? 0, shotsFired: player.shots_fired ?? 0, shotsHit: player.shots_hit_foe ?? 0, enemyShots: player.shots_fired_enemy_spotted ?? 0,
      headshotHits: player.shots_hit_foe_head ?? 0, flashKills: player.flashbang_leading_to_kill ?? 0, counterStrafe: player.counter_strafing_shots_good_ratio ?? 0, utilityDeath: player.utility_on_death_avg ?? 0,
      tradeAttempts: player.trade_kill_attempts ?? 0, tradeOpps: player.trade_kill_opportunities ?? 0, tradedDeathAttempts: player.traded_death_attempts ?? 0, tradedDeathOpps: player.traded_death_opportunities ?? 0
    };
  });
  const kills = sum(players, "total_kills"), deaths = sum(players, "total_deaths"), assists = sum(players, "total_assists"), headshots = sum(players, "total_hs_kills"), rounds = sum(players, "rounds_count"), damage = sum(players, "total_damage");
  const wins = rows.filter(x => x.result === "win").length, losses = rows.filter(x => x.result === "loss").length, ties = rows.filter(x => x.result === "tie").length;
  const mapStats = Object.entries(rows.reduce<Record<string, { matches:number; wins:number; kills:number; deaths:number; damage:number; rounds:number; rating:number }>>((acc, m) => { const k = m.map; acc[k] ??= {matches:0,wins:0,kills:0,deaths:0,damage:0,rounds:0,rating:0}; const x=acc[k]; x.matches++; x.wins += m.result === "win" ? 1 : 0; x.kills += m.kills; x.deaths += m.deaths; x.damage += m.damage; x.rounds += m.rounds; x.rating += m.rating; return acc; }, {})).map(([map, x]) => ({ map, ...x, winRate: x.matches ? x.wins/x.matches*100 : 0, kd: x.deaths ? x.kills/x.deaths : x.kills, adr: x.rounds ? x.damage/x.rounds : 0, rating: x.matches ? x.rating/x.matches : 0 })).sort((a,b)=>b.matches-a.matches);
  return {
    matches: rows, sampleSize: rows.length, totals: {
      kills,deaths,assists,headshots,rounds,damage,wins,losses,ties,matches:rows.length, winRate:rows.length ? wins/rows.length*100:0, kd:deaths?kills/deaths:kills,
      hsPercent:kills?headshots/kills*100:0, adr:rounds?damage/rounds:0, rating:avg(players,"leetify_rating"), ctRating:avg(players,"ct_leetify_rating"), tRating:avg(players,"t_leetify_rating"), accuracy:avg(players,"accuracy"), preaim:avg(players,"preaim"), reaction:avg(players,"reaction_time"),
      sprayAccuracy:avg(players,"spray_accuracy"), survived:avg(players,"rounds_survived_percentage"), tradeKillSuccess:avg(players,"trade_kills_success_percentage"), tradedDeathSuccess:avg(players,"traded_deaths_success_percentage"), counterStrafe:avg(players,"counter_strafing_shots_good_ratio"),
      roundsWon:sum(players,"rounds_won"), roundsLost:sum(players,"rounds_lost"), shotsFired:sum(players,"shots_fired"), shotsHit:sum(players,"shots_hit_foe"), headshotHits:sum(players,"shots_hit_foe_head"), flashKills:sum(players,"flashbang_leading_to_kill"),
      flashAssists:sum(players,"flash_assist"), flashThrown:sum(players,"flashbang_thrown"), heThrown:sum(players,"he_thrown"), molotovThrown:sum(players,"molotov_thrown"), smokeThrown:sum(players,"smoke_thrown"), mvps:sum(players,"mvps"),
      multi1k:sum(players,"multi1k"), multi2k:sum(players,"multi2k"), multi3k:sum(players,"multi3k"), multi4k:sum(players,"multi4k"), multi5k:sum(players,"multi5k"), tradeKills:sum(players,"trade_kills_succeed"), tradedDeaths:sum(players,"traded_deaths_succeed")
    }, ratings: profile.rating ?? {}, lifetimeStats: profile.stats ?? {}, ranks: profile.ranks ?? {}, mapStats, totalTrackedMatches: profile.total_matches ?? matches.length, firstMatchDate: profile.first_match_date ?? null, profileName: profile.name ?? null, profileSteamId: profile.steam64_id ?? steamid64, source:"leetify"
  };
}
