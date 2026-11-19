# Talkin’ Ball

A visual dictionary for the language of basketball. Built with React, TypeScript, and Vite, using the definitions, play diagrams, and timestamped source clips from [the original Claude artifact](https://claude.ai/artifact/MqKpcY55c9YNukbJRyZ1qZ#term-butter).

## The playbook

- Six basketball terms with definitions, aliases, and visual breakdowns.
- Eight source clips with timestamped YouTube playback and direct links.
- Search by term, alias, definition, or source, with category filters.
- Saved terms and a sample review queue, persisted in the current browser.

## Run locally

Node.js 22 or newer is required.

```sh
npm ci
npm run dev
```

Open <http://localhost:5173>.

## Verify

```sh
npm test
npm run build
npm audit --audit-level=moderate
```

CI repeats tests, TypeScript checks, the production build, and dependency auditing on each pull request and push to `main`.

## Deploy

```sh
npm ci
npm run build
npm start
```

The production server serves `dist` at <http://localhost:4173>. Set `PORT` to use another port. The build can also be hosted by any static hosting provider; navigation uses URL hashes, so no rewrite rules or API keys are needed.

## Content and assets

Definitions, episode details, and clip timestamps were migrated from the supplied artifact without independent fact-checking. “Clip-backed” means a source link was supplied, not that its accuracy or availability has been independently verified. YouTube hosts the videos and thumbnails; unavailable embeds include a direct source link.

The review queue is a local demo with three sample drafts. Approval adds the supplied source clip to the Ghost screen entry; drafts without clips cannot be approved. Decisions and bookmarks stay in this browser, with no backend, shared moderation, authentication, or automated clip discovery. Resetting the sample queue restores its drafts without removing saved terms.

Basketball artwork and court diagrams are drawn in SVG and CSS. Barlow Condensed and DM Sans are self-hosted under their included SIL Open Font Licenses in `public/fonts`.
