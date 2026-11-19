import { EP, QUEUE, TERMS, type Term } from "./data";

export const STORAGE_KEY = "talkin-ball:v1";
export interface Collection {
  saved: string[];
  approved: string[];
  rejected: string[];
}
export const EMPTY: Collection = { saved: [], approved: [], rejected: [] };
export function readCollection(): Collection {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "null",
    );
    if (!value || typeof value !== "object") return EMPTY;
    const item = value as Record<string, unknown>;
    const valid = (key: string, ids: string[]) =>
      Array.isArray(item[key])
        ? [
            ...new Set(
              (item[key] as unknown[]).filter(
                (s): s is string => typeof s === "string" && ids.includes(s),
              ),
            ),
          ]
        : [];
    return {
      saved: valid(
        "saved",
        TERMS.map((t) => t.slug),
      ),
      approved: valid(
        "approved",
        QUEUE.filter((q) => q.clipReady).map((q) => q.id),
      ),
      rejected: valid(
        "rejected",
        QUEUE.map((q) => q.id),
      ),
    };
  } catch {
    return EMPTY;
  }
}
export function getTerms(collection: Collection): Term[] {
  return TERMS.map((term) => ({
    ...term,
    clips: [
      ...term.clips,
      ...QUEUE.filter(
        (d) => collection.approved.includes(d.id) && d.merge === term.slug,
      ).flatMap((d) =>
        d.sources
          .filter((s) => s.ep && s.t != null)
          .map((s) => ({
            ep: s.ep!,
            t: s.t!,
            who: "JJ Redick to LeBron James",
            quote: "On the ghost screen, you called it a bluff screen.",
            ctx: "Approved from the review queue",
          })),
      ),
    ],
  }));
}
export const categories: Record<string, string> = {
  butter: "Game IQ",
  "hostage-dribble": "On-ball",
  "gortat-screen": "Off-ball",
  "ghost-screen": "Off-ball",
  "court-mapping": "Game IQ",
  blender: "Game IQ",
};
export function matches(term: Term, query: string) {
  const q = query.trim().toLocaleLowerCase();
  return [
    term.term,
    ...term.aka,
    term.def,
    ...Object.values(term.facts),
    ...term.clips.map((c) => EP[c.ep].show),
  ].some((s) => s.toLocaleLowerCase().includes(q));
}
export const displayTerm = (t: Pick<Term, "term" | "proper">) =>
  t.proper ? t.term : t.term.toLowerCase();
