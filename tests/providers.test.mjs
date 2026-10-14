import test from "node:test";
import assert from "node:assert/strict";
import { playerUrl, readProgress } from "../src/providers.mjs";
test("constructs movie and TV routes with correct provider options", () => {
  assert.equal(
    playerUrl("vidlink", { id: 693134, kind: "movie" }, 1, 1, 32.8),
    "https://vidlink.pro/movie/693134?autoplay=false&startAt=32",
  );
  assert.equal(
    playerUrl("vidfast", { id: 1399, kind: "tv" }, 2, 4),
    "https://vidfast.vc/tv/1399/2/4?autoPlay=false&startAt=0",
  );
  assert.equal(
    playerUrl("vidy", { id: 1399, kind: "tv" }, 1, 1, 45),
    "https://www.vidy.st/tv/1399/1/1?autoplay=false&progress=45",
  );
});
test("rejects unknown providers and invalid IDs or episodes", () => {
  for (const call of [
    () => playerUrl("evil", { id: 1, kind: "movie" }),
    () => playerUrl("vidlink", { id: "../../evil", kind: "movie" }),
    () => playerUrl("vidlink", { id: 1, kind: "tv" }, -1, 2),
  ])
    assert.throws(call);
});
test("accepts progress only from selected iframe and origin", () => {
  const frame = {};
  const origin = "https://vidlink.pro";
  const data = {
    type: "PLAYER_EVENT",
    data: { event: "timeupdate", currentTime: 24, duration: 100 },
  };
  assert.deepEqual(
    readProgress({ source: frame, origin, data }, frame, origin),
    { position: 24, duration: 100 },
  );
  assert.equal(readProgress({ source: {}, origin, data }, frame, origin), null);
  assert.equal(
    readProgress(
      { source: frame, origin: "https://evil.test", data },
      frame,
      origin,
    ),
    null,
  );
  assert.equal(
    readProgress({ source: frame, origin, data: "{broken" }, frame, origin),
    null,
  );
  assert.equal(
    readProgress(
      {
        source: frame,
        origin,
        data: { ...data, data: { ...data.data, currentTime: Infinity } },
      },
      frame,
      origin,
    ),
    null,
  );
  assert.equal(
    readProgress(
      {
        source: frame,
        origin,
        data: { ...data, data: { ...data.data, currentTime: 200 } },
      },
      frame,
      origin,
    ),
    null,
  );
  assert.deepEqual(
    readProgress(
      { source: frame, origin, data: JSON.stringify(data) },
      frame,
      origin,
    ),
    { position: 24, duration: 100 },
  );
});
