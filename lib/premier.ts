const LEETIFY_API = "https://api.cs-prod.leetify.com/api/profile/id";
const CSSTATS_URL = "https://csstats.gg/player";

export interface PremierGame {
  gameId: string;
  mapName: string;
  matchResult: "win" | "loss" | "tie";
  skillLevel: number;
  rankType: number | null;
  elo: number | null;
}

export interface PremierData {
  rating: number;
  previousRating: number | null;
  ratingChange: number | null;
  season: number | null;
  recentGames: PremierGame[];
  source: "leetify" | "csstats";
  sourceUrl: string;
  fetchedAt: string;
}

function parseNumber(value: string): number | null {
  const normalized = value.replace(/\u00a0/g, " ").replace(/,/g, "").trim();
  const match = normalized.match(/\d{1,6}/);
  return match ? Number(match[0]) : null;
}

function decodeHtml(text: string): string {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>(?=.)/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchLeetify(steamid64: string): Promise<PremierData | null> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const key = process.env.LEETIFY_KEY;
  if (key) headers._leetify_key = key;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);

  try {
    const res = await fetch(`${LEETIFY_API}/${steamid64}`, {
      headers,
      signal: controller.signal,
      next: { revalidate: 300 }
    });

    if (!res.ok) { console.warn(`Leetify premier ${res.status} for ${steamid64}`); return null; }

    const data = await res.json();
    const games = Array.isArray(data?.games) ? data.games : [];
    const premier = games
      .filter((game: any) => Number(game?.rankType) === 11 && Number.isFinite(Number(game?.skillLevel)))
      .map((game: any) => ({
        gameId: String(game.gameId ?? ""),
        mapName: String(game.mapName ?? "—"),
        matchResult: game.matchResult === "win" || game.matchResult === "loss" ? game.matchResult : "tie",
        skillLevel: Number(game.skillLevel),
        rankType: Number(game.rankType),
        elo: game.elo == null ? null : Number(game.elo)
      })) as PremierGame[];

    if (!premier.length) return null;

    const rating = premier[0].skillLevel;
    const previousRating = premier.length > 1 ? premier[1].skillLevel : null;

    return {
      rating,
      previousRating,
      ratingChange: previousRating == null ? null : rating - previousRating,
      season: null,
      recentGames: premier.slice(0, 10),
      source: "leetify",
      sourceUrl: `https://leetify.com/app/profile/${steamid64}`,
      fetchedAt: new Date().toISOString()
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchCsstats(steamid64: string): Promise<PremierData | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(`${CSSTATS_URL}/${steamid64}`, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "Mozilla/5.0 (compatible; CS2RadarStats/1.0; +https://csstats.gg/)"
      },
      signal: controller.signal,
      next: { revalidate: 600 }
    });

    if (!res.ok) { console.warn(`CSStats premier ${res.status} for ${steamid64}`); return null; }

    const html = await res.text();
    const text = decodeHtml(html);
    const seasonMatch = text.match(/Premier\s*-\s*Season\s*(\d+)/i);
    if (!seasonMatch) { console.warn(`CSStats premier: no "Premier - Season" marker found for ${steamid64}`); return null; }

    const season = Number(seasonMatch[1]);
    const section = text.slice(seasonMatch.index ?? 0, (seasonMatch.index ?? 0) + 700);

    // Current CSStats pages show the current and best Premier values directly
    // after the season marker. Prefer the first 4–5 digit rating we encounter.
    const candidates = section
      .match(/(?:^|\s)(\d{1,3}(?:[ ,]\d{3})|\d{4,5})(?=\s|$)/g)
      ?.map((value) => parseNumber(value))
      .filter((value): value is number => value !== null && value >= 1000 && value <= 50000) ?? [];

    const rating = candidates[0] ?? null;
    const previousRating = candidates[1] ?? null;
    if (rating == null) return null;

    return {
      rating,
      previousRating,
      ratingChange: previousRating == null ? null : rating - previousRating,
      season,
      recentGames: [],
      source: "csstats",
      sourceUrl: `${CSSTATS_URL}/${steamid64}`,
      fetchedAt: new Date().toISOString()
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function getPremierRating(steamid64: string): Promise<PremierData | null> {
  // Primary source: unofficial Leetify profile endpoint. It is much more
  // precise than HTML parsing and returns the latest Premier game rating.
  try {
    const data = await fetchLeetify(steamid64);
    if (data) return data;
  } catch (error) {
    console.warn("Leetify Premier lookup failed:", error);
  }

  // Fallback: scrape the public CSStats profile. This is intentionally kept
  // isolated so a markup change only affects this adapter.
  try {
    const data = await fetchCsstats(steamid64);
    if (data) return data;
  } catch (error) {
    console.warn("CSStats Premier scrape failed:", error);
  }

  return null;
}
