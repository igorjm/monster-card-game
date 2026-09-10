# Theme Packs: Product Bible and Implementation Plan

Status: active on `codex/theme-packs`. The typed pack seam, Monstros extraction,
room theme persistence/API, creation picker, and two Brazilian preview packs are
implemented on this branch. Final art/audio and production editorial approvals
remain intentionally gated.

## 1. Decision

Keep one mechanical engine and ship each setting as a content pack. A theme may
change names, prose, imagery, palette, ambience, narration, and user-facing
terminology. It must not change the deck, action semantics, information
visibility, night order, timers, voting, or win priority.

The existing `monstros` experience is the compatibility baseline. Extracting it
into a pack must produce no gameplay or visible-copy regression before another
pack is enabled.

There are **10 proposed new satirical packs plus the existing `monstros`
pack**, for 11 packs in the long-term catalog. This resolves the ambiguity in
the recovered study, which referred to 10 packs while also treating Monstros
as a pack.

## 2. Mechanical skeleton (frozen for this project)

The persisted IDs below are legacy Portuguese identifiers. Treat them as opaque
protocol keys, not display names. Renaming them would add migration risk without
improving the first theme release.

| Persisted role ID | Archetype | Mechanical behavior |
| --- | --- | --- |
| `aldeao` | Villager A | No night action |
| `lavrador` | Villager B | No night action; alternate cast/art slot |
| `cacador` | Hunter | Hides one center card without seeing it |
| `bruxa` | Seer | Peeks at one player; sees center-card presence |
| `lobisomem` | Wolf | Sees the pack and remaining center cards |
| `mumia` | Martyr A | Martyr team wins if this role is executed |
| `esqueleto` | Martyr B | Martyr team wins if this role is executed |
| `zumbi` | Shapechanger | Takes a center role and may chain its action |
| `vampiro` | Swapper | Swaps with another player or an occupied center slot |

Frozen invariants:

- 3–7 players and exactly three center slots.
- The existing deck table in `buildDeck`.
- Night order and action windows: Hunter, Seer, Wolf, Shapechanger, Swapper,
  dawn.
- The current approximately 98-second synchronized night.
- Information-visibility rules, including temporary Seer and Wolf reveals.
- Win priority: executed Martyr, executed Wolf, Hunter-hidden Wolf when Hunter
  survives, otherwise Wolf team.
- Shapechanger has no victory condition of its own; its final role determines
  scoring.
- Theme selection is locked once a game leaves the lobby.
- Player identity and career wins remain global across themes in version 1.

Themes must never be passed into `dealGame`, `applyNightAction`, or
`resolveVotes`. If a proposed pack needs an engine `if (themeId === ...)`, it is
a new ruleset, not a theme pack.

## 3. Corrections and additions to the recovered proposal

1. **Separate mechanics from presentation.** The current `ROLES` object mixes
   engine facts (`team`, `hasAction`) with names, copy, and art. Mechanical facts
   must move to an engine-owned `ROLE_RULES`; a pack must not be able to alter
   them.
2. **Separate themed copy from generic interface localization.** Buttons such
   as Create room, Pause, Copy link, and Try again belong to a small locale
   catalog. Role names, center terminology, story, rules flavor, share text,
   and result blurbs belong to the pack. This prevents duplicating the entire UI
   in every theme.
3. **Use semantic colors.** Runtime tokens should be named `background`,
   `surface`, `primary`, `accent`, `text`, and so on—not `blood`, `grave`, or
   `swamp`. The latter are Monstros presentation choices.
4. **Keep audio timing mechanical.** Packs provide words and recordings, but
   every narration must fit the shared action windows. Pack-specific timelines
   would let the browser and server disagree about whether an action is valid.
5. **Validate IDs on the server.** A room stores only a registry-backed theme
   ID. Never construct a filesystem path or dynamic import from an untrusted
   request value.
6. **Distinguish room theme from installed-app branding.** A room can change its
   palette and content live. PWA name, icon, manifest, social metadata, and the
   initial home/loading screen use the deployment's default pack. Separate
   white-label deployments can set a different default pack.
7. **Make draft packs non-public.** Placeholder art and unfinished narration
   are useful during development, but the production picker should list only
   packs marked `published` and allowed by deployment configuration.
8. **Namespace and budget assets.** Put assets below `/themes/<theme-id>/` and
   cache only the active/default pack. Ten packs must not become one enormous
   service-worker precache.
9. **Preserve local user data.** Existing `monstros:*` local-storage keys should
   be read during a one-time compatibility migration before neutral keys are
   written.

## 4. Proposed code boundaries

```text
lib/game/
  types.ts                  stable persisted/protocol IDs
  mechanics.ts              ROLE_RULES, teams, deck, action order
  timeline.ts               only shared time windows and total duration
  engine.ts                 rules; imports no theme package

lib/themes/
  types.ts                  ThemePack and presentation-only contracts
  registry.ts               static allowlist, fallback, status filtering
  monstros.ts               current content extracted unchanged
  folclore-br.ts
  rio-satira.ts
  validate.ts               completeness and invariant checks

lib/ui/locales/
  pt-BR.ts                  generic shell copy
  en.ts                     added before English-language packs ship

components/theme/
  ThemeProvider.tsx         active pack and runtime CSS variables
  ThemePicker.tsx           room-creation control

public/themes/<theme-id>/
  art/                      logo, card back, nine role images
  audio/                    night narration, captions, ambient loop
  icons/                    optional deployment/PWA icon set
```

`lib/game` must not import `lib/themes`, React, browser APIs, assets, or localized
strings. Theme-aware UI consumes the active pack through one provider/helper
rather than importing `monstros` content directly.

## 5. Contract direction

The exact copy fields should be finalized from a hardcoded-copy inventory before
implementation. The important constraint is that a pack remains data-only and
serializable.

```ts
type ThemeStatus = "draft" | "published";
type SupportedLocale = "pt-BR" | "en"; // extend deliberately later

type RolePresentation = {
  name: string;
  letter: string;
  description: string;
  nightHint: string;
  artSrc: string;
  artAlt: string;
};

type ThemePack = {
  schemaVersion: 1;
  id: string;
  status: ThemeStatus;
  name: string;
  shortName: string;
  locale: SupportedLocale;
  brand: {
    title: string;
    tagline: string;
    description: string;
    logoSrc: string;
    cardBackSrc: string;
    shareText: string; // template with documented room-code/link placeholders
  };
  terminology: {
    center: string;
    centerPositionNames: readonly [string, string, string];
    village: string;
    wolfPack: string;
  };
  roles: Record<Role, RolePresentation>;
  teams: Record<Team, {
    name: string;
    goal: string;
    winBlurb: string;
  }>;
  rulesCopy: {
    deckSummary: string;
    nightSummary: string;
    votingSummary: string;
    winPrioritySummary: string;
  };
  narration: {
    audioSrc?: string;
    captionsSrc?: string;
    ttsLocale: SupportedLocale;
    segments: Record<NarrationBeat, {
      narration: string;
      actorPrompt?: string;
    }>;
    subtitles: readonly SubtitleCue[];
  };
  ambient: {
    audioSrc?: string;
    volume: number;
  };
  palette: {
    background: string;
    backgroundSoft: string;
    surface: string;
    surfaceStrong: string;
    primary: string;
    primaryStrong: string;
    accent: string;
    accentSoft: string;
    text: string;
    textMuted: string;
    border: string;
    positive: string;
    danger: string;
  };
};
```

Do not put `team`, `hasAction`, deck counts, window times, or win conditions in
`ThemePack`. Those fields would duplicate rules and eventually drift.

Contract validation must assert:

- ID is a safe slug and is unique.
- All nine role keys and all team keys exist exactly once.
- All required prose and alt text is non-empty.
- Asset paths are namespaced and files exist.
- Palette values are valid CSS colors and essential combinations pass contrast
  checks.
- Subtitle cues are ordered, do not overlap, and stay within the shared night.
- Required narration beats exist and fit their mechanical windows.
- Ambient volume is between 0 and 1.
- Published packs contain no placeholder markers or missing audio/art.

## 6. Room, API, and deployment model

Database:

- Add `rooms.theme_id text not null default 'monstros'` in an additive Supabase
  migration. Existing rooms are backfilled automatically by the default.
- Do not add a database check constraint listing pack IDs; adding content should
  not require a database migration. Validate against the server registry.
- Expose `themeId` in every `RoomView`.

Room behavior:

- `POST /api/rooms` accepts `{ nickname, token, themeId }`; omitted values use
  `DEFAULT_THEME_ID`, falling back safely to `monstros`.
- Validate the requested theme against the enabled server registry before the
  room is inserted.
- The selected theme is immutable after room creation, so players always join
  the same branded experience and no lobby mutation endpoint is exposed.
- Restart preserves the selected theme. Leaving/deleting a room needs no theme
  cleanup.

Deployment behavior:

- `DEFAULT_THEME_ID`: branding used before a room is loaded and for new rooms.
- `ENABLED_THEME_IDS`: server-side allowlist for a deployment; default is all
  published packs.
- `LOCK_THEME_ID` (optional): hides the picker for a single-brand deployment.
- Generate metadata and the web manifest from the default pack. A room-level
  switch changes in-app visuals and the browser theme-color meta tag, not the
  already-installed app's identity.

Theme IDs are public content identifiers, not secrets. Server registry
validation remains authoritative even if defaults are also exposed to the
client build.

## 7. Content catalog

These are working editorial names, not approved production copy. Each pack must
receive a native/local reviewer, a trademark pass, and a satire-safety review
before publication. The target is institutions, status games, media incentives,
and bureaucracy—not ethnicity, poverty, neighborhoods, religion, or victims.

| Pack ID | Center | Villager A / B | Hunter | Seer | Wolf | Martyr A / B | Shapechanger | Swapper |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `folclore-br` | Cruzeiro | Caboclo / Turista | Caipora | Cuca | Lobisomem | Saci / Mula-sem-cabeça | Encantado | Boto |
| `rio-satira` | Arquivo | Morador / Motoboy | Olheiro | Tia do Zap | Miliciano | Influencer / Comentarista | Laranja | Cabo Eleitoral |
| `startup` | Pitch Deck | Dev Pleno / Customer Success | Security Engineer | Whistleblower | VC | Visionary Founder / Serial Founder | AI Agent | Recruiter |
| `brasilia` | Caixa 2 | Servidor / Contribuinte | CPI | Jornalista | Bancada | Escândalo do Áudio / Escândalo da Planilha | Assessor | Relator |
| `lagos-power` | Generator Room | Commuter / Shopkeeper | Grid Inspector | Radio Investigator | Generator Cartel | Prophet / Reality Star | Stand-in | Talent Agent |
| `bollywood-studio` | File Queue | Tenant / Film Extra | Municipal Inspector | Investigative Reporter | Builder Lobby | Viral Auntie A / Viral Auntie B | Body Double | Agent |
| `tokyo-black-company` | Lost & Found | Salaryperson / Convenience Clerk | Compliance Officer | Anonymous Reviewer | Black Company Mentor | Quiet Quitter A / Quiet Quitter B | Temp | HR Manager |
| `telenovela-studio` | Camerino | Vecina / Camarógrafo | Director | Chismosa | Villano Enmascarado | Ex A / Ex B | Impostor de Máscara | Productor |
| `suburbia-hoa` | Complaint Box | Resident / Delivery Driver | Code Inspector | Neighborhood Watch | HOA Board | Pink Flamingo / Plastic Flamingo | Gig Worker | Realtor |
| `paris-cafe` | Strike Notice Board | Barista / Commuter | Union Steward | Investigative Reporter | Lobbyist | Coffee Influencer A / Coffee Influencer B | Stagiaire | Critic |

Editorial flags to resolve in the theme bible, before art or audio:

- `folclore-br`: review the use of “Caboclo,” Indigenous-derived figures, and
  the Boto story with a Brazilian folklore specialist. Replace any identity term
  used as a punchline.
- `rio-satira`: this is the highest-risk pack. Avoid equating favela residents
  with crime or making light of real violence. A Rio-based sensitivity review is
  a publication gate.
- `brasilia`: keep roles fictional and systemic; do not imply allegations about
  identifiable living people.
- `lagos-power`: the recovered “419 Kings/Yahoo Boy” framing leans on a global
  stereotype and has been replaced here with institutional power/infrastructure
  satire. Nigerian editorial review is required.
- `bollywood-studio`: distinguish cinema satire from claims about Indian people
  generally; review language and cultural references locally.
- `tokyo-black-company`: target labor exploitation, not Japanese workers.
- `telenovela-studio`: choose whether this is a fictional pan-Latin studio or a
  specific locale; do not mix regional Spanish carelessly.

Each pack bible file must include: premise, target of satire, explicit red lines,
full cast, center terminology, team names, all role copy, rules copy,
approximately 98-second narration script by fixed beat, palette, art direction,
audio direction, pronunciation notes, alt text, locale, reviewer/status, and
asset checklist.

## 8. Implementation sequence

### Phase 0 — Baseline and content audit

- Record current Monstros screenshots for home, lobby, every night action,
  discussion, vote, and results.
- Add characterization tests around role mechanics, room views, timeline
  visibility, scoring, and restart behavior before moving data.
- Inventory hardcoded copy in phase components, role/card helpers, voice UI,
  PWA prompts, offline screen, share messages, manifest/layout, and API errors.
- Classify each string as mechanical/internal, generic UI locale, or theme copy.
- Approve the contract and the 10-pack catalog before implementation.

Gate: a reviewed copy inventory and green baseline `test`, `lint`, and `build`.

### Phase 1 — Engine/content seam and Monstros extraction

- Add `lib/game/mechanics.ts`; move mechanical team and action facts out of
  `ROLES`.
- Reduce `lib/game/timeline.ts` to shared windows, beats, grace period, and total
  duration. Move narration text/subtitles/audio path into `monstros`.
- Add `ThemePack`, the registry, validation, and `monstros` pack.
- Namespace Monstros assets under `/themes/monstros/`, with compatibility or a
  coordinated service-worker cache bump.
- Add the theme provider and make cards, center labels, narration, ambience,
  results, rules, sharing, and voice labels consume it.
- Add a small `pt-BR` generic UI catalog; do not introduce a third-party i18n
  framework.
- Change runtime CSS to semantic custom properties while preserving the current
  Monstros rendering.

Gate: Monstros behavior, screenshots, timing, and text are equivalent; the game
engine has zero imports from `lib/themes`.

### Phase 2 — Persistence and creation selection

- Apply the additive `theme_id` migration and update the Room/RoomView types.
- Default old rooms to `monstros` and validate the selected theme in the room
  creation API.
- Add the creation picker with pack preview, current selection, loading/error
  state, and a clear “theme cannot change after creation” message.
- Persist the theme in the initial room row so every connected player receives
  the same pack on their first view.
- Make the ambient singleton switch/fade tracks when the theme changes.
- Key narration availability by audio URL instead of one global boolean; use the
  active pack locale for TTS fallback.
- Migrate local preference keys without losing existing nickname, identity,
  dismissed prompts, or sound choice.
- Make the service worker runtime-cache `/themes/` assets; precache only shell
  assets and the deployment default pack.

Gate: host/non-host and lobby/in-game authorization tests pass; two clients stay
on the same theme; refresh/restart/rejoin preserve it; invalid IDs cannot resolve
paths or enter persisted state.

### Phase 3 — Brazilian proof packs

- Finish `folclore-br` and `rio-satira` bible files and editorial reviews.
- Add complete copy, semantic palette, logo, card back, nine role-art assets,
  ambient loop, narration recording, captions, and TTS fallback for each.
- Keep packs `draft` until there are no placeholders and all validation passes.
- Test all nine role reveals/actions and result combinations in both packs, not
  only the home/lobby.
- Run mobile network/performance checks; only the active pack should download.

Gate: both packs are production-complete, culturally reviewed, accessible, and
playable through a full match on at least iOS Safari/PWA and Android Chrome.

### Phase 4 — White-label deployment support

- Generate root metadata, manifest, icons, default palette, home copy, and
  social cards from `DEFAULT_THEME_ID`.
- Support an allowlist and optional locked single-pack deployment without
  branching the repository.
- Neutralize internal user-facing `monstros` labels. Internal LiveKit room-name
  prefixes may remain stable until a safe neutral migration is justified.
- Document how to deploy one domain per pack and how shared/global player stats
  behave.

Gate: two preview deployments from the same commit present different default
brands without code changes and can still use the shared engine/API correctly.

### Phase 5 — Worldwide content-only packs

- Add the required generic shell locale before a pack in that locale ships.
- Complete one pack at a time through bible, review, art, audio, validation, and
  full-match QA.
- Do not batch-publish unreviewed cultural satire.
- A normal new pack after this point should require content/assets and registry
  registration only—no engine, API, or phase-component changes.

Gate: adding a fixture pack in a test changes no file under `lib/game`, `app/api`,
or `components/phases`.

## 9. Verification matrix

Automated:

- Existing engine and view suites remain green.
- Mechanical results are identical for every theme ID.
- Registry rejects incomplete, duplicate, unsafe, or unpublished packs.
- Every published asset exists and every role/team/copy key is complete.
- Audio/caption duration and cue-bound checks pass.
- Room creation defaults correctly; only host+lobby can update; invalid ID and
  post-start changes fail; restart retains theme.
- `RoomView.themeId` is present without exposing additional secret game state.
- Theme switches do not alter `GameState`, votes, roles, or career scoring.

Visual/manual:

- No flash of unthemed content beyond the documented deployment-default loading
  state.
- Palette contrast, focus states, reduced motion, alt text, and long role names
  work at narrow mobile widths.
- Audio starts, pauses, resumes, seeks to server time, falls back to correct-locale
  TTS, and changes source after a lobby theme switch.
- Voice-chat titles and private-pack wording use the active theme without
  changing LiveKit authorization.
- Offline shell works; previously visited active-pack assets are available;
  unrelated packs are not eagerly cached.
- Share copy, PWA metadata, home branding, and room branding follow the documented
  default-vs-active distinction.

Release checks for each phase: `npm test`, `npm run lint`, `npm run build`, plus a
full game with multiple browser identities.

## 10. Asset and editorial definition of done

A pack cannot be `published` until it has:

- One transparent logo, one card back, and nine original role images with a
  consistent crop. Current source art is 1024×1024; new art should use the same
  source canvas unless the renderer is deliberately changed.
- Descriptive alt text and no embedded third-party marks.
- One narration recording matching the fixed windows, synchronized captions,
  pronunciation notes, and verified TTS fallback copy.
- One loop-safe ambient track with documented source/license and a volume that
  does not compete with voice chat.
- A semantic palette with verified contrast and no theme-specific CSS selectors
  required for ordinary rendering.
- Complete pack bible, satire red lines, editorial owner/reviewer, and approval
  date.
- A size report. The production client must lazy-load only the active pack;
  asset budgets should be set after measuring the Monstros baseline rather than
  silently multiplying its current footprint by 11.

## 11. Explicit non-goals

- New roles, action kinds, teams, deck math, night order, or win conditions.
- Per-theme server engines or database tables.
- A fork per theme.
- A full localization framework in the first Brazilian proof.
- User-authored/uploaded theme packs.
- Physical deck production.
- A radically different non-pixel shell. If needed later, it should consume a
  versioned shared game contract instead of copying the rules.

## 12. Review checklist before Phase 0 begins

- [ ] Confirm 10 new packs + Monstros is the intended catalog count.
- [ ] Approve keeping legacy role/team IDs as internal protocol keys.
- [ ] Approve global career wins across themes for version 1.
- [ ] Approve deployment-default PWA branding versus room-active branding.
- [ ] Review or replace all provisional cast names and pack IDs.
- [ ] Name editorial/cultural reviewers for the two Brazilian proof packs.
- [ ] Decide whether placeholder proof packs are available only locally/preview
      or visible in production before final art/audio.
- [ ] Approve the five-phase delivery order and gates.
