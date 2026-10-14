const genres = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science fiction",
  53: "Thriller",
  10752: "War",
  37: "Western",
  10759: "Action & Adventure",
  10765: "Sci-Fi & Fantasy",
  10762: "Kids",
  10764: "Reality",
  10767: "Talk",
};
export function normalize(t, kind) {
  return {
    id: t.id,
    kind,
    name: t.title || t.name || "Untitled",
    year: Number((t.release_date || t.first_air_date || "").slice(0, 4)) || 0,
    genre: t.genres?.[0]?.name || genres[t.genre_ids?.[0]] || "",
    description: t.overview || "No description available.",
    poster: t.poster_path
      ? `https://image.tmdb.org/t/p/w500${t.poster_path}`
      : "",
    backdrop: t.backdrop_path
      ? `https://image.tmdb.org/t/p/w1280${t.backdrop_path}`
      : undefined,
  };
}
export function parseRequest(url) {
  const p = new URL(url, "https://stream.local").searchParams;
  const action = p.get("action") || "browse",
    kind = p.get("kind") || "all",
    page = Number(p.get("page") || 1),
    query = (p.get("q") || "").trim();
  if (
    !["browse", "detail", "season", "library"].includes(action) ||
    !["all", "movie", "tv"].includes(kind) ||
    !Number.isInteger(page) ||
    page < 1 ||
    page > 500 ||
    query.length > 200
  )
    throw new Error("Invalid catalog request");
  const id = Number(p.get("id")),
    season = Number(p.get("season"));
  if (
    ["detail", "season"].includes(action) &&
    (!["movie", "tv"].includes(kind) || !Number.isSafeInteger(id) || id < 1)
  )
    throw new Error("Invalid title");
  if (
    action === "season" &&
    (kind !== "tv" ||
      !p.has("season") ||
      !Number.isSafeInteger(season) ||
      season < 0 ||
      season > 1000)
  )
    throw new Error("Invalid season");
  const refs = (p.get("refs") || "").split(",").filter(Boolean);
  if (
    action === "library" &&
    (refs.length > 20 || refs.some((r) => !/^(movie|tv):[1-9]\d{0,9}$/.test(r)))
  )
    throw new Error("Invalid library selection");
  return { action, kind, page, query, id, season, refs };
}
export async function getCatalog(input, request) {
  const { action, kind, page, query, id, season, refs } = input;
  if (action === "detail") {
    const t = await request(`/${kind}/${id}`);
    if (t.adult) throw new Error("Unavailable title");
    return {
      ...normalize(t, kind),
      seasons: (t.seasons || [])
        .filter((s) => s.episode_count > 0)
        .map((s) => ({
          number: s.season_number,
          name: s.name,
          count: s.episode_count,
        })),
    };
  }
  if (action === "season") {
    const t = await request(`/tv/${id}/season/${season}`);
    return {
      episodes: (t.episodes || []).map((e) => ({
        number: e.episode_number,
        name: e.name,
        airDate: e.air_date,
        overview: e.overview,
      })),
    };
  }
  if (action === "library")
    return {
      results: await Promise.all(
        refs.map(async (ref) => {
          const [type, id] = ref.split(":");
          try {
            const t = await request(`/${type}/${id}`);
            return t.adult ? null : normalize(t, type);
          } catch (error) {
            if (error.status !== 404) throw error;
            return {
              id: Number(id),
              kind: type,
              name: "Unavailable title",
              year: 0,
              genre: "",
              description: "This title is no longer in the catalog.",
              poster: "",
            };
          }
        }),
      ).then((items) => items.filter(Boolean)),
      totalPages: 1,
    };
  const kinds = kind === "all" ? ["movie", "tv"] : [kind];
  const lists = await Promise.all(
    kinds.map(async (type) => {
      const data = await request(
        query ? `/search/${type}` : `/discover/${type}`,
        {
          page: String(page),
          ...(query ? { query } : { sort_by: "popularity.desc" }),
          include_adult: "false",
        },
      );
      return {
        ...data,
        results: (data.results || [])
          .filter((t) => !t.adult)
          .map((t) => normalize(t, type)),
      };
    }),
  );
  const results = [];
  for (let i = 0; i < Math.max(...lists.map((l) => l.results.length)); i++)
    for (const list of lists)
      if (list.results[i]) results.push(list.results[i]);
  return {
    results,
    page,
    totalPages: Math.min(
      500,
      Math.max(1, ...lists.map((l) => l.total_pages || 0)),
    ),
    totalResults: lists.reduce((n, l) => n + (l.total_results || 0), 0),
  };
}
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  let input;
  try {
    input = parseRequest(req.url);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
  const token = process.env.TMDB_READ_TOKEN;
  if (!token)
    return res
      .status(503)
      .json({ error: "The catalog connection is not configured yet." });
  const request = async (path, params = {}) => {
    const url = new URL(`https://api.themoviedb.org/3${path}`);
    url.search = new URLSearchParams({
      language: "en-US",
      ...params,
    }).toString();
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      const error = new Error("Catalog provider unavailable");
      error.status = response.status;
      throw error;
    }
    return response.json();
  };
  try {
    const data = await getCatalog(input, request);
    res.setHeader(
      "Cache-Control",
      input.action === "library"
        ? "private, max-age=60"
        : "public, max-age=60, s-maxage=600, stale-while-revalidate=3600",
    );
    return res.status(200).json(data);
  } catch (error) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(error.status === 404 ? 404 : 502).json({
      error:
        error.status === 404
          ? "Title not found."
          : "The catalog is temporarily unavailable. Please try again.",
    });
  }
}
