import { readFileSync } from "node:fs";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ThemeToggle from "./ThemeToggle";
import { THEME_KEY } from "./theme";

let media: MediaQueryList;
function systemTheme(dark: boolean) {
  Object.defineProperty(media, "matches", { value: dark, configurable: true });
  act(() => media.dispatchEvent(new Event("change")));
}

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  media = Object.assign(new EventTarget(), {
    matches: false,
  }) as MediaQueryList;
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => media),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("theme preference", () => {
  it("follows system appearance until explicitly changed", () => {
    render(<ThemeToggle />);
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    systemTheme(true);
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    fireEvent.click(
      screen.getByRole("button", { name: "Switch to light mode" }),
    );
    expect(localStorage.getItem(THEME_KEY)).toBe("light");
    systemTheme(false);
    systemTheme(true);
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it.each(["light", "dark"])("restores an explicit %s preference", (theme) => {
    localStorage.setItem(THEME_KEY, theme);
    systemTheme(theme !== "dark");
    render(<ThemeToggle />);
    expect(document.documentElement).toHaveAttribute("data-theme", theme);
    expect(document.documentElement.style.colorScheme).toBe(theme);
  });

  it("persists explicit toggles across remounts", () => {
    const view = render(<ThemeToggle />);
    fireEvent.click(
      screen.getByRole("button", { name: "Switch to dark mode" }),
    );
    expect(localStorage.getItem(THEME_KEY)).toBe("dark");
    view.unmount();
    render(<ThemeToggle />);
    expect(
      screen.getByRole("button", { name: "Switch to light mode" }),
    ).toBeInTheDocument();
  });

  it("ignores invalid saved values and follows the system", () => {
    localStorage.setItem(THEME_KEY, "invalid");
    systemTheme(true);
    render(<ThemeToggle />);
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });

  it("syncs another tab and returns to system appearance when cleared", () => {
    render(<ThemeToggle />);
    act(() => {
      localStorage.setItem(THEME_KEY, "dark");
      window.dispatchEvent(new StorageEvent("storage", { key: THEME_KEY }));
    });
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    act(() => {
      localStorage.clear();
      window.dispatchEvent(new StorageEvent("storage", { key: null }));
    });
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("still toggles when local storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    render(<ThemeToggle />);
    fireEvent.click(
      screen.getByRole("button", { name: "Switch to dark mode" }),
    );
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });
});

describe("pre-paint theme bootstrap", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const bootstrap = html.match(/<script>([\s\S]*?)<\/script>/)![1];

  it("applies the saved theme before React loads", () => {
    localStorage.setItem(THEME_KEY, "dark");
    new Function("matchMedia", bootstrap)(window.matchMedia);
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("uses system appearance when storage is unavailable", () => {
    systemTheme(true);
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    new Function("matchMedia", bootstrap)(window.matchMedia);
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });
});
