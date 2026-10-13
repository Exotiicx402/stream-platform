export const providers = [
  { id: "vidlink", name: "VidLink", origin: "https://vidlink.pro" },
  { id: "vidfast", name: "VidFast", origin: "https://vidfast.vc" },
  { id: "vidy", name: "Vidy", origin: "https://www.vidy.st" },
];
export function playerUrl(
  providerId,
  title,
  season = 1,
  episode = 1,
  start = 0,
) {
  const provider = providers.find((p) => p.id === providerId);
  if (
    !provider ||
    !Number.isSafeInteger(title.id) ||
    title.id <= 0 ||
    !["movie", "tv"].includes(title.kind)
  )
    throw new Error("Invalid player selection");
  if (
    !Number.isSafeInteger(season) ||
    season < 1 ||
    !Number.isSafeInteger(episode) ||
    episode < 1
  )
    throw new Error("Invalid episode");
  const url = new URL(
    title.kind === "movie"
      ? `/movie/${title.id}`
      : `/tv/${title.id}/${season}/${episode}`,
    provider.origin,
  );
  const offset = Math.max(0, Math.floor(Number.isFinite(start) ? start : 0));
  if (providerId === "vidlink") {
    url.searchParams.set("autoplay", "false");
    url.searchParams.set("startAt", String(offset));
  }
  if (providerId === "vidfast") {
    url.searchParams.set("autoPlay", "false");
    url.searchParams.set("startAt", String(offset));
  }
  if (providerId === "vidy") {
    url.searchParams.set("autoplay", "false");
    url.searchParams.set("progress", String(offset));
  }
  return url.toString();
}
export function readProgress(event, frame, origin) {
  if (event.source !== frame || event.origin !== origin) return null;
  let value = event.data;
  try {
    if (typeof value === "string") {
      if (value.length > 20000) return null;
      value = JSON.parse(value);
    }
  } catch {
    return null;
  }
  if (value?.type !== "PLAYER_EVENT") return null;
  const data = value.data;
  if (!data || !["timeupdate", "pause", "ended", "seeked"].includes(data.event))
    return null;
  if (
    typeof data.currentTime !== "number" ||
    typeof data.duration !== "number" ||
    !Number.isFinite(data.currentTime) ||
    !Number.isFinite(data.duration) ||
    data.currentTime < 0 ||
    data.duration <= 0 ||
    data.currentTime > data.duration + 2
  )
    return null;
  return {
    position: Math.min(data.currentTime, data.duration),
    duration: data.duration,
  };
}
