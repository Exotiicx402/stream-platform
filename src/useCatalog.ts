import { useEffect, useState } from "react";
import { catalog, type Title } from "./catalog";
export const titleKey = (t: Pick<Title, "kind" | "id">) => `${t.kind}:${t.id}`;
export const legacyKey = (ref: number | string) =>
  typeof ref === "string"
    ? ref
    : titleKey(catalog.find((t) => t.id === ref) || { kind: "movie", id: ref });
export async function catalogRequest(
  params: Record<string, string>,
  signal?: AbortSignal,
) {
  const response = await fetch(`/api/catalog?${new URLSearchParams(params)}`, {
    signal,
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Could not load the catalog.");
  return data;
}
export function useCatalog(
  view: string,
  query: string,
  filter: string,
  refs: string[],
) {
  const [debounced, setDebounced] = useState(query),
    [page, setPage] = useState(1),
    [retry, setRetry] = useState(0);
  const [state, setState] = useState<{
    key: string;
    results: Title[];
    loading: boolean;
    error: string;
    pages: number;
    total: number;
  }>({ key: "", results: [], loading: true, error: "", pages: 1, total: 0 });
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);
  const kind = filter === "All" ? "all" : filter === "Movies" ? "movie" : "tv";
  const refsKey = refs.join(",");
  const key = JSON.stringify([
    view,
    debounced,
    kind,
    view === "Discover" ? "" : refsKey,
  ]);
  const [pageKey, setPageKey] = useState(key);
  const currentPage = pageKey === key ? page : 1;
  useEffect(() => {
    if (view === "Rewards") return;
    const controller = new AbortController();
    setState((s) => ({
      ...s,
      key,
      results: currentPage === 1 ? [] : s.results,
      loading: true,
      error: "",
    }));
    const run = async () => {
      const personal = view !== "Discover";
      const selected = refsKey
        .split(",")
        .filter(Boolean)
        .filter((r) => kind === "all" || r.startsWith(`${kind}:`));
      if (personal && !selected.length) {
        setState({
          key,
          results: [],
          loading: false,
          error: "",
          pages: 1,
          total: 0,
        });
        return;
      }
      const data = await catalogRequest(
        personal
          ? {
              action: "library",
              refs: selected
                .slice((currentPage - 1) * 20, currentPage * 20)
                .join(","),
            }
          : { action: "browse", kind, q: debounced, page: String(currentPage) },
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setState((s) => ({
        key,
        results: [
          ...new Map(
            [...(currentPage > 1 ? s.results : []), ...data.results].map(
              (t: Title) => [titleKey(t), t],
            ),
          ).values(),
        ] as Title[],
        loading: false,
        error: "",
        pages: personal ? Math.ceil(selected.length / 20) : data.totalPages,
        total: personal ? selected.length : data.totalResults,
      }));
    };
    run().catch((e) => {
      if (!controller.signal.aborted)
        setState((s) => ({ ...s, key, loading: false, error: e.message }));
    });
    return () => controller.abort();
  }, [key, currentPage, retry]);
  const current = state.key === key;
  const results = current ? state.results : [];
  return {
    titles:
      view === "Discover"
        ? results
        : results.filter(
            (t) =>
              !debounced ||
              t.name.toLowerCase().includes(debounced.toLowerCase()),
          ),
    loading: !current || state.loading || debounced !== query.trim(),
    error: current ? state.error : "",
    total: current ? state.total : 0,
    hasMore: current && currentPage < state.pages,
    loadMore: () => {
      setPageKey(key);
      setPage(currentPage + 1);
    },
    retry: () => setRetry((n) => n + 1),
  };
}
