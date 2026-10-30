# Help Desk, Built Like Linear

A design + architecture guide for **Project 46 — Help Desk System** that looks and feels like a modern SaaS product (Linear, Height, Vercel dashboard) instead of a college CRUD project.

Stack you picked: **MERN + JWT**. This guide keeps that, and fixes the two things that make MERN projects look amateur: **default Bootstrap-ish styling** and **page-per-CRUD-operation architecture**.

---

## 0. The one-paragraph answer

A help desk is structurally the *same product* as an issue tracker. Linear is an issue tracker. So don't invent a UI — **rename Linear's primitives** (Issue → Ticket, Comment → Reply, Cycle → SLA, Project → Category, View → Queue filter) and copy its visual discipline: near-black layered surfaces, 1px hairlines instead of shadows, 13px type, one muted indigo accent, 36px list rows, `⌘K` command palette, and 150ms motion. Then add the three things a help desk needs that Linear doesn't have: **requester vs agent roles**, **"Waiting on user" status**, and **internal-only notes**.

---

## 1. What actually makes Linear feel like Linear

Six pillars. Miss any one and it reads as "a dashboard template."

### 1.1 Chrome-less density
- No cards inside cards. No double borders. No drop shadows on containers.
- Structure comes from **1px hairlines** (`rgba(255,255,255,0.06–0.08)`) and whitespace.
- List rows are **36–40px** tall. Body text is **13px**, meta is **12px**, page titles **15–16px**. Nothing is 16px except maybe a marketing headline.
- The app fills the viewport. No centered `max-w-7xl` container with 80px side padding inside the app shell.

### 1.2 One accent, used sparingly
- Canvas is near-monochrome. A **single indigo** (`#5E6AD2`) for primary buttons, focus rings, active states, selected rows.
- Status is communicated by a **6px dot + 10%-opacity tinted background**, never a saturated pill. This alone separates you from every Bootstrap ticket system.
- Color count discipline: 1 accent + 4 status hues (amber / blue / green / grey) + 1 danger red. That's it.

### 1.3 Keyboard-first (the highest-leverage detail)
This is the #1 thing that makes a demo feel like real SaaS.
- `⌘K` command palette (navigation + actions + search).
- Single-key actions on a focused list: `J`/`K` move, `Enter` open, `C` create, `A` assign, `P` priority, `E` edit.
- `G` then `Q` = go to queue, `G` then `K` = knowledge base.
- `⌘Enter` submits the ticket composer.
- Every list is arrow-key navigable and shows a visible focus ring.

### 1.4 Motion as feedback, never decoration
- **120–180ms**, `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo-ish). Only `opacity` and `transform`.
- Popovers scale from `0.97 → 1` with a fade. Palettes fade + rise 4px.
- No slides across the screen, no bounce, no long fades, no skeleton shimmer longer than ~600ms.
- Respect `prefers-reduced-motion`.

### 1.5 Perceived speed
- Optimistic mutations (assign, status change, reply) — update the cache, reconcile after the response.
- Skeletons for first load only; mutations never show a spinner, they show the new state.
- Hover a ticket row → prefetch its detail.
- Loading state = a 2px indeterminate bar at the top of the content area, not a full-page spinner.

### 1.6 Typographic discipline
- **Inter** (variable). Base `13px / 20px`, tracking `-0.01em`.
- `tabular-nums` for counts, IDs, dates, SLA timers.
- Weights: `400` body, `500` titles and buttons, `600` rare (page title).
- Section labels: `11px`, uppercase, `500`, `letter-spacing: 0.04em`, muted color.
- IDs (`HD-1042`) in a mono stack (`ui-monospace, "SF Mono", Menlo`).
- Icons: Lucide at **16px, strokeWidth 1.5**, muted by default, brightening on hover.

---

## 2. The mapping: Linear → Help Desk

Decide these names once and use them everywhere (DB, API, UI copy).

| Linear | Your app | Notes |
|---|---|---|
| Issue | **Ticket** | `HD-1042` human key, `_id` in URLs |
| Workflow state | **Ticket status** | `open → in_progress → waiting_on_user → resolved → closed` |
| Comment | **Reply** | `isInternal: true` = agent-only note (amber tint) |
| Project | **Category** | Hardware / Software / Network / Access |
| Label | **Tag** | free-form, normalized lowercase |
| Cycle | **SLA window** | derived from priority, not manual |
| Assignee | **Assignee (agent)** | only `agent`/`admin` roles |
| View | **Queue view** | saved filter: My tickets, Unassigned, Breaching SLA |
| Inbox | **Agent inbox** | new tickets + replies on your tickets |
| Sub-issue | **Checklist** | optional, on the ticket detail page |

**Do not** call it "Issue." Requester-facing language must be human: "Your ticket has been resolved," not "Issue transitioned to Done."

### Status semantics (important for a help desk)

| Status | Meaning | Who acts next |
|---|---|---|
| `open` | New, unclaimed | IT |
| `in_progress` | Agent working | IT |
| `waiting_on_user` | Agent needs info | **Employee** ← Linear has no equivalent; this is your differentiator |
| `resolved` | Fix delivered, awaiting confirm | Employee (or auto-close) |
| `closed` | Done | nobody |

Show a **"Waiting on you"** counter on the employee dashboard. That's the core loop of a real help desk.

---

## 3. Database: how to decide (you asked)

| Option | Best for | Cost | Trade-off |
|---|---|---|---|
| **Local MongoDB (Docker)** | daily development | free | needs Docker running |
| **Local MongoDB (Homebrew)** | daily development | free | pollutes host, version drift |
| **Atlas free M0** | deployment + demo links | free | 500 connections, needs internet, ~150ms latency from a laptop |
| `mongodb-memory-server` | automated tests only | free | **data vanishes on restart — never use it for your demo** |

**Recommendation: both, in this order.**
1. Develop against local Docker (instant, offline).
2. Deploy against Atlas M0 (same code, different `MONGO_URI`).

```bash
# local dev, one command, data persists in a named volume
docker run -d --name helpdesk-mongo -p 27017:27017 \
  -v helpdesk-mongo:/data/db mongo:7
```

```env
# server/.env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/helpdesk
JWT_ACCESS_SECRET=change-me-64-chars
JWT_REFRESH_SECRET=change-me-too
ACCESS_TTL=15m
REFRESH_TTL=7d
CLIENT_ORIGIN=http://localhost:5173
```

Atlas later: create M0 → add `0.0.0.0/0` for the demo → paste the `mongodb+srv://` string, appending `/helpdesk`. Never commit `.env`.

---

## 4. Data model

Four collections. Keep documents flat; no deep nesting of replies inside tickets (that's how you get 16MB limits and painful pagination).

### `users`
```js
{
  _id, name, email,            // email unique, lowercased
  passwordHash,                // bcrypt, cost 12
  role: 'employee' | 'agent' | 'admin',
  department,                  // e.g. 'Engineering'
  title,                       // job title, shown on tickets
  avatarColor,                 // deterministic from name, for the letter-avatar
  isActive: true,
  lastLoginAt, createdAt, updatedAt
}
```

### `tickets`
```js
{
  _id,
  key: 'HD-1042',              // sequential per workspace, from a counters doc
  title,                       // <= 140 chars
  description,                 // markdown
  status,                      // open | in_progress | waiting_on_user | resolved | closed
  priority,                    // none | low | medium | high | urgent
  category,                    // hardware | software | network | access | other
  tags: ['vpn'],
  requesterId,                 // ref users
  assigneeId,                  // ref users | null
  slaFirstResponseDueAt,       // Date
  slaResolveDueAt,             // Date
  firstResponseAt, resolvedAt, closedAt,
  replyCount,                  // denormalized for list rendering
  lastActivityAt,              // denormalized, drives sorting + "updated 3h ago"
  attachments: [{ name, url, size, mime }],
  createdAt, updatedAt
}
```

### `replies`
```js
{
  _id, ticketId, authorId,
  body,                        // markdown
  isInternal: false,           // agent-only note
  attachments: [],
  createdAt, editedAt
}
```

### `knowledge_base`
```js
{
  _id, title, slug,            // slug unique
  body,                        // markdown
  category, tags: [],
  authorId, isPublished: true,
  views, helpfulCount, notHelpfulCount,
  createdAt, updatedAt
}
```

### Indexes (do this on day one, not day nine)
```js
tickets.index({ status: 1, lastActivityAt: -1 })
tickets.index({ assigneeId: 1, status: 1 })
tickets.index({ requesterId: 1, createdAt: -1 })
tickets.index({ key: 1 }, { unique: true })
tickets.index({ title: 'text', description: 'text' })
replies.index({ ticketId: 1, createdAt: 1 })
kb.index({ slug: 1 }, { unique: true })
kb.index({ title: 'text', body: 'text' })
```

**Denormalize deliberately:** `replyCount` and `lastActivityAt` on the ticket. The queue is the most-rendered screen in the app; it should never need a `$lookup` to draw a row.

### Sequential keys
`counters` collection: `{ _id: 'ticket', seq: 1042 }` with `findOneAndUpdate({_id:'ticket'}, {$inc:{seq:1}}, {upsert:true, new:true})`. `HD-${seq}`. Human keys make the product feel real; ObjectIds in the URL bar do not.

---

## 5. API design

Keep the spec in the assignment, add what a real client needs.

| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/login` | public | `{email, password}` → `{accessToken, user}` + httpOnly refresh cookie |
| POST | `/api/auth/refresh` | cookie | rotate refresh token |
| POST | `/api/auth/logout` | user | clear cookie |
| GET | `/api/auth/me` | user | rehydrate session on reload |
| GET | `/api/tickets` | user | `?status=&priority=&category=&assigneeId=&q=&view=&cursor=&limit=` |
| POST | `/api/tickets` | employee+ | creates ticket, auto-computes SLA, returns `key` |
| GET | `/api/tickets/:id` | owner or agent | by `_id` **or** `key` |
| PUT | `/api/tickets/:id` | owner (title/desc) or agent (all) | field-level authorization |
| DELETE | `/api/tickets/:id` | owner if still `open`, or admin | soft-delete preferred (`deletedAt`) |
| POST | `/api/tickets/:id/replies` | owner or agent | `{body, isInternal}`; `isInternal` rejected for employees |
| PUT | `/api/tickets/:id/assign` | agent/admin | `{assigneeId}`; sets `in_progress`, notifies |
| PUT | `/api/tickets/:id/status` | agent/admin | (add this — don't overload PUT) |
| GET | `/api/tickets/:id/replies` | owner or agent | paginated |
| GET | `/api/tickets/stats` | agent/admin | dashboard aggregates |
| GET | `/api/knowledge-base` | public-ish | `?q=&category=&page=` |
| POST | `/api/knowledge-base` | agent/admin | publish article |
| GET | `/api/knowledge-base/:slug` | user | increments `views` |
| POST | `/api/knowledge-base/:slug/vote` | user | helpful / not |

### Conventions
- **One error envelope, always:** `{ error: { code: 'TICKET_NOT_FOUND', message: 'Human readable.' } }`. The client renders `message`; code exists for branching and tests.
- **Cursor pagination**, not `page=N`: `{ data: [...], nextCursor: '...' }`. Infinite scroll in the queue, "Load more" in replies.
- **Filtering is server-side.** Once you have 200 tickets, client-side filtering is the thing that breaks the demo.
- **Validation at the edge:** `zod` schema shared by route handler and (optionally) the client form.
- **Authorization is middleware, not `if` statements in handlers:** `requireRole('agent')`, `canAccessTicket(req.user, ticket)`.
- Status/assignee changes also append a system reply (`type: 'system'`) so the activity feed tells the story: *"Priya assigned this to Arjun · 2h ago."*

### JWT shape (short version)
- Access token, 15 min, in memory on the client (React state) — **not** localStorage.
- Refresh token, 7 days, `httpOnly; Secure; SameSite=Lax` cookie, path `/api/auth`.
- `requireAuth` reads `Authorization: Bearer`, verifies, loads `{ id, role }`.
- Axios interceptor: on 401 → call `/refresh` once → retry original request → else redirect to login. Queue concurrent 401s so you don't fire ten refreshes.

> If this is a college project and refresh tokens feel like overkill: still do the httpOnly cookie for the access token and skip rotation. Do not put a 7-day JWT in `localStorage`.

---

## 6. Frontend architecture

```
client/src
├─ app/            providers, router, query client
├─ components/
│  ├─ ui/          Button, Input, Select, Dialog, Popover, Tooltip, Badge, Avatar,
│  │               Skeleton, Toast, CommandPalette, DataTable  (shadcn/Radix based)
│  └─ tickets/     TicketRow, StatusDot, PriorityIcon, ReplyThread, PropertySidebar
├─ features/
│  ├─ auth/  tickets/  queue/  kb/  reports/
│  └─ (each: api.ts, hooks.ts, components/, types.ts)
├─ layouts/        AppShell, Sidebar, Topbar, AuthLayout
├─ lib/            api client, query client, dates, permissions, shortcuts
└─ styles/         tokens.css, globals.css
```

| Concern | Choice | Why |
|---|---|---|
| Build | Vite + React + TypeScript | fast, and types keep a 4-collection model sane |
| Styling | Tailwind v4 (`@theme` tokens) | tokens live in CSS, shadcn-compatible |
| Primitives | shadcn/ui (Radix) | you need accessible Popover/Dialog/Command — build-from-scratch eats days |
| Icons | lucide-react, 16px, `strokeWidth={1.5}` | matches Linear's line weight |
| Server state | TanStack Query | optimistic updates, cache invalidation, prefetch |
| Client state | Zustand | palette open, selected row, sidebar collapsed. Nothing else belongs here |
| Routing | react-router (`createBrowserRouter`) | nested layouts: `/login`, `/app/...` |
| Forms | react-hook-form + zod | pair with the server schema |
| Markdown | react-markdown + remark-gfm | ticket bodies + KB |
| Dates | date-fns + `formatDistanceToNowStrict` | "3h ago", tabular numbers |
| Charts | Recharts, restyled | thin strokes, no gridline clutter |
| Drag & drop | dnd-kit (only if you ship the board view) | |
| Command palette | cmdk | |

### App shell

```
┌───────────────┬──────────────────────────────────────────────┐
│ 220px sidebar │  44px topbar: breadcrumb · actions · ⌘K      │
│               ├──────────────────────────────────────────────┤
│ ⌘K Search     │                                              │
│ Inbox      3  │   content, full-bleed, 24px gutters          │
│ My tickets    │                                              │
│ ── Workspace  │                                              │
│ Queue         │                                              │
│ Knowledge     │                                              │
│ Reports       │                                              │
│               │                                              │
│ ──            │                                              │
│ ◉ Parth ▾     │                                              │
└───────────────┴──────────────────────────────────────────────┘
```

- Sidebar: `220px`, collapses to `48px` icon rail. Background one step lighter than content.
- Sidebar item: `height: 28px`, `padding: 0 8px`, `border-radius: 6px`, hover `rgba(255,255,255,0.04)`, active `rgba(255,255,255,0.06)` + full-opacity text. Counts right-aligned, `12px`, `tabular-nums`, muted.
- **Two nav variants by role.** Employee: Inbox, My tickets, Knowledge base, New ticket. Agent: Inbox, My tickets, Queue, Reports, Knowledge base. Same shell, different items — not two apps.
- Topbar shows a breadcrumb (`Queue / HD-1042`), the primary action for that page, and the `⌘K` hint pill.

---

## 7. Design tokens (paste this, then tune)

```css
@theme {
  /* surfaces — layered, near-black, barely distinguishable on purpose */
  --color-bg:            #08090A;
  --color-surface:       #0D0E10;
  --color-surface-2:     #131416;
  --color-surface-3:     #17181B;
  --color-border:        rgba(255,255,255,0.07);
  --color-border-strong: rgba(255,255,255,0.12);

  /* text */
  --color-text:          #F7F8F8;
  --color-text-muted:    #8A8F98;
  --color-text-subtle:   #62666D;

  /* one accent */
  --color-accent:        #5E6AD2;
  --color-accent-hover:  #6E79DB;
  --color-accent-soft:   rgba(94,106,210,0.12);

  /* status — dot color + soft background */
  --color-status-open:      #8A8F98;
  --color-status-progress:  #F2C94C;
  --color-status-waiting:   #4EA7FC;
  --color-status-resolved:  #4CB782;
  --color-status-closed:    #62666D;
  --color-danger:           #EB5757;
  --color-warning:          #F2C94C;
  --color-success:          #4CB782;

  /* type */
  --font-sans: "Inter Variable", Inter, -apple-system, system-ui, sans-serif;
  --font-mono: ui-monospace, "SF Mono", Menlo, monospace;
  --text-xs: 11px; --text-sm: 12px; --text-base: 13px;
  --text-md: 14px; --text-lg: 16px; --text-xl: 20px;

  /* geometry */
  --radius-sm: 4px; --radius: 6px; --radius-lg: 8px;

  /* elevation — almost none; dialogs only */
  --shadow-pop: 0 8px 24px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.07);
  --shadow-dialog: 0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08);

  /* motion */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --dur-fast: 120ms; --dur: 160ms; --dur-slow: 220ms;
}
```

Fifteen more details that make it land:

1. Focus ring: `outline: 2px solid var(--color-accent); outline-offset: 2px` — visible on **every** interactive element.
2. Text selection: accent at 30% opacity, normal text color.
3. Thin dark scrollbars (`scrollbar-width: thin`, custom `::-webkit-scrollbar` 8px).
4. `font-variant-numeric: tabular-nums` on any column of numbers.
5. Row hover: `background: rgba(255,255,255,0.03)`; selected row: `var(--color-accent-soft)` + 2px accent bar on the left.
6. Status dot: `6px`, `border-radius: 50%`, plus a 10%-opacity rounded background 18px wide when used as a pill.
7. Priority: line icons (Urgent = red filled bar, High = 3 bars, Med = 2, Low = 1, None = dashed) — bars beat arrows and look intentional.
8. Avatar: 20px circle, deterministic pastel from name hash, initials at `10px/500`.
9. Empty states: 32px muted icon, one-line headline at 13px `500`, one sentence at 13px muted, one primary action. Never a sad-face illustration.
10. Toasts: bottom-right, 320px, surface-3, 1px border, no shadow, auto-dismiss 4s, single `Undo` action where relevant.
11. Dialogs: `--shadow-dialog`, 8px radius, 480px wide, backdrop `rgba(0,0,0,0.5)` + `backdrop-filter: blur(2px)`.
12. Keyboard hint chips: `11px` mono, `1px` border, 4px radius, 16px height.
13. Login glow: `radial-gradient(600px 300px at 50% -10%, rgba(94,106,210,0.16), transparent 70%)` over `--color-bg`.
14. Light theme later: invert surfaces to `#FFFFFF / #FAFAFA`, borders to `rgba(0,0,0,0.08)`. Build tokens so this is a 20-line change, not a rewrite.
15. `document.title` = `HD-1042 · Printer offline` so screenshots and tabs look real.

---

## 8. Page-by-page spec

### 1. Login
Centered column, `360px`, on `--color-bg` with the radial glow. Brand mark (24px) → "Sign in to Tasu" at 16px/600 → subtitle 13px muted. Email + password, 32px tall inputs, full-width accent button "Sign in", `⏎` hint inside it. Inline error `12px` red under the field, never an alert(). Footer: "Demo accounts" pill showing employee / agent credentials — because you will demo this live and the reviewer must be able to log in.
*Pattern:* no sidebar, no nav, no marketing copy. Linear's auth is one column and one action.

### 2. Employee Dashboard
`/app` — one screen, no scroll at 1440×900.
- Greeting row: "Good afternoon, Parth" 16px/500 + date muted right.
- Three stat tiles, `1px` border, 12px padding, no shadow: **Open** (count), **Waiting on you** (count, accent-tinted when > 0), **Resolved this month**.
- **"Needs your attention"** list: tickets in `waiting_on_user` or `resolved`-awaiting-confirm. 4 rows max, ticket-row component reused.
- Two-column bottom: "Recent activity" (system feed) + "Suggested articles" (3 KB links by keyword match on your last ticket categories).
- Primary action top-right: **New ticket** (`C`).

### 3. Create Ticket
Dedicated route `/app/tickets/new`, not a modal — it's the deepest form in the app.
- Layout: 680px main column + 280px property rail.
- Title: borderless input, 20px/500, placeholder "What's going wrong?". Focus ring on the container only.
- Property rail: inline pill selectors for **Category**, **Priority**, **Attachments**. Each pill = label + value, 24px tall, opens a Popover.
- Description: markdown editor (textarea + `Write / Preview` tabs), min-height 180px, monospace-free prose at 13px/20px.
- While typing the title, show a **"Related articles"** strip under it (client-side filter of KB titles — no AI needed, still feels smart). One click inserts the link into the description.
- Sticky footer: `Cancel` (ghost) · `Create ticket` (accent) with `⌘⏎` chip. On success → navigate to the ticket, toast "HD-1043 created".

### 4. My Tickets
- Topbar: title "My tickets" + count, then filter chips (`All · Open · Waiting · Resolved`) and a `Search` icon that focuses the search input (`/`).
- Grouped list: section header (`OPEN · 3`) as an 11px uppercase sticky label, rows underneath.
- Row, 40px: status dot · mono key (`HD-1042`, muted) · title (13px/500, truncate) · category icon · priority bars · relative time right-aligned.
- Selected row shows the accent-soft background; `J`/`K` moves selection, `Enter` opens.
- Empty state: "No tickets yet. Something broken? Create a ticket." + button.

### 5. Ticket Details — the money screen
- Topbar: `← My tickets` + mono key + status pill + right-side actions (`Assign`, `⋯`).
- **Main column (flex-1, max 760px):**
  - Title 20px/600, editable inline on click.
  - Requester line: avatar + name + department + "opened 2h ago" (12px muted).
  - Description rendered markdown in a bordered block.
  - Activity: replies interleaved with system events ("Priya changed status to Waiting on user"). Reply = avatar + name + time + markdown body; **internal notes** get an amber left bar + `Internal` chip.
  - Composer at the bottom, sticky: 3-row textarea, `Reply` primary + `Note` toggle for agents. `⌘⏎` sends. Optimistic append.
- **Right rail (280px, sticky):** a `PropertyRow` list — Status, Assignee, Priority, Category, Tags, Requester, SLA (countdown, red when < 2h), Created. Each opens a Popover with a searchable select. This component is reused on the create page.
- For agents, show a **"Resolve"** primary button and a **suggested-article** block ("This looks like: VPN drops after sleep") — instead of AI, do keyword overlap with KB titles/tags; label it clearly.

### 6. IT Dashboard
Triage, not analytics.
- Row 1, four stats: **Unassigned** (count, links to filtered queue), **Breaching SLA** (red if > 0), **Avg first response** (h), **Resolved today**.
- Row 2: workload per agent — avatar, name, horizontal bar (open tickets / max), count. Sorted desc. Makes "who's drowning" obvious in one glance.
- Row 3: 7-day volume area chart (single accent line, `rgba` fill to transparent, no gridlines except 3 horizontal hairlines) + "Oldest unassigned" list (3 rows).

### 7. Ticket Queue
- **Views** as tabs above the list: `All · Unassigned · Mine · Breaching · Waiting on user`. These are just query params — implement them as real links so they're shareable.
- Filter bar: status, priority, category, assignee, search. Filters live in the URL (`?status=open&assignee=me`) so refresh preserves state. Reviewers notice this.
- Table view (default) with checkbox column; bulk bar slides up from the bottom when rows are selected: `3 selected · Assign ▾ · Priority ▾ · Close`.
- Optional toggle to **Board** (columns by status, dnd-kit). Ship it only after the table is perfect.
- Row is identical to My Tickets → reuse the component with a `showRequester` prop.

### 8. Knowledge Base
- Two-pane: left `240px` category tree + search; right article list (`title`, category, `read 2m`, views).
- Article view: reading column `max-width: 680px`, 14px/24px for body (KB reads better slightly larger than app UI), sticky TOC on the right for long articles, `Was this helpful? 👍 👎` at the bottom.
- Agents get an `Edit` button and "New article". Employees get read-only.
- Search: `⌘K` searches tickets + KB across scopes; on the KB page, `/` scopes to articles.

### 9. Reports
- Filter bar: date range (`7d / 30d / 90d / custom`) + category.
- Grid of 4 charts + 1 table:
  1. Tickets created vs resolved (2-line area, accent + green).
  2. By category (horizontal bars, sorted).
  3. By priority (stacked horizontal single bar — compact, Linear-ish).
  4. SLA compliance (big single number `94%` at 28px/600 + delta chip vs previous period). Numbers beat donuts.
  5. Table: top 10 KB articles by views, with a "no article found for" hint from tag frequency.
- Export CSV button (agents only) — 20 lines of code, big credibility.
- Do the aggregation server-side (`$facet` in one request) so the page loads in one round trip.

---

## 9. Motion & interaction table

| Interaction | Property | Duration | Easing |
|---|---|---|---|
| Row hover background | background-color | 120ms | ease-out |
| Popover / dropdown | opacity + scale(0.97→1) | 140ms | `--ease-out` |
| Command palette | opacity + translateY(4px→0) | 160ms | `--ease-out` |
| Dialog | opacity + scale(0.98→1) | 180ms | `--ease-out` |
| Row status dot change | background-color | 160ms | ease-out |
| Checkbox / avatar fill | background-color | 120ms | ease |
| Sidebar collapse | width | 200ms | `--ease-out` |
| Toast | translateY(8px→0) + opacity | 180ms | `--ease-out` |
| List item enter (optimistic) | `@starting-style` opacity | 160ms | ease-out |

Rules: never animate `height`/`width` except the sidebar; never animate more than 2 properties at once; nothing over 250ms.

---

## 10. Build order (≈8–9 focused days)

| Phase | Work | Done when |
|---|---|---|
| 0 · 2h | Vite + TS + Tailwind + shadcn init, tokens.css, folder skeleton, Docker Mongo, Mongoose connect, health route | `GET /api/health` returns ok, tokens visible on a test page |
| 1 · 1d | App shell: sidebar, topbar, breadcrumb, route skeleton for all 9 pages with empty states | You can click every nav item and see a real (empty) page |
| 2 · 0.5d | Auth: model, bcrypt, login/refresh/me, JWT verify, protected routes, role guard, login page | Employee and agent land on different navs; refresh keeps you logged in |
| 3 · 2d | Tickets: model + counters + SLA, CRUD routes, list + create + detail pages, reply thread | Full loop: create → view → reply → status change |
| 4 · 1d | Agent features: assign, status transitions, system activity feed, queue views with URL filters, bulk actions | `?view=unassigned` is shareable; assignment notifies |
| 5 · 1d | Knowledge base: CRUD, search, article view, helpful votes, "related articles" strip on create | Search returns an article you wrote |
| 6 · 1d | Dashboards + reports: stats endpoints, charts, workload, SLA compliance | Numbers match a manual `countDocuments` check |
| 7 · 1.5d | Polish: `⌘K` palette, J/K nav, toasts, skeletons, empty states, seed script, favicon/title, deploy | A stranger can use it for 3 minutes without instructions |

**Phase 7 is not optional.** It is the entire difference between "MERN project" and "SaaS product." Budget it.

### Seed data
Write `server/seed.js` with: 6 users (1 admin, 2 agents, 3 employees), ~40 tickets spread over 30 days with a realistic mix of statuses/priorities/categories, ~90 replies, 12 KB articles. Name them plausibly (`"VPN disconnects every 10 minutes"`, `"Adobe license expired"`, `"Cannot access staging DB"`). An empty app never looks good; a full one looks finished. Make `npm run seed` re-runnable.

---

## 11. Anti-patterns — what makes it look like a college project

1. **Colored status badges** (solid blue/green pills). → dot + 10% tint background.
2. **`border-radius: 16px` cards with `box-shadow: 0 4px 12px`.** → 6px radius, hairline border, no shadow.
3. **16px body text everywhere.** → 13px. Density is the aesthetic.
4. **Centered `max-w-7xl` page with big padding.** → full-bleed app shell + fixed sidebar.
5. **`#007BFF` links and default blue focus outlines.** → one accent, custom rings.
6. **Page-per-CRUD** (`/tickets/:id/edit` as a separate screen). → inline edit + popovers.
7. **Full-page spinner** between routes. → skeletons, or nothing (cache).
8. **`window.confirm()` for delete.** → Popover with `Delete` in danger color.
9. **Emoji as UI icons.** → Lucide 16px.
10. **A settings page with 40 toggle switches before anything works.** → build the loop first.
11. **Client-side filtering of a fetched list.** → query params, server filter.
12. **`alert()` on errors.** → inline field errors + toast.
13. **Sidebar with 12 top-level items.** → max 6, grouped under one label.
14. **Tables with `border-collapse` 1px grids on every cell.** → horizontal hairlines only (or none; row hover is enough).
15. **Inconsistent spacing** (13px here, 17px there). → 4px scale only: 4, 8, 12, 16, 24, 32.

---

## 12. Definition of done (screenshot test)

Take a screenshot of the ticket detail page. Does it look like it belongs in the same product family as Linear, Height, or the Vercel dashboard? Then check:

- [ ] Every page renders with **zero** data and still looks intentional
- [ ] Tab through login → dashboard → ticket → reply with the keyboard only
- [ ] `⌘K` opens from every page and navigates
- [ ] Assign a ticket: UI updates in <100ms, persists after refresh
- [ ] Employee cannot see internal notes or the Queue nav
- [ ] A 390px-wide viewport shows a usable stacked layout (sidebar → drawer)
- [ ] Lighthouse: no layout shift on first paint; fonts preloaded with `font-display: swap`
- [ ] Dark mode at `#08090A` on an OLED laptop doesn't look muddy — check your border opacity by eye, not by spec

---

## 13. Next step

The highest-risk unknowns, in order: **the ticket-detail layout**, **the design tokens in practice**, and **role-based nav**. Everything else is CRUD.

If you want, I can now:
- scaffold Phase 0–1 (Vite shell + tokens + all 9 routes with empty states) so you have something to look at, or
- write the full Express route handlers + Mongoose models first, or
- generate the seed script so every page looks alive from the first run.
