export interface Clip {
  ep: string;
  t: number;
  who: string;
  quote: string;
  ctx: string;
}
export interface Term {
  slug: string;
  term: string;
  aka: string[];
  proper?: boolean;
  def: string;
  facts: Record<string, string>;
  shot?: { at: number; cap: string };
  play?: {
    o: number[][];
    x: number[][];
    moves: (string | number)[][];
    cap: string;
  };
  clips: Clip[];
  related: string[];
}
export interface Draft {
  id: string;
  term: string;
  kind: string;
  def: string;
  sources: { label: string; ep?: string; t?: number }[];
  note: string;
  clock?: boolean;
  clipReady: boolean;
  proper?: boolean;
  merge?: string;
}
export interface Episode {
  id: string;
  title: string;
  show: string;
  hosts: string;
  season: string;
}
export const EP: Record<string, Episode> = {
  spacing: {
    id: "6Oag1Uojg20",
    title: "The Spacing, The Icons and The Block",
    show: "Mind the Game",
    hosts: "LeBron James & JJ Redick",
    season: "Season 1, 2024",
  },
  hardest: {
    id: "YSjimpC0fk8",
    title: "The Hardest Actions to Guard in Basketball",
    show: "Mind the Game",
    hosts: "LeBron James & JJ Redick",
    season: "Season 1, 2024",
  },
  luka: {
    id: "EshJkgzYkV4",
    title: "Luka Dončić, Longevity, and Love of the Game",
    show: "Mind the Game",
    hosts: "LeBron James & Steve Nash",
    season: "Season 2",
  },
  wizdet: {
    id: "o7EjgIyGeSY",
    title:
      "Detroit Pistons vs Washington Wizards Full Game Highlights - November 12, 2026 | NBA",
    show: "yikerzgame highlights",
    hosts: "yikerzgame (uploader)",
    season: "November 12, 2026",
  },
};
export const fmt = (s: number) =>
  Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
export const yt = (id: string, t: number) => `https://youtu.be/${id}?t=${t}`;

export const TERMS: Term[] = [
  {
    slug: "butter",
    term: "Butter",
    aka: [],
    def: "A late shot clock: about six or seven seconds or less. The booth calls it when the offense has to get a shot up.",
    facts: {
      Source: "Third-party game highlights uploaded by yikerzgame",
      Where: "YouTube",
      Date: "November 12, 2026",
    },
    shot: {
      at: 7,
      cap: "Butter starts around here: six or seven seconds left on the 24-second shot clock.",
    },
    clips: [
      {
        ep: "wizdet",
        t: 1550,
        who: "Game broadcast commentary",
        quote:
          "They’re butter. They probably think we was crazy.” “What’s butter?” “That’s terminology of a late-clock situation, usually six or seven seconds or under.",
        ctx: "Via third-party highlights uploaded by yikerzgame",
      },
    ],
    related: ["hostage-dribble"],
  },
  {
    slug: "hostage-dribble",
    term: "Hostage dribble",
    aka: ["putting him in jail", "in jail", "handcuffs"],
    def: "After the defender chases over a screen, the ball handler keeps him pinned on his back and slows the dribble down. The trailing defender can’t recover, so the big has to commit, and the offense plays 2-on-1.",
    facts: {
      "Who says it": "LeBron James, JJ Redick",
      Where: "Podcasts, film breakdowns, player talk",
      Era: "Pick-and-roll era, 2010s to now",
    },
    play: {
      o: [
        [1, 172, 116, 1],
        [5, 138, 172],
      ],
      x: [
        [1, 176, 139],
        [5, 152, 80],
      ],
      moves: [
        ["trail", 100, 202, 172, 152, 178, 210],
        ["cut", 134, 162, 124, 96],
      ],
      cap: "X1 chased over the screen and is stuck on O1’s back. X5 has to choose between the ball and O5’s roll.",
    },
    clips: [
      {
        ep: "spacing",
        t: 1567,
        who: "LeBron James",
        quote:
          "I hostaged… I call it ‘put them in jail,’ but some people call it a hostage dribble. They chase over the screen, you put them on your back, and then you just kind of hostage dribble.",
        ctx: "Breaking down his own play against the Bucks, March 2020",
      },
      {
        ep: "spacing",
        t: 261,
        who: "JJ Redick",
        quote:
          "The offensive player has an advantage, and as Bron calls it, a hostage dribble, or putting a player in jail.",
        ctx: "Whiteboard explainer",
      },
      {
        ep: "spacing",
        t: 1714,
        who: "LeBron James",
        quote:
          "Draymond does it all the time… he had me in jail and put the handcuffs on me.",
        ctx: "Same idea off the ball, on drives",
      },
    ],
    related: ["gortat-screen", "ghost-screen"],
  },
  {
    slug: "gortat-screen",
    term: "Gortat screen",
    aka: [],
    proper: true,
    def: "Once the ball handler has his defender in jail, the screener rolls into a second screen on the big in drop coverage, so the ball handler gets all the way to the rim.",
    facts: {
      "Who says it": "JJ Redick, LeBron James",
      Where: "Podcasts, coaching staffs",
      Era: "Named for Marcin Gortat, who ran it with John Wall on the 2010s Wizards",
    },
    play: {
      o: [
        [1, 178, 120, 1],
        [5, 136, 142],
      ],
      x: [
        [1, 183, 143],
        [5, 146, 64],
      ],
      moves: [
        ["screen", 138, 132, 144, 80],
        ["dribble", 175, 106, 166, 48],
      ],
      cap: "With X1 still in jail, O5 turns his roll into a second screen on X5. The lane to the rim is open.",
    },
    clips: [
      {
        ep: "spacing",
        t: 250,
        who: "JJ Redick",
        quote:
          "So a Gortat screen is when the offensive player comes around the pick and roll, the defensive player goes over the top…",
        ctx: "Whiteboard explainer",
      },
    ],
    related: ["hostage-dribble"],
  },
  {
    slug: "ghost-screen",
    term: "Ghost screen",
    aka: ["bluff screen"],
    def: "The screener runs up like he’s setting a pick-and-roll, never stops, and keeps going to the three-point line or slips to the basket. The point is to confuse the two defenders.",
    facts: {
      "Who says it": "JJ Redick (“ghost”), LeBron James (“bluff”)",
      Where: "Broadcasts, podcasts, coaching",
      Era: "Modern spacing era",
    },
    play: {
      o: [
        [1, 150, 198, 1],
        [4, 204, 116],
      ],
      x: [
        [1, 150, 172],
        [4, 184, 92],
      ],
      moves: [
        ["cut", 198, 124, 246, 146, 130, 205],
        ["pass", 163, 194, 240, 164],
      ],
      cap: "O4 runs at X1 like he’s screening, never stops, and flares to the arc. X1 and X4 both hesitate.",
    },
    clips: [
      {
        ep: "hardest",
        t: 228,
        who: "JJ Redick",
        quote:
          "A ghost screen, or as LeBron calls it, a bluff screen, is simply when you run in to set a pick and roll and you essentially don’t stop.",
        ctx: "Whiteboard explainer",
      },
    ],
    related: ["hostage-dribble", "blender"],
  },
  {
    slug: "court-mapping",
    term: "Court mapping",
    aka: ["spatial awareness"],
    def: "Knowing where all ten players are, and how each defender has been taught to react, so you can make the pass before the opening appears.",
    facts: {
      "Who says it": "JJ Redick, LeBron James",
      Where: "Podcasts, film breakdowns",
      Era: "Jokić era",
    },
    play: {
      o: [
        [5, 112, 120, 1],
        [2, 34, 124],
        [1, 184, 198],
        [4, 258, 134],
        [3, 289, 28],
      ],
      x: [
        [5, 128, 104],
        [2, 56, 112],
        [1, 178, 174],
        [4, 238, 118],
        [3, 266, 38],
      ],
      moves: [
        ["cut", 40, 114, 124, 44, 50, 52],
        ["pass", 104, 108, 118, 56],
      ],
      cap: "O5 knows where all ten are. X2 is overplaying the wing, so the pass leaves as O2 starts his backdoor cut.",
    },
    clips: [
      {
        ep: "spacing",
        t: 313,
        who: "JJ Redick",
        quote:
          "Court mapping is simply knowing where everyone is on the court and the tendencies of those players.",
        ctx: "Using Nikola Jokić as the example",
      },
    ],
    related: ["blender"],
  },
  {
    slug: "blender",
    term: "Blender",
    aka: ["in rotation"],
    def: "The broken floor after the first bit of penetration forces help. The ball moves around the gym while the defense is still recovering, creating closeouts, paint touches and open threes.",
    facts: {
      "Who says it": "NBA coaches and players",
      Where: "Podcasts, film rooms",
      Era: "Modern",
    },
    play: {
      o: [
        [1, 150, 196, 1],
        [3, 258, 136],
        [2, 289, 28],
        [4, 42, 134],
        [5, 112, 40],
      ],
      x: [
        [1, 168, 182],
        [3, 214, 104],
        [2, 250, 62],
        [4, 72, 114],
        [5, 170, 62],
      ],
      moves: [
        ["dribble", 150, 182, 150, 132],
        ["def", 207, 106, 172, 120],
        ["pass", 160, 134, 243, 137],
        ["def", 250, 70, 255, 120],
        ["pass", 263, 126, 285, 45],
        ["def", 178, 58, 270, 34],
      ],
      cap: "O1’s drive pulls X3 off the wing. The ball goes wing, then corner, and each defender gets there a step late.",
    },
    clips: [
      {
        ep: "luka",
        t: 1319,
        who: "Mind the Game film breakdown",
        quote:
          "Blender is a term we use in the NBA when a team is in rotation.",
        ctx: "On-screen breakdown",
      },
    ],
    related: ["court-mapping", "ghost-screen"],
  },
];
