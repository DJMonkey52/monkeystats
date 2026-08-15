/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.steamstatic.com" },
      { protocol: "https", hostname: "avatars.akamai.steamstatic.com" },
      { protocol: "https", hostname: "assets.faceit-cdn.net" },
      { protocol: "https", hostname: "distribution.faceit-cdn.net" }
    ]
  }
};

export default nextConfig;
