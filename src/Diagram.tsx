import { useState } from "react";
import { RotateCcw } from "lucide-react";
import type { Term } from "./data";

export default function Diagram({ term }: { term: Term }) {
  const [replay, setReplay] = useState(0);
  if (!term.shot && !term.play) return null;
  return (
    <figure className={`diagram ${term.shot ? "clock-diagram" : ""}`}>
      <div className="diagram-top">
        <span>{term.shot ? "AGAINST THE CLOCK" : "ON THE WHITEBOARD"}</span>
        <button
          onClick={() => setReplay((r) => r + 1)}
          aria-label="Replay diagram"
        >
          <RotateCcw size={14} />
        </button>
      </div>
      {term.shot ? (
        <div className="shot-art" key={replay}>
          <div className="shot-clock">
            <span className="lit-digits">
              :{String(term.shot.at).padStart(2, "0")}
            </span>
            <small>and under on the 24</small>
          </div>
        </div>
      ) : (
        <svg
          key={`${term.slug}-${replay}`}
          className="court-svg"
          viewBox="0 0 300 240"
          role="img"
          aria-label={`Half-court diagram of ${term.term}`}
        >
          <defs>
            <marker
              id={`arrow-${term.slug}`}
              markerWidth="6"
              markerHeight="6"
              refX="4"
              refY="3"
              orient="auto"
            >
              <path
                d="M0 0 5 3 0 6"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1.4"
              />
            </marker>
          </defs>
          <rect
            x="102"
            y="1"
            width="96"
            height="113"
            fill="var(--court-fill)"
          />
          <g fill="none" stroke="var(--court-line)" strokeWidth="1.4">
            <path d="M1 239V1h298v238M18 1v84a142 142 0 0 0 264 0V1M102 1v113h96V1" />
            <circle cx="150" cy="114" r="36" />
            <path d="M126 31a24 24 0 0 0 48 0M132 24h36" />
            <circle cx="150" cy="31" r="4.5" />
          </g>
          {term.play?.moves.map(([kind, ax, ay, bx, by, cx, cy], i) => (
            <g
              key={i}
              className="play-motion"
              style={{ animationDelay: `${i * 160}ms` }}
            >
              <path
                d={`M${ax} ${ay}Q${cx ?? (+ax + +bx) / 2} ${cy ?? (+ay + +by) / 2} ${bx} ${by}`}
                fill="none"
                stroke={kind === "def" ? "var(--text-muted)" : "var(--accent)"}
                strokeWidth="2.5"
                strokeDasharray={
                  kind === "pass" || kind === "trail" ? "5 4" : undefined
                }
                markerEnd={
                  kind === "screen" || kind === "trail"
                    ? undefined
                    : `url(#arrow-${term.slug})`
                }
              />
              {kind === "screen" && (
                <path
                  d={`M${+bx - 8} ${by}h16`}
                  stroke="var(--accent)"
                  strokeWidth="3"
                />
              )}
            </g>
          ))}
          {term.play?.x.map(([n, x, y]) => (
            <g key={n} stroke="var(--text-muted)" strokeWidth="2">
              <path d={`M${x - 5} ${y - 5}l10 10m0-10-10 10`} />
              <text
                x={x + 8}
                y={y + 10}
                stroke="none"
                fontSize="8"
                fill="var(--text-muted)"
              >
                {n}
              </text>
            </g>
          ))}
          {term.play?.o.map(([n, x, y, ball]) => (
            <g key={n}>
              {!!ball && (
                <circle
                  cx={x}
                  cy={y}
                  r="14"
                  fill="var(--accent)"
                  opacity=".18"
                />
              )}
              <circle cx={x} cy={y} r="10" fill="var(--player-fill)" />
              <text
                x={x}
                y={y + 3.5}
                textAnchor="middle"
                fontSize="10"
                fill="var(--player-fg)"
              >
                {n}
              </text>
            </g>
          ))}
        </svg>
      )}
      {term.play && <figcaption>{term.play.cap}</figcaption>}
      {term.play && (
        <div className="legend">
          <span>
            <b>●</b> Offense
          </span>
          <span>× Defense</span>
          <span className="orange">⤴ Movement</span>
        </div>
      )}
      {term.shot && (
        <svg
          className="clock-timeline"
          viewBox="0 0 832 100"
          role="img"
          aria-label={term.shot.cap}
        >
          <rect
            x="20"
            y="10"
            width="792"
            height="10"
            fill="var(--surface-muted)"
          />
          <rect
            key={replay}
            className="clock-highlight"
            x={812 - (term.shot.at / 24) * 792}
            y="10"
            width={(term.shot.at / 24) * 792}
            height="10"
            fill="var(--accent)"
          />
          {Array.from({ length: 25 }, (_, i) => (
            <line
              key={i}
              x1={20 + i * 33}
              y1="28"
              x2={20 + i * 33}
              y2={i % 6 === 0 ? 40 : 34}
              stroke="var(--text-muted)"
            />
          ))}
          {[24, 18, 12, 6, 0].map((value, i) => (
            <text
              key={value}
              x={20 + i * 198}
              y="62"
              fontSize="11"
              fontFamily="var(--mono)"
              textAnchor="middle"
              fill="var(--text-muted)"
            >
              {value}
            </text>
          ))}
        </svg>
      )}
    </figure>
  );
}
