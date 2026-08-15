const STEAM_API = "https://api.steampowered.com";
const CS2_APPID = 730;

export interface SteamProfile {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatarfull: string;
  personastate: number;
  communityvisibilitystate: number;
  timecreated?: number;
  loccountrycode?: string;
}

export interface SteamBans {
  VACBanned: boolean;
  NumberOfVACBans: number;
  NumberOfGameBans: number;
  DaysSinceLastBan: number;
  CommunityBanned: boolean;
  EconomyBan: string;
}

function key(): string {
  const k = process.env.STEAM_API_KEY;
  if (!k) throw new Error("STEAM_API_KEY is not set");
  return k;
}

export async function resolveVanityUrl(vanity: string): Promise<string | null> {
  const url = `${STEAM_API}/ISteamUser/ResolveVanityURL/v1/?key=${key()}&vanityurl=${encodeURIComponent(
    vanity
  )}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  if (data?.response?.success === 1) return data.response.steamid as string;
  return null;
}

export async function getPlayerSummary(steamid64: string): Promise<SteamProfile | null> {
  const url = `${STEAM_API}/ISteamUser/GetPlayerSummaries/v2/?key=${key()}&steamids=${steamid64}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  const player = data?.response?.players?.[0];
  return player ?? null;
}

export async function getPlayerBans(steamid64: string): Promise<SteamBans | null> {
  const url = `${STEAM_API}/ISteamUser/GetPlayerBans/v1/?key=${key()}&steamids=${steamid64}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.players?.[0] ?? null;
}

export async function getSteamLevel(steamid64: string): Promise<number | null> {
  const url = `${STEAM_API}/IPlayerService/GetSteamLevel/v1/?key=${key()}&steamid=${steamid64}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return typeof data?.response?.player_level === "number" ? data.response.player_level : null;
}

export interface Cs2Playtime {
  forever_minutes: number;
  recent_minutes: number;
  visible: boolean;
}

export async function getCs2Playtime(steamid64: string): Promise<Cs2Playtime> {
  const url = `${STEAM_API}/IPlayerService/GetOwnedGames/v1/?key=${key()}&steamid=${steamid64}&include_appinfo=false&include_played_free_games=true`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return { forever_minutes: 0, recent_minutes: 0, visible: false };
  const data = await res.json();
  const games = data?.response?.games as
    | { appid: number; playtime_forever: number; playtime_2weeks?: number }[]
    | undefined;
  if (!games) return { forever_minutes: 0, recent_minutes: 0, visible: false };
  const cs2 = games.find((g) => g.appid === CS2_APPID);
  if (!cs2) return { forever_minutes: 0, recent_minutes: 0, visible: true };
  return {
    forever_minutes: cs2.playtime_forever,
    recent_minutes: cs2.playtime_2weeks ?? 0,
    visible: true
  };
}
