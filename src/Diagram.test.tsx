import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Diagram from "./Diagram";
import { TERMS } from "./data";

describe("play diagrams", () => {
  it("renders nothing when neither a shot clock nor a play is supplied", () => {
    const { container } = render(
      <Diagram term={{ ...TERMS[0], shot: undefined, play: undefined }} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it.each([
    ["hostage-dribble", ["Trailing defender", "Cut / movement"]],
    ["gortat-screen", ["Screen", "Dribble"]],
    ["ghost-screen", ["Cut / movement", "Pass"]],
    ["court-mapping", ["Cut / movement", "Pass"]],
    ["blender", ["Dribble", "Defensive recovery", "Pass"]],
  ])("explains only the line styles used by %s", (slug, labels) => {
    const term = TERMS.find((t) => t.slug === slug)!;
    const { container } = render(<Diagram term={term} />);
    expect(screen.getByRole("img")).toHaveAccessibleName(
      `Half-court diagram of ${term.term}`,
    );
    expect(screen.getByText("Offense")).toBeInTheDocument();
    expect(screen.getByText("× Defense")).toBeInTheDocument();
    for (const label of labels) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(container.querySelectorAll(".legend-line")).toHaveLength(
      labels.length,
    );
    const legend = container.querySelector(".legend")!;
    const kinds = [...new Set(term.play!.moves.map(([kind]) => kind))];
    kinds.forEach((kind, i) => {
      const swatch = legend.querySelectorAll(".legend-line")[i];
      const path = swatch.querySelector("path")!;
      if (kind === "pass" || kind === "trail") {
        expect(path).toHaveAttribute("stroke-dasharray", "5 4");
      } else {
        expect(path).not.toHaveAttribute("stroke-dasharray");
      }
      expect(swatch.querySelectorAll("path")).toHaveLength(
        kind === "trail" ? 1 : 2,
      );
      expect(swatch.classList.contains("defensive-line")).toBe(kind === "def");
    });
  });

  it("renders the shot clock without a play legend", () => {
    const { container } = render(<Diagram term={TERMS[0]} />);
    expect(
      screen.getByText(":07", { selector: ".lit-digits" }),
    ).toBeInTheDocument();
    expect(container.querySelector(".legend")).not.toBeInTheDocument();
  });
});
