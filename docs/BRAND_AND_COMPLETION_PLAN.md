# Skill-High Brand and Completion Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` to implement this plan task by task. One Luna xhigh builder executes it; the parent owns assets, browser review, commits, and push. Local implementation is already authorized. Do not start another design questionnaire or spawn additional builders.

**Goal:** Deliver a distinctive photographic landing page and a complete local MVP journey from discovering work to managing listings, collaborating, and sharing accepted-work proof.

**Architecture:** Retain the Next.js client interface, shareable query router, FastAPI monolith, PostgreSQL, existing order lifecycle, and private sessions. Reuse existing `Service.is_active`, `Project.status`, `Application.status`, and `ProofOfWork.public`; this iteration requires **no schema migration**. New frontend files are limited to the landing page, extracted account screens, and public profile.

**Tech Stack:** Next.js 16.1.6, React 19.2.3, TypeScript, native CSS/React state, FastAPI, SQLAlchemy, PostgreSQL, existing pytest; Bun's built-in runner for a small pure-helper check. No new dependency.

**Spec:** `PRODUCT.md`, the product mechanisms in `/home/adi/Downloads/Skill-High.html`, and `.impeccable/surfaces/app-page-tsx.md`. The user's September 14 request for an original palette, imagery, landing page, animation, and completion supersedes the old Fiverr/forest visual commitment. `DESIGN.md` describes the rejected incumbent and is rewritten from the finished build only.

## Global constraints

- Prefix every shell command with `rtk`; use `apply_patch` for file edits. Preserve `.env`, the development database, seed records, and unrelated changes.
- All integration tests use `skillhigh_test` at port 54329. Never reset, recreate, or seed over `skillhigh_dev` as a test step; do not run these database-resetting tests in parallel.
- No paid APIs, public deployment, actual money, real email delivery, background jobs, cloud storage, or model calls. The local mail sink and payment simulator remain explicitly local.
- Preserve server-side ownership checks, CSRF, password hashing, HTTP(S) delivery validation, order snapshots, latest-delivery acceptance, private messages, unique proof, and verified reviews.
- Do not advertise milestones, Skill Squads, subscriptions, Skill DNA scoring, employment eligibility, verified identities, or production payment protection. Those are proposal extensions, not this MVP.
- Photographs are editorial context; existing category images are illustrations, never a seller's portfolio. No invented seller portraits, testimonials, ratings, transaction counts, or speed promises.
- User-selected implementation is code-led. Parent already ran Impeccable context and concept seed `dab5430b`; do not rerun either. Read craft-floor before UI edits. All six direction blocks stay in development documentation, never UI source, hidden DOM, metadata, or delivered assets.

## Audit and finite scope

The existing app already supports real service requests, project applications, orders, messages, deliveries, revisions, verified reviews, matching, disputes, and admin resolution. Eight backend tests passed before this iteration; the parent verified both order journeys in the browser.

| Existing gap | Deliverable in this iteration |
| --- | --- |
| `/` is a familiar four-column service marketplace | Photographic landing at `/`; explicit `/?view=services` and `/?view=projects` discovery |
| My services reads the public catalog and explicitly says editing is unavailable | Owner-only all-status list, prefilled editing, pause/resume, reliable refresh |
| Project and application ownership has no exit | Edit an untouched open brief; close an open project; withdraw/reapply to a pending application |
| Reset and verification APIs have no interface | Request-reset, set-password, verify-email, resend-verification screens/actions |
| Work activity and matching are buried in profile | Work overview, stable workspace navigation, inbox, transparent simulated earnings |
| Proof records are private and cannot be made public | Explicit visibility switch and a safe public member profile with selected proof |
| Navigation can retain stale IDs; catalog does not refresh after publishing | Tested route helpers, auth return preservation, keyed resource screens, catalog invalidation |

## Visual and interaction contract

**World:** A cooperative creative studio: a clear brief arrives, work happens, an accepted result becomes professional evidence. It borrows the studio's disciplined typography, contrasting ink, process photography, and sequence. Do not draw literal receipts, torn edges, perforations, stamps, or a collage of floating badges.

**Palette:** Cobalt `#3046D3` (primary actions, selected navigation, one proof chapter), ink `#172238` (text), paper `#F8F7F3` (canvas), white `#FFFFFF` (working surfaces), saffron `#F4C76B` (warm focus in the hero/proof example), soft ink `#46536A`, muted ink `#5C6678`, line `#DCDDDC`, control border `#858EA0`, danger `#A62D3C`, success `#22654D`. Keep semantic green for success only. Replace old forest/teal references and hard-coded green fills across all screens rather than aliasing their names indefinitely. Set cobalt hover to a darker blue such as `#2536A8`; use ink text on saffron.

Measured WCAG ratios: ink/paper 14.81, soft ink/paper 7.24, muted/paper 5.40, white/cobalt 7.14, cobalt/paper 6.66, ink/saffron 10.00, control-border/white 3.29. Recheck computed hover, focus, and error pairs after building. On cobalt, use a white outline focus indicator; on white/paper use cobalt. Color always accompanies a textual state.

**Type:** `Schibsted_Grotesk` for display/wordmark; `DM_Sans` for body and forms. Both use existing `next/font/google`; Schibsted's export was verified in installed Next font declarations. Display weight 650–750, normal sentence case, restrained tracking around `-.035em`; body 16px/1.5. Main landing headline `clamp(3.25rem, 6.3vw, 5.75rem)`; operational headings 30–40px. Do not turn all labels into spaced capitals.

**Geometry:** 1280px maximum content, 24px desktop side padding and 20px mobile, 4–6px controls, 8px functional surfaces, flat quiet records. Landing uses three deliberate changes in density; the app is a practical workspace with restrained color. No card-shaped container around every section.

**Landing composition, 1440×900:** A 76px paper header with Skill-High left, Find work / Find talent / How it works center, Sign in and Join right. No global search bar or category strip on this route. Below, a 12-column spread: left seven columns carry a small plain audience line, an 80–92px headline, a short explanation, and two real actions; right five columns carry the collaboration photo at approximately 4:5, showing faces and laptop. The smaller print-process photo sits low across the column boundary, as part of the grid, never over the headline or controls. A quiet progress selector aligns underneath it. By the bottom of the first viewport, the visitor sees a small real service preview or the beginning of the next section, not an oversized empty color block.

Exact lead copy: “Good work starts before graduation.” Supporting copy: “Find focused projects, collaborate with clear scope, and build a record of work you can carry forward.” Primary action “Find a project” → projects; secondary “Hire student talent” → services. A text action “Offer a service” uses the protected create-service route. Skill-High's proposition is about recorded work, not guaranteed jobs or income.

**Scroll story:** (1) Hero and interactive work preview. (2) A three-column row of live services, heading “Start with something you can make”, with real prices and a Browse all services link; clear loading/error/retry states. (3) A full-width cobalt proof chapter with a large white heading, a saffron-accented example record, and three brief explanatory rows. (4) A quiet two-column close: existing `web.jpg` desk image, student/graduate continuity copy, Create your profile and Post a project actions. Close with useful footer links and a compact local-demo disclosure. No fake partner logos, testimonials, or FAQ padding.

**Signature interaction — Brief to proof:** One controlled three-state preview uses buttons “Brief”, “Delivery”, “Proof” with `aria-pressed` and an adjacent labelled panel. Scenario: “Campus event poster”; Brief says “One digital poster · 3 hours estimated”; Delivery says “A final export and handoff note”; Proof says “Accepted work can become part of your public profile.” Label the whole preview “Illustrative work journey”; these are demonstrative states, not a claim that the seed order completed. Use the design category image as category context for the brief, print-process photo for delivery, and a semantic text record for proof. Each state changes the explanatory copy and exposes a relevant live action: Browse projects, Offer a service, Create/View your profile. Selection never writes an order. One replayable 250ms horizontal handoff of the bounded image/panel area embodies the transition from working material to retained record. It must work with mouse, touch, and keyboard without relying on hovering.

**Motion:** A single 600ms photo-settling entrance in the hero; headline and actions are visible immediately. The selected journey state transitions over 250ms using transform/opacity, with text updated immediately. Buttons acknowledge interaction in 120–160ms; menu and status feedback in 180ms. No autonomous loop, marquee, count-up, per-section reveal, cursor follower, parallax, or animation library. Reduced motion removes spatial movement and smooth scrolling, retains immediate text/state changes and a brief color acknowledgment. App pages do not replay marketing choreography.

**Mobile:** At 390px, headline and actions precede the collaboration image; image remains visible. Use a 4:3 mobile crop, keep faces intact, then a small process image and the journey controls. Stack lower sections, allow category/filter wrapping, move workspace navigation to a labelled horizontally scrollable row. At 320px, every control and record stays within the viewport, minimum interactive target 44px. Do not make dense tables the only way to read an order or payout.

**Shipping imagery:** `public/images/studio-collaboration.jpg`, `public/images/studio-process.jpg`, and existing `public/images/web.jpg`, plus the existing six category illustrations through `imageFor`. Parent has downloaded and inspected new photos and owns `public/images/CREDITS.md` and provenance. Use dimensioned `next/image` where practical, an accurate `sizes`, eager/high-priority only for the hero, lazy loading below the fold. Reuse assets without creating duplicate files. No unused candidate image ships in the public manifest.

## File map and shared contracts

| File | Responsibility |
| --- | --- |
| `app/page.tsx` | Shared shell, route dispatch, session, catalog, existing catalog/detail components |
| `app/marketplace.ts` | Existing API/type/format helpers plus pure route and earnings helpers |
| `app/landing.tsx` (new) | Landing content and the sole illustrative journey interaction |
| `app/auth.tsx` (new) | Extracted sign-in/registration plus recovery/verification screens |
| `app/public-profile.tsx` (new) | Safe public member identity, active offers, reviews, selected proof |
| `app/workspace.tsx` | Existing work screens plus owner controls, overview, inbox, earnings, proof visibility |
| `app/globals.css`, `app/layout.tsx` | Shared visual system, font import, responsive and reduced-motion behavior |
| `backend/app.py` | Minimal owner/status/public-profile additions, existing workflow integration |
| `backend/tests/test_listing_management.py` (new) | Listing ownership, visibility, snapshot, application lifecycle regression |
| `backend/tests/test_public_profile.py` (new) | Proof consent and public-field privacy regression |
| `backend/tests/test_password_reset.py` | Reset/verification mail and token lifecycle regression |
| `backend/tests/test_orders.py` | Existing work lifecycle plus funded/settled simulator regression |
| `app/marketplace.test.ts` (new) | Bun built-in tests for route round trips and currency-safe earnings |

Keep the current query navigation architecture. Export `Route`, `Navigate`, `readRoute(search: string): Route`, and `routeHref(next: Partial<Route>, current: Route): string` from `marketplace.ts`; import the last as `href` in existing code to avoid gratuitous call-site churn. `Route` retains `view`, `id`, `q`, `category`, `maxPrice`, `sort`, `next`, and adds optional `mode: "login" | "register"` and `token`. The default view is `home`. `services` must now be serialized explicitly. Only positive integer IDs survive parsing. Clear resource IDs when moving to a different non-resource view and do not leak token/mode/next into ordinary marketplace navigation. Preserve all catalog filters when returning from authentication.

Supported new views: `home`, `dashboard`, `inbox`, `earnings`, `person`, `edit-service`, `edit-project`, `forgot-password`, `reset-password`, `verify-email`; retain every existing view. Unknown views show a clear not-found state and home link. Authentication requires a validated same-origin `next` URL with pathname `/`, parsed through the same route helper; invalid destinations fall back to dashboard. Sign in passes `mode=login`; Join passes `mode=register`. Protect all workspace routes while retaining their complete destination.

`Service` gains `is_active: boolean`. Add `Proof = { id: number; order_id: number; title: string; public: boolean; created_at?: string }`, `PublicProof = { id: number; title: string; skills: string[]; created_at: string }`, and `PublicProfile = PublicPerson & { services: Service[]; seller_rating: number | null; seller_review_count: number; seller_reviews: ServiceReview[]; proofs: PublicProof[] }`. Use narrow server responses, not frontend stripping of private fields.

`Order` summary reads gain existing resource IDs, `created_at`, narrow `client` and `worker`, plus `last_message: Message | null`. Extend `GET /orders` using the existing participant predicate and public-person helper; no separate inbox endpoint or message-read schema is necessary. Query only the latest message for each order, not every order's complete delivery/review history. If per-order lookups are retained at this MVP size, mark their ceiling with one `ponytail:` comment and the batched-query upgrade path.

## Task 1 — Lock the shared shell and routing

**Files:** `app/marketplace.ts`, `app/marketplace.test.ts`, `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `PRODUCT.md`.

**Produces:** Pure route helpers, home as the root destination, explicit service/project routes, shared cobalt/ink tokens, and an accessible responsive shell.

- [ ] Add the small runnable route test first using `import { test, expect } from "bun:test"`. Assert: empty search → home; services → `/?view=services`; `id=-1`, fractions and nonnumbers → undefined; service→dashboard clears ID; auth round trip preserves `q`, category, price, sort and exact resource; invalid/external next → dashboard; token disappears when leaving recovery. Run `rtk bun test app/marketplace.test.ts` and confirm the missing helpers fail before implementation.
- [ ] Move/adjust the existing helpers and route every anchor through them. Keep real `href`s for open-in-new-tab. Wire `popstate`, keys such as `${view}:${id ?? ""}`, and safe post-auth return. Fresh navigation scrolls to top with reduced-motion awareness; browser Back retains a usable state. Remove the page-wide session-loading gate for public landing/catalog routes; show pending account chrome until `/me` resolves.
- [ ] Header wordmark goes to home. Landing navigation uses Find work / Find talent / How it works; catalogs keep search and category controls. Auth and private workspace routes do not render the category strip. Workspace gets persistent Overview / Orders / Inbox / Earnings navigation, with listings, applications, profile, and admin reachable from the account/navigation area.
- [ ] Set the named palette and font, restyle every existing component state, remove old discovery-band styling and green hard-codes, add a skip link, visible focus, selected-nav semantics, and text wrapping. Preserve notices and native labelled form controls. Update `PRODUCT.md` Brand Commitments to the new user-requested direction, without changing product scope.
- [ ] Run route tests and `rtk bun run build`. No commit: report this checkpoint to parent and continue.

## Task 2 — Build the landing and authored motion

**Files:** create `app/landing.tsx`; modify `app/page.tsx`, `app/globals.css`.

**Consumes:** `Service[]`, `User | null`, shared `Navigate`, route helpers, existing `imageFor`, and supplied local images. **Produces:** `Landing({ services, user, navigate, catalogLoading, catalogError, reloadCatalog })`.

- [ ] Implement the exact desktop and mobile composition, four-section story, copy, and real destinations above. Pass the same live catalog to featured offers; choose three existing records without synthetic ratings or implied endorsements. If no services exist, show a concise empty state and Offer a service action.
- [ ] Implement the three-button illustrative journey. Its heading/copy changes immediately; the controlled image/record settles in one bounded horizontal transition. The proof state is an example, distinct from fetched public proof. The footer's How it works link targets this section, and authenticated profile actions go to their existing account.
- [ ] Add only the specified CSS motion and its reduced-motion alternative. All meaningful text/controls are visible before animations. Dimension photos and confirm both crops, not merely successful file requests.
- [ ] Run `rtk bun run build`; parent reviews landing at desktop/mobile in its batched review. Continue building other tasks rather than opening a self-polish loop.

## Task 3 — Finish owned listings and application exits

**Files:** `backend/app.py`, new `backend/tests/test_listing_management.py`, `app/marketplace.ts`, `app/workspace.tsx`, `app/page.tsx`.

**API contracts (all mutations use `actor`/CSRF):**

| Endpoint | Input / result | Required rules |
| --- | --- | --- |
| `GET /me/services` | `Service[]`, all statuses | Only current user's services; include `is_active` in serializer |
| `PUT /services/{id}` | Existing `ServiceIn` → complete `Service` | Owner only; update fields/skill links; existing orders untouched |
| `PATCH /services/{id}/visibility` | Pydantic `{ is_active: bool }` → `Service` | Owner only; false hides from public list/detail and prevents new requests; true resumes |
| `PUT /projects/{id}` | Existing `ProjectIn` → complete `Project` | Owner, `status=open`, zero applications; otherwise 409 explaining that an applied-to brief cannot be rewritten |
| `POST /projects/{id}/close` | No body → `Project` | Owner; open→closed, pending applications→closed; assigned→409; already closed returns current state |
| `POST /applications/{id}/withdraw` | No body → application ID/status | Worker owner; pending→withdrawn; accepted→409; already withdrawn returns current state |

Public listing reads stay public; owner reads stay protected. Non-owner mutation returns 403, missing row 404. Use row locks on the service/project whose fields or lifecycle are changing. `request_service` and `apply` must take the same respective listing lock before availability checks/creation, so pause/close cannot race a new request. Project editing has no effect on assigned orders. Service editing affects only future orders. Do not delete a listing, application, message, or order.

For reapplication, change the existing `apply` handler: under the open-project lock, find the user's existing application; a withdrawn row becomes pending and refreshes `created_at`, reusing the same ID. A pending/accepted row keeps the existing 409. A closed project stays unavailable. On acceptance, keep the existing snapshot transaction and mark the other pending applications `not_selected`, preserving withdrawn rows. This resolves the existing unique `(project_id, worker_id)` constraint without schema work.

- [ ] Add `test_owner_listing_lifecycle_preserves_orders_and_application_history`: create worker service and client request, pause as owner, verify public absence/request 404, verify private existing order still readable with original amount/title; edit service and resume, verify a new order uses new terms; stranger mutations return 403; owner list includes paused listings. Add project subcase: edit before first application works, later edit 409; withdraw/reapply uses same ID; accepting one applicant marks others not_selected; assigned close 409; closing a second open project excludes it from search/matches and prevents apply. Run only this file before implementing to establish failure.
- [ ] Implement the routes and shared normalized skill assignment: trim names, reject names outside 2–80 characters, deduplicate case-insensitively, and reuse `get_skill`; both create and update paths use the same rules. Replace existing skill links inside the transaction. Do not create a service repository or another persistence layer.
- [ ] Reuse `CreateWorkspace` as a create/edit form by passing optional `listing` and fixed kind. Prefill every field including skills/scale; edit mode hides kind switching, Save changes returns to the owner list. Mirror server length/hour/positive-money constraints in controls; retain entered values on failure.
- [ ] `ServicesWorkspace` uses `/me/services`; display Live/Paused text, Edit, Pause/Resume. Own paused items route to their edit screen rather than a public 404. Fix its existing Offer a service action (currently incorrectly opens project creation). `ProjectsWorkspace` exposes Edit only while open with zero applications and Close only while open. Explain read-only terms when applications exist. Applications show Withdraw for pending and Apply again only for withdrawn/open. Close uses a small inline confirmation stating that applications close; pause is immediately reversible.
- [ ] Add `onCatalogChanged: () => Promise<void>` to Workspace props and call after successful create/edit/pause/resume/close and application acceptance. Await or refresh before navigating so public lists never retain a closed or old listing. Use keyed resource screens so changing IDs cannot display or mutate the prior resource while loading.
- [ ] Run `rtk uv run pytest backend/tests/test_listing_management.py -q` and `rtk bun run build`.

## Task 4 — Complete account recovery and verification

**Files:** create `app/auth.tsx`; modify `app/page.tsx`, `app/workspace.tsx`, `backend/app.py`, `backend/tests/test_password_reset.py`, `app/globals.css`.

**Consumes:** Existing registration/login, `POST /auth/request-password-reset` with `{email}` (202), `POST /auth/reset-password` with `{token,password}` (204), `POST /auth/verify-email` with `{token}` (204), and `GET /me`. **Adds:** `POST /auth/resend-verification` (authenticated `actor`, no body, 202; already-verified account is a harmless no-op).

- [ ] Extend mail tests before changing backend behavior: verification response never exposes token, verification succeeds once and replay fails; resend requires sign-in/CSRF; reset rejects reused token, invalidates prior sessions, rejects old password and accepts the new one; unknown email receives the same reset-request 202. Keep `DEV_MAIL_DIR=tmp_path` and the existing test database guard.
- [ ] Reuse `issue_token` for resend. Add a concrete browser URL to local mail text for `/?view=verify-email&token=…` or `/?view=reset-password&token=…`; keep `token=…` as the **last** line so existing local tests/readers remain compatible. Never return or expose the sink through an API. No email provider and no browser directory viewer.
- [ ] Extract existing AuthScreen, retaining demo credential fill and current registration/login behavior. Add Forgot password from sign-in, reset form with new-password confirmation/minimum 12 characters, and a verify form with token input when a link token is absent. Link tokens prefill but do not mutate on GET/mount; the user presses Verify email / Set new password. Keep entered input on API errors, disable duplicate submission, use role=status/alert, and give Back to sign in after success. Reset completion clears stale client session state and returns to sign-in.
- [ ] Profile displays email verification state and Resend verification for unverified accounts. After register, show a nonblocking verification notice plus a route to verification; preserve the original next destination. Refresh `/me` after verification. Local-development copy explains that links are in the development mail sink; do not claim an email was delivered. Generic request copy: “If an account matches, a reset link has been prepared.”
- [ ] Run `rtk uv run pytest backend/tests/test_password_reset.py -q` and `rtk bun run build`. Parent manually exercises tokens from local sink without exposing them in the final response.

## Task 5 — Give work, hiring, inbox, and earnings a coherent home

**Files:** `backend/app.py`, `app/marketplace.ts`, `app/marketplace.test.ts`, `app/workspace.tsx`, `app/page.tsx`, `app/globals.css`; extend existing `backend/tests/test_account_and_access.py` and `backend/tests/test_orders.py`.

**Produces:** Overview, inbox, and earnings views using existing order facts; enriched `/orders` summaries as specified above. No unread/read-receipt promise and no wallet API.

- [ ] Add a privacy regression proving `/orders` for a stranger omits the other pair's order and last message, while each participant sees the right partner and latest message. Assert no partner email or password fields. Implement summary fields in the existing list endpoint only.
- [ ] Overview greets the current account and gives two task-oriented sections: Your work (pending requests to accept, active work to deliver, applications, up to three `/matches` links) and Your hiring (submitted deliveries to review, pending project applicants, open projects). Use real statuses and counts; empty states lead to Find a project/Offer a service/Post a project. Availability is linked to the existing profile editor. The account can both work and hire; do not create exclusive roles or a second identity.
- [ ] Inbox lists only the current user's order threads with title, other person's name, latest message/date or “No messages yet”, and order status. Opening goes to the existing order conversation, with a real link. Add a conversation anchor/focus target so this is not merely another orders list. Retain Refresh; while an order conversation is open poll its existing `after_id` messages every 8 seconds, pause when the document is hidden, deduplicate by ID, and clean up timers/requests on order change. Never replace an unsent draft while refreshing. No WebSocket or global notification job.
- [ ] Earnings reads current-user worker orders only, grouped by currency. Add pure `earningsByCurrency(orders: Order[], userId: number)` returning `{ currency, completed_net_minor, paid_net_minor }[]`; completed net sums `amount_minor - fee_minor` for completed worker orders; paid net additionally requires `payout_status === "paid"` and `payment_status !== "refunded"`. Show “Completed work value” and “Simulated payouts”, not withdrawable balance. Rows show contract amount, fee, net and payout state; cancelled/in-progress orders do not contribute to totals. Buyer activity is visible under hiring/orders, not mixed into earnings. Ignore legacy `/dashboard.earnings_minor` because it combines currencies.
- [ ] Add a Bun helper test with one INR completed worker order, one USD completed worker order, an unrelated buyer order, a cancelled order, and a refunded order. Assert separate currencies, no buyer/cancelled value, and no refunded amount in simulated-paid total. Keep the original OrderDetail agreement and add fee/net/payout visibility. Any simulation controls stay in development-only details and remain client-only; use unique event IDs and the existing server endpoint. No new real-money action.
- [ ] Before exposing the simulator's financial states, add `test_simulator_requires_funding_and_cannot_overwrite_settlement` in the existing order tests. Assert completed/unpaid payout→409, paid/completed/ready payout→200, repeat identical event→duplicate without another state change, event reused for another order/outcome→409, and later failure/refund cannot reverse an already paid-out order. Lock the order row before checking its participant and state. Payout requires completed work, `payment_status == "paid"`, `payout_status == "ready"`, and no open dispute. Failure is allowed only from unpaid/failed, refund only from paid before payout, and success only from unpaid/failed or an already-paid no-op. Preserve terminal refunded/paid-out states. Catch unique-event races, roll back, and return duplicate only when the persisted event matches both order and outcome; otherwise 409. These are corrections inside the existing local simulator, not a new payment subsystem.
- [ ] Give asynchronous workspace lists separate loading/error/empty states and Retry. Mutation notices clear stale errors on successful retry; 401 preserves the current route in sign-in return. Run the relevant API test, `rtk bun test app/marketplace.test.ts`, and `rtk bun run build`.

## Task 6 — Make proof useful without exposing private work

**Files:** `backend/app.py`, new `backend/tests/test_public_profile.py`, `app/marketplace.ts`, new `app/public-profile.tsx`, `app/page.tsx`, `app/workspace.tsx`, `app/globals.css`.

**API contracts:** `GET /people/{user_id}` → `PublicProfile`, 404 for nonexistent/inactive user. Reuse `public_person`, `serialize_service`, and `seller_reviews`; include active services and only `ProofOfWork.public == true` belonging to that worker. Public proof fields are **only** ID, title, skill names from the order's recorded `skills_snapshot`, and proof creation date. Never return order ID, client identity, scope, amount, messages, submission URL, availability note, or email. Ratings must remain verified client-to-worker reviews of completed orders; no average over reviews the seller wrote about clients.

`PATCH /me/proof/{proof_id}` accepts Pydantic `{public: bool}`, requires `actor`, checks worker ownership, and returns the existing private Proof shape. Default remains false. Do not add public delivery/file URLs; consent to show the proof title does not authorize publishing client materials.

- [ ] Add `test_public_proof_is_opt_in_and_never_exposes_order_material`: complete one real test order, confirm empty public proofs by default; stranger PATCH →403; worker enables it and anonymous GET exposes exactly the four allowed fields; order scope/messages/URL/email absent from response; worker disables it and public proof disappears. Include a forged `worker_id`/`order_id` in PATCH and assert it cannot change ownership. Run to confirm failure, then implement endpoints.
- [ ] In existing profile proof rows, show Private/Public text and a labelled “Show this proof on my public profile” checkbox. Adjacent copy explicitly identifies title, skills and completion date as the shared fields and says to publish only if the project title is safe to share. Do not enable automatically. Keep the private Open order link for its owner and show API errors without optimistic consent changes.
- [ ] Build `PublicProfileScreen({ id, navigate })`: identity and career stage, bio, skills, verified-review summary or “No reviews yet”, active offers, selected completed-work records, and Share profile. Copy uses the browser clipboard only after click, reports failure, and leaves a selectable URL fallback. No private contact button. Public profile navigation works while signed out. Link seller names in service cards/detail and applicant identities to `/?view=person&id=…`; profile gets View public profile.
- [ ] Public proof record links can use the profile URL plus `#proof-{id}` with matching document IDs; no separate public order/detail API. An empty proof section honestly says “No public proof shared yet.” A member need not have prior work to publish a service or apply.
- [ ] Run `rtk uv run pytest backend/tests/test_public_profile.py -q` and `rtk bun run build`.

## Task 7 — Integration, review, and documentation handoff

**Files:** all changed implementation files; `README.md`, `docs/TECHNICAL_DESIGN.md`, `docs/SAMPLE_DATA_AND_TEST_CASES.md`; parent/documenter owns final `DESIGN.md` and `.impeccable/design.json`.

- [ ] Run `rtk uv run pytest backend/tests -q`, then `rtk bun test app/marketplace.test.ts`, then `rtk bun run build`. Preserve exact output summaries for parent. Do not repeatedly broaden testing after this passes without a new failure/change.
- [ ] Check every visible navigation destination, create/edit/pause/close action, reset/verify action, proof toggle, and empty/error CTA for a real endpoint or route. Remove obsolete “editing unavailable” text and old marketplace-first/forest documentation. Update README and technical/sample-test docs with the actual new views/APIs and unchanged local limits; do not claim the entire long-term proposal is implemented.
- [ ] Parent runs one batched desktop/mobile inspection (1440 and 390, plus user viewport), then one correction batch and at most one confirmation round. Capture from top after entrance motion settles, verify each capture file shows the correct fully-loaded route, and include screenshots in `.impeccable/review/`. Review home, service catalog/detail, work overview, owner editing, order conversation, profile/proof, account recovery, and admin; check 320px overflow and reduced motion behavior without multiplying polish rounds.
- [ ] Parent's behavioral check covers old full service/project→revision→completion→review flows, listing snapshot preservation, unknown/private reads, auth return with filters, pause/resume, application withdraw/reapply, public consent on/off, two message participants, no duplicate polled messages, empty accounts, and currency-separated totals. Use dedicated test-created resources rather than modifying seed terms for checks.
- [ ] Parent runs the hookless Impeccable detector once on changed UI targets, resolves mechanical findings, and conducts the required finish review using the contract and valid captures. Builder reports remaining findings concretely; do not self-certify an unreviewed page. After final correction, write token-bearing `DESIGN.md` and `.impeccable/design.json` from the actual build, verify shipping raster provenance, and let parent commit/push the finished result.

## Exit condition

The landing is recognizably Skill-High, every existing app screen uses the new world, and a new account can discover, publish, edit/pause, apply/withdraw, hire, collaborate, complete/review, recover access, and choose which proof to share. API tests, helper tests, and production build pass; parent completes the bounded browser/finish review and documentation. Local email, simulated money, unavailable scanned uploads, and advanced proposal features remain explicit limits. No additional subsystem is needed for this iteration.
