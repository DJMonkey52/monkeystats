import { NextRequest, NextResponse } from "next/server";
import { parseUserInput } from "@/lib/resolveInput";
import { getPlayerBans, getPlayerSummary, getSteamLevel, getCs2Playtime, resolveVanityUrl } from "@/lib/steam";
import { getFaceitCs2Stats, getFaceitPlayerBySteamId } from "@/lib/faceit";
import { getPremierRating } from "@/lib/premier";
import { buildPlayerAnalytics, getLeetifyMatches, getLeetifyProfile } from "@/lib/leetify";
import { getCsstatsProfile } from "@/lib/csstats";
import { getCs2SpaceProfile } from "@/lib/cs2space";

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

    const [faceitPlayer, premier, leetify, csstats, cs2space] = await Promise.all([
      getFaceitPlayerBySteamId(steamid64, profile.personaname).catch(() => null),
      getPremierRating(steamid64).catch(() => null),
      (async () => {
        try {
          const [p, m] = await Promise.all([getLeetifyProfile(steamid64), getLeetifyMatches(steamid64)]);
          const usable = Array.isArray(m) && m.length ? m : (Array.isArray(p?.recent_matches) ? p.recent_matches as any[] : []);
          return buildPlayerAnalytics(p, usable as any, steamid64);
        } catch (e) {
          console.warn("Leetify v3 lookup failed:", e);
          return null;
        }
      })(),
      getCsstatsProfile(steamid64).catch(() => null),
      getCs2SpaceProfile(steamid64).catch((e) => { console.warn('CS2.SPACE lookup failed:', e); return null; })
    ]);

    const faceitStats = faceitPlayer
      ? await getFaceitCs2Stats(faceitPlayer.player_id).catch(() => null)
      : null;

    const sp = cs2space?.steam || {};
    const unifiedProfile = cs2space ? {
      ...profile,
      ...sp,
      personaname: sp.personaname ?? sp.personaName ?? sp.name ?? sp.nickname ?? profile.personaname,
      avatarfull: sp.avatarfull ?? sp.avatarFull ?? sp.avatar ?? profile.avatarfull,
      profileurl: sp.profileurl ?? sp.profileUrl ?? profile.profileurl,
      personastate: sp.personastate ?? sp.personaState ?? profile.personastate,
    } : profile;
    const unifiedFaceit = cs2space?.faceit?.player ? {
      nickname: faceitPlayer?.nickname ?? cs2space.faceit.player.nickname,
      avatar: faceitPlayer?.avatar ?? cs2space.faceit.player.avatar,
      country: faceitPlayer?.country ?? cs2space.faceit.player.country,
      url: faceitPlayer?.faceit_url?.replace("{lang}", "en") ?? cs2space.faceit.player.faceit_url,
      cs2: faceitPlayer?.games?.cs2 ?? cs2space.faceit.game ?? null,
      stats: faceitStats ?? cs2space.faceit.game ?? null
    } : (faceitPlayer ? { nickname: faceitPlayer.nickname, avatar: faceitPlayer.avatar, country: faceitPlayer.country, url: faceitPlayer.faceit_url?.replace("{lang}", "en"), cs2: faceitPlayer.games?.cs2 ?? null, stats: faceitStats } : null);
    const cs2spaceStats = cs2space?.stats ? Object.fromEntries(Object.entries(cs2space.stats).filter(([, v]) => v != null)) : {};
    const unifiedStats = Object.keys(cs2spaceStats).length ? { ...(csstats?.stats || {}), ...cs2spaceStats } : (csstats?.stats || {});
    const unifiedMatches = cs2space?.matches?.length ? cs2space.matches : (leetify?.matches?.length ? leetify.matches : (csstats?.matches || []));
    const unifiedRanks = cs2space?.competitiveRanks?.length ? cs2space.competitiveRanks : (csstats?.competitiveRanks || []);
    const unifiedPremier = cs2space?.premier?.rating != null ? cs2space.premier : (csstats?.premier?.rating != null ? csstats.premier : premier);
    const merged = cs2space ? {
      steamid64, profile: unifiedProfile, bans, steamLevel: level, playtime,
      premier: unifiedPremier,
      leetify: { ...(leetify || {}), ...(cs2space.leetify || {}), matches: unifiedMatches, totals: { ...(leetify?.totals || {}), ...cs2spaceStats } },
      faceit: unifiedFaceit,
      csstats: { source: 'cs2space', sourceUrl: `https://cs2.space/api/profile/${steamid64}`, stats: unifiedStats, matches: unifiedMatches, premier: unifiedPremier, competitiveRanks: unifiedRanks },
      cs2space
    } : null;

    if (merged) return NextResponse.json(merged);

    return NextResponse.json({
      steamid64, profile, bans, steamLevel: level, playtime, premier, leetify,
      faceit: faceitPlayer ? {
        nickname: faceitPlayer.nickname, avatar: faceitPlayer.avatar, country: faceitPlayer.country,
        url: faceitPlayer.faceit_url?.replace("{lang}", "en"), cs2: faceitPlayer.games?.cs2 ?? null, stats: faceitStats
      } : null,
      csstats
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Не удалось получить статистику игрока. Проверьте API-ключи и попробуйте снова." }, { status: 500 });
  }
}
