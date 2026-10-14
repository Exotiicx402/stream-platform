import test from "node:test";
import assert from "node:assert/strict";
import handler, {
  parseRequest,
  getCatalog,
  normalize,
} from "../api/catalog.js";
test("rejects arbitrary upstream paths, invalid media, overlong searches and oversized batches", () => {
  for (const url of [
    "/api/catalog?action=proxy",
    "/api/catalog?action=detail&kind=person&id=1",
    "/api/catalog?page=501",
    "/api/catalog?action=season&kind=tv&id=1396&season=-1",
    `/api/catalog?q=${"a".repeat(201)}`,
    `/api/catalog?action=library&refs=${Array(21).fill("tv:1396").join(",")}`,
  ])
    assert.throws(() => parseRequest(url));
  assert.equal(
    parseRequest("/api/catalog?action=season&kind=tv&id=1396&season=0").season,
    0,
  );
});
test("searches both media types and keeps colliding numeric IDs distinct", async () => {
  const calls = [];
  const result = await getCatalog(
    parseRequest("/api/catalog?q=office&page=2"),
    async (path, params) => {
      calls.push({ path, params });
      return {
        results: [
          {
            id: 10,
            title: path.endsWith("movie") ? "Movie" : undefined,
            name: "Show",
          },
        ],
        total_pages: 3,
        total_results: 45,
      };
    },
  );
  assert.equal(result.results.length, 2);
  assert.deepEqual(
    result.results.map((t) => t.kind),
    ["movie", "tv"],
  );
  assert.equal(result.totalResults, 90);
  assert.equal(result.totalPages, 3);
  assert.deepEqual(
    calls.map((c) => c.path),
    ["/search/movie", "/search/tv"],
  );
  assert.equal(calls[0].params.page, "2");
});
test("normalizes missing images and filters adult titles", async () => {
  assert.equal(normalize({ id: 1, title: "Missing" }, "movie").poster, "");
  const result = await getCatalog(
    parseRequest("/api/catalog?kind=movie"),
    async () => ({
      results: [
        { id: 1, adult: true },
        { id: 2, title: "Okay" },
      ],
      total_pages: 1,
      total_results: 2,
    }),
  );
  assert.equal(result.results.length, 1);
  assert.equal(result.results[0].id, 2);
});
test("season responses expose episode numbers and names", async () => {
  const data = await getCatalog(
    parseRequest("/api/catalog?action=season&kind=tv&id=1396&season=2"),
    async (path) => {
      assert.equal(path, "/tv/1396/season/2");
      return {
        episodes: [
          {
            episode_number: 1,
            name: "Seven Thirty-Seven",
            air_date: "2009-03-08",
          },
        ],
      };
    },
  );
  assert.equal(data.episodes[0].name, "Seven Thirty-Seven");
});
test("server does not expose upstream errors or the token", async () => {
  const old = process.env.TMDB_READ_TOKEN,
    fetchOld = globalThis.fetch;
  process.env.TMDB_READ_TOKEN = "unit-test-private-token";
  globalThis.fetch = async () => ({ ok: false, status: 401 });
  let body, status;
  const res = {
    setHeader() {},
    status(code) {
      status = code;
      return this;
    },
    json(data) {
      body = data;
      return data;
    },
  };
  try {
    await handler({ method: "GET", url: "/api/catalog" }, res);
    assert.equal(status, 502);
    assert.equal(
      JSON.stringify(body).includes("unit-test-private-token"),
      false,
    );
  } finally {
    globalThis.fetch = fetchOld;
    if (old === undefined) delete process.env.TMDB_READ_TOKEN;
    else process.env.TMDB_READ_TOKEN = old;
  }
});
