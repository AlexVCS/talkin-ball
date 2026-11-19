import { useState } from "react";
import { RotateCcw } from "lucide-react";
import type { Term } from "./data";

export default function Diagram({ term }: { term: Term }) {
  const [replay, setReplay] = useState(0);
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
            <span className="ghost-digits" aria-hidden="true">
              88
            </span>
            <span className="lit-digits">0{term.shot.at}</span>
            <small>SHOT CLOCK</small>
          </div>
          <svg
            viewBox="0 0 300 145"
            role="img"
            aria-label="Basketball backboard below a seven-second shot clock"
          >
            <path
              d="M150 0v15M55 122V16h190v106zM119 113V72h62v41"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="m127 120 10 25m2-24 5 24m6-23v23m11-24-5 24m17-25-10 25M131 131q19 9 38 0"
              stroke="currentColor"
              fill="none"
              opacity=".45"
            />
            <ellipse
              cx="150"
              cy="119"
              rx="25"
              ry="5"
              fill="none"
              stroke="#f15a29"
              strokeWidth="3"
            />
          </svg>
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
                stroke="#f15a29"
                strokeWidth="1.4"
              />
            </marker>
          </defs>
          <rect x="102" y="1" width="96" height="113" fill="#e9e8dd" />
          <g fill="none" stroke="#b9bcaf" strokeWidth="1.4">
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
                <circle cx={x} cy={y} r="14" fill="#f15a29" opacity=".18" />
              )}
              <circle cx={x} cy={y} r="10" fill="#232a23" />
              <text
                x={x}
                y={y + 3.5}
                textAnchor="middle"
                fontSize="10"
                fill="#fff"
              >
                {n}
              </text>
            </g>
          ))}
        </svg>
      )}
      <figcaption>{(term.play || term.shot)?.cap}</figcaption>
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
        <div className="clock-scale">
          <span>24 SEC</span>
          <i />
          <b>07</b>
          <i />
          <span>00</span>
        </div>
      )}
    </figure>
  );
}
