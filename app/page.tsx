"use client";

import { FormEvent, useEffect, useState } from "react";

type User = {
  id: number;
  email: string;
  display_name: string;
  career_stage: string;
  is_admin: boolean;
};
type Item = Record<string, unknown>;

function csrf() {
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("sh_csrf="))
      ?.split("=")[1] ?? ""
  );
}
async function api(path: string, options: RequestInit = {}) {
  const method = options.method ?? "GET";
  const headers = new Headers(options.headers);
  if (method !== "GET") headers.set("X-CSRF-Token", csrf());
  if (options.body && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  const response = await fetch(`/api/v1${path}`, {
    ...options,
    headers,
    credentials: "include",
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail ?? "Request failed");
  }
  return response.status === 204 ? null : response.json();
}
const money = (amount: unknown, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount ?? 0) / 100);

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState("marketplace");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [projects, setProjects] = useState<Item[]>([]);
  const [services, setServices] = useState<Item[]>([]);
  const [orders, setOrders] = useState<Item[]>([]);
  const [matches, setMatches] = useState<Item[]>([]);
  const [proof, setProof] = useState<Item[]>([]);
  const [dashboard, setDashboard] = useState<Item>({});
  const [selectedOrder, setSelectedOrder] = useState<Item | null>(null);
  const [messages, setMessages] = useState<Item[]>([]);

  const loadPublicListings = async () => {
    try {
      const [p, s] = await Promise.all([api("/projects"), api("/services")]);
      setProjects(p);
      setServices(s);
    } catch {
      // Public listing discovery is optional while the API is starting.
    }
  };

  const refresh = async () => {
    try {
      const me = (await api("/me")) as User;
      setUser(me);
      const [p, s, o, m, pr, d] = await Promise.all([
        api("/projects"),
        api("/services"),
        api("/orders"),
        api("/matches"),
        api("/me/proof"),
        api("/dashboard"),
      ]);
      setProjects(p);
      setServices(s);
      setOrders(o);
      setMatches(m);
      setProof(pr);
      setDashboard(d);
    } catch {
      setUser(null);
    }
  };
  useEffect(() => {
    refresh();
    loadPublicListings();
  }, []);
  const submit = async (
    event: FormEvent<HTMLFormElement>,
    path: string,
    after = refresh,
  ) => {
    event.preventDefault();
    setError("");
    setNotice("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const body: Record<string, unknown> = { ...data };
    for (const field of [
      "amount_minor",
      "estimated_hours",
      "hours_per_week",
      "rating",
    ])
      if (field in body) body[field] = Number(body[field]);
    for (const field of ["required_skills", "skills"])
      if (field in body)
        body[field] = String(body[field])
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
    try {
      await api(path, { method: "POST", body: JSON.stringify(body) });
      event.currentTarget.reset();
      setNotice("Saved.");
      await after();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    }
  };
  const chooseOrder = async (order: Item) => {
    setSelectedOrder(order);
    setMessages(await api(`/orders/${order.id}/messages`));
    setTab("workspace");
  };
  const action = async (path: string, body?: Item, method = "POST") => {
    try {
      await api(path, {
        method,
        body: body ? JSON.stringify(body) : undefined,
      });
      setNotice("Updated.");
      await refresh();
      if (selectedOrder)
        setSelectedOrder(await api(`/orders/${selectedOrder.id}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    }
  };

  if (!user)
    return (
      <PublicLanding
        projects={projects}
        services={services}
        error={error}
        onDone={refresh}
        setError={setError}
      />
    );

  return (
    <main className="shell">
      <header>
        <div className="brand">
          <span className="mark">SH</span>Skill-High
        </div>
        <div className="row">
          <span className="pill">{user.career_stage}</span>
          <strong>{user.display_name}</strong>
          <button
            className="secondary"
            onClick={async () => {
              await api("/auth/logout", { method: "POST" });
              setUser(null);
            }}
          >
            Log out
          </button>
        </div>
      </header>
      <nav className="tabs" aria-label="Workspace">
        {[
          "marketplace",
          "create",
          "dashboard",
          "workspace",
          "profile",
          ...(user.is_admin ? ["admin"] : []),
        ].map((name) => (
          <button
            key={name}
            className="secondary tab"
            aria-selected={tab === name}
            onClick={() => setTab(name)}
          >
            {name[0].toUpperCase() + name.slice(1)}
          </button>
        ))}
      </nav>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="success" role="status">
          {notice}
        </p>
      )}
      {tab === "marketplace" && (
        <Marketplace
          projects={projects}
          services={services}
          currentUser={user}
          apply={(id) => action(`/projects/${id}/applications`)}
          buy={(id) => action(`/services/${id}/orders`)}
        />
      )}
      {tab === "create" && <CreateForms submit={submit} />}
      {tab === "dashboard" && (
        <Dashboard
          dashboard={dashboard}
          matches={matches}
          proof={proof}
          orders={orders}
          chooseOrder={chooseOrder}
        />
      )}
      {tab === "workspace" && (
        <Workspace
          order={selectedOrder}
          messages={messages}
          user={user}
          action={action}
          refreshMessages={async () => {
            if (selectedOrder) {
              setMessages(await api(`/orders/${selectedOrder.id}/messages`));
            }
          }}
        />
      )}
      {tab === "profile" && (
        <Profile user={user} setUser={setUser} action={action} />
      )}
      {tab === "admin" && user.is_admin && <Admin action={action} />}
    </main>
  );
}

function Auth({
  onDone,
  error,
  setError,
}: {
  onDone: () => Promise<void>;
  error: string;
  setError: (x: string) => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const showDemoAccounts = process.env.NODE_ENV === "development";
  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const body = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await api(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      await onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign in");
    }
  };
  return (
    <section className="card auth-card">
      <h2>{mode === "login" ? "Welcome back" : "Build your work profile"}</h2>
      <form className="form" onSubmit={submitAuth}>
        <label>
          Email
          <input
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={12}
            required
          />
        </label>
        {mode === "register" && (
          <>
            <label>
              Display name
              <input name="display_name" required />
            </label>
            <label>
              Career stage
              <select name="career_stage">
                <option value="student">Student</option>
                <option value="graduate">Graduate</option>
              </select>
            </label>
            <input name="timezone" value="Asia/Kolkata" readOnly />
          </>
        )}
        <button>{mode === "login" ? "Log in" : "Create account"}</button>
      </form>
      {mode === "login" && showDemoAccounts && (
        <section className="demo-login" aria-label="Development demo accounts">
          <strong>Try a demo account</strong>
          <p className="small muted">
            Choose a role to fill the local development credentials.
          </p>
          <div className="row">
            {[
              ["Worker", "ravi@skillhigh-campus.com"],
              ["Client", "maya@skillhigh-campus.com"],
              ["Admin", "admin@skillhigh-campus.com"],
            ].map(([label, demoEmail]) => (
              <button
                className="secondary"
                key={label}
                type="button"
                onClick={() => {
                  setEmail(demoEmail);
                  setPassword("skillhigh-demo-123");
                  setError("");
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </section>
      )}
      <p className="small">
        {mode === "login" ? "New here? " : "Already joined? "}
        <button
          className="secondary"
          type="button"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Register" : "Log in"}
        </button>
      </p>
      {error && <p className="error">{error}</p>}
    </section>
  );
}

function PublicLanding({
  projects,
  services,
  error,
  onDone,
  setError,
}: {
  projects: Item[];
  services: Item[];
  error: string;
  onDone: () => Promise<void>;
  setError: (value: string) => void;
}) {
  const [query, setQuery] = useState("");
  const openJoin = () =>
    document.getElementById("join")?.scrollIntoView({ behavior: "smooth" });
  const listings: Array<Item & { kind: string }> = [
    ...services.map((service): Item & { kind: string } => ({
      ...service,
      kind: "Service",
    })),
    ...projects.map((project): Item & { kind: string } => ({
      ...project,
      kind: "Project",
    })),
  ].filter((listing) =>
    `${listing.title} ${listing.description}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const search = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="market-home">
      <header className="market-header">
        <div className="brand">
          <span className="mark">SH</span>Skill-High
        </div>
        <nav className="market-nav" aria-label="Main navigation">
          <button
            className="nav-link"
            onClick={() =>
              document
                .getElementById("explore")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Explore
          </button>
          <button
            className="nav-link"
            onClick={() =>
              document
                .getElementById("how-it-works")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            How it works
          </button>
          <button className="nav-link" onClick={openJoin}>
            Offer a service
          </button>
          <button className="secondary sign-in-link" onClick={openJoin}>
            Sign in
          </button>
          <button onClick={openJoin}>Join</button>
        </nav>
      </header>

      <section className="market-hero">
        <div className="market-hero-inner">
          <h1>Find practical help. Build work you can stand behind.</h1>
          <p>
            Search student services and project briefs, then agree work through
            one clear order workspace.
          </p>
          <form className="market-search" onSubmit={search}>
            <label className="sr-only" htmlFor="market-search">
              Search services and projects
            </label>
            <input
              id="market-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="What do you need help with?"
            />
            <button>Search</button>
          </form>
          <div className="popular-searches" aria-label="Popular searches">
            <span>Popular:</span>
            {["Poster", "Landing page", "Design", "Website"].map((term) => (
              <button key={term} type="button" onClick={() => setQuery(term)}>
                {term}
              </button>
            ))}
          </div>
        </div>
      </section>

      <nav className="category-bar" aria-label="Service categories">
        {[
          "Design",
          "Development",
          "Writing",
          "Marketing",
          "Video",
          "Research",
        ].map((category) => (
          <button key={category} onClick={() => setQuery(category)}>
            {category}
          </button>
        ))}
      </nav>

      <section className="market-section" id="explore">
        <div className="section-heading">
          <div>
            <h2>Browse available work</h2>
            <p>Live services and project briefs from the local marketplace.</p>
          </div>
          <button className="secondary" onClick={() => setQuery("")}>
            Show all
          </button>
        </div>
        <div className="listing-grid">
          {listings.length ? (
            listings.slice(0, 6).map((listing) => (
              <article
                className="market-listing"
                key={`${listing.kind}-${listing.id}`}
              >
                <div className="listing-cover" aria-hidden="true">
                  <span>{String(listing.kind)}</span>
                  <strong>{String(listing.title).slice(0, 42)}</strong>
                </div>
                <div className="listing-body">
                  <span className="listing-kind">{String(listing.kind)}</span>
                  <h3>{String(listing.title)}</h3>
                  <p>{String(listing.description)}</p>
                  <div className="listing-foot">
                    <strong>
                      {money(listing.amount_minor, String(listing.currency))}
                    </strong>
                    <button onClick={openJoin}>View details</button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-market">
              <h3>No listings match that search.</h3>
              <p>
                Try a broader term or publish the first brief for this need.
              </p>
              <button onClick={openJoin}>Post a project</button>
            </div>
          )}
        </div>
      </section>

      <section className="how-it-works" id="how-it-works">
        <div>
          <h2>Built for straightforward small work.</h2>
          <p>Profiles, scopes, delivery, review, and proof stay connected.</p>
        </div>
        <ol>
          <li>
            <strong>Find a fit</strong>
            <span>Search services or post a focused brief.</span>
          </li>
          <li>
            <strong>Agree the scope</strong>
            <span>Accepted work becomes one recorded order.</span>
          </li>
          <li>
            <strong>Keep the proof</strong>
            <span>Completed work adds verified evidence to the profile.</span>
          </li>
        </ol>
      </section>

      <section className="join-section" id="join">
        <div>
          <h2>Join the marketplace.</h2>
          <p>
            Create a profile to apply, hire, offer a service, or use a
            development demo account.
          </p>
        </div>
        <Auth onDone={onDone} error={error} setError={setError} />
      </section>
    </main>
  );
}

function Marketplace({
  projects,
  services,
  currentUser,
  apply,
  buy,
}: {
  projects: Item[];
  services: Item[];
  currentUser: User;
  apply: (id: unknown) => void;
  buy: (id: unknown) => void;
}) {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1>
            Work that fits <em>your skills.</em>
          </h1>
          <p className="lede">
            Projects and services are real records. Applying or ordering creates
            the next step of a real agreement.
          </p>
        </div>
        <div className="card process-card">
          <h3>How it works</h3>
          <p>
            Post a project, apply with your skills, then use the order workspace
            to deliver and build a verified record.
          </p>
        </div>
      </section>
      <section className="grid two">
        <div className="card metric-card">
          <h2>Open projects</h2>
          {projects.length ? (
            projects.map((p) => (
              <article className="listing" key={String(p.id)}>
                <strong>{String(p.title)}</strong>
                <p className="muted">{String(p.description)}</p>
                <div className="row">
                  <span className="pill">{String(p.scale)}</span>
                  <span>{money(p.amount_minor, String(p.currency))}</span>
                  {Number(p.client_id) !== currentUser.id && (
                    <button onClick={() => apply(p.id)}>Apply</button>
                  )}
                </div>
              </article>
            ))
          ) : (
            <p className="muted">No open projects yet.</p>
          )}
        </div>
        <div className="card metric-card">
          <h2>Services</h2>
          {services.length ? (
            services.map((s) => (
              <article className="listing" key={String(s.id)}>
                <strong>{String(s.title)}</strong>
                <p className="muted">{String(s.description)}</p>
                <div className="row">
                  <span>{money(s.amount_minor, String(s.currency))}</span>
                  {Number(s.provider_id) !== currentUser.id && (
                    <button onClick={() => buy(s.id)}>Request service</button>
                  )}
                </div>
              </article>
            ))
          ) : (
            <p className="muted">No services yet.</p>
          )}
        </div>
      </section>
    </>
  );
}

function CreateForms({
  submit,
}: {
  submit: (event: FormEvent<HTMLFormElement>, path: string) => Promise<void>;
}) {
  return (
    <section className="grid two">
      <div className="card">
        <h2>Post a client project</h2>
        <form className="form" onSubmit={(e) => submit(e, "/projects")}>
          <label>
            Title
            <input name="title" required />
          </label>
          <label>
            Scope
            <textarea name="description" required />
          </label>
          <label>
            Budget in paise
            <input name="amount_minor" type="number" min="1" required />
          </label>
          <label>
            Scale
            <select name="scale">
              <option>micro</option>
              <option>small</option>
              <option>medium</option>
            </select>
          </label>
          <label>
            Estimated hours
            <input name="estimated_hours" type="number" min="1" required />
          </label>
          <label>
            Required skills, comma separated
            <input name="required_skills" />
          </label>
          <input name="currency" value="INR" readOnly />
          <button>Publish project</button>
        </form>
      </div>
      <div className="card">
        <h2>Offer a service</h2>
        <form className="form" onSubmit={(e) => submit(e, "/services")}>
          <label>
            Title
            <input name="title" required />
          </label>
          <label>
            What will you deliver?
            <textarea name="description" required />
          </label>
          <label>
            Price in paise
            <input name="amount_minor" type="number" min="1" required />
          </label>
          <label>
            Estimated hours
            <input name="estimated_hours" type="number" min="1" required />
          </label>
          <label>
            Skills, comma separated
            <input name="skills" />
          </label>
          <input name="currency" value="INR" readOnly />
          <button>Publish service</button>
        </form>
      </div>
    </section>
  );
}

function Dashboard({
  dashboard,
  matches,
  proof,
  orders,
  chooseOrder,
}: {
  dashboard: Item;
  matches: Item[];
  proof: Item[];
  orders: Item[];
  chooseOrder: (o: Item) => void;
}) {
  return (
    <>
      <section className="grid">
        <div className="card metric-card">
          <div className="metric">{String(dashboard.active_orders ?? 0)}</div>
          <span className="muted">Active orders</span>
        </div>
        <div className="card">
          <div className="metric">{money(dashboard.earnings_minor)}</div>
          <span className="muted">
            {String(dashboard.payment_label ?? "Development earnings")}
          </span>
        </div>
        <div className="card">
          <div className="metric">{String(dashboard.proof_count ?? 0)}</div>
          <span className="muted">Verified proof records</span>
        </div>
      </section>
      <section className="grid two">
        <div className="card">
          <h2>Your orders</h2>
          {orders.length ? (
            orders.map((o) => (
              <article className="listing order" key={String(o.id)}>
                <strong>{String(o.title)}</strong>
                <div className="row">
                  <span className="pill">{String(o.status)}</span>
                  <span>{money(o.amount_minor, String(o.currency))}</span>
                  <button onClick={() => chooseOrder(o)}>Open workspace</button>
                </div>
              </article>
            ))
          ) : (
            <p className="muted">No agreed work yet.</p>
          )}
        </div>
        <div className="card">
          <h2>Matches</h2>
          {matches.length ? (
            matches.map((m) => (
              <article className="listing" key={String(m.project_id)}>
                <strong>{String(m.title)}</strong>
                <p className="muted">{String(m.why)}</p>
                <span className="pill">score {String(m.score)}</span>
              </article>
            ))
          ) : (
            <p className="muted">
              Add skills and availability to receive matches.
            </p>
          )}
          <h2>Proof of work</h2>
          {proof.length ? (
            proof.map((p) => (
              <p key={String(p.id)}>
                <span className="pill">verified</span> {String(p.title)}
              </p>
            ))
          ) : (
            <p className="muted">Accepted work will appear here.</p>
          )}
        </div>
      </section>
    </>
  );
}

function Workspace({
  order,
  messages,
  user,
  action,
  refreshMessages,
}: {
  order: Item | null;
  messages: Item[];
  user: User;
  action: (path: string, body?: Item, method?: string) => Promise<void>;
  refreshMessages: () => Promise<void>;
}) {
  const [message, setMessage] = useState("");
  const [delivery, setDelivery] = useState("");
  const [link, setLink] = useState("");
  const [dispute, setDispute] = useState("");
  if (!order)
    return (
      <section className="card">
        <h2>Select an order</h2>
        <p className="muted">
          Open an order from your dashboard to message, deliver, revise, accept,
          pay, and review it.
        </p>
      </section>
    );
  const isWorker = Number(order.worker_id) === user.id;
  const isClient = Number(order.client_id) === user.id;
  const status = String(order.status);
  return (
    <section className="grid two">
      <div className="card">
        <p className="pill">{status}</p>
        <h2>{String(order.title)}</h2>
        <p>{String(order.scope_snapshot)}</p>
        <p>
          <strong>{money(order.amount_minor, String(order.currency))}</strong> ·
          fee {money(order.fee_minor, String(order.currency))}
        </p>
        <div className="row">
          {status === "pending_acceptance" && isWorker && (
            <button onClick={() => action(`/orders/${order.id}/accept`)}>
              Accept work
            </button>
          )}
          {status === "active" && isWorker && (
            <button
              onClick={() =>
                action(`/orders/${order.id}/deliveries`, {
                  message: delivery,
                  submission_url: link,
                })
              }
            >
              Submit delivery
            </button>
          )}
          {status === "submitted" && isClient && (
            <>
              <button
                className="secondary"
                onClick={() => action(`/orders/${order.id}/request-revision`)}
              >
                Request revision
              </button>
              <button
                onClick={() =>
                  action(`/orders/${order.id}/complete`, {
                    delivery_id: Number(order.latest_delivery_id),
                  })
                }
              >
                Accept delivery
              </button>
            </>
          )}
          {isClient && (
            <button
              className="secondary"
              onClick={() =>
                action(
                  `/payments/simulate/${order.id}?event_id=ui-${order.id}-${Date.now()}`,
                )
              }
            >
              Simulate payment
            </button>
          )}
          {status !== "completed" && status !== "cancelled" && (
            <button
              className="warn"
              onClick={() =>
                action(`/orders/${order.id}/disputes`, { reason: dispute })
              }
            >
              Report a problem
            </button>
          )}
        </div>
        {status === "active" && isWorker && (
          <div className="form">
            <label>
              Delivery note
              <textarea
                value={delivery}
                onChange={(e) => setDelivery(e.target.value)}
              />
            </label>
            <label>
              Delivery link
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
              />
            </label>
          </div>
        )}
        {status === "completed" && (
          <ReviewForm orderId={Number(order.id)} action={action} />
        )}
        {status !== "completed" && status !== "cancelled" && (
          <label>
            Problem details
            <textarea
              value={dispute}
              onChange={(e) => setDispute(e.target.value)}
              placeholder="Describe the issue before reporting it"
            />
          </label>
        )}
      </div>
      <div className="card">
        <h2>Order messages</h2>
        {messages.map((m) => (
          <div className="message" key={String(m.id)}>
            <strong>
              {Number(m.author_id) === user.id ? "You" : "Partner"}
            </strong>
            <br />
            {String(m.body)}
          </div>
        ))}
        <form
          className="row"
          onSubmit={async (e) => {
            e.preventDefault();
            if (message.trim()) {
              await action(`/orders/${order.id}/messages`, { body: message });
              setMessage("");
              await refreshMessages();
            }
          }}
        >
          <input
            aria-label="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write a project message"
          />
          <button>Send</button>
        </form>
      </div>
    </section>
  );
}

function ReviewForm({
  orderId,
  action,
}: {
  orderId: number;
  action: (path: string, body?: Item, method?: string) => Promise<void>;
}) {
  const [body, setBody] = useState("");
  return (
    <div className="form">
      <label>
        Rating
        <select id="rating">
          <option value="5">5 · Excellent</option>
          <option value="4">4 · Good</option>
          <option value="3">3 · Okay</option>
          <option value="2">2 · Needs work</option>
          <option value="1">1 · Poor</option>
        </select>
      </label>
      <label>
        Review
        <textarea value={body} onChange={(e) => setBody(e.target.value)} />
      </label>
      <button
        onClick={() =>
          action(`/orders/${orderId}/reviews`, {
            rating: Number(
              (document.getElementById("rating") as HTMLSelectElement)?.value ??
                5,
            ),
            body,
          })
        }
      >
        Leave verified review
      </button>
    </div>
  );
}

function Profile({
  user,
  setUser,
  action,
}: {
  user: User;
  setUser: (u: User) => void;
  action: (path: string, body?: Item, method?: string) => Promise<void>;
}) {
  const [name, setName] = useState(user.display_name);
  const [stage, setStage] = useState(user.career_stage);
  const [skill, setSkill] = useState("");
  const [hours, setHours] = useState("6");
  return (
    <section className="grid two">
      <div className="card">
        <h2>Your profile</h2>
        <form
          className="form"
          onSubmit={async (e) => {
            e.preventDefault();
            await action(
              "/me",
              { display_name: name, career_stage: stage },
              "PATCH",
            );
            setUser({ ...user, display_name: name, career_stage: stage });
          }}
        >
          <label>
            Display name
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Career stage
            <select value={stage} onChange={(e) => setStage(e.target.value)}>
              <option>student</option>
              <option>graduate</option>
            </select>
          </label>
          <button>Save profile</button>
        </form>
      </div>
      <div className="card">
        <h2>Skill and availability</h2>
        <div className="form">
          <label>
            Skill
            <input
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              placeholder="e.g. Poster design"
            />
          </label>
          <button
            onClick={() => action("/skills", { name: skill, level: "working" })}
          >
            Add skill
          </button>
          <label>
            Hours per week
            <input
              type="number"
              min="0"
              max="80"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </label>
          <button
            className="secondary"
            onClick={() =>
              action(
                "/me/availability",
                { hours_per_week: Number(hours) },
                "PUT",
              )
            }
          >
            Save availability
          </button>
        </div>
        <p className="small muted">
          Availability informs matching; it does not reserve time until you
          accept work.
        </p>
      </div>
    </section>
  );
}

function Admin({
  action,
}: {
  action: (path: string, body?: Item, method?: string) => Promise<void>;
}) {
  const [overview, setOverview] = useState<Item | null>(null);
  const [error, setError] = useState("");
  const load = async () => {
    try {
      setOverview(await api("/admin/overview"));
      setError("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not load administration",
      );
    }
  };
  useEffect(() => {
    load();
  }, []);
  if (error)
    return (
      <section className="card">
        <p className="error">{error}</p>
      </section>
    );
  if (!overview)
    return (
      <section className="card">
        <p>Loading administration…</p>
      </section>
    );
  const disputes = (overview.disputes as Item[]) ?? [];
  const users = (overview.users as Item[]) ?? [];
  const projects = (overview.projects as Item[]) ?? [];
  return (
    <section className="grid two">
      <div className="card">
        <h2>Users</h2>
        {users.map((u) => (
          <p className="listing" key={String(u.id)}>
            <strong>{String(u.display_name)}</strong> · {String(u.email)} ·{" "}
            {String(u.career_stage)}
          </p>
        ))}
      </div>
      <div className="card">
        <h2>Reports and disputes</h2>
        {disputes.length ? (
          disputes.map((d) => (
            <article className="listing" key={String(d.id)}>
              <strong>Order #{String(d.order_id)}</strong>
              <p>{String(d.reason)}</p>
              <div className="row">
                <span className="pill">{String(d.status)}</span>
                {String(d.status) === "open" && (
                  <button
                    onClick={async () => {
                      await action(`/admin/disputes/${d.id}/resolve`);
                      await load();
                    }}
                  >
                    Resolve
                  </button>
                )}
              </div>
            </article>
          ))
        ) : (
          <p className="muted">No open reports.</p>
        )}
        <h2>Listings</h2>
        {projects.map((p) => (
          <p className="listing" key={String(p.id)}>
            {String(p.title)} · <span className="pill">{String(p.status)}</span>
          </p>
        ))}
      </div>
    </section>
  );
}
