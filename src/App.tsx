import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Check,
  CheckCheck,
  CircleCheck,
  Clock3,
  ExternalLink,
  ListFilter,
  Play,
  Search,
  Shuffle,
  X,
} from "lucide-react";
import { EP, QUEUE, TERMS, fmt, yt, type Clip, type Term } from "./data";
import {
  categories,
  displayTerm,
  getTerms,
  matches,
  readCollection,
  STORAGE_KEY,
  type Collection,
} from "./model";
import Diagram from "./Diagram";
import ThemeToggle from "./ThemeToggle";

function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const el = dialog.current!;
    el.showModal();
    return () => {
      el.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="modal"
      aria-label={title}
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <header role="presentation">
        <h2>{title}</h2>
        <button
          className="icon-button"
          onClick={close}
          aria-label="Close dialog"
        >
          <X size={22} />
        </button>
      </header>
      {children}
    </dialog>
  );
}

export default function App() {
  const [hash, setHash] = useState(window.location.hash);
  const [currentSlug, setCurrentSlug] = useState(
    () =>
      TERMS.find((t) => `#term-${t.slug}` === window.location.hash)?.slug ||
      TERMS[0].slug,
  );
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All terms");
  const [savedOnly, setSavedOnly] = useState(false);
  const [collection, setCollection] = useState<Collection>(readCollection);
  const [notice, setNotice] = useState("");
  const [about, setAbout] = useState(false);
  const [playing, setPlaying] = useState<Clip | null>(null);
  const [queueFilter, setQueueFilter] = useState("All drafts");
  const [resetting, setResetting] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const review = hash === "#review";
  const terms = getTerms(collection);
  const visible = terms.filter(
    (t) =>
      matches(t, query) &&
      (category === "All terms" || categories[t.slug] === category) &&
      (!savedOnly || collection.saved.includes(t.slug)),
  );
  const current = terms.find((t) => t.slug === currentSlug) || terms[0];
  const term = visible.find((t) => t.slug === current.slug) || visible[0];
  const drafts = QUEUE.filter(
    (d) =>
      !collection.approved.includes(d.id) &&
      !collection.rejected.includes(d.id),
  );
  const ready = drafts.filter((d) => d.clipReady).length;

  useEffect(() => {
    const route = () => {
      const next = window.location.hash;
      setHash(next);
      if (next.startsWith("#term-"))
        setCurrentSlug(
          TERMS.find((t) => `#term-${t.slug}` === next)?.slug || TERMS[0].slug,
        );
      setPlaying(null);
    };
    window.addEventListener("hashchange", route);
    return () => window.removeEventListener("hashchange", route);
  }, []);
  useEffect(() => {
    if (hash.startsWith("#term-")) {
      document.getElementById("dictionary")?.scrollIntoView({ block: "start" });
    }
  }, [hash]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
    } catch {
      setNotice(
        "Your browser can’t save changes. They’ll last until this page closes.",
      );
    }
  }, [collection]);
  useEffect(() => {
    const syncCollection = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null)
        setCollection(readCollection());
    };
    window.addEventListener("storage", syncCollection);
    return () => window.removeEventListener("storage", syncCollection);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    const shortcut = (e: KeyboardEvent) => {
      if (
        ((e.key === "/" && !e.metaKey && !e.ctrlKey) ||
          (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey))) &&
        !e.altKey &&
        searchRef.current &&
        !(
          e.target instanceof HTMLElement &&
          (e.target.isContentEditable ||
            e.target.closest("input, textarea, select"))
        ) &&
        !document.querySelector("dialog[open]")
      ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);

  const selectTerm = (slug: string) => {
    setQuery("");
    setCategory("All terms");
    setSavedOnly(false);
    window.location.hash = `term-${slug}`;
    document.getElementById("dictionary")?.scrollIntoView({ block: "start" });
  };
  const jumpToDictionary = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (review) {
      window.location.hash = `term-${current.slug}`;
      return;
    }
    const dictionary = document.getElementById("dictionary");
    dictionary?.scrollIntoView({ block: "start" });
    dictionary?.focus({ preventScroll: true });
  };
  const save = (slug: string) =>
    setCollection((c) => ({
      ...c,
      saved: c.saved.includes(slug)
        ? c.saved.filter((s) => s !== slug)
        : [...c.saved, slug],
    }));
  const clearFilters = () => {
    setQuery("");
    setCategory("All terms");
    setSavedOnly(false);
  };

  return (
    <>
      <a
        className="skip-link"
        href={review ? "#review" : "#dictionary"}
        onClick={
          review
            ? (event) => {
                event.preventDefault();
                document.getElementById("review")?.focus();
              }
            : jumpToDictionary
        }
      >
        {review ? "Skip to review queue" : "Skip to dictionary"}
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a
            className="brand"
            href="#term-butter"
            onClick={clearFilters}
            aria-label="Talkin’ Ball home"
          >
            <span>Talkin’ Ball</span>
          </a>
          <nav className="main-nav" aria-label="Main navigation">
            <a
              href={`#term-${current.slug}`}
              onClick={clearFilters}
              className={!review ? "active" : ""}
              aria-current={!review ? "page" : undefined}
            >
              Dictionary
            </a>
            <a
              href="#review"
              className={review ? "active" : ""}
              aria-current={review ? "page" : undefined}
            >
              Review queue{" "}
              <span className="nav-count">
                {String(drafts.length).padStart(2, "0")}
              </span>
            </a>
          </nav>
          <ThemeToggle />
        </div>
      </header>

      {!review ? (
        <>
          <section className="hero" aria-label="Welcome to Talkin’ Ball">
            <h1>
              Ever watched a{" "}
              <span
                className="headline-ball"
                role="img"
                aria-label="basketball"
              >
                <img src="/ball.svg" alt="" />
              </span>{" "}
              game, and thought,
              <br />
              <span>what are they talkin’ bout?</span>
            </h1>
          </section>
          <main id="dictionary" className="dictionary" tabIndex={-1}>
            <div className="section-heading">
              <div>
                <h2>The playbook</h2>
              </div>
              <div className="search-toolbar">
                <label className="search-box">
                  <input
                    ref={searchRef}
                    aria-keyshortcuts="/ Meta+K Control+K"
                    type="search"
                    placeholder={"Heard something? Search a term"}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search basketball terms"
                  />
                  <kbd>/</kbd>
                </label>
              </div>
            </div>
            <div className="filter-row">
              <div
                className="category-tabs"
                role="group"
                aria-label="Filter by category"
              >
                {["All terms", "On-ball", "Off-ball", "Game IQ"].map((c) => (
                  <button
                    key={c}
                    className={category === c ? "selected" : ""}
                    onClick={() => setCategory(c)}
                    aria-pressed={category === c}
                  >
                    {c === "All terms" ? "All" : c}{" "}
                    <span className="filter-count">
                      {String(
                        terms.filter(
                          (t) => c === "All terms" || categories[t.slug] === c,
                        ).length,
                      ).padStart(2, "0")}
                    </span>
                  </button>
                ))}
              </div>
              <button
                className={`saved-toggle ${savedOnly ? "selected" : ""}`}
                aria-pressed={savedOnly}
                onClick={() => setSavedOnly(!savedOnly)}
              >
                <Bookmark
                  size={17}
                  fill={savedOnly ? "currentColor" : "none"}
                />
                <span>Saved</span>
                <b>{String(collection.saved.length).padStart(2, "0")}</b>
              </button>

              <span className="result-count" role="status">
                {visible.length} {visible.length === 1 ? "term" : "terms"} in
                the playbook
              </span>
            </div>
            <div className="dictionary-layout">
              <aside className="term-index" aria-label="Basketball terms">
                <div className="index-label">
                  <span>No.</span>
                  <span>Term</span>
                  <span>Clips</span>
                </div>
                {visible.map((t, i) => (
                  <button
                    key={t.slug}
                    className={`term-button ${term?.slug === t.slug ? "selected" : ""}`}
                    onClick={() => {
                      window.location.hash = `term-${t.slug}`;
                    }}
                    aria-current={term?.slug === t.slug ? "true" : undefined}
                  >
                    <span className="term-number">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <strong>{displayTerm(t)}</strong>
                      <small>{categories[t.slug]}</small>
                    </span>
                    <span className="term-clips">{t.clips.length}</span>
                  </button>
                ))}
                {!visible.length && (
                  <p className="index-empty">
                    No terms found.
                    <br />
                    Try another search.
                  </p>
                )}
              </aside>
              {term ? (
                <article className="term-entry" key={term.slug}>
                  <div className="entry-topline">
                    <span>
                      ENTRY{" "}
                      {String(
                        TERMS.findIndex((t) => t.slug === term.slug) + 1,
                      ).padStart(3, "0")}{" "}
                      · {categories[term.slug].toUpperCase()}
                    </span>
                  </div>
                  <div className="entry-heading">
                    <h2>{displayTerm(term)}</h2>
                    <button
                      className={`bookmark-button ${collection.saved.includes(term.slug) ? "is-saved" : ""}`}
                      onClick={() => save(term.slug)}
                      aria-label={`${collection.saved.includes(term.slug) ? "Unsave" : "Save"} ${displayTerm(term)}`}
                      aria-pressed={collection.saved.includes(term.slug)}
                    >
                      <Bookmark
                        size={21}
                        fill={
                          collection.saved.includes(term.slug)
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>
                  </div>
                  {!!term.aka.length && (
                    <p className="aliases">
                      Also known as{" "}
                      {term.aka.map((a) => (
                        <span key={a}>{a}</span>
                      ))}
                    </p>
                  )}
                  <div className="definition-layout">
                    <div className="definition-copy">
                      <p className="definition">{term.def}</p>
                      <dl className="facts">
                        {Object.entries(term.facts).map(([k, v]) => (
                          <div key={k}>
                            <dt>{k}</dt>
                            <dd>{v}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                    <Diagram term={term} />
                  </div>
                  <section className="clips-section">
                    <div className="subsection-title">
                      <h3>From the source</h3>
                      <span>
                        {term.clips.length}{" "}
                        {term.clips.length === 1
                          ? "SOURCE CLIP"
                          : "SOURCE CLIPS"}
                      </span>
                    </div>
                    {!term.clips.length && (
                      <p>No source clips are available for this term yet.</p>
                    )}
                    {term.clips.map((clip, i) => (
                      <ClipCard
                        key={`${clip.ep}-${clip.t}`}
                        clip={clip}
                        term={term}
                        primary={i === 0}
                        play={() => setPlaying(clip)}
                      />
                    ))}
                  </section>
                  <section className="related-section">
                    <div className="subsection-title">
                      <h3>Keep the conversation going.</h3>
                      <span>RELATED TERMS</span>
                    </div>
                    <div className="related-terms">
                      {term.related.map((slug) => {
                        const t = terms.find((t) => t.slug === slug)!;
                        return (
                          <button key={slug} onClick={() => selectTerm(slug)}>
                            <span>
                              <small>{categories[slug]}</small>
                              <strong>{displayTerm(t)}</strong>
                            </span>
                            <ArrowUpRight size={21} />
                          </button>
                        );
                      })}
                    </div>
                  </section>
                </article>
              ) : (
                <div className="empty-state">
                  <Search size={36} />
                  <h2>
                    {savedOnly && !collection.saved.length
                      ? "Start your own playbook."
                      : "That one’s not in the playbook. Yet."}
                  </h2>
                  <p>
                    {savedOnly && !collection.saved.length
                      ? "Tap the bookmark on any entry to keep it close."
                      : "Try a different term, an alias, or a phrase you heard."}
                  </p>
                  <button className="button primary" onClick={clearFilters}>
                    Explore all terms <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
            <div className="discovery-action">
              <button
                className="text-button"
                onClick={() => {
                  const others = terms.filter((t) => t.slug !== current.slug);
                  selectTerm(
                    others[Math.floor(Math.random() * others.length)].slug,
                  );
                }}
              >
                <Shuffle size={15} /> Put me on to something{" "}
                <ArrowUpRight size={15} />
              </button>
            </div>
            <section
              className="queue-preview"
              aria-labelledby="queue-preview-title"
            >
              <div className="queue-preview-heading">
                <h2 id="queue-preview-title">In review</h2>
                <p>Drafts need a clip before they go in the book.</p>
              </div>
              {drafts.map((draft) => (
                <a className="queue-preview-row" href="#review" key={draft.id}>
                  <h3>{displayTerm(draft)}</h3>
                  <span className="queue-preview-kind">{draft.kind}</span>
                  <p>{draft.def}</p>
                  <span className="queue-preview-count">
                    {draft.sources.filter((source) => source.ep).length}{" "}
                    {draft.sources.filter((source) => source.ep).length === 1
                      ? "clip"
                      : "clips"}
                  </span>
                  <span className="queue-preview-link">
                    Review draft <ArrowUpRight size={14} />
                  </span>
                </a>
              ))}
              {!drafts.length && (
                <p className="queue-preview-empty">
                  All caught up. <a href="#review">View the review queue</a>
                </p>
              )}
            </section>
          </main>
        </>
      ) : (
        <main id="review" className="review-page" tabIndex={-1}>
          <a className="back-link" href={`#term-${current.slug}`}>
            <ArrowLeft size={15} /> Back to the dictionary
          </a>
          <div className="review-title">
            <div>
              <p className="eyebrow">BEHIND THE PLAYBOOK</p>
              <h1>
                Good language.
                <br />
                <span>Great evidence.</span>
              </h1>
            </div>
            <div className="review-intro">
              <p>Every term needs a moment to back it up.</p>
              <span>
                Review draft definitions and source clips before they join the
                dictionary. These are sample drafts from the original artifact;
                decisions are saved in this browser only.
              </span>
            </div>
          </div>
          <div className="review-stats">
            <div>
              <strong>{String(drafts.length).padStart(2, "0")}</strong>
              <span>IN THE QUEUE</span>
            </div>
            <div>
              <strong>{String(ready).padStart(2, "0")}</strong>
              <span>READY TO REVIEW</span>
            </div>
            <div>
              <strong>{String(drafts.length - ready).padStart(2, "0")}</strong>
              <span>NEED A SOURCE</span>
            </div>
            <p>
              <CircleCheck size={20} /> No clip, no entry.
              <br />
              <span>That’s the house rule.</span>
            </p>
          </div>
          <div className="queue-toolbar" id="queue-controls" tabIndex={-1}>
            <div
              className="category-tabs"
              role="group"
              aria-label="Filter review queue"
            >
              {["All drafts", "Ready to review", "Needs a clip"].map((f) => (
                <button
                  key={f}
                  onClick={() => setQueueFilter(f)}
                  className={queueFilter === f ? "selected" : ""}
                  aria-pressed={queueFilter === f}
                >
                  {f}
                </button>
              ))}
            </div>
            <button className="text-button" onClick={() => setResetting(true)}>
              Reset sample queue
            </button>
          </div>
          <div className="draft-list">
            {drafts
              .filter(
                (d) =>
                  queueFilter === "All drafts" ||
                  (queueFilter === "Ready to review"
                    ? d.clipReady
                    : !d.clipReady),
              )
              .map((d) => (
                <article className="draft-card" key={d.id}>
                  <div className="draft-name">
                    <span
                      className={`draft-state ${d.clipReady ? "ready" : ""}`}
                    >
                      {d.clipReady ? (
                        <CircleCheck size={13} />
                      ) : (
                        <Clock3 size={13} />
                      )}{" "}
                      {d.clipReady ? "READY TO REVIEW" : "NEEDS A CLIP"}
                    </span>
                    <h2>
                      {displayTerm(d)}
                      <span>.</span>
                    </h2>
                    <p>{d.kind}</p>
                  </div>
                  <div className="draft-details">
                    <span className="eyebrow">DRAFT DEFINITION</span>
                    <p className="draft-definition">{d.def}</p>
                    <div className="draft-sources">
                      <span>HEARD ON</span>
                      {d.sources.map((s) =>
                        s.ep ? (
                          <a
                            key={s.label}
                            href={yt(EP[s.ep].id, s.t!)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {EP[s.ep].show} · {fmt(s.t!)}{" "}
                            <ExternalLink size={12} />
                          </a>
                        ) : (
                          <p key={s.label}>{s.label}</p>
                        ),
                      )}
                    </div>
                    <p className="draft-note">
                      {d.note
                        .replace(
                          "Bots will timestamp the first broadcast clip where a commentator says it.",
                          "A timestamped broadcast clip is needed before this can be approved.",
                        )
                        .replace(
                          "The bots will look for the moment in the teams’ broadcast highlights.",
                          "A timestamped broadcast clip is needed before this can be approved.",
                        )}
                    </p>
                    <div className="draft-actions">
                      <button
                        className="button primary"
                        disabled={!d.clipReady}
                        onClick={() => {
                          if (!d.clipReady) return;
                          document.getElementById("queue-controls")?.focus();
                          setCollection((c) => ({
                            ...c,
                            approved: [...c.approved, d.id],
                          }));
                          setNotice(
                            "Approved. The source clip is now on the ghost screen entry.",
                          );
                        }}
                      >
                        <Check size={15} /> Approve & add clip
                      </button>
                      <button
                        className="button secondary"
                        onClick={() =>
                          setNotice(
                            "Kept in the queue. No background clip search is running in this demo.",
                          )
                        }
                      >
                        Keep in queue
                      </button>
                      <button
                        className="reject-button"
                        onClick={() => {
                          document.getElementById("queue-controls")?.focus();
                          setCollection((c) => ({
                            ...c,
                            rejected: [...c.rejected, d.id],
                          }));
                          setNotice(
                            "Draft rejected. Use Reset sample queue to restore it.",
                          );
                        }}
                      >
                        Reject
                      </button>
                    </div>
                    {!d.clipReady && (
                      <small className="source-required">
                        A timestamped source clip is required for approval.
                      </small>
                    )}
                  </div>
                </article>
              ))}
          </div>
          {!drafts.filter(
            (d) =>
              queueFilter === "All drafts" ||
              (queueFilter === "Ready to review" ? d.clipReady : !d.clipReady),
          ).length && (
            <div className="empty-state">
              <CheckCheck size={36} />
              <h2>
                {drafts.length ? "Nothing in this lane." : "All caught up."}
              </h2>
              <p>
                {drafts.length
                  ? "Choose another filter to see the remaining drafts."
                  : "The queue is clear. Reset the sample queue to explore again."}
              </p>
            </div>
          )}
          <p className="queue-disclaimer">
            <ListFilter size={14} /> This is a local review demo, not an
            authenticated publishing workflow. No bots or automated ingestion
            are connected.
          </p>
        </main>
      )}

      <footer className="site-footer">
        <a className="brand" href="#term-butter" onClick={clearFilters}>
          <span>Talkin’ Ball</span>
        </a>
        <button onClick={() => setAbout(true)}>
          A little more about us <ArrowUpRight size={14} />
        </button>
        <span>EVERY TERM BACKED BY THE CLIP WHERE IT WAS SAID</span>
      </footer>
      {notice && (
        <div className="toast" role="status">
          <CircleCheck size={18} />
          <span>{notice}</span>
          <button
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}
      {about && (
        <Modal title="Every game has a language." close={() => setAbout(false)}>
          <div className="about-content">
            <p className="large-copy">
              We’re here for the “wait, what does that mean?” moments.
            </p>
            <p>
              Talkin’ Ball is a field guide to basketball’s real vocabulary.
              Clear definitions, visual breakdowns, and timestamped clips put
              the language in context.
            </p>
            <p>
              This first edition recreates the six entries and source citations
              in{" "}
              <a
                href="https://claude.ai/artifact/MqKpcY55c9YNukbJRyZ1qZ#term-butter"
                target="_blank"
                rel="noreferrer"
              >
                Alex’s original artifact <ExternalLink size={13} />
              </a>
              . “Clip-backed” means the entry has a source link supplied by that
              artifact, not an independent fact-check. Videos are hosted by
              YouTube and may change or be unavailable.
            </p>
            <p>
              Bookmarks and review decisions stay in this browser. The review
              queue uses sample drafts; there is no backend, shared moderation,
              or automated clip discovery.
            </p>
            <button className="button primary" onClick={() => setAbout(false)}>
              Got it. Let’s talk ball. <ArrowRight size={16} />
            </button>
          </div>
        </Modal>
      )}
      {playing && (
        <Modal title={EP[playing.ep].show} close={() => setPlaying(null)}>
          <div className="video-player">
            <iframe
              title={EP[playing.ep].title}
              src={`https://www.youtube-nocookie.com/embed/${EP[playing.ep].id}?start=${playing.t}&autoplay=${window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 0 : 1}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
          <div className="video-caption">
            <h3>{EP[playing.ep].title}</h3>
            <p>{playing.ctx}</p>
            <a
              className="button primary"
              href={yt(EP[playing.ep].id, playing.t)}
              target="_blank"
              rel="noreferrer"
            >
              Watch on YouTube at {fmt(playing.t)} <ArrowUpRight size={15} />
            </a>
            <small>
              If this video won’t play here, open the original source on
              YouTube.
            </small>
          </div>
        </Modal>
      )}
      {resetting && (
        <Modal
          title="Reset the sample queue?"
          close={() => setResetting(false)}
        >
          <div className="about-content">
            <p>
              This restores the three sample drafts and removes clips added
              through approvals. Your saved terms stay saved.
            </p>
            <div className="draft-actions">
              <button
                className="button primary"
                onClick={() => {
                  setCollection((c) => ({ ...c, approved: [], rejected: [] }));
                  setResetting(false);
                  setNotice(
                    "Sample queue restored. Your saved terms are unchanged.",
                  );
                }}
              >
                Reset sample queue
              </button>
              <button
                className="button secondary"
                onClick={() => setResetting(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function ClipCard({
  clip,
  term,
  primary,
  play,
}: {
  clip: Clip;
  term: Term;
  primary: boolean;
  play: () => void;
}) {
  const episode = EP[clip.ep];
  const words = [term.term, ...term.aka]
    .sort((a, b) => b.length - a.length)
    .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const quote = clip.quote.split(new RegExp(`(${words.join("|")})`, "gi"));
  return (
    <div
      className={`clip-card ${primary ? "primary-clip" : "additional-clip"}`}
    >
      <button className="clip-thumbnail" onClick={play}>
        <img
          src={`https://i.ytimg.com/vi/${episode.id}/hqdefault.jpg`}
          alt=""
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <span className="clip-scrim" />
        <span className="thumbnail-kicker">FROM THE SOURCE</span>
        <span className="play-circle">
          <Play size={20} fill="currentColor" />
        </span>
        <span className="thumbnail-bottom">
          <strong>{episode.show}</strong>
          <b>
            {fmt(clip.t)} <ArrowUpRight size={12} />
          </b>
        </span>
      </button>
      <div className="clip-quote">
        <span className="quote-mark" aria-hidden="true">
          “
        </span>
        <blockquote>
          “
          {quote.map((s, i) =>
            [term.term, ...term.aka].some(
              (w) => w.toLowerCase() === s.toLowerCase(),
            ) ? (
              <mark key={i}>{s}</mark>
            ) : (
              s
            ),
          )}
          ”
        </blockquote>
        <div className="clip-attribution">
          <span>
            <strong>{clip.who}</strong>
            <small>
              {clip.ctx} · {episode.season}
            </small>
          </span>
          <a
            href={yt(episode.id, clip.t)}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open source on YouTube at ${fmt(clip.t)}`}
          >
            <ArrowUpRight size={19} />
          </a>
        </div>
      </div>
    </div>
  );
}
