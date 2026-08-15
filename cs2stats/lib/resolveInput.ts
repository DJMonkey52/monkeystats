// Turns whatever the user pasted (steamID64, steamID32, vanity URL, full
// profile link) into a raw identifier the Steam Web API can work with.

const STEAMID64_BASE = 76561197960265728n;

export type ParsedInput =
  | { kind: "steamid64"; value: string }
  | { kind: "vanity"; value: string };

function fromLegacySteamId(input: string): string | null {
  // STEAM_0:1:12345678
  const m = input.match(/^STEAM_[0-5]:([01]):(\d+)$/i);
  if (!m) return null;
  const y = BigInt(m[1]);
  const z = BigInt(m[2]);
  return (STEAMID64_BASE + z * 2n + y).toString();
}

function fromSteam3Id(input: string): string | null {
  // [U:1:12345678]
  const m = input.match(/^\[?U:1:(\d+)\]?$/i);
  if (!m) return null;
  const accountId = BigInt(m[1]);
  return (STEAMID64_BASE + accountId).toString();
}

export function parseUserInput(raw: string): ParsedInput {
  const input = raw.trim();

  // Full steamID64, 17 digits starting with 7656119
  if (/^7656119\d{10}$/.test(input)) {
    return { kind: "steamid64", value: input };
  }

  const legacy = fromLegacySteamId(input);
  if (legacy) return { kind: "steamid64", value: legacy };

  const steam3 = fromSteam3Id(input);
  if (steam3) return { kind: "steamid64", value: steam3 };

  // URL forms: steamcommunity.com/profiles/<id64> or /id/<vanity>
  try {
    const withProtocol = input.startsWith("http") ? input : `https://${input}`;
    const url = new URL(withProtocol);
    if (url.hostname.includes("steamcommunity.com")) {
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] === "profiles" && parts[1]) {
        if (/^7656119\d{10}$/.test(parts[1])) {
          return { kind: "steamid64", value: parts[1] };
        }
      }
      if (parts[0] === "id" && parts[1]) {
        return { kind: "vanity", value: parts[1] };
      }
    }
  } catch {
    // not a URL, fall through
  }

  // Bare accountId (32-bit)
  if (/^\d{1,10}$/.test(input) && input.length < 17) {
    const accountId = BigInt(input);
    return { kind: "steamid64", value: (STEAMID64_BASE + accountId).toString() };
  }

  // Anything else: treat as a vanity name / custom URL slug
  return { kind: "vanity", value: input };
}
