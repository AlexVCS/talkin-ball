import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { STORAGE_KEY } from "./model";
import * as model from "./model";
import { TERMS } from "./data";

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/#term-butter");
});
const route = (hash: string) =>
  act(() => {
    window.history.replaceState(null, "", "/" + hash);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });

describe("dictionary", () => {
  it("explains when a term has no source clips", () => {
    const getTerms = vi
      .spyOn(model, "getTerms")
      .mockReturnValue(TERMS.map((term) => ({ ...term, clips: [] })));
    try {
      const { container } = render(<App />);
      expect(
        screen.getByText("No source clips are available for this term yet."),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".clip-thumbnail"),
      ).not.toBeInTheDocument();
      expect(container.querySelector("iframe")).not.toBeInTheDocument();
    } finally {
      getTerms.mockRestore();
    }
  });
  it("announces search result counts including no matches", () => {
    render(<App />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "6 terms in the playbook",
    );
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "zzzz" },
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      "0 terms in the playbook",
    );
  });
  it("restores dialog focus and handles Escape cancellation", () => {
    render(<App />);
    const trigger = screen.getByRole("button", { name: "What’s the story?" });
    trigger.focus();
    fireEvent.click(trigger);
    fireEvent(
      screen.getByRole("dialog"),
      new Event("cancel", { bubbles: false }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
  it("does not autoplay clips when reduced motion is requested", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    try {
      render(<App />);
      fireEvent.click(
        screen.getByRole("button", {
          name: "FROM THE SOURCE yikerzgame highlights 25:50",
        }),
      );
      expect(
        screen.getByRole("dialog").querySelector("iframe"),
      ).toHaveAttribute(
        "src",
        "https://www.youtube-nocookie.com/embed/o7EjgIyGeSY?start=1550&autoplay=0",
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it("opens a direct term link and searches aliases with no-result recovery", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: /^butter\s*\.$/ }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "jail" },
    });
    expect(
      screen.getByRole("heading", { name: /^hostage dribble\s*\.$/ }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "zzzzzz" },
    });
    expect(
      screen.getByText("That one’s not in the playbook. Yet."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Explore all terms/ }));
    expect(
      screen.getByRole("heading", { name: /^butter\s*\.$/ }),
    ).toBeInTheDocument();
  });
  it("filters categories and persists saved entries across remounts", () => {
    const view = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Save butter" }));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).saved).toEqual([
      "butter",
    ]);
    fireEvent.click(screen.getByRole("button", { name: /My saved/ }));
    expect(
      screen
        .getByLabelText("Basketball terms")
        .querySelectorAll(".term-button"),
    ).toHaveLength(1);
    view.unmount();
    render(<App />);
    expect(
      screen.getByRole("button", { name: "Unsave butter" }),
    ).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Off-ball" }));
    expect(
      screen
        .getByLabelText("Basketball terms")
        .querySelectorAll(".term-button"),
    ).toHaveLength(2);
  });
  it("opens a timestamped embed and supplies an external fallback", () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", {
        name: "FROM THE SOURCE yikerzgame highlights 25:50",
      }),
    );
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: /Full Game Highlights/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("Game broadcast commentary")).toBeInTheDocument();
    expect(dialog.querySelector("iframe")).toHaveAttribute(
      "src",
      "https://www.youtube-nocookie.com/embed/o7EjgIyGeSY?start=1550&autoplay=1",
    );
    expect(
      within(dialog).getByRole("link", { name: /Watch on YouTube at 25:50/ }),
    ).toHaveAttribute("href", "https://youtu.be/o7EjgIyGeSY?t=1550");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Close dialog" }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("syncs another tab’s changes before making a new bookmark decision", () => {
    render(<App />);
    act(() => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          saved: ["ghost-screen"],
          approved: ["bluff"],
          rejected: ["red"],
        }),
      );
      window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
    });
    fireEvent.click(screen.getByRole("button", { name: "Save butter" }));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({
      saved: ["ghost-screen", "butter"],
      approved: ["bluff"],
      rejected: ["red"],
    });
    act(() => {
      localStorage.clear();
      window.dispatchEvent(new StorageEvent("storage", { key: null }));
    });
    expect(
      screen.getByRole("button", { name: "Save butter" }),
    ).toBeInTheDocument();
  });
  it("follows browser hash navigation", () => {
    render(<App />);
    route("#term-court-mapping");
    expect(
      screen.getByRole("heading", { name: /^court mapping\s*\.$/ }),
    ).toBeInTheDocument();
    route("#term-unknown");
    expect(
      screen.getByRole("heading", { name: /^butter\s*\.$/ }),
    ).toBeInTheDocument();
  });
  it("preserves the selected term across section jumps and review navigation", () => {
    route("#term-ghost-screen");
    render(<App />);
    route("#dictionary");
    expect(
      screen.getByRole("heading", { name: /^ghost screen\s*\.$/ }),
    ).toBeInTheDocument();
    route("#review");
    expect(
      screen.getByRole("link", { name: "Back to the dictionary" }),
    ).toHaveAttribute("href", "#term-ghost-screen");
    route("#term-ghost-screen");
    expect(
      screen.getByRole("heading", { name: /^ghost screen\s*\.$/ }),
    ).toBeInTheDocument();
  });
  it("keeps a shareable term URL when jumping and restores it on reload", () => {
    route("#term-ghost-screen");
    const view = render(<App />);
    fireEvent.click(screen.getByRole("link", { name: "Get in the game" }));
    expect(window.location.hash).toBe("#term-ghost-screen");
    expect(document.activeElement).toBe(screen.getByRole("main"));
    fireEvent.click(screen.getByRole("link", { name: "Skip to dictionary" }));
    expect(window.location.hash).toBe("#term-ghost-screen");
    view.unmount();
    render(<App />);
    expect(
      screen.getByRole("heading", { name: /^ghost screen\s*\.$/ }),
    ).toBeInTheDocument();
  });
});
describe("sample review queue", () => {
  it("skips to review content and retains focus after removing a draft", () => {
    route("#review");
    render(<App />);
    const skip = screen.getByRole("link", { name: "Skip to review queue" });
    expect(skip).toHaveAttribute("href", "#review");
    fireEvent.click(skip);
    expect(window.location.hash).toBe("#review");
    expect(screen.getByRole("main")).toHaveFocus();
    fireEvent.click(screen.getAllByRole("button", { name: "Reject" })[0]);
    expect(document.getElementById("queue-controls")).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent("Draft rejected");
  });
  it("requires a source and persists approval on the correct entry", () => {
    route("#review");
    const view = render(<App />);
    const cards = document.querySelectorAll(".draft-card");
    expect(
      within(cards[0] as HTMLElement).getByRole("button", { name: /Approve/ }),
    ).toBeDisabled();
    fireEvent.click(
      within(cards[2] as HTMLElement).getByRole("button", { name: /Approve/ }),
    );
    expect(document.querySelectorAll(".draft-card")).toHaveLength(2);
    route("#term-ghost-screen");
    expect(screen.getByText("2 SOURCE CLIPS")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "FROM THE SOURCE Mind the Game 29:59",
      }),
    ).toBeInTheDocument();
    view.unmount();
    render(<App />);
    expect(screen.getByText("2 SOURCE CLIPS")).toBeInTheDocument();
  });
  it("rejects drafts and restores the queue without removing bookmarks", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ saved: ["butter"], approved: [], rejected: [] }),
    );
    route("#review");
    render(<App />);
    fireEvent.click(screen.getAllByRole("button", { name: "Reject" })[0]);
    expect(document.querySelectorAll(".draft-card")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Reset sample queue" }));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Reset sample queue",
      }),
    );
    expect(document.querySelectorAll(".draft-card")).toHaveLength(3);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).saved).toEqual([
      "butter",
    ]);
  });
  it("undoes a rejection without resetting other decisions", () => {
    route("#review");
    render(<App />);
    const cards = document.querySelectorAll(".draft-card");
    fireEvent.click(
      within(cards[2] as HTMLElement).getByRole("button", { name: /Approve/ }),
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Reject" })[0]);
    expect(document.querySelectorAll(".draft-card")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(document.querySelectorAll(".draft-card")).toHaveLength(2);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({
      saved: [],
      approved: ["bluff"],
      rejected: [],
    });
  });
});
describe("saved terms", () => {
  it("offers undo after unsaving the entry open in My saved", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        saved: ["butter", "ghost-screen"],
        approved: [],
        rejected: [],
      }),
    );
    route("#term-ghost-screen");
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /My saved/ }));
    fireEvent.click(
      screen.getByRole("button", { name: "Unsave ghost screen" }),
    );
    expect(document.querySelector(".toast")).toHaveTextContent(
      "Removed ghost screen from My saved.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(
      screen.getByRole("heading", { name: /^ghost screen\s*\.$/ }),
    ).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).saved).toEqual([
      "butter",
      "ghost-screen",
    ]);
  });
  it("explains when a search only misses saved terms", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ saved: ["butter"], approved: [], rejected: [] }),
    );
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /My saved/ }));
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "ghost" },
    });
    expect(
      screen.getByText("None of your saved terms match."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Search all terms/ }));
    expect(screen.getByRole("searchbox")).toHaveValue("ghost");
    expect(
      screen.getByRole("heading", { name: /^ghost screen\s*\.$/ }),
    ).toBeInTheDocument();
  });
  it("keeps undo available when the browser can’t save", () => {
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
    render(<App />);
    expect(document.querySelector(".toast")).toHaveTextContent(
      "Your browser can’t save changes.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Save butter" }));
    fireEvent.click(screen.getByRole("button", { name: "Unsave butter" }));
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
    expect(document.querySelector(".toast")).toHaveTextContent(
      "Removed butter from My saved. Your browser can’t save changes.",
    );
    setItem.mockRestore();
  });
});
