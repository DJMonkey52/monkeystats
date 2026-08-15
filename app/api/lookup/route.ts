import { NextRequest, NextResponse } from "next/server";
import { parseUserInput } from "@/lib/resolveInput";
import { getPlayerBans, getPlayerSummary, getSteamLevel, getCs2Playtime, resolveVanityUrl } from "@/lib/steam";
import { getFaceitCs2Stats, getFaceitPlayerBySteamId } from "@/lib/faceit";
import { getPremierRating } from "@/lib/premier";
import { buildPlayerAnalytics, getLeetifyMatches, getLeetifyProfile } from "@/lib/leetify";
import { getCsstatsProfile } from "@/lib/csstats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q?.trim()) return NextResponse.json({ error: "Введите ссылку, SteamID или ник." }, { status: 400 });

  try {
    const parsed = parseUserInput(q);
    let steamid64 = parsed.kind === "steamid64" ? parsed.value : null;
    if (parsed.kind === "vanity") steamid64 = await resolveVanityUrl(parsed.value);
    if (!steamid64) return NextResponse.json({ error: "Не удалось определить SteamID64." }, { status: 404 });

    const [profile, bans, level, playtime] = await Promise.all([
      getPlayerSummary(steamid64),
      getPlayerBans(steamid64).catch(() => null),
      getSteamLevel(steamid64).catch(() => null),
      getCs2Playtime(steamid64).catch(() => ({ forever_minutes: 0, recent_minutes: 0, visible: false }))
    ]);
    if (!profile) return NextResponse.json({ error: "Steam-профиль не найден или закрыт." }, { status: 404 });

    const [faceitPlayer, premier, leetify, csstats] = await Promise.all([
      getFaceitPlayerBySteamId(steamid64, profile.personaname).catch(() => null),
      getPremierRating(steamid64).catch(() => null),
      (async () => {
        try {
          const [p, m] = await Promise.all([getLeetifyProfile(steamid64), getLeetifyMatches(steamid64)]);
          return buildPlayerAnalytics(p, m, steamid64);
        } catch (e) {
          console.warn("Leetify v3 lookup failed:", e);
          return null;
        }
      })(),
      getCsstatsProfile(steamid64).catch(() => null)
    ]);

    const faceitStats = faceitPlayer
      ? await getFaceitCs2Stats(faceitPlayer.player_id).catch(() => null)
      : null;

    return NextResponse.json({
      steamid64,
      profile,
      bans,
      steamLevel: level,
      playtime,
      premier,
      leetify,
      faceit: faceitPlayer ? {
        nickname: faceitPlayer.nickname,
        avatar: faceitPlayer.avatar,
        country: faceitPlayer.country,
        url: faceitPlayer.faceit_url?.replace("{lang}", "en"),
        cs2: faceitPlayer.games?.cs2 ?? null,
        stats: faceitStats
      } : null,
      csstats
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Не удалось получить статистику игрока. Проверьте API-ключи и попробуйте снова." }, { status: 500 });
  }
}
