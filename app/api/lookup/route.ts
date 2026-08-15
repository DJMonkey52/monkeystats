import { NextRequest, NextResponse } from "next/server";
import { parseUserInput } from "@/lib/resolveInput";
import {
  getCs2Playtime,
  getPlayerBans,
  getPlayerSummary,
  getSteamLevel,
  resolveVanityUrl
} from "@/lib/steam";
import { getFaceitCs2Stats, getFaceitPlayerBySteamId } from "@/lib/faceit";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || !q.trim()) {
    return NextResponse.json({ error: "Введите ссылку, SteamID или ник." }, { status: 400 });
  }

  try {
    const parsed = parseUserInput(q);

    let steamid64 = parsed.kind === "steamid64" ? parsed.value : null;
    if (parsed.kind === "vanity") {
      steamid64 = await resolveVanityUrl(parsed.value);
    }

    if (!steamid64) {
      return NextResponse.json(
        { error: "Не удалось найти игрока по этому запросу. Проверьте ссылку/SteamID." },
        { status: 404 }
      );
    }

    const [profile, bans, level, playtime] = await Promise.all([
      getPlayerSummary(steamid64),
      getPlayerBans(steamid64).catch(() => null),
      getSteamLevel(steamid64).catch(() => null),
      getCs2Playtime(steamid64).catch(() => ({ forever_minutes: 0, recent_minutes: 0, visible: false }))
    ]);

    if (!profile) {
      return NextResponse.json({ error: "Профиль Steam не найден." }, { status: 404 });
    }

    const faceitPlayer = await getFaceitPlayerBySteamId(steamid64).catch(() => null);
    const faceitStats = faceitPlayer
      ? await getFaceitCs2Stats(faceitPlayer.player_id).catch(() => null)
      : null;

    return NextResponse.json({
      steamid64,
      profile,
      bans,
      steamLevel: level,
      playtime,
      faceit: faceitPlayer
        ? {
            nickname: faceitPlayer.nickname,
            avatar: faceitPlayer.avatar,
            country: faceitPlayer.country,
            url: faceitPlayer.faceit_url?.replace("{lang}", "en"),
            cs2: faceitPlayer.games?.cs2 ?? null,
            stats: faceitStats
          }
        : null
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Внутренняя ошибка при обращении к Steam/FACEIT API." },
      { status: 500 }
    );
  }
}
