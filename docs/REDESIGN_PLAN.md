# Skill-High Marketplace Rebuild Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` to implement this plan task by task. The user has already selected Astra for planning and Luna at xhigh for implementation. Do not ask for another design approval or execution choice. Do not delegate further.

**Goal:** Replace the disconnected public landing page and signed-in demo interface with a coherent, professional freelance marketplace whose discovery, hiring, and delivery actions work against the existing persistent API.

**Architecture:** Keep Next.js, the existing API proxy, FastAPI, SQLAlchemy, PostgreSQL, sessions, CSRF, and order state machine. Use one shared app shell with query-addressable screens; add the small read APIs needed to connect existing writes to usable workflows. Use local category photography and real API records, with no new runtime dependencies or schema migration.

**Tech Stack:** Next.js 16.1.6, React 19.2.3, TypeScript, CSS, FastAPI, SQLAlchemy, PostgreSQL, Bun, uv, pytest.

**Spec:** The accepted direction below and `PRODUCT.md` define the product. `DESIGN.md` contains obsolete paper/dark-panel rules that this rebuild must replace. The user's supplied Fiverr references determine the familiar navigation, catalog, detail-page, and account-menu structure; keep Skill-High's name, content, and identity.

## Global constraints

- Prefix every shell command with `rtk`; read `/home/adi/.codex/RTK.md` if not already read. Use `apply_patch` for file changes.
- Preserve existing changes. The parent owns `public/images/` and `.impeccable/review/` assets. Use the photos; do not replace or delete them.
- `impeccable context --target app/page.tsx` was already run this session. Do not rerun it or introduce a concept-selection detour. The approved reference direction supersedes the random concept seed.
- GBrain is unavailable; Obsidian retrieval timed out. No saved decision was retrieved. Proceed with the repository and supplied references; do not add memory/background integrations.
- The existing API is running at `127.0.0.1:8000`, Next at `127.0.0.1:3000`, and PostgreSQL at `127.0.0.1:54329`. Do not start duplicate services, reset the development database, change `.env`, or change global configuration. Tell the parent when API edits are ready so it can restart the exact project process.
- Run database tests sequentially, only through the existing dedicated `skillhigh_test` mechanism. Never run pytest concurrently with another pytest invocation.
- Payments remain a clearly labeled local simulator; uploads remain unavailable; delivery text and HTTP(S) links work. Do not add providers, paid APIs, packages, services, or fake capabilities.
- Do not fabricate testimonials, seller tiers, sales, completed-work counts, star ratings, response times, availability, or delivery deadlines. Estimated hours mean effort, not turnaround time. Seeded accounts/listings are fictional development data.
- Implementation is authorized. No routine confirmation gates. The parent will independently review and handle committing/publishing.

## Accepted screen and visual specification

Use a white ground, near-black text, deep teal/forest actions, restrained gray borders, and the installed Manrope/DM Sans fonts. Use 6–8px control/image corners, little or no card shadow, 14–16px body copy, 16px listing titles, 26–32px page headings. Remove the paper palette, oversized slogan, decorative explanatory cards, emoji icons, dark listing containers, and marketing claims about the implementation.

At 1440×900, use a content width around 1280px and four service cards per row. The first complete card row, including seller and price, must be visible without scrolling. The header is roughly 72px, category navigation roughly 44px, and the homepage discovery band at most 220px. Search-result screens omit the band. The band may use a forest background and one category image, with a short heading such as “Find the right help for your next project.” No giant centered manifesto. A light band is acceptable if it produces a more convincing result.

| Screen | Required composition and actions |
| --- | --- |
| Shared header | Skill-High wordmark/link; prominent search field and Search button; Browse services, Find work, Post a project. Signed out: Sign in and Join. Signed in: Orders and avatar/name dropdown. Same styling and content width in both states. |
| Category bar | All services, Design, Development, Writing, Video, Presentations, Photography. Real filters, visible selected state, horizontal scrolling on narrow screens. |
| Services | Compact feature band only on unfiltered home; heading and real result count; category, maximum price in rupees, and sort controls; four-column image cards. Each card shows seller initials/name, title, real rating or “New”, estimated effort, and price. Image and title open the service detail. |
| Projects / Find work | Distinct project catalog with client name, title, short brief, required skills, budget, effort, and scale. Search and category filters work here too. Open a project to read its full scope and apply. |
| Service detail | Breadcrumb/back link; title and seller row; large image with “Category illustration” caption; full scope and skills; seller bio and genuine seller reviews, or an honest empty state. Right-hand bordered purchase panel, about 360px wide, with price, estimated effort, request explanation, and Request service. Sticky on desktop; stacked and usable on mobile. |
| Project detail | Full client brief, client identity, required skills, budget, scale, estimated effort; Apply action. Show “Your project” with a link to applicants for its owner. Show an applied state when appropriate. |
| Authentication | Dedicated compact screen or native accessible dialog, not a form at the bottom of the homepage. Login/register tabs, labels, validation, pending state, actionable errors. Development demo credentials remain available inside a collapsed secondary section. Preserve the intended destination after successful auth. |
| Account menu | Profile, My services, My projects, My applications, Orders, Offer a service, Post a project, and Sign out; Admin only for admins. Use native `details`/`summary` or a properly keyboard-operated button/menu. No dead Favorites/Notifications controls. |
| My projects | Owned projects including assigned ones, status and applicant count; open applicants to see public worker identity/skills and accept a pending application. Successful acceptance opens the resulting active order. |
| My applications | Applied projects, application state, project availability, and a link to the order when accepted. If another applicant was selected, show “Project filled” instead of implying a pending opportunity. |
| My services | Current user's live service cards and Offer a service. Do not invent editing/deletion endpoints. |
| Create | Separate focused Post a project and Offer a service forms; rupee inputs, clear scope guidance, skills, estimated hours; project scale only for projects. Successful publish navigates to the new resource. |
| Orders | Compact list with All / Buying / Selling filters, title, counterpart, amount, and readable status. Opening a row loads a full order screen. |
| Order detail | Scope and clear current status; role-appropriate next action; delivery history with safe links; message thread and composer; modest agreement/payment summary. Revision, acceptance, cancellation, disputes, and completed-order reviews remain usable. |
| Profile / Admin | Restyle the existing real capabilities into the same shell. Profile reads and saves name, bio, career stage, skills, and availability; proof records remain visible. Admin overview and dispute resolution remain restricted and functional. |

At 900px use two cards; at 390px use one card, a compact header with search on its own row, and horizontally scrollable categories. No horizontal page overflow. Keep 44px primary targets, visible keyboard focus, real labels, readable contrast, and reduced-motion support. A plain footer can link to Services, Find work, and creating work; do not add invented policy pages or social links.

## Files and boundaries

| File | Work |
| --- | --- |
| `backend/app.py` | Public listing metadata/detail reads, owned-work/applicant reads, order-detail history, availability read; narrow validation/state fixes below. Keep the monolith. |
| `backend/seed.py` | Add a small varied, repeatable fictional catalog without changing existing records or adding reviews. |
| `backend/tests/test_marketplace.py` | One focused API workflow test covering the new discovery, hiring, and private-read contracts. |
| `backend/tests/test_orders.py` | Extend the existing order regression to verify delivery readback, latest-delivery acceptance, and genuine review aggregates. |
| `app/marketplace.ts` (new) | Shared TypeScript records, existing API/currency helpers, small category/image mapping. It has real callers in the two UI files; no context/store/class hierarchy. |
| `app/page.tsx` | Shared navigation, URL state, catalog, detail screens, auth, and loading/error orchestration. Replace the mutually exclusive public/private page trees. |
| `app/workspace.tsx` (new) | Existing create/profile/admin/order capabilities plus owned projects/applications, using the same small API helper and design. Functional components only. |
| `app/globals.css` | Replace conflicting old styling with a single coherent responsive system. Remove dead selectors instead of appending another theme. |
| `app/layout.tsx` | Only update metadata if useful; reuse existing fonts. |
| `PRODUCT.md`, `DESIGN.md`, `README.md`, `docs/TECHNICAL_DESIGN.md`, `docs/SAMPLE_DATA_AND_TEST_CASES.md` | Align the short factual docs with the finished UI, API, seed data, and verified limitations. |

Use `public/images/{design,web,video,writing,presentation,photo}.jpg` and keep `public/images/CREDITS.md`. These are editorial category photos, not seller work. Images need fixed aspect ratios, local URLs, useful alt text, and `object-fit: cover`; initials represent users because real profile photos are unavailable.

## Task 1: Connect the missing reads to existing workflows

**Files:** `backend/app.py`, `backend/tests/test_marketplace.py`, `backend/tests/test_orders.py`.

- [ ] Read every caller of `serialize_order`, the public listing handlers, `participant`, `accept_application`, `submit_delivery`, and `complete_order` before changing their contracts.
- [ ] Add a public person serializer that never calls `serialize_user` and only returns `id`, `display_name`, `career_stage`, `bio`, and skill names. Public JSON must not contain email, password/session/token fields, `is_admin`, or private proof records.
- [ ] Reuse listing serializers between catalog and detail endpoints. Preserve existing fields and add the following contracts; do not add database columns:

```text
GET /api/v1/services
GET /api/v1/services/{id}
Service: id, provider_id, title, description, amount_minor, currency,
         estimated_hours, created_at, skills: string[], provider: PublicPerson,
         seller_rating: number|null, seller_review_count: number
Service detail additionally: seller_reviews: [{id, rating, body, author_name}]

GET /api/v1/projects
GET /api/v1/projects/{id}
Project: id, client_id, title, description, amount_minor, currency,
         estimated_hours, scale, status, created_at,
         required_skills: string[], client: PublicPerson

GET /api/v1/me/projects
Owned Project[] plus application_count and order_id: number|null;
include assigned projects. Requires current_user.

GET /api/v1/projects/{id}/applications
[{id, project_id, worker_id, status, created_at, worker: PublicPerson}]
Only the project's client can read it (403 otherwise; 404 missing project).

GET /api/v1/me/applications
[{id, status, project: Project, order_id: number|null}]
Only this user's applications; order_id only when this user was selected.

GET /api/v1/me/availability
{hours_per_week: number, note: string}; return 0 and empty note if absent.

GET /api/v1/orders/{id}
Existing order fields plus client/worker public people, created_at,
deliveries: [{id, author_id, message, submission_url, created_at}],
reviews: [{id, author_id, recipient_id, rating, body}],
disputes: [{id, reason, status}].
Call participant() before reading any history. Keep GET /orders lightweight.
```

- [ ] Public service detail returns 404 for inactive/missing services. Project detail can expose the existing public brief with its current status so a previously applied link remains meaningful after assignment. No private applicant records go into public project responses.
- [ ] Seller rating/reviews come only from completed orders where the reviewed user was the worker and the review author was the client. These are seller-wide aggregates; label them consistently as seller reviews. Empty aggregate is `null` and zero, not five stars. Use SQLAlchemy aggregate/batched reads for catalog metadata where straightforward; never query per card from the browser.
- [ ] Preserve all existing ownership checks on applications/orders, and keep POST application acceptance as the only path that assigns a project. The UI must check project status as well as pending application status; existing unselected rows can remain pending in storage.
- [ ] Include history in the existing order detail read rather than adding several new private resources. Messages continue using the existing separate GET/POST endpoints.
- [ ] Validate new delivery links at the server boundary: allow empty string or an absolute HTTP(S) URL, strip surrounding whitespace, and reject executable/non-web schemes with 422. Use the standard library's `urllib.parse.urlsplit` with a Pydantic field validator; do not fetch the URL. The frontend must also refuse to render unsafe legacy URLs as links.
- [ ] Fix `complete_order` to reject any delivery ID other than `order.latest_delivery_id` after a revision; checking only membership in the order accepts an obsolete draft. Keep the existing order lock, participant check, dispute check, and unique proof rule.

The essential completion guard is:

```python
if payload.delivery_id != order.latest_delivery_id:
    raise HTTPException(422, "Accept the latest delivery")
```

- [ ] Add a runnable workflow test following the existing `TestClient(create_app(testing=True))` style. Register a client, worker, and stranger; create a service/project, apply, inspect applicants as owner, accept, and inspect the resulting order. Assert the concrete security/data contracts:

```python
assert public_service["provider"]["display_name"] == "Ravi Worker"
assert "email" not in public_service["provider"]
assert public_service["seller_rating"] is None
assert public_service["seller_review_count"] == 0
assert public_service["skills"] == ["Poster design"]
assert stranger_applicants.status_code == 403
assert stranger_order.status_code == 403
assert own_projects[0]["application_count"] == 1
assert own_projects[0]["status"] == "assigned"
assert worker_applications[0]["order_id"] == order["id"]
assert invalid_delivery_url.status_code == 422
assert read_order["deliveries"][-1]["submission_url"] == "https://example.test/final"
assert old_delivery_completion.status_code == 422
```

Use actual named responses in the test, not mocked values. Extend the existing completion test to submit a first delivery, request revision, submit a second delivery, reject completion with the first ID, accept the second, and retain its duplicate-proof/payment/review assertions. After a client review, the seller aggregate must reflect the actual one review. A worker's review of a client must not affect seller ratings.

- [ ] Run `rtk uv run pytest backend/tests -q` once after this API slice. Resolve failures before the UI depends on it. Notify the parent that the API can be restarted.

## Task 2: Give discovery a truthful, varied catalog

**Files:** `backend/seed.py`, later `docs/SAMPLE_DATA_AND_TEST_CASES.md`.

- [ ] Retain Aarav, Ravi, Maya, the existing campus-poster service, and landing-page project. Add missing fictional accounts/skills/listings with natural-key existence checks in the existing seed function. Never update a matching existing record.
- [ ] Create enough genuine seeded records for two rows: eight services total and four projects total. Keep descriptions concrete, describing deliverables and scope instead of sales claims. Use this bounded seed content (prices shown in rupees; multiply by 100 in storage):

| Provider | Service | Price | Effort | Skills |
| --- | --- | --- | --- | --- |
| Ravi Mehta (existing) | Campus event poster (existing) | 1,800 | 3h | Poster design |
| Ravi Mehta | Social media launch kit | 2,400 | 5h | Graphic design, Social media design |
| Nila Shah | Responsive portfolio website | 6,500 | 12h | Frontend development, Web design |
| Nila Shah | Website mobile layout review | 2,200 | 4h | Frontend development, Accessibility |
| Ishan Rao | Short-form video edit | 2,800 | 5h | Video editing |
| Tara Sen | Clear website copy | 2,000 | 4h | Copywriting |
| Tara Sen | Pitch deck layout | 3,200 | 6h | Presentation design |
| Kabir Das | Product photo cleanup | 1,600 | 3h | Photo editing |

New accounts use the existing fictional `@skillhigh-campus.com` convention and development password. Do not add review rows, proof rows, payment events, or completed orders to make the catalog look established. Add “Research report proofreading” (₹1,500, 3h), “Club launch video” (₹3,000, 6h), and “Sponsor presentation refresh” (₹2,400, 5h) as Maya's additional projects with matching skills.

- [ ] Run `rtk uv run python backend/seed.py`, then run it again and verify public counts are unchanged. Seed is additive and this is permitted against the development database. Keep seed provenance visible in the development UI using a small “Demo marketplace · fictional listings” note near the catalog/footer, not an intrusive banner.

## Task 3: Replace the two page trees with a single marketplace

**Files:** `app/marketplace.ts`, `app/page.tsx`, `app/globals.css`.

**Interfaces:** The record shapes in Task 1 define TypeScript types. `api<T>(path, options)` preserves the existing `/api/v1` proxy, cookies, and CSRF. `money(amountMinor, currency)` retains `Intl.NumberFormat`. `Workspace` receives `user`, `view`, `id`, and `navigate`; components may call the shared API directly.

- [ ] Move the existing API/currency helpers to `app/marketplace.ts`. Preserve response status on thrown errors and turn FastAPI 422 detail arrays into readable messages. Do not display `[object Object]`.
- [ ] Separate session loading from resource loading. Only an actual 401 from session validation clears the user. An orders/profile/catalog 500 or network error produces a visible retryable section error and preserves the session and loaded data. Signed out is an expected state, not a red error banner.
- [ ] Replace `Item = Record<string, unknown>` for the main records with small types matching Task 1. Use one category mapping for labels, keyword/skill classification, and photo filenames. Derive categories from listing skills/title because the existing schema has no category column; include an Other fallback and mark this deliberate heuristic with a `ponytail:` comment explaining that persisted categories can replace it when taxonomy expands.
- [ ] Make screens addressable using `/?view=services`, `/?view=projects`, `/?view=service&id=1`, `/?view=project&id=1`, `/?view=orders`, and equivalent account views. Preserve `q`, `category`, `maxPrice`, and `sort` for catalogs. Use the installed Next navigation primitives or a small native History API handler; back, forward, refresh, and direct links must restore the screen. Do not introduce a router dependency. Avoid a `useSearchParams` production-build failure by supplying its required Suspense boundary if using that hook.
- [ ] Use actual anchors for resource/navigation links. Use buttons for mutations. A public detail route must fetch its own ID, not depend on an item left in React state. Invalid/missing IDs show a clear unavailable state with a Browse link.
- [ ] Implement the accepted shared header/category/catalog/detail composition. Search matches normalized title, description, seller/client name, and skill names; category and price filters combine; sort supports newest and price ascending/descending; displayed result counts follow filtered API data. Native selects and number inputs suffice. Preserve a single search term across header and result screen. Do not truncate silently to six results.
- [ ] Client-side filtering is adequate for this small catalog. Add one `ponytail:` comment explaining the in-memory catalog ceiling and server pagination upgrade path. Never claim database full-text search or intelligent recommendations.
- [ ] Render the photos as category illustrations. Use “New” for zero seller reviews, with no star glyph/number implying a rating. Detail captions explain the photo; never call these portfolio samples or completed work.
- [ ] Authentication must remember the desired route. After login, return to the detail/form and let the user make the explicit purchase/application action; do not automatically create an order as a side effect of signing in. Signed-in owners see an informative own-listing state.
- [ ] Request service calls the existing POST and opens `/?view=order&id=<returned id>` with “Waiting for provider” status. Apply calls the existing POST and updates the applied state/My applications. No View details link should scroll to auth.
- [ ] Replace obsolete CSS rather than layering new overrides over both themes. Scope component styles; avoid global `header`/`h1` rules that accidentally recreate the dark-panel and giant-heading bugs.

Shared mutation semantics must fix the existing root bugs:

```tsx
const form = event.currentTarget; // Capture before awaiting anything.
const body = Object.fromEntries(new FormData(form));
try {
  const result = await api<Result>(path, {
    method: "POST", body: JSON.stringify(body),
  });
  form.reset(); // Only after a successful write.
  return result;
} catch (error) {
  // Render a local error; keep the form values. Never report success here.
}
```

If keeping a shared mutation helper, it must return the response or explicit success/failure, not swallow errors while callers assume success. Disable duplicate submission while pending; show a relevant success message; preserve typed message/delivery/profile values on failure. Profile state comes from the successful server response, never a blind local update after a failed save.

## Task 4: Make account and order workflows usable

**Files:** `app/workspace.tsx`, `app/page.tsx`, `app/globals.css`.

- [ ] Build the compact Orders, My projects, My applications, My services, Profile, and Admin screens listed above using the real reads. Profile availability initializes from GET `/me/availability`, not the existing hardcoded six hours. Show saved skills and proof records; keep private proof records private.
- [ ] Show owned projects even after assignment. Fetch applicants only on the owner screen, display their real identity/skills, and accept using the existing application ID. On success open the returned order. Handle 409 by refreshing project/applicant availability and explaining that the project is already assigned.
- [ ] Use separate create forms so the user performs one clear task. Inputs: title length 4–140, scope 10–5000, rupee amount positive with step 0.01, integer hours 1–200, comma-separated skill names; scale uses supported choices. Render INR as a label, not a strange read-only text field. Convert rupees with `Math.round(Number(value) * 100)` and reject nonfinite/nonpositive/unsafe integers. Trim and deduplicate skill names before sending. Navigate using the created resource ID.
- [ ] Load order detail and messages together when its ID changes. Always render delivery note, safe link, author and time before the client's acceptance action. The latest delivery is clearly identified; history remains readable after revision. Render external links only when URL parsing confirms HTTP(S), with `rel="noopener noreferrer"` for new tabs.
- [ ] Implement actions strictly from the real role/status matrix:

| State | Worker | Client |
| --- | --- | --- |
| pending_acceptance | Accept request; cancel | Waiting for provider; cancel |
| active | Delivery form with note and optional link; cancel | Waiting for delivery; cancel |
| submitted | Waiting for review; view delivery; cancel | View latest delivery; request revision; accept latest delivery; cancel |
| completed | Review client once; proof visible in profile | Review worker once |
| cancelled | Read-only agreement/history | Read-only agreement/history |

- [ ] Use order `reviews` to hide an already-submitted review form and show the saved review. Use readable status labels such as “In progress” and “Waiting for provider”, while API values stay unchanged. Do not present effort as a guaranteed delivery date.
- [ ] Messages refresh after send and on an explicit Refresh action. A small cleaned-up interval while the order screen is open is optional; do not claim live chat unless it exists. Preserve draft text if a send fails, and clear draft state when switching orders so one partner's draft does not leak into another order.
- [ ] Put problem reporting in a compact secondary `details` area, with a required reason and the existing POST. Show open/resolved dispute state; completion remains blocked by the server until resolution. Admin Resolve refreshes actual data and only reports success after it succeeds.
- [ ] Keep cancellation as an explicit secondary destructive action with the existing endpoint. Do not cancel or reorder anything automatically.
- [ ] Place payment simulation in a development-only section labeled “Payment simulator — no money moves”. Show real `payment_status` and `payout_status`; do not imply escrow or real earnings. Preserve the current provider-fee meaning: amount is the price, fee is deducted from the provider's payout; do not invent an extra checkout charge.

## Task 5: Verify the whole user journey and reconcile documentation

**Files:** affected implementation files; factual documentation listed above. Screenshot artifacts belong under `.impeccable/review/`.

- [ ] Run `rtk uv run pytest backend/tests -q` sequentially and `rtk bun run build`. Resolve errors; do not stop after visual markup compiles. Do not add a test framework or lockfile dependencies.
- [ ] Ask the parent to restart the specific API process after backend changes; use the already-running Next dev process. The parent has a working browser route through Playwright: `rtk uv run --with playwright python`, with executable `/home/adi/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`. Browser MCP is unavailable. Do not launch unrelated apps or kill other processes.
- [ ] Check public screens at 1440×900 and 390×844. Capture home, filtered catalog, service detail, signed-in account menu, owned-project applicants, and order detail. Verify loaded image natural widths, no console exceptions, no page overflow, and focus/keyboard usability. Inspect the screenshots, including seller/price visibility in the first desktop viewport. Compare against `.impeccable/review/before-rebuild.png` and `before-signed-in.png`.
- [ ] Verify search by a service title and a skill; combine category and price filters; verify empty results and Clear filters; open a detail in a fresh tab; use back/forward and reload. Ensure no dead links or auth-scroll actions remain.
- [ ] Use distinct client and worker browser contexts for the end-to-end path: open service signed out → sign in as Maya → request service → see pending order → Ravi accepts → Ravi sends message and delivery link → Maya reads link and requests revision → Ravi resubmits → Maya accepts latest delivery → both see completed status → Maya reviews → Ravi's seller aggregate and proof update. Do not create a second order just by refreshing.
- [ ] Run the project path as well: Maya publishes a project → Ravi applies → Maya opens My projects/applicants → accepts Ravi → order opens → assigned project remains visible. Verify own listing actions are disabled/informative and strangers cannot inspect applicants/order history.
- [ ] Verify a failed POST leaves typed data intact and shows an error, and a failed optional GET does not log the user out. Registration, profile save/readback, skill add/readback, availability readback, logout, admin overview, and dispute resolution must still work. Do not claim a path was verified unless it was exercised.
- [ ] Update documentation to name the actual new query-addressable screens and read endpoints, true catalog contents, honest rating/illustration handling, in-memory catalog filtering, existing matching formula, optional/manual message refresh, and unchanged simulator/mail/upload limits. Replace outdated warm-paper/dark-listing design rules with the implemented values. Avoid documenting speculative full-text search, email delivery, uploaded files, public proof sharing, or notifications.
- [ ] Inspect the final diff and provide the parent a short handoff: changed files, commands/results, screenshots, and any specific remaining issue. Do not commit or push; parent owns final review/publishing.

## Completion standard

The deliverable is a working local marketplace, not a static Fiverr imitation. It is complete when the first screen looks like a credible service catalog, the same design persists after login, details are directly addressable, buyers can select applicants and inspect deliveries, all exposed actions persist correctly, and the tested limitations are stated accurately. Do not expand into real payments, scanner setup, external notifications, a new backend architecture, seller package tiers, or made-up social proof.
