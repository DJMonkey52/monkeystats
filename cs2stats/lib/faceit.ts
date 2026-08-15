const FACEIT_API = "https://open.faceit.com/data/v4";

export interface FaceitPlayer {
  player_id: string;
  nickname: string;
  avatar: string;
  country: string;
  faceit_url: string;
  games: {
    cs2?: {
      skill_level: number;
      faceit_elo: number;
      region: string;
    };
  };
}

export interface FaceitCs2Stats {
  matches: number;
  winRate: number;
  avgKd: number;
  avgHsPercent: number;
  currentWinStreak: number;
  longestWinStreak: number;
  recentResults: ("W" | "L")[];
}

function headers() {
  const k = process.env.FACEIT_API_KEY;
  if (!k) throw new Error("FACEIT_API_KEY is not set");
  return { Authorization: `Bearer ${k}` };
}

export async function getFaceitPlayerBySteamId(
  steamid64: string
): Promise<FaceitPlayer | null> {
  const url = `${FACEIT_API}/players?game=cs2&game_player_id=${steamid64}`;
  const res = await fetch(url, { headers: headers(), cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return (await res.json()) as FaceitPlayer;
}

export async function getFaceitCs2Stats(playerId: string): Promise<FaceitCs2Stats | null> {
  const url = `${FACEIT_API}/players/${playerId}/stats/cs2`;
  const res = await fetch(url, { headers: headers(), cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  const lifetime = data?.lifetime;
  if (!lifetime) return null;

  const recent: string[] = lifetime["Recent Results"] ?? [];

  return {
    matches: Number(lifetime["Matches"] ?? 0),
    winRate: Number(lifetime["Win Rate %"] ?? 0),
    avgKd: Number(lifetime["Average K/D Ratio"] ?? 0),
    avgHsPercent: Number(lifetime["Average Headshots %"] ?? 0),
    currentWinStreak: Number(lifetime["Current Win Streak"] ?? 0),
    longestWinStreak: Number(lifetime["Longest Win Streak"] ?? 0),
    recentResults: recent.map((r) => (r === "1" ? "W" : "L")) as ("W" | "L")[]
  };
}
