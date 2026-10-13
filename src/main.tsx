import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Play,
  Plus,
  Check,
  Search,
  ArrowUpRight,
  Bookmark,
  Clock,
  Gift,
  X,
  ChevronRight,
  LogIn,
} from "lucide-react";
import { catalog, type Title } from "./catalog";
import { providers, playerUrl, readProgress } from "./providers.mjs";
import { supabase } from "./backend";
import "./style.css";
type HistoryItem = {
  id: number;
  season: number;
  episode: number;
  position: number;
  duration: number;
  updated: number;
};
type Library = { saved: number[]; history: HistoryItem[] };
const empty: Library = { saved: [], history: [] };
function readLibrary(key: string): Library {
  try {
    const v = JSON.parse(localStorage.getItem(key) || "null");
    return v && Array.isArray(v.saved) && Array.isArray(v.history)
      ? {
          saved: v.saved.filter((id: unknown) => Number.isSafeInteger(id)),
          history: v.history.filter(
            (h: HistoryItem) =>
              h &&
              Number.isSafeInteger(h.id) &&
              Number.isFinite(h.position) &&
              h.position >= 0 &&
              Number.isFinite(h.duration) &&
              h.duration > 0,
          ),
        }
      : empty;
  } catch {
    return empty;
  }
}
function App() {
  const [view, setView] = useState("Discover"),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("All"),
    [selected, setSelected] = useState<Title | null>(null),
    [playing, setPlaying] = useState(false);
  const [user, setUser] = useState<string | null>(null),
    [library, setLibrary] = useState<Library>(() =>
      readLibrary("stream:v1:guest"),
    ),
    [ready, setReady] = useState(false),
    [loadedKey, setLoadedKey] = useState(""),
    [remoteReady, setRemoteReady] = useState(false),
    [notice, setNotice] = useState(""),
    [auth, setAuth] = useState(false),
    [email, setEmail] = useState(""),
    [busy, setBusy] = useState(false);
  const key = `stream:v1:${user || "guest"}`;
  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user.id || null);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    let live = true;
    setReady(false);
    setRemoteReady(false);
    setLibrary(readLibrary(key));
    (async () => {
      if (user && supabase) {
        const { data, error } = await supabase
          .from("libraries")
          .select("saved,history")
          .eq("user_id", user)
          .maybeSingle();
        if (!live) return;
        if (error)
          setNotice(
            "Account sync unavailable. Your changes will stay on this device.",
          );
        else {
          setRemoteReady(true);
          if (data) setLibrary(data as Library);
        }
      }
      if (live) {
        setLoadedKey(key);
        setReady(true);
      }
    })();
    return () => {
      live = false;
    };
  }, [key, user]);
  useEffect(() => {
    if (!ready || loadedKey !== key) return;
    try {
      localStorage.setItem(key, JSON.stringify(library));
    } catch {
      setNotice(
        "Browser storage unavailable. Changes may not survive a refresh.",
      );
    }
    if (user && supabase && remoteReady) {
      const timer = setTimeout(() => {
        supabase!
          .from("libraries")
          .upsert({ user_id: user, ...library })
          .then(({ error }) => {
            if (error)
              setNotice("Could not sync. Changes are saved on this device.");
          });
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [library, key, user, ready, loadedKey, remoteReady]);
  const save = (id: number) =>
    setLibrary((l) => ({
      ...l,
      saved: l.saved.includes(id)
        ? l.saved.filter((x) => x !== id)
        : [...l.saved, id],
    }));
  const progress = (item: HistoryItem) =>
    setLibrary((l) => ({
      ...l,
      history: [
        item,
        ...l.history.filter(
          (h) =>
            !(
              h.id === item.id &&
              h.season === item.season &&
              h.episode === item.episode
            ),
        ),
      ].slice(0, 100),
    }));
  const open = (t: Title, play = false) => {
    setSelected(t);
    setPlaying(play);
  };
  const titles = catalog.filter(
    (t) =>
      (!query ||
        `${t.name} ${t.genre}`.toLowerCase().includes(query.toLowerCase())) &&
      (filter === "All" || t.kind === (filter === "Movies" ? "movie" : "tv")) &&
      (view !== "My list" || library.saved.includes(t.id)) &&
      (view !== "History" || library.history.some((h) => h.id === t.id)),
  );
  const feature = catalog[0];
  return (
    <>
      <header>
        <button
          className="brand"
          onClick={() => {
            setView("Discover");
            setQuery("");
          }}
        >
          <span className="brand-icon">
            <Play size={17} fill="currentColor" />
          </span>
          stream<span className="beta">ALPHA</span>
        </button>
        <nav>
          {["Discover", "My list", "History", "Rewards"].map((v) => (
            <button
              key={v}
              className={view === v ? "active" : ""}
              onClick={() => {
                setView(v);
                setQuery("");
              }}
            >
              {v}
            </button>
          ))}
        </nav>
        <button className="account" onClick={() => setAuth(true)}>
          <LogIn size={17} />
          {user ? "Account" : "Sign in"}
        </button>
      </header>
      <main>
        {view === "Discover" && !query && (
          <section
            className="hero"
            style={{
              backgroundImage: `linear-gradient(90deg,#0d0e10 0%,#0d0e1080 50%,#0d0e1010),linear-gradient(0deg,#0d0e10,transparent 45%),url(${feature.backdrop})`,
            }}
          >
            <div className="hero-content">
              <div className="eyebrow">
                <span />
                THE EVENING PICK
              </div>
              <p className="overline">2024 · SCIENCE FICTION · MOVIE</p>
              <h1>
                DUNE<span>PART TWO</span>
              </h1>
              <p className="description">
                Some destinies are written in sand.
                <br />
                Find your next obsession.
              </p>
              <div className="actions">
                <button className="primary" onClick={() => open(feature, true)}>
                  <Play size={18} fill="currentColor" />
                  Watch now
                </button>
                <button className="secondary" onClick={() => save(feature.id)}>
                  {library.saved.includes(feature.id) ? (
                    <Check size={18} />
                  ) : (
                    <Plus size={18} />
                  )}
                  My list
                </button>
                <button className="text-button" onClick={() => open(feature)}>
                  Details <ArrowUpRight size={16} />
                </button>
              </div>
            </div>
            <span className="hero-caption">
              01 / 08 <span>CURATED STARTER COLLECTION</span>
            </span>
          </section>
        )}
        {view === "Rewards" ? (
          <section className="rewards">
            <div className="eyebrow">THE COMMUNITY CHAPTER</div>
            <Gift size={48} />
            <h1>
              A little more
              <br />
              for showing up.
            </h1>
            <p>
              Rewards are being designed. For now, settle in, find something
              good, and make this space yours.
            </p>
            <span className="pill">Not launched yet</span>
            <div className="reward-grid">
              <article>
                <Bookmark />
                <h3>Your own collection</h3>
                <p>Keep everything you want to watch in one place.</p>
              </article>
              <article>
                <Clock />
                <h3>Pick up where you left off</h3>
                <p>Compatible players save progress automatically.</p>
              </article>
              <article>
                <Gift />
                <h3>Built for the community</h3>
                <p>
                  Token details and eligibility will be published before rewards
                  go live.
                </p>
              </article>
            </div>
          </section>
        ) : (
          <section className="collection">
            <div className="section-top">
              <div>
                <p className="eyebrow">
                  {view === "Discover"
                    ? "LESS SCROLLING. MORE WATCHING."
                    : "YOUR SPACE"}
                </p>
                <h2>
                  {query
                    ? "Search results"
                    : view === "Discover"
                      ? "Find your next watch"
                      : view === "My list"
                        ? "Saved for later"
                        : "Recently watched"}
                </h2>
              </div>
              <label className="search">
                <Search size={18} />
                <input
                  aria-label="Search titles"
                  placeholder="Search titles, genres…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <button
                    aria-label="Clear search"
                    onClick={() => setQuery("")}
                  >
                    <X size={16} />
                  </button>
                )}
              </label>
            </div>
            <div className="filters">
              {["All", "Movies", "TV shows"].map((f) => (
                <button
                  key={f}
                  className={filter === f ? "chosen" : ""}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ))}
              <span>{titles.length} titles · starter catalog</span>
            </div>
            <div className="grid">
              {titles.map((t) => (
                <article className="card" key={t.id}>
                  <button
                    className="poster"
                    onClick={() => open(t)}
                    aria-label={`View ${t.name}`}
                  >
                    <img
                      src={t.poster}
                      alt=""
                      loading="lazy"
                      onError={(e) => (e.currentTarget.style.opacity = "0")}
                      onLoad={(e) => (e.currentTarget.style.opacity = "1")}
                    />
                    <span className="fallback-title">{t.name}</span>
                    <span className="type">
                      {t.kind === "movie" ? "MOVIE" : "SERIES"}
                    </span>
                    <span className="play-icon">
                      <Play fill="currentColor" />
                    </span>
                  </button>
                  <div className="card-bottom">
                    <div>
                      <button className="title-link" onClick={() => open(t)}>
                        {t.name}
                      </button>
                      <p>
                        {t.year} <span>·</span> {t.genre}
                      </p>
                    </div>
                    <button
                      className="save"
                      disabled={!ready}
                      aria-label={`${library.saved.includes(t.id) ? "Remove" : "Save"} ${t.name}`}
                      onClick={() => save(t.id)}
                    >
                      {library.saved.includes(t.id) ? (
                        <Check size={18} />
                      ) : (
                        <Plus size={18} />
                      )}
                    </button>
                  </div>
                  {view === "History" && (
                    <small>
                      {Math.floor(
                        (library.history.find((h) => h.id === t.id)?.position ||
                          0) / 60,
                      )}{" "}
                      minutes in
                    </small>
                  )}
                </article>
              ))}
            </div>
            {!titles.length && (
              <div className="empty">
                <Bookmark size={32} />
                <h3>
                  {query
                    ? "No matches this time."
                    : "Your collection starts here."}
                </h3>
                <p>
                  {query
                    ? "Try another title or genre."
                    : "Save a title or start watching to see it here."}
                </p>
                <button
                  onClick={() => {
                    setView("Discover");
                    setQuery("");
                    setFilter("All");
                  }}
                >
                  Explore the collection <ChevronRight size={16} />
                </button>
              </div>
            )}
          </section>
        )}
      </main>
      <footer>
        <span className="brand">stream.</span>
        <p>An early look at your new home for entertainment.</p>
        <span>Working name · Alpha 0.1</span>
      </footer>
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {selected && (
        <Modal onClose={() => setSelected(null)} label={selected.name}>
          <Player
            title={selected}
            playing={playing}
            setPlaying={setPlaying}
            saved={library.saved.includes(selected.id)}
            onSave={() => save(selected.id)}
            history={library.history.filter((h) => h.id === selected.id)}
            onProgress={progress}
          />
        </Modal>
      )}
      {auth && (
        <Modal onClose={() => setAuth(false)} label="Your account">
          <div className="auth">
            <span className="eyebrow">MAKE YOURSELF AT HOME</span>
            <h2>{user ? "You’re signed in." : "Your list, everywhere."}</h2>
            {!supabase ? (
              <>
                <p>
                  Account sync is coming online. You can already save titles and
                  watch as a guest on this device.
                </p>
                <button className="primary" onClick={() => setAuth(false)}>
                  Keep exploring
                </button>
              </>
            ) : user ? (
              <button
                className="secondary"
                onClick={async () => {
                  const { error } = await supabase!.auth.signOut();
                  if (error) setNotice(error.message);
                  else setAuth(false);
                }}
              >
                Sign out
              </button>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  const { error } = await supabase!.auth.signInWithOtp({
                    email,
                    options: { emailRedirectTo: location.origin },
                  });
                  setBusy(false);
                  setNotice(
                    error
                      ? error.message
                      : "Check your email for your sign-in link.",
                  );
                }}
              >
                <p>
                  Get a sign-in link to save your collection across devices.
                  Guest activity stays on this device.
                </p>
                <label>
                  Email address
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </label>
                <button className="primary" disabled={busy}>
                  {busy ? "Sending…" : "Email me a sign-in link"}
                </button>
              </form>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
function Modal({
  children,
  onClose,
  label,
}: {
  children: React.ReactNode;
  onClose: () => void;
  label: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog ref={ref} onCancel={onClose} aria-label={label}>
      <button className="close" aria-label="Close dialog" onClick={onClose}>
        <X />
      </button>
      {children}
    </dialog>
  );
}
function Player({
  title,
  playing,
  setPlaying,
  saved,
  onSave,
  history,
  onProgress,
}: {
  title: Title;
  playing: boolean;
  setPlaying: (v: boolean) => void;
  saved: boolean;
  onSave: () => void;
  history: HistoryItem[];
  onProgress: (h: HistoryItem) => void;
}) {
  const latest = history[0];
  const [provider, setProvider] = useState("vidlink"),
    [season, setSeason] = useState(latest?.season || 1),
    [episode, setEpisode] = useState(latest?.episode || 1),
    [attempt, setAttempt] = useState(0);
  const frame = useRef<HTMLIFrameElement>(null),
    last = useRef(0);
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;
  const current = history.find(
    (h) => h.season === season && h.episode === episode,
  );
  const resume = useRef(current?.position || 0);
  useEffect(() => {
    resume.current = current?.position || 0;
  }, [provider, season, episode, attempt]);
  const [src, setSrc] = useState("");
  useEffect(() => {
    setSrc(playerUrl(provider, title, season, episode, resume.current));
    last.current = 0;
  }, [provider, title.id, season, episode, attempt]);
  useEffect(() => {
    const handle = (e: MessageEvent) => {
      const progress = readProgress(
        e,
        frame.current?.contentWindow,
        providers.find((p) => p.id === provider)!.origin,
      );
      if (progress && Date.now() - last.current > 5000) {
        last.current = Date.now();
        onProgressRef.current({
          id: title.id,
          season,
          episode,
          ...progress,
          updated: Date.now(),
        });
      }
    };
    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, [provider, title.id, season, episode]);
  return (
    <div className="detail">
      {playing ? (
        <div className="player">
          <iframe
            ref={frame}
            key={`${src}:${attempt}`}
            src={src}
            title={`${title.name} player`}
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="origin"
          />
        </div>
      ) : (
        <div
          className="detail-art"
          style={{
            backgroundImage: `linear-gradient(0deg,#141518,transparent),url(${title.backdrop || title.poster})`,
          }}
        >
          <button className="primary" onClick={() => setPlaying(true)}>
            <Play fill="currentColor" />
            Start watching
          </button>
        </div>
      )}
      <div className="detail-body">
        <p className="eyebrow">
          {title.year} · {title.genre} ·{" "}
          {title.kind === "tv" ? "SERIES" : "MOVIE"}
        </p>
        <div className="detail-heading">
          <h2>{title.name}</h2>
          <button className="secondary" onClick={onSave}>
            {saved ? <Check size={18} /> : <Plus size={18} />}My list
          </button>
        </div>
        <p>{title.description}</p>
        {title.kind === "tv" && (
          <div className="episodes">
            <label>
              Season
              <input
                type="number"
                min="1"
                max="100"
                value={season}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isSafeInteger(n) && n > 0 && n <= 100) {
                    setSeason(n);
                    setEpisode(1);
                  }
                }}
              />
            </label>
            <label>
              Episode
              <input
                type="number"
                min="1"
                max="1000"
                value={episode}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isSafeInteger(n) && n > 0 && n <= 1000)
                    setEpisode(n);
                }}
              />
            </label>
            <small>
              Enter an existing episode. Availability varies by source.
            </small>
          </div>
        )}
        <div className="provider-row">
          <span>Playback source</span>
          {providers.map((p) => (
            <button
              className={provider === p.id ? "chosen" : ""}
              key={p.id}
              onClick={() => setProvider(p.id)}
            >
              {p.name}
            </button>
          ))}
          {playing && (
            <button onClick={() => setAttempt((x) => x + 1)}>
              Reload player
            </button>
          )}
        </div>
        <p className="hint">
          If a player doesn’t load, try another source. Playback is provided by
          third parties; progress saves when the player supports it.
        </p>
      </div>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
