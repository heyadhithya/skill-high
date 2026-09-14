"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  Application,
  Message,
  Navigate,
  Order,
  Proof,
  Project,
  Route,
  Service,
  User,
  api,
  earningsByCurrency,
  initials,
  imageFor,
  labelStatus,
  money,
  safeUrl,
} from "./marketplace";

export default function Workspace({
  user,
  view,
  id,
  navigate,
  onUserUpdated,
  onCatalogChanged,
}: {
  user: User;
  view: string;
  id?: number;
  navigate: Navigate;
  onUserUpdated: (user: User) => void;
  onCatalogChanged: () => Promise<void>;
}) {
  if (view === "create" || view === "create-service" || view === "edit-service" || view === "edit-project")
    return (
      <CreateWorkspace
        navigate={navigate}
        initialKind={view === "create-service" || view === "edit-service" ? "service" : "project"}
        listingId={view.startsWith("edit-") ? id : undefined}
        onCatalogChanged={onCatalogChanged}
      />
    );
  if (view === "profile")
    return (
      <ProfileWorkspace
        user={user}
        navigate={navigate}
        onUserUpdated={onUserUpdated}
      />
    );
  if (view === "projects-mine")
    return <ProjectsWorkspace navigate={navigate} onCatalogChanged={onCatalogChanged} />;
  if (view === "applications")
    return <ApplicationsWorkspace navigate={navigate} />;
  if (view === "services-mine")
    return <ServicesWorkspace user={user} navigate={navigate} onCatalogChanged={onCatalogChanged} />;
  if (view === "applicants" && id)
    return <ApplicantsWorkspace projectId={id} navigate={navigate} onCatalogChanged={onCatalogChanged} />;
  if (view === "admin") return <AdminWorkspace />;
  if (view === "inbox") return <InboxWorkspace user={user} navigate={navigate} />;
  if (view === "earnings") return <EarningsWorkspace user={user} />;
  if (view === "dashboard") return <DashboardWorkspace user={user} navigate={navigate} />;
  return (
    <OrdersWorkspace
      user={user}
      orderId={view === "order" ? id : undefined}
      navigate={navigate}
    />
  );
}

function CreateWorkspace({
  navigate,
  initialKind = "project",
  listingId,
  onCatalogChanged,
}: {
  navigate: Navigate;
  initialKind?: "project" | "service";
  listingId?: number;
  onCatalogChanged: () => Promise<void>;
}) {
  const [kind, setKind] = useState<"project" | "service">(initialKind);
  const [listing, setListing] = useState<Service | Project | null>(null);
  const [loading, setLoading] = useState(Boolean(listingId));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (!listingId) return;
    void api<Service[] | Project[]>(kind === "service" ? "/me/services" : "/me/projects")
      .then((rows) => setListing(rows.find((row) => row.id === listingId) ?? null))
      .catch((error) => setError(error instanceof Error ? error.message : "Could not load this listing."))
      .finally(() => setLoading(false));
  }, [listingId, kind]);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError("");
    setNotice("");
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const amount = Number(data.amount_rupees);
    const hours = Number(data.estimated_hours);
    const amountMinor = Math.round(amount * 100);
    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !Number.isSafeInteger(amountMinor) ||
      !Number.isFinite(hours) ||
      hours <= 0
    ) {
      setError("Enter a positive rupee amount and estimated effort.");
      setPending(false);
      return;
    }
    const body: Record<string, unknown> = {
      ...data,
      amount_minor: amountMinor,
      estimated_hours: Math.round(hours),
    };
    delete body.amount_rupees;
    for (const field of ["required_skills", "skills"])
      if (field in body)
        body[field] = Array.from(
          new Set(
            String(body[field])
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
          ),
        );
    try {
      const result = await api<{ id: number }>(
        listingId ? `${kind === "project" ? "/projects" : "/services"}/${listingId}` : kind === "project" ? "/projects" : "/services",
        { method: listingId ? "PUT" : "POST", body: JSON.stringify(body) },
      );
      setNotice(listingId ? "Changes saved." : "Published.");
      await onCatalogChanged();
      form.reset();
      navigate(listingId ? { view: kind === "project" ? "projects-mine" : "services-mine", id: undefined } : { view: kind === "project" ? "project" : "service", id: result.id });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not publish this listing.",
      );
    } finally {
      setPending(false);
    }
  };
  return (
    <section className="workspace-shell">
      <div className="workspace-heading">
        <div>
          <h1>{listingId ? `Edit your ${kind === "project" ? "project" : "service"}.` : "Put a clear offer into the marketplace."}</h1>
          <p>
            Use concrete scope, rupees, and estimated effort. No delivery
            promise is implied by effort.
          </p>
        </div>
      </div>
      {!listingId && <div className="create-tabs">
        <button
          className={kind === "project" ? "selected" : ""}
          onClick={() => setKind("project")}
        >
          Post a project
        </button>
        <button
          className={kind === "service" ? "selected" : ""}
          onClick={() => setKind("service")}
        >
          Offer a service
        </button>
      </div>}
      {loading ? <div className="page-loading">Loading listing…</div> : <form className="form-panel form-stack" onSubmit={submit}>
        <label>
          <span>Title</span>
          <input
            name="title"
            defaultValue={listing?.title}
            required
            minLength={4}
            placeholder={
              kind === "project"
                ? "e.g. Edit our club launch video"
                : "e.g. Responsive portfolio website"
            }
          />
        </label>
        <label>
          <span>
            {kind === "project" ? "Project brief" : "What will you deliver?"}
          </span>
          <textarea
            name="description"
            defaultValue={listing?.description}
            required
            minLength={10}
            placeholder="Describe the concrete result, materials, and handoff."
          />
        </label>
        <div className="form-columns">
          <label>
            <span>Budget / price in rupees</span>
            <input
              name="amount_rupees"
              defaultValue={listing ? listing.amount_minor / 100 : undefined}
              type="number"
              min="0.01"
              step="0.01"
              required
              placeholder="1800"
            />
          </label>
          <label>
            <span>Estimated effort in hours</span>
            <input
              name="estimated_hours"
              defaultValue={listing?.estimated_hours}
              type="number"
              min="1"
              max="200"
              step="1"
              required
              placeholder="4"
            />
          </label>
        </div>
        {kind === "project" && (
          <label>
            <span>Project scale</span>
            <select name="scale" defaultValue={(listing as Project | null)?.scale || "micro"}>
              <option value="micro">Micro</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="long_term">Long term</option>
            </select>
          </label>
        )}
        <label>
          <span>{kind === "project" ? "Required skills" : "Skills used"}</span>
          <input
            name={kind === "project" ? "required_skills" : "skills"}
            defaultValue={kind === "project" ? (listing as Project | null)?.required_skills.join(", ") : (listing as Service | null)?.skills.join(", ")}
            placeholder="Separate skills with commas"
          />
        </label>
        <input type="hidden" name="currency" value="INR" />
        {error && <p className="notice notice-error">{error}</p>}
        {notice && <p className="notice notice-success">{notice}</p>}
        <button className="button button-primary" disabled={pending}>
          {pending ? "Saving…" : listingId ? "Save changes" : kind === "project" ? "Publish project" : "Publish service"}
        </button>
      </form>}
    </section>
  );
}

function ProjectsWorkspace({ navigate, onCatalogChanged }: { navigate: Navigate; onCatalogChanged: () => Promise<void> }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<number | null>(null);
  useEffect(() => {
    void api<Project[]>("/me/projects")
      .then(setProjects)
      .catch((error) =>
        setError(
          error instanceof Error
            ? error.message
            : "Could not load your projects.",
        ),
      );
  }, []);
  const close = async (projectId: number) => { if (!window.confirm("Close this project and its pending applications?")) return; setPending(projectId); setError(""); try { await api(`/projects/${projectId}/close`, { method: "POST" }); setProjects((rows) => rows.map((item) => item.id === projectId ? { ...item, status: "closed" } : item)); await onCatalogChanged(); } catch (error) { setError(error instanceof Error ? error.message : "Could not close this project."); } finally { setPending(null); } };
  return (
    <section className="workspace-shell">
      <WorkspaceTitle
        title="My projects"
        text="Projects you own, including assigned work and applicant counts."
        action={
          <button
            className="button button-primary"
            onClick={() => navigate({ view: "create" })}
          >
            Post a project
          </button>
        }
      />
      {error && <p className="notice notice-error">{error}</p>}
      <div className="record-list">
        {projects.length ? (
          projects.map((project) => (
            <article className="record-row" key={project.id}>
              <div>
                <span className="status-tag">
                  {labelStatus(project.status)}
                </span>
                <h2>{project.title}</h2>
                <p>
                  {project.application_count ?? 0} applicant
                  {project.application_count === 1 ? "" : "s"} ·{" "}
                  {money(project.amount_minor, project.currency)}
                </p>
              </div>
              <div className="record-actions">
                {project.status === "open" && (project.application_count ?? 0) === 0 && <button className="button button-secondary" onClick={() => navigate({ view: "edit-project", id: project.id })}>Edit</button>}
                {project.status === "open" && <button className="button button-secondary" disabled={pending === project.id} onClick={() => void close(project.id)}>{pending === project.id ? "Closing…" : "Close"}</button>}
                {project.order_id ? (
                  <button
                    className="button button-secondary"
                    onClick={() =>
                      navigate({
                        view: "order",
                        id: project.order_id ?? undefined,
                      })
                    }
                  >
                    Open order
                  </button>
                ) : (
                  <button
                    className="button button-secondary"
                    onClick={() =>
                      navigate({ view: "applicants", id: project.id })
                    }
                  >
                    View applicants
                  </button>
                )}
              </div>
            </article>
          ))
        ) : (
          <Empty
            title="No projects yet"
            text="Post a focused brief when you need help."
          />
        )}
      </div>
    </section>
  );
}

function ApplicantsWorkspace({
  projectId,
  navigate,
  onCatalogChanged,
}: {
  projectId: number;
  navigate: Navigate;
  onCatalogChanged: () => Promise<void>;
}) {
  const [rows, setRows] = useState<
    Array<{
      id: number;
      status: string;
      worker_id: number;
      worker: {
        display_name: string;
        career_stage: string;
        bio: string;
        skills: string[];
      };
    }>
  >([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<number | null>(null);
  const load = () =>
    api<typeof rows>(`/projects/${projectId}/applications`)
      .then(setRows)
      .catch((error) =>
        setError(
          error instanceof Error ? error.message : "Could not load applicants.",
        ),
      );
  useEffect(() => {
    void load();
  }, [projectId]);
  const accept = async (applicationId: number) => {
    setPending(applicationId);
    setError("");
    try {
      const order = await api<Order>(`/applications/${applicationId}/accept`, {
        method: "POST",
      });
      await onCatalogChanged();
      navigate({ view: "order", id: order.id });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not accept this applicant.",
      );
    } finally {
      setPending(null);
    }
  };
  return (
    <section className="workspace-shell">
      <button
        className="back-link"
        onClick={() => navigate({ view: "projects-mine" })}
      >
        My projects
      </button>
      <WorkspaceTitle
        title="Project applicants"
        text="Review public work identity and accept one pending application."
      />
      {error && <p className="notice notice-error">{error}</p>}
      <div className="record-list">
        {rows.length ? (
          rows.map((row) => (
            <article className="applicant-row" key={row.id}>
              <span className="avatar">
                {initials(row.worker.display_name)}
              </span>
              <div>
                <h2>{row.worker.display_name}</h2>
                <p>
                  {labelStatus(row.worker.career_stage)} ·{" "}
                  {row.worker.bio || "No bio added yet."}
                </p>
                <div className="tag-row">
                  {row.worker.skills.map((skill) => (
                    <span className="tag" key={skill}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div className="record-actions">
                <span className="status-tag">{labelStatus(row.status)}</span>
                {row.status === "pending" && (
                  <button
                    className="button button-primary"
                    disabled={pending === row.id}
                    onClick={() => void accept(row.id)}
                  >
                    {pending === row.id ? "Accepting…" : "Accept"}
                  </button>
                )}
              </div>
            </article>
          ))
        ) : (
          <Empty
            title="No applications yet"
            text="Applications will appear here when workers apply."
          />
        )}
      </div>
    </section>
  );
}

function ApplicationsWorkspace({ navigate }: { navigate: Navigate }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<number | null>(null);
  const load = () => api<Application[]>("/me/applications").then(setApplications).catch((error) => setError(error instanceof Error ? error.message : "Could not load your applications."));
  useEffect(() => {
    void load();
  }, []);
  const withdraw = async (id: number) => { setPending(id); setError(""); try { await api(`/applications/${id}/withdraw`, { method: "POST" }); await load(); } catch (error) { setError(error instanceof Error ? error.message : "Could not withdraw this application."); } finally { setPending(null); } };
  const applyAgain = async (id: number) => { setPending(id); setError(""); try { await api(`/projects/${id}/applications`, { method: "POST" }); await load(); } catch (error) { setError(error instanceof Error ? error.message : "Could not apply again."); } finally { setPending(null); } };
  return (
    <section className="workspace-shell">
      <WorkspaceTitle
        title="My applications"
        text="Track applications and open an order when a client accepts."
      />
      {error && <p className="notice notice-error">{error}</p>}
      <div className="record-list">
        {applications.length ? (
          applications.map((item) => (
            <article className="record-row" key={item.id}>
              <div>
                <span className="status-tag">
                  {item.project.status === "assigned" &&
                  item.status !== "accepted"
                    ? "Project filled"
                    : labelStatus(item.status)}
                </span>
                <h2>{item.project.title}</h2>
                <p>
                  {item.project.client.display_name} ·{" "}
                  {money(item.project.amount_minor, item.project.currency)}
                </p>
              </div>
              <div>
                {item.order_id ? (
                  <button
                    className="button button-secondary"
                    onClick={() =>
                      navigate({
                        view: "order",
                        id: item.order_id ?? undefined,
                      })
                    }
                  >
                    Open order
                  </button>
                ) : item.status === "pending" ? (
                  <button className="button button-secondary" disabled={pending === item.id} onClick={() => void withdraw(item.id)}>{pending === item.id ? "Withdrawing…" : "Withdraw"}</button>
                ) : item.status === "withdrawn" && item.project.status === "open" ? (
                  <button className="button button-secondary" disabled={pending === item.id} onClick={() => void applyAgain(item.project.id)}>{pending === item.id ? "Applying…" : "Apply again"}</button>
                ) : (
                  <button
                    className="button button-secondary"
                    onClick={() =>
                      navigate({ view: "project", id: item.project.id })
                    }
                  >
                    View project
                  </button>
                )}
              </div>
            </article>
          ))
        ) : (
          <Empty
            title="No applications yet"
            text="Find a project and apply when the scope fits."
          />
        )}
      </div>
    </section>
  );
}

function ServicesWorkspace({
  user,
  navigate,
  onCatalogChanged,
}: {
  user: User;
  navigate: Navigate;
  onCatalogChanged: () => Promise<void>;
}) {
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<number | null>(null);
  const load = () => api<Service[]>("/me/services").then(setServices).catch((error) => setError(error instanceof Error ? error.message : "Could not load your services."));
  useEffect(() => {
    void load();
  }, [user.id]);
  const visibility = async (service: Service) => { setPending(service.id); setError(""); try { await api(`/services/${service.id}/visibility`, { method: "PATCH", body: JSON.stringify({ is_active: !service.is_active }) }); await load(); await onCatalogChanged(); } catch (error) { setError(error instanceof Error ? error.message : "Could not change visibility."); } finally { setPending(null); } };
  return (
    <section className="workspace-shell">
      <WorkspaceTitle
        title="My services"
        text="Keep future terms current while preserving every existing order snapshot."
        action={
          <button
            className="button button-primary"
            onClick={() => navigate({ view: "create-service" })}
          >
            Offer a service
          </button>
        }
      />
      {error && <p className="notice notice-error">{error}</p>}
      <div className="service-grid">
        {services.length ? (
          services.map((service) => (
            <article className="service-card compact-service" key={service.id}>
              <a
                className="card-image-link"
                href={`/?view=${service.is_active ? "service" : "edit-service"}&id=${service.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  navigate({ view: service.is_active ? "service" : "edit-service", id: service.id });
                }}
              >
                <img
                  src={imageFor(service)}
                  alt={`${service.title} category illustration`}
                />
              </a>
              <div className="card-content">
                <span className="status-tag">{service.is_active ? "Live" : "Paused"}</span>
                <a
                  className="card-title"
                  href={`/?view=${service.is_active ? "service" : "edit-service"}&id=${service.id}`}
                  onClick={(event) => {
                    event.preventDefault();
                    navigate({ view: service.is_active ? "service" : "edit-service", id: service.id });
                  }}
                >
                  {service.title}
                </a>
                <p>
                  {money(service.amount_minor, service.currency)} ·{" "}
                  {service.estimated_hours}h effort
                </p>
                <div className="record-actions"><button className="button button-secondary" onClick={() => navigate({ view: "edit-service", id: service.id })}>Edit</button><button className="button button-secondary" disabled={pending === service.id} onClick={() => void visibility(service)}>{pending === service.id ? "Saving…" : service.is_active ? "Pause" : "Resume"}</button></div>
              </div>
            </article>
          ))
        ) : (
          <Empty
            title="No services yet"
            text="Offer one concrete skill to start building your catalog."
          />
        )}
      </div>
    </section>
  );
}

function OrdersWorkspace({
  user,
  orderId,
  navigate,
}: {
  user: User;
  orderId?: number;
  navigate: Navigate;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  useEffect(() => {
    void api<Order[]>("/orders")
      .then(setOrders)
      .catch((error) =>
        setError(
          error instanceof Error ? error.message : "Could not load orders.",
        ),
      );
  }, [orderId]);
  if (orderId)
    return <OrderDetail user={user} orderId={orderId} navigate={navigate} />;
  const shown = orders.filter(
    (order) =>
      filter === "all" ||
      (filter === "buying" && order.client_id === user.id) ||
      (filter === "selling" && order.worker_id === user.id),
  );
  return (
    <section className="workspace-shell">
      <WorkspaceTitle
        title="Orders"
        text="Every accepted service or project becomes one recorded order."
      />
      <div className="segmented">
        <button
          className={filter === "all" ? "selected" : ""}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          className={filter === "buying" ? "selected" : ""}
          onClick={() => setFilter("buying")}
        >
          Buying
        </button>
        <button
          className={filter === "selling" ? "selected" : ""}
          onClick={() => setFilter("selling")}
        >
          Selling
        </button>
      </div>
      {error && <p className="notice notice-error">{error}</p>}
      <div className="record-list">
        {shown.length ? (
          shown.map((order) => (
            <button
              className="record-row order-row"
              key={order.id}
              onClick={() => navigate({ view: "order", id: order.id })}
            >
              <div>
                <span className="status-tag">{labelStatus(order.status)}</span>
                <h2>{order.title}</h2>
                <p>
                  {order.client_id === user.id ? "Buying" : "Selling"} ·{" "}
                  {order.client_id === user.id ? "Provider" : "Client"}
                </p>
              </div>
              <strong>{money(order.amount_minor, order.currency)}</strong>
            </button>
          ))
        ) : (
          <Empty
            title="No orders yet"
            text="Request a service or accept a project to begin an order."
          />
        )}
      </div>
    </section>
  );
}

function OrderDetail({
  user,
  orderId,
  navigate,
}: {
  user: User;
  orderId: number;
  navigate: Navigate;
}) {
  const [order, setOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [delivery, setDelivery] = useState("");
  const [link, setLink] = useState("");
  const [review, setReview] = useState("");
  const [rating, setRating] = useState("5");
  const [dispute, setDispute] = useState("");
  const [paymentOutcome, setPaymentOutcome] = useState<"success" | "failure" | "refund" | "payout">("success");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const lastMessageId = useRef(0);
  const load = async () => {
    try {
      const [loaded, thread] = await Promise.all([
        api<Order>(`/orders/${orderId}`),
        api<Message[]>(`/orders/${orderId}/messages`),
      ]);
      setOrder(loaded);
      setMessages(thread);
      lastMessageId.current = thread.at(-1)?.id ?? 0;
      setError("");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not load this order.",
      );
    }
  };
  useEffect(() => {
    setMessage("");
    setDelivery("");
    setLink("");
    setDispute("");
    void load();
  }, [orderId]);
  useEffect(() => {
    if (!orderId) return;
    const poll = () => {
      if (document.hidden) return;
      void api<Message[]>(`/orders/${orderId}/messages?after_id=${lastMessageId.current}`).then((rows) => {
        if (!rows.length) return;
        lastMessageId.current = Math.max(lastMessageId.current, ...rows.map((row) => row.id));
        setMessages((current) => [...current, ...rows.filter((row) => !current.some((item) => item.id === row.id))]);
      }).catch(() => undefined);
    };
    const timer = window.setInterval(poll, 8000);
    return () => window.clearInterval(timer);
  }, [orderId]);
  const action = async (path: string, body?: Record<string, unknown>) => {
    if (pending) return false;
    setPending(true);
    setError("");
    setNotice("");
    try {
      await api(path, {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      });
      setNotice("Updated.");
      await load();
      return true;
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "That action could not be completed.",
      );
      return false;
    } finally {
      setPending(false);
    }
  };
  if (error && !order)
    return (
      <section className="detail-shell">
        <p className="notice notice-error">{error}</p>
        <button
          className="button button-secondary"
          onClick={() => navigate({ view: "orders" })}
        >
          Back to orders
        </button>
      </section>
    );
  if (!order) return <div className="page-loading">Loading order…</div>;
  const isWorker = order.worker_id === user.id;
  const isClient = order.client_id === user.id;
  const latest = order.deliveries?.find(
    (item) => item.id === order.latest_delivery_id,
  );
  const reviewByUser = order.reviews?.some(
    (item) => item.author_id === user.id,
  );
  return (
    <section className="detail-shell order-detail">
      <button
        className="back-link"
        onClick={() => navigate({ view: "orders" })}
      >
        Orders
      </button>
      {error && <p className="notice notice-error">{error}</p>}
      {notice && <p className="notice notice-success">{notice}</p>}
      <div className="order-layout">
        <div className="order-main">
          <div className="order-title-row">
            <div>
              <span className="status-tag">{labelStatus(order.status)}</span>
              <h1>{order.title}</h1>
              <p>
                {isClient
                  ? `Working with ${order.worker?.display_name}`
                  : `For ${order.client?.display_name}`}
              </p>
            </div>
            <strong className="order-amount">
              {money(order.amount_minor, order.currency)}
            </strong>
          </div>
          <section className="order-section">
            <h2>Scope</h2>
            <p>{order.scope_snapshot}</p>
            <p className="muted">
              Estimated effort: {order.estimated_hours} hours. Payments are
              simulated in development.
            </p>
          </section>
          <section className="order-section">
            <h2>Delivery history</h2>
            {order.deliveries?.length ? (
              order.deliveries.map((item) => (
                <article
                  className={`delivery ${item.id === order.latest_delivery_id ? "delivery-latest" : ""}`}
                  key={item.id}
                >
                  <div>
                    <strong>
                      {item.id === order.latest_delivery_id
                        ? "Latest delivery"
                        : "Earlier delivery"}
                    </strong>
                    <p>{item.message}</p>
                    {safeUrl(item.submission_url) && (
                      <a
                        href={safeUrl(item.submission_url)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open submitted link
                      </a>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <p className="muted">No delivery submitted yet.</p>
            )}
          </section>
          {isWorker && order.status === "pending_acceptance" && (
            <section className="action-box">
              <h2>Review request</h2>
              <p>Accept this service request to open the order workspace.</p>
              <button
                className="button button-primary"
                disabled={pending}
                onClick={() => void action(`/orders/${order.id}/accept`)}
              >
                Accept request
              </button>
            </section>
          )}
          {isWorker && order.status === "active" && (
            <section className="action-box">
              <h2>Submit a delivery</h2>
              <label>
                Delivery note
                <textarea
                  value={delivery}
                  onChange={(event) => setDelivery(event.target.value)}
                  required
                />
              </label>
              <label>
                Link to your work (optional)
                <input
                  value={link}
                  onChange={(event) => setLink(event.target.value)}
                  placeholder="https://…"
                />
              </label>
              <button
                className="button button-primary"
                disabled={pending || !delivery.trim()}
                onClick={() =>
                  void action(`/orders/${order.id}/deliveries`, {
                    message: delivery,
                    submission_url: link,
                  }).then((ok) => {
                    if (ok) {
                      setDelivery("");
                      setLink("");
                    }
                  })
                }
              >
                Submit delivery
              </button>
            </section>
          )}
          {isClient && order.status === "submitted" && (
            <div className="action-row">
              <button
                className="button button-secondary"
                disabled={pending}
                onClick={() =>
                  void action(`/orders/${order.id}/request-revision`)
                }
              >
                Request revision
              </button>
              <button
                className="button button-primary"
                disabled={pending || !order.latest_delivery_id}
                onClick={() =>
                  void action(`/orders/${order.id}/complete`, {
                    delivery_id: order.latest_delivery_id,
                  })
                }
              >
                Accept latest delivery
              </button>
            </div>
          )}
          {order.status === "completed" && !reviewByUser && (
            <section className="action-box">
              <h2>Leave a verified review</h2>
              <div className="form-columns">
                <label>
                  Rating
                  <select
                    value={rating}
                    onChange={(event) => setRating(event.target.value)}
                  >
                    <option value="5">5 · Excellent</option>
                    <option value="4">4 · Good</option>
                    <option value="3">3 · Okay</option>
                    <option value="2">2 · Needs work</option>
                    <option value="1">1 · Poor</option>
                  </select>
                </label>
                <label>
                  Review
                  <textarea
                    value={review}
                    onChange={(event) => setReview(event.target.value)}
                  />
                </label>
              </div>
              <button
                className="button button-primary"
                disabled={pending || !review.trim()}
                onClick={() =>
                  void action(`/orders/${order.id}/reviews`, {
                    rating: Number(rating),
                    body: review,
                  }).then((ok) => {
                    if (ok) setReview("");
                  })
                }
              >
                Leave review
              </button>
            </section>
          )}
          {order.status !== "completed" && order.status !== "cancelled" && (
            <section className="action-box">
              <label>
                Problem details
                <textarea
                  value={dispute}
                  onChange={(event) => setDispute(event.target.value)}
                  placeholder="Describe what needs help before reporting it."
                  required
                />
              </label>
              <div className="action-row">
                <button
                  className="button button-secondary"
                  disabled={pending || !dispute.trim()}
                  onClick={() =>
                    void action(`/orders/${order.id}/disputes`, {
                      reason: dispute,
                    }).then((ok) => {
                      if (ok) setDispute("");
                    })
                  }
                >
                  Report a problem
                </button>
                <button
                  className="button button-secondary"
                  disabled={pending}
                  onClick={() => void action(`/orders/${order.id}/cancel`)}
                >
                  Cancel order
                </button>
              </div>
            </section>
          )}
          {order.disputes?.length ? (
            <section className="order-section">
              <h2>Disputes</h2>
              {order.disputes.map((item) => (
                <p className="notice notice-neutral" key={item.id}>
                  {labelStatus(item.status)} · {item.reason}
                </p>
              ))}
            </section>
          ) : null}
        </div>
        <aside className="order-aside">
          <section className="summary-panel">
            <h2>Agreement</h2>
            <p>
              <span>Status</span>
              <strong>{labelStatus(order.status)}</strong>
            </p>
            <p>
              <span>Payment</span>
              <strong>{labelStatus(order.payment_status)}</strong>
            </p>
            <p>
              <span>Fee</span>
              <strong>{money(order.fee_minor, order.currency)}</strong>
            </p>
            <p>
              <span>Worker net</span>
              <strong>{money(order.amount_minor - order.fee_minor, order.currency)}</strong>
            </p>
            <p>
              <span>Payout</span>
              <strong>{labelStatus(order.payout_status)}</strong>
            </p>
            <p>
              <span>Effort</span>
              <strong>{order.estimated_hours} hours</strong>
            </p>
            {isClient && process.env.NODE_ENV === "development" && (
              <details className="payment-simulator">
                <summary>Development payment simulator</summary>
                <label>
                  Event outcome
                  <select value={paymentOutcome} onChange={(event) => setPaymentOutcome(event.target.value as typeof paymentOutcome)}>
                    <option value="success">Success / fund</option>
                    <option value="failure">Failure</option>
                    <option value="refund">Refund</option>
                    <option value="payout">Payout</option>
                  </select>
                </label>
                <button
                  className="button button-secondary button-wide"
                  disabled={pending}
                  onClick={() => void action(`/payments/simulate/${order.id}?event_id=ui-${order.id}-${Date.now()}&outcome=${paymentOutcome}`)}
                >
                  Simulate payment
                </button>
              </details>
            )}
          </section>
          <section className="message-panel" id="order-messages" aria-labelledby="order-messages-title">
            <div className="message-heading">
              <h2 id="order-messages-title">Messages</h2>
              <button
                className="button button-secondary"
                disabled={pending}
                onClick={() => void load()}
              >
                Refresh
              </button>
            </div>
            <div className="message-list">
              {messages.map((item) => (
                <div
                  className={`message ${item.author_id === user.id ? "message-own" : ""}`}
                  key={item.id}
                >
                  <strong>
                    {item.author_id === user.id ? "You" : "Partner"}
                  </strong>
                  <p>{item.body}</p>
                </div>
              ))}
            </div>
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                if (
                  message.trim() &&
                  (await action(`/orders/${order.id}/messages`, {
                    body: message,
                  }))
                )
                  setMessage("");
              }}
            >
              <input
                aria-label="Message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Write a message"
              />
              <button
                className="button button-primary"
                disabled={pending || !message.trim()}
              >
                Send
              </button>
            </form>
          </section>
        </aside>
      </div>
    </section>
  );
}

function DashboardWorkspace({ user, navigate }: { user: User; navigate: Navigate }) {
  const [orders, setOrders] = useState<Order[]>([]); const [projects, setProjects] = useState<Project[]>([]); const [applications, setApplications] = useState<Application[]>([]); const [matches, setMatches] = useState<Array<{ project_id: number; title: string; why: string }>>([]); const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  const load = () => { setLoading(true); setError(""); return Promise.all([api<Order[]>("/orders"), api<Project[]>("/me/projects"), api<Application[]>("/me/applications"), api<typeof matches>("/matches")]).then(([loadedOrders, loadedProjects, loadedApplications, loadedMatches]) => { setOrders(loadedOrders); setProjects(loadedProjects); setApplications(loadedApplications); setMatches(loadedMatches); }).catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load your overview.")).finally(() => setLoading(false)); };
  useEffect(() => { void load(); }, []);
  const pendingRequests = orders.filter((item) => item.worker_id === user.id && item.status === "pending_acceptance"); const deliverables = orders.filter((item) => item.worker_id === user.id && item.status === "active"); const reviews = orders.filter((item) => item.client_id === user.id && item.status === "submitted"); const applicants = projects.reduce((total, item) => total + (item.application_count ?? 0), 0);
  return <section className="workspace-shell"><WorkspaceTitle title={`Good to see you, ${user.display_name}.`} text="Your next useful action, work history, and hiring activity in one place." action={<button className="button button-secondary" onClick={() => void load()} disabled={loading}>{loading ? "Refreshing…" : "Retry"}</button>} />{error && <p className="notice notice-error" role="alert">{error}</p>}{loading ? <div className="page-loading">Loading your overview…</div> : <><div className="overview-grid"><section className="form-panel"><h2>Your work</h2><OverviewLine label="Requests to accept" count={pendingRequests.length} action={() => navigate({ view: "orders" })} /><OverviewLine label="Active deliveries" count={deliverables.length} action={() => navigate({ view: "orders" })} /><OverviewLine label="Applications" count={applications.length} action={() => navigate({ view: "applications" })} />{matches.slice(0, 3).map((item) => <button className="admin-line overview-link" key={item.project_id} onClick={() => navigate({ view: "project", id: item.project_id })}><strong>{item.title}</strong><span>{item.why}</span></button>)}{!pendingRequests.length && !deliverables.length && !applications.length && !matches.length && <Empty title="No work in motion yet" text="Find a focused project or offer one useful service." />}</section><section className="form-panel"><h2>Your hiring</h2><OverviewLine label="Deliveries to review" count={reviews.length} action={() => navigate({ view: "orders" })} /><OverviewLine label="Open projects" count={projects.filter((item) => item.status === "open").length} action={() => navigate({ view: "projects-mine" })} /><OverviewLine label="Applicants" count={applicants} action={() => navigate({ view: "projects-mine" })} /><div className="action-row"><button className="button button-primary" onClick={() => navigate({ view: "create" })}>Post a project</button><button className="button button-secondary" onClick={() => navigate({ view: "services" })}>Find talent</button></div></section></div><div className="overview-footer"><button className="button button-secondary" onClick={() => navigate({ view: "profile" })}>Update skills and availability</button><button className="button button-secondary" onClick={() => navigate({ view: "earnings" })}>View simulated earnings</button></div></> }</section>;
}

function OverviewLine({ label, count, action }: { label: string; count: number; action: () => void }) {
  return <button className="overview-line" onClick={action}><span>{label}</span><strong>{count}</strong></button>;
}

function InboxWorkspace({ user, navigate }: { user: User; navigate: Navigate }) {
  const [orders, setOrders] = useState<Order[]>([]); const [error, setError] = useState(""); const [loading, setLoading] = useState(true); const load = () => { setLoading(true); setError(""); return api<Order[]>("/orders").then(setOrders).catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load your inbox.")).finally(() => setLoading(false)); };
  useEffect(() => { void load(); }, []);
  return <section className="workspace-shell"><WorkspaceTitle title="Inbox" text="Order conversations, with the latest message visible at a glance." action={<button className="button button-secondary" onClick={() => void load()} disabled={loading}>{loading ? "Refreshing…" : "Retry"}</button>} />{error && <p className="notice notice-error" role="alert">{error}</p>}{loading ? <div className="page-loading">Loading your inbox…</div> : <div className="record-list">{orders.length ? orders.map((order) => <button className="record-row inbox-row" key={order.id} onClick={() => navigate({ view: "order", id: order.id })}><div><span className="status-tag">{labelStatus(order.status)}</span><h2>{order.title}</h2><p>{order.client_id === user.id ? order.worker?.display_name : order.client?.display_name} · {order.last_message?.body || "No messages yet"}</p></div><small>{order.last_message?.created_at ? new Date(order.last_message.created_at).toLocaleDateString("en-IN") : ""}</small></button>) : <Empty title="No conversations yet" text="Messages appear here once an order exists." />}</div>}</section>;
}

function EarningsWorkspace({ user }: { user: User }) {
  const [orders, setOrders] = useState<Order[]>([]); const [error, setError] = useState(""); const [loading, setLoading] = useState(true); const load = () => { setLoading(true); setError(""); return api<Order[]>("/orders").then(setOrders).catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load earnings.")).finally(() => setLoading(false)); };
  useEffect(() => { void load(); }, []);
  const totals = earningsByCurrency(orders, user.id);
  const workerOrders = orders.filter((item) => item.worker_id === user.id);
  return <section className="workspace-shell"><WorkspaceTitle title="Simulated earnings" text="Completed work value and simulated payouts, separated by currency. Nothing here is withdrawable balance." action={<button className="button button-secondary" onClick={() => void load()} disabled={loading}>{loading ? "Refreshing…" : "Retry"}</button>} />{error && <p className="notice notice-error" role="alert">{error}</p>}{loading ? <div className="page-loading">Loading earnings…</div> : <><div className="profile-metrics">{totals.length ? totals.map((total) => <div key={total.currency}><strong>{money(total.completed_net_minor, total.currency)}</strong><span>Completed work value · {total.currency}</span><small>{money(total.paid_net_minor, total.currency)} simulated payouts</small></div>) : <div><strong>—</strong><span>No completed work yet</span></div>}</div><div className="record-list">{workerOrders.length ? workerOrders.map((order) => <article className="record-row" key={order.id}><div><span className="status-tag">{labelStatus(order.status)}</span><h2>{order.title}</h2><p>{money(order.amount_minor, order.currency)} · Fee {money(order.fee_minor, order.currency)} · Net {money(order.amount_minor - order.fee_minor, order.currency)}</p></div><strong>{labelStatus(order.payout_status)}</strong></article>) : <Empty title="No worker orders yet" text="Accepted work will appear here after a client hires you." />}</div></>}</section>;
}

function ProfileWorkspace({
  user,
  navigate,
  onUserUpdated,
}: {
  user: User;
  navigate: Navigate;
  onUserUpdated: (user: User) => void;
}) {
  const [name, setName] = useState(user.display_name);
  const [bio, setBio] = useState(user.bio || "");
  const [stage, setStage] = useState(user.career_stage);
  const [skills, setSkills] = useState<Array<{ name: string; level: string }>>(
    [],
  );
  const [proof, setProof] = useState<Proof[]>([]);
  const [dashboard, setDashboard] = useState<{
    proof_count: number;
    average_rating: number | null;
  }>({ proof_count: 0, average_rating: null });
  const [matches, setMatches] = useState<
    Array<{ project_id: number; title: string; why: string }>
  >([]);
  const [skill, setSkill] = useState("");
  const [hours, setHours] = useState("0");
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const resendVerification = async () => { try { await api("/auth/resend-verification", { method: "POST" }); setNotice("A verification link was prepared in the local development mail sink."); } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not resend verification."); } };
  const toggleProof = async (item: Proof) => { try { const updated = await api<Proof>(`/me/proof/${item.id}`, { method: "PATCH", body: JSON.stringify({ public: !item.public }) }); setProof((rows) => rows.map((row) => row.id === item.id ? updated : row)); } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not change proof visibility."); } };
  useEffect(() => {
    void Promise.all([
      api<Array<{ name: string; level: string }>>("/me/skills"),
      api<{ hours_per_week: number; note: string }>("/me/availability"),
      api<typeof proof>("/me/proof"),
      api<typeof dashboard>("/dashboard"),
      api<typeof matches>("/matches"),
    ])
      .then(
        ([
          loadedSkills,
          availability,
          loadedProof,
          loadedDashboard,
          loadedMatches,
        ]) => {
          setSkills(loadedSkills);
          setHours(String(availability.hours_per_week));
          setNote(availability.note);
          setProof(loadedProof);
          setDashboard(loadedDashboard);
          setMatches(loadedMatches);
        },
      )
      .catch((error) =>
        setError(
          error instanceof Error
            ? error.message
            : "Could not load your profile details.",
        ),
      );
  }, []);
  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const saved = await api<User>("/me", {
        method: "PATCH",
        body: JSON.stringify({ display_name: name, bio, career_stage: stage }),
      });
      onUserUpdated(saved);
      setNotice("Profile saved.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not save profile.",
      );
    }
  };
  const addSkill = async () => {
    if (!skill.trim()) return;
    try {
      const added = await api<{ name: string; level: string }>("/skills", {
        method: "POST",
        body: JSON.stringify({ name: skill, level: "working" }),
      });
      setSkills((current) => [
        ...current.filter((item) => item.name !== added.name),
        added,
      ]);
      setSkill("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not add skill.");
    }
  };
  const saveAvailability = async () => {
    try {
      await api("/me/availability", {
        method: "PUT",
        body: JSON.stringify({ hours_per_week: Number(hours), note }),
      });
      setNotice("Availability saved.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not save availability.",
      );
    }
  };
  return (
    <section className="workspace-shell">
      <WorkspaceTitle
        title="Your profile"
        text="Keep the public basics of your work identity clear."
        action={<button className="button button-secondary" onClick={() => navigate({ view: "person", id: user.id })}>View public profile</button>}
      />
      {error && <p className="notice notice-error">{error}</p>}
      {notice && <p className="notice notice-success">{notice}</p>}
      <div className="profile-metrics">
        <div>
          <strong>{dashboard.proof_count}</strong>
          <span>Proof records</span>
        </div>
        <div>
          <strong>By currency</strong>
          <button className="text-link" type="button" onClick={() => navigate({ view: "earnings" })}>Open simulated earnings</button>
        </div>
        <div>
          <strong>{dashboard.average_rating ?? "New"}</strong>
          <span>Average rating</span>
        </div>
      </div>
      <div className="workspace-columns">
        <form className="form-panel form-stack" onSubmit={saveProfile}>
          <h2>Profile details</h2>
          <label>
            Display name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
          <label>
            Career stage
            <select
              value={stage}
              onChange={(event) => setStage(event.target.value)}
            >
              <option value="student">Student</option>
              <option value="graduate">Graduate</option>
            </select>
          </label>
          <label>
            Bio
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder="What kind of work do you enjoy?"
            />
          </label>
          <button className="button button-primary">Save profile</button>
          <div className="verification-state"><strong>{user.is_verified ? "Email verified" : "Email not verified"}</strong>{!user.is_verified && <button className="button button-secondary" type="button" onClick={() => void resendVerification()}>Resend verification</button>}<small>Development links are written to the local mail sink; no email is delivered.</small></div>
          <h2>Verified proof of work</h2>
          {proof.length ? (
            proof.map((item) => (
              <div className="proof-row" key={item.id}><a className="admin-line" href={`/?view=order&id=${item.order_id}`} onClick={(event) => { event.preventDefault(); navigate({ view: "order", id: item.order_id }); }}><strong>{item.title}</strong><span>Order #{item.order_id} · {item.public ? "Public" : "Private"}</span></a><label className="proof-toggle"><input type="checkbox" checked={item.public} onChange={() => void toggleProof(item)} /><span>Show this proof on my public profile</span><small>Shares only the title, skills, and completion date. Publish only if the project title is safe to share.</small></label></div>
            ))
          ) : (
            <p className="muted">Accepted deliveries will appear here.</p>
          )}
        </form>
        <div className="form-panel form-stack">
          <h2>Skills and availability</h2>
          <label>
            Add a skill
            <input
              value={skill}
              onChange={(event) => setSkill(event.target.value)}
              placeholder="e.g. Poster design"
            />
          </label>
          <button
            className="button button-secondary"
            onClick={() => void addSkill()}
          >
            Add skill
          </button>
          <div className="tag-row">
            {skills.map((item) => (
              <span className="tag" key={item.name}>
                {item.name}
              </span>
            ))}
          </div>
          <label>
            Hours per week
            <input
              type="number"
              min="0"
              max="80"
              value={hours}
              onChange={(event) => setHours(event.target.value)}
            />
          </label>
          <label>
            Availability note
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Optional context for matching"
            />
          </label>
          <button
            className="button button-secondary"
            onClick={() => void saveAvailability()}
          >
            Save availability
          </button>
          <h2>Suggested projects</h2>
          {matches.length ? (
            matches.slice(0, 3).map((item) => (
              <a
                className="admin-line"
                href={`/?view=project&id=${item.project_id}`}
                key={item.project_id}
                onClick={(event) => {
                  event.preventDefault();
                  navigate({ view: "project", id: item.project_id });
                }}
              >
                <strong>{item.title}</strong>
                <span>{item.why}</span>
              </a>
            ))
          ) : (
            <p className="muted">
              Add skills and availability to receive matches.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function AdminWorkspace() {
  const [overview, setOverview] = useState<{
    users: Array<{
      id: number;
      display_name: string;
      email: string;
      career_stage: string;
    }>;
    projects: Array<{ id: number; title: string; status: string }>;
    disputes: Array<{
      id: number;
      order_id: number;
      reason: string;
      status: string;
    }>;
  } | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<number | null>(null);
  const load = () =>
    api<typeof overview>("/admin/overview")
      .then(setOverview)
      .catch((error) =>
        setError(
          error instanceof Error
            ? error.message
            : "Could not load admin overview.",
        ),
      );
  const resolve = async (disputeId: number) => {
    setPending(disputeId);
    setError("");
    try {
      await api(`/admin/disputes/${disputeId}/resolve`, { method: "POST" });
      await load();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not resolve this dispute.",
      );
    } finally {
      setPending(null);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  if (error)
    return (
      <section className="workspace-shell">
        <p className="notice notice-error">{error}</p>
      </section>
    );
  if (!overview) return <div className="page-loading">Loading admin…</div>;
  return (
    <section className="workspace-shell">
      <WorkspaceTitle
        title="Admin overview"
        text="Restricted marketplace operations and dispute resolution."
      />
      <div className="workspace-columns">
        <section className="form-panel">
          <h2>Users</h2>
          {overview.users.map((item) => (
            <p className="admin-line" key={item.id}>
              <strong>{item.display_name}</strong>
              <span>
                {item.email} · {item.career_stage}
              </span>
            </p>
          ))}
        </section>
        <section className="form-panel">
          <h2>Disputes</h2>
          {overview.disputes.length ? (
            overview.disputes.map((item) => (
              <article className="admin-dispute" key={item.id}>
                <strong>Order #{item.order_id}</strong>
                <p>{item.reason}</p>
                <span className="status-tag">{item.status}</span>
                {item.status === "open" && (
                  <button
                    className="button button-primary"
                    disabled={pending === item.id}
                    onClick={() => void resolve(item.id)}
                  >
                    {pending === item.id ? "Resolving…" : "Resolve"}
                  </button>
                )}
              </article>
            ))
          ) : (
            <p className="muted">No disputes.</p>
          )}
          <h2>Projects</h2>
          {overview.projects.map((item) => (
            <p className="admin-line" key={item.id}>
              <strong>{item.title}</strong>
              <span>{item.status}</span>
            </p>
          ))}
        </section>
      </div>
    </section>
  );
}

function WorkspaceTitle({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="workspace-heading">
      <div>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
      {action}
    </div>
  );
}
function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}
