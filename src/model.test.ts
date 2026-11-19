import { beforeEach, describe, expect, it } from "vitest";
import { EMPTY, getTerms, matches, readCollection, STORAGE_KEY } from "./model";
import { EP, TERMS, type Draft } from "./data";
import queueJson from "../server/review-queue.json";

const QUEUE = queueJson as Draft[];

beforeEach(() => localStorage.clear());
describe("dictionary content", () => {
  it("preserves six unique entries and all eight original clips", () => {
    expect(TERMS).toHaveLength(6);
    expect(new Set(TERMS.map((t) => t.slug)).size).toBe(6);
    expect(TERMS.flatMap((t) => t.clips)).toHaveLength(8);
    for (const term of TERMS) {
      expect(term.play || term.shot).toBeTruthy();
      for (const slug of term.related)
        expect(TERMS.some((t) => t.slug === slug)).toBe(true);
      for (const clip of term.clips) {
        expect(EP[clip.ep]).toBeDefined();
        expect(clip.t).toBeGreaterThan(0);
      }
    }
    expect(QUEUE).toHaveLength(3);
  });
  it("finds terms by case-insensitive names, aliases, definitions, and sources", () => {
    expect(
      TERMS.filter((t) => matches(t, " JAIL ")).map((t) => t.slug),
    ).toContain("hostage-dribble");
    expect(TERMS.filter((t) => matches(t, "BLUFF")).map((t) => t.slug)).toEqual(
      ["ghost-screen"],
    );
    expect(
      TERMS.filter((t) => matches(t, "six or seven")).map((t) => t.slug),
    ).toEqual(["butter"]);
    expect(TERMS.filter((t) => matches(t, "Mind the Game"))).toHaveLength(5);
    expect(TERMS.filter((t) => matches(t, "nonsense"))).toHaveLength(0);
  });
});
describe("local collection", () => {
  it("recovers safely from corrupt and unknown browser storage", () => {
    for (const value of ["{", "null", "[]", "123", '{"saved":"butter"}']) {
      localStorage.setItem(STORAGE_KEY, value);
      expect(readCollection()).toEqual(EMPTY);
    }
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        saved: ["butter", "bad", "butter", null],
        approved: ["red", "bluff"],
        rejected: ["english", "bad"],
      }),
    );
    expect(readCollection()).toEqual({
      saved: ["butter"],
      approved: ["red", "bluff"],
      rejected: ["english", "bad"],
    });
  });
  it("adds an approved source exactly once without mutating the original terms", () => {
    const collection = { ...EMPTY, approved: ["bluff", "bluff"] };
    const ghost = getTerms(collection, QUEUE).find(
      (t) => t.slug === "ghost-screen",
    )!;
    expect(ghost.clips).toHaveLength(2);
    expect(ghost.clips[1]).toMatchObject({ ep: "hardest", t: 1799 });
    expect(TERMS.find((t) => t.slug === "ghost-screen")!.clips).toHaveLength(1);
    expect(
      getTerms(EMPTY, QUEUE).find((t) => t.slug === "ghost-screen")!.clips,
    ).toHaveLength(1);
    expect(
      getTerms(collection).find((t) => t.slug === "ghost-screen")!.clips,
    ).toHaveLength(1);
  });
  it("never adds clips from drafts that have no source", () => {
    const red = { ...QUEUE[0], merge: "butter" };
    const butter = getTerms({ ...EMPTY, approved: ["red"] }, [red]).find(
      (t) => t.slug === "butter",
    )!;
    expect(butter.clips).toHaveLength(
      TERMS.find((t) => t.slug === "butter")!.clips.length,
    );
  });
});
