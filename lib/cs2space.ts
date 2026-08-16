const BASE = 'https://cs2.space/api/profile';

const finite = (v: unknown) => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v.replace(/,/g, '').replace('%', '').trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const first = (...values: unknown[]) => values.find(v => v !== null && v !== undefined && v !== '' && !(typeof v === 'number' && !Number.isFinite(v)));
const num = (...values: unknown[]) => finite(first(...values));
const arr = (...values: unknown[]) => values.find(Array.isArray) as any[] | undefined;

function findArrays(node: any, predicate: (a: any[]) => boolean, depth = 0): any[][] {
  if (!node || depth > 6) return [];
  const out: any[][] = [];
  if (Array.isArray(node)) {
    if (predicate(node)) out.push(node);
    for (const x of node) out.push(...findArrays(x, predicate, depth + 1));
  } else if (typeof node === 'object') {
    for (const x of Object.values(node)) out.push(...findArrays(x, predicate, depth + 1));
  }
  return out;
}

function normalizeMatches(raw: any, steamid64: string) {
  const candidates = findArrays(raw, a => a.length > 0 && a.some(x => x && typeof x === 'object' && (x.map_name || x.mapName || x.finished_at || x.finishedAt || x.match_id || x.matchId)));
  const source = candidates.sort((a, b) => b.length - a.length)[0] || [];
  return source.map((m: any, i: number) => {
    const stats = Array.isArray(m.stats) ? m.stats : Array.isArray(m.players) ? m.players : [];
    const p = stats.find((x: any) => String(x?.steam64_id ?? x?.steamId ?? x?.steam_id_64 ?? '') === steamid64) || stats.find((x: any) => x?.player || x?.player_stats)?.player_stats || stats[0] || m.player || m.stats || {};
    const teamScores = m.team_scores || m.teamScores || [];
    const team = num(p.initial_team_number, p.team_number, p.teamNumber);
    const mine = teamScores.find((x: any) => num(x.team_number, x.teamNumber) === team)?.score;
    const enemy = teamScores.find((x: any) => num(x.team_number, x.teamNumber) !== team)?.score;
    const result = mine != null && enemy != null ? (mine > enemy ? 'win' : mine < enemy ? 'loss' : 'tie') : (m.result || 'unknown');
    const kills = num(p.total_kills, p.kills, p.Kills) ?? 0;
    const deaths = num(p.total_deaths, p.deaths, p.Deaths) ?? 0;
    const hs = num(p.total_hs_kills, p.headshots, p.Headshots) ?? 0;
    const rounds = num(p.rounds_count, p.rounds, p.Rounds) ?? 0;
    const damage = num(p.total_damage, p.damage, p.Damage) ?? 0;
    return {
      id: String(m.id ?? m.match_id ?? m.matchId ?? i),
      date: m.finished_at ?? m.finishedAt ?? m.date ?? m.started_at ?? null,
      map: m.map_name ?? m.mapName ?? m.map ?? '—',
      mode: m.data_source ?? m.mode ?? m.game_mode ?? 'CS2',
      result,
      score: mine != null && enemy != null ? `${mine}:${enemy}` : String(m.score ?? '—'),
      kills, deaths, assists: num(p.total_assists, p.assists) ?? 0,
      hsPercent: num(p.hs_percent, p.hsPercent) ?? (kills ? hs / kills * 100 : 0),
      kd: num(p.kd_ratio, p.kd, p.KD) ?? (deaths ? kills / deaths : kills),
      adr: num(p.adr, p.ADR, p.dpr) ?? (rounds ? damage / rounds : 0),
      damage, rounds, rating: num(p.leetify_rating, p.rating, p.Rating) ?? 0,
      ctRating: num(p.ct_leetify_rating, p.ct_rating) ?? 0,
      tRating: num(p.t_leetify_rating, p.t_rating) ?? 0,
      mvps: num(p.mvps, p.MVPs) ?? 0,
      accuracy: num(p.accuracy) ?? 0,
      preaim: num(p.preaim) ?? 0,
      reaction: num(p.reaction_time, p.reaction) ?? 0,
      sprayAccuracy: num(p.spray_accuracy) ?? 0,
      survived: num(p.rounds_survived_percentage, p.survival) ?? 0,
      multi1k: num(p.multi1k) ?? 0, multi2k: num(p.multi2k) ?? 0, multi3k: num(p.multi3k) ?? 0, multi4k: num(p.multi4k) ?? 0, multi5k: num(p.multi5k) ?? 0,
      tradeKills: num(p.trade_kills_succeed, p.tradeKills) ?? 0,
      tradedDeaths: num(p.traded_deaths_succeed, p.tradedDeaths) ?? 0,
      flashAssists: num(p.flash_assist, p.flashAssists) ?? 0,
      flashKills: num(p.flashbang_leading_to_kill, p.flashKills) ?? 0,
      roundsWon: num(p.rounds_won) ?? 0, roundsLost: num(p.rounds_lost) ?? 0,
      shotsFired: num(p.shots_fired) ?? 0, shotsHit: num(p.shots_hit_foe, p.shots_hit) ?? 0,
      headshotHits: num(p.shots_hit_foe_head) ?? 0,
      counterStrafe: num(p.counter_strafing_shots_good_ratio, p.counterStrafe) ?? 0,
      tradeKillSuccess: num(p.trade_kills_success_percentage) ?? 0,
      tradedDeathSuccess: num(p.traded_deaths_success_percentage) ?? 0,
      heThrown: num(p.he_thrown) ?? 0, molotovThrown: num(p.molotov_thrown) ?? 0, smokeThrown: num(p.smoke_thrown) ?? 0
    };
  }).filter((x: any) => x.date || x.map !== '—').slice(0, 30);
}

function normalizeRanks(raw: any) {
  const out: any[] = [];
  const rankArrays = findArrays(raw, a => a.length > 0 && a.some(x => x && typeof x === 'object' && (x.rank_id != null || x.rankId != null || x.skill_level != null || x.skillLevel != null || x.rank != null)));
  for (const list of rankArrays) for (const x of list) {
    const level = num(x.rank_id, x.rankId, x.skill_level, x.skillLevel, x.level);
    if (level != null && level >= 1 && level <= 18) {
      const map = x.map_name ?? x.mapName ?? x.map ?? x.mode ?? 'Competitive';
      if (!out.some(r => r.level === level && r.map === map)) out.push({ level, map, name: x.rank_name ?? x.rankName ?? x.rank_label ?? x.skill_level_label ?? null });
    }
  }
  return out;
}

function extractPremier(raw: any) {
  const sources = [raw.premier, raw.cs2?.premier, raw.leetify?.premier, raw.leetify?.ranks?.premier, raw.player?.premier];
  for (const s of sources) {
    if (s == null) continue;
    if (typeof s === 'number' || typeof s === 'string') { const r = finite(s); if (r != null) return { rating: r, previousRating: null, season: null, history: [] }; }
    if (typeof s === 'object') {
      const rating = num(s.rating, s.elo, s.skillLevel, s.current, s.currentRating, s.rank);
      const history = Array.isArray(s.history) ? s.history.map((h: any) => ({ season: num(h.season, h.seasonNumber), rating: num(h.rating, h.currentRating, h.elo, h.current), best: num(h.best, h.bestRating), wins: num(h.wins) })).filter((h: any) => h.season != null) : [];
      return { rating, previousRating: num(s.previousRating, s.previous, s.bestPrevious), season: num(s.season, s.seasonNumber), history };
    }
  }
  return { rating: null, previousRating: null, season: null, history: [] };
}

export async function getCs2SpaceProfile(steamid64: string) {
  const key = process.env.CS2SPACE_API_KEY || process.env.CS2_SPACE_API_KEY;
  if (!key) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${BASE}/${encodeURIComponent(steamid64)}`, { headers: { 'x-api-key': key, Accept: 'application/json' }, cache: 'no-store', signal: controller.signal });
    if (!res.ok) throw new Error(`CS2.SPACE ${res.status}`);
    const raw = await res.json();
    const steam = raw.steam?.profile ?? raw.steam?.player ?? raw.steam ?? raw.profile ?? {};
    const face = raw.faceit ?? {};
    const faceGame = face.cs2 ?? face.games?.cs2 ?? {};
    const lt = raw.leetify ?? {};
    const ltStats = lt.stats ?? lt.statistics ?? {};
    const premier = extractPremier(raw);
    const directMatches = arr(raw.matches, raw.matchHistory, raw.recentMatches, raw.leetify?.matches, raw.leetify?.matchHistory);
    const matches = directMatches?.length ? normalizeMatches({ matches: directMatches }, steamid64) : normalizeMatches(raw, steamid64);
    const competitiveRanks = normalizeRanks(raw);
    const kills = num(ltStats.kills, lt.kills, ltStats.total_kills) ?? 0;
    const deaths = num(ltStats.deaths, lt.deaths, ltStats.total_deaths) ?? 0;
    const rounds = num(ltStats.rounds, ltStats.rounds_count) ?? 0;
    const damage = num(ltStats.damage, ltStats.total_damage) ?? 0;
    const totals = {
      kd: num(ltStats.kd, lt.kd, ltStats.kd_ratio) ?? (deaths ? kills / deaths : null), hltvRating: num(ltStats.rating, lt.rating, ltStats.hltv_rating),
      winRate: num(ltStats.winRate, ltStats.win_rate, lt.win_rate), played: num(ltStats.matches, lt.total_matches, matches.length),
      wins: num(ltStats.wins, lt.wins), losses: num(ltStats.losses, lt.losses), ties: num(ltStats.ties, lt.ties), hsPercent: num(ltStats.hsPercent, ltStats.hs_percent),
      kills, deaths, assists: num(ltStats.assists, lt.assists), headshots: num(ltStats.headshots, lt.headshots), adr: num(ltStats.adr, lt.adr) ?? (rounds ? damage / rounds : null), damage, rounds
    };
    return {
      source: 'cs2space', sourceUrl: `https://cs2.space/api/profile/${steamid64}`,
      raw,
      steam, faceit: { player: face, game: faceGame }, leetify: lt,
      stats: totals, matches, premier, competitiveRanks
    };
  } finally { clearTimeout(timer); }
}
