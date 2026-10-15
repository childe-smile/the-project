const servers = ["https://de1.api.radio-browser.info", "https://nl1.api.radio-browser.info"];
const cache = new Map();

export async function getRadioStations(genre) {
  if (cache.has(genre)) return cache.get(genre);
  const query = new URLSearchParams({ tag: genre, hidebroken: "true", is_https: "true", order: "votes", reverse: "true", limit: "30" });
  for (const server of servers) {
    try {
      const response = await fetch(`${server}/json/stations/search?${query}`, { signal: AbortSignal.timeout(6000) });
      if (!response.ok) continue;
      const seen = new Set();
      const stations = (await response.json()).flatMap(station => {
        const url = station.url_resolved || station.url;
        try { if (new URL(url).protocol !== "https:" || station.hls || seen.has(url)) return []; } catch { return []; }
        seen.add(url);
        return [{ name: String(station.name || "Radio station").trim(), url, country: station.country || "Live radio", bitrate: Number(station.bitrate) || 0 }];
      });
      if (stations.length) { cache.set(genre, stations); return stations; }
    } catch { /* Try another directory when one server is unavailable. */ }
  }
  throw new Error("Stations couldn't load. Try again.");
}
