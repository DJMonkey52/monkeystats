const BASE = "https://api-public.cs-prod.leetify.com";

export interface LeetifyProfile {
  privacy_mode?: string;
  winrate?: number;
  total_matches?: number;
  first_match_date?: string | null;
  name?: string;
  steam64_id?: string;
  id?: string | null;
  bans?: unknown[];
  ranks?: {
    leetify?: number | null;
    premier?: number | null;
    faceit?: number | null;
    faceit_elo?: number | null;
    wingman?: number | null;
    renown?: number | null;
    competitive?: unknown[];
  };
  rating?: Record<string, number | null>;
  stats?: Record<string, number | null>;
  recent_matches?: unknown[];
  recent_teammates?: unknown[];
}

export interface MatchPlayerStats {
  steam64_id: string;
  name: string;
  mvps?: number;
  preaim?: number;
  reaction_time?: number;
  accuracy?: number;
  accuracy_enemy_spotted?: number;
  accuracy_head?: number;
  shots_fired_enemy_spotted?: number;
  shots_fired?: number;
  shots_hit_enemy_spotted?: number;
  shots_hit_friend?: number;
  shots_hit_friend_head?: number;
  shots_hit_foe?: number;
  shots_hit_foe_head?: number;
  utility_on_death_avg?: number;
  he_foes_damage_avg?: number;
  he_friends_damage_avg?: number;
  he_thrown?: number;
  molotov_thrown?: number;
  smoke_thrown?: number;
  counter_strafing_shots_all?: number;
  counter_strafing_shots_bad?: number;
  counter_strafing_shots_good?: number;
  counter_strafing_shots_good_ratio?: number;
  flashbang_hit_foe?: number;
  flashbang_leading_to_kill?: number;
  flashbang_hit_foe_avg_duration?: number;
  flashbang_hit_friend?: number;
  flashbang_thrown?: number;
  flash_assist?: number;
  score?: number;
  initial_team_number?: number;
  spray_accuracy?: number;
  total_kills?: number;
  total_deaths?: number;
  kd_ratio?: number;
  rounds_survived?: number;
  rounds_survived_percentage?: number;
  dpr?: number;
  total_assists?: number;
  total_damage?: number;
  leetify_rating?: number;
  ct_leetify_rating?: number;
  t_leetify_rating?: number;
  multi1k?: number;
  multi2k?: number;
  multi3k?: number;
  multi4k?: number;
  multi5k?: number;
  rounds_count?: number;
  rounds_won?: number;
  rounds_lost?: number;
  total_hs_kills?: number;
  trade_kill_opportunities?: number;
  trade_kill_attempts?: number;
  trade_kills_succeed?: number;
  trade_kill_attempts_percentage?: number;
  trade_kills_success_percentage?: number;
  trade_kill_opportunities_per_round?: number;
  traded_death_opportunities?: number;
  traded_death_attempts?: number;
  traded_deaths_succeed?: number;
  traded_death_attempts_percentage?: number;
  traded_deaths_success_percentage?: number;
  traded_deaths_opportunities_per_round?: number;
}

export interface LeetifyMatch {
  id: string;
  finished_at: string;
  data_source: string;
  data_source_match_id: string;
  map_name: string;
  has_banned_player?: boolean;
  replay_url?: string;
  team_scores?: { team_number: number; score: number }[];
  stats?: MatchPlayerStats[];
}

function headers(): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.LEETIFY_API_KEY) h.Authorization = `Bearer ${process.env.LEETIFY_API_KEY}`;
  return h;
}

async function get<T>(path: string, params: Record<string, string>) {
  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, { headers: headers(), cache: "no-store", signal: controller.signal });
    if (!res.ok) throw new Error(`Leetify ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function getLeetifyProfile(steamid64: string) {
  return get<LeetifyProfile>("/v3/profile", { steam64_id: steamid64 });
}

export async function getLeetifyMatches(steamid64: string) {
  return get<LeetifyMatch[]>("/v3/profile/matches", { steam64_id: steamid64 });
}

function finite(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function sum(rows: MatchPlayerStats[], key: keyof MatchPlayerStats) {
  return rows.reduce((n, row) => n + (finite(row[key]) ? Number(row[key]) : 0), 0);
}

function avg(rows: MatchPlayerStats[], key: keyof MatchPlayerStats) {
  const values = rows.map(r => r[key]).filter(finite).map(Number);
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

export function buildPlayerAnalytics(profile: LeetifyProfile, matches: LeetifyMatch[], steamid64: string) {
  const playerMatches = matches
    .map(match => ({
      match,
      player: match.stats?.find(s => s.steam64_id === steamid64) ?? match.stats?.find(s => s.name === profile.name)
    }))
    .filter((x): x is { match: LeetifyMatch; player: MatchPlayerStats } => Boolean(x.player))
    .slice(0, 30);

  const rows = playerMatches.map(({ match, player }) => {
    const scores = match.team_scores ?? [];
    const mine = player.initial_team_number;
    const myScore = scores.find(s => s.team_number === mine)?.score ?? null;
    const enemyScore = scores.find(s => s.team_number !== mine)?.score ?? null;
    const result = myScore == null || enemyScore == null ? "unknown" : myScore > enemyScore ? "win" : myScore < enemyScore ? "loss" : "tie";
    return {
      id: match.id,
      date: match.finished_at,
      map: match.map_name,
      mode: match.data_source,
      result,
      score: myScore != null && enemyScore != null ? `${myScore}:${enemyScore}` : "—",
      banned: Boolean(match.has_banned_player),
      kills: player.total_kills ?? 0,
      deaths: player.total_deaths ?? 0,
      assists: player.total_assists ?? 0,
      headshots: player.total_hs_kills ?? 0,
      hsPercent: player.total_kills ? ((player.total_hs_kills ?? 0) / player.total_kills) * 100 : 0,
      kd: player.kd_ratio ?? 0,
      adr: player.dpr ?? 0,
      damage: player.total_damage ?? 0,
      rounds: player.rounds_count ?? 0,
      rating: player.leetify_rating ?? 0,
      ctRating: player.ct_leetify_rating ?? 0,
      tRating: player.t_leetify_rating ?? 0,
      scorePoints: player.score ?? 0,
      mvps: player.mvps ?? 0,
      accuracy: player.accuracy ?? 0,
      preaim: player.preaim ?? 0,
      reaction: player.reaction_time ?? 0,
      sprayAccuracy: player.spray_accuracy ?? 0,
      survived: player.rounds_survived_percentage ?? 0,
      multi1k: player.multi1k ?? 0,
      multi2k: player.multi2k ?? 0,
      multi3k: player.multi3k ?? 0,
      multi4k: player.multi4k ?? 0,
      multi5k: player.multi5k ?? 0,
      tradeKills: player.trade_kills_succeed ?? 0,
      tradeKillSuccess: player.trade_kills_success_percentage ?? 0,
      tradedDeaths: player.traded_deaths_succeed ?? 0,
      tradedDeathSuccess: player.traded_deaths_success_percentage ?? 0,
      flashAssists: player.flash_assist ?? 0,
      flashThrown: player.flashbang_thrown ?? 0,
      heThrown: player.he_thrown ?? 0,
      molotovThrown: player.molotov_thrown ?? 0,
      smokeThrown: player.smoke_thrown ?? 0
    };
  });

  const kills = sum(playerMatches.map(x => x.player), "total_kills");
  const deaths = sum(playerMatches.map(x => x.player), "total_deaths");
  const assists = sum(playerMatches.map(x => x.player), "total_assists");
  const headshots = sum(playerMatches.map(x => x.player), "total_hs_kills");
  const rounds = sum(playerMatches.map(x => x.player), "rounds_count");
  const damage = sum(playerMatches.map(x => x.player), "total_damage");
  const wins = rows.filter(x => x.result === "win").length;
  const losses = rows.filter(x => x.result === "loss").length;
  const ties = rows.filter(x => x.result === "tie").length;

  return {
    matches: rows,
    sampleSize: rows.length,
    totals: {
      kills, deaths, assists, headshots, rounds, damage, wins, losses, ties,
      winRate: rows.length ? (wins / rows.length) * 100 : 0,
      kd: deaths ? kills / deaths : kills,
      hsPercent: kills ? (headshots / kills) * 100 : 0,
      adr: rounds ? damage / rounds : 0,
      rating: avg(playerMatches.map(x => x.player), "leetify_rating"),
      ctRating: avg(playerMatches.map(x => x.player), "ct_leetify_rating"),
      tRating: avg(playerMatches.map(x => x.player), "t_leetify_rating"),
      accuracy: avg(playerMatches.map(x => x.player), "accuracy"),
      preaim: avg(playerMatches.map(x => x.player), "preaim"),
      reaction: avg(playerMatches.map(x => x.player), "reaction_time"),
      sprayAccuracy: avg(playerMatches.map(x => x.player), "spray_accuracy"),
      survived: avg(playerMatches.map(x => x.player), "rounds_survived_percentage"),
      tradeKillSuccess: avg(playerMatches.map(x => x.player), "trade_kills_success_percentage"),
      tradedDeathSuccess: avg(playerMatches.map(x => x.player), "traded_deaths_success_percentage")
    },
    ratings: profile.rating ?? {},
    lifetimeStats: profile.stats ?? {},
    ranks: profile.ranks ?? {},
    totalTrackedMatches: profile.total_matches ?? matches.length,
    firstMatchDate: profile.first_match_date ?? null,
    profileName: profile.name ?? null,
    profileSteamId: profile.steam64_id ?? steamid64,
    source: "leetify"
  };
}
