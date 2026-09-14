"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Workspace from "./workspace";
import {
  ApiError,
  Service,
  Project,
  User,
  api,
  categories,
  categoryFor,
  imageFor,
  initials,
  labelStatus,
  money,
} from "./marketplace";

type Route = {
  view: string;
  id?: number;
  q: string;
  category: string;
  maxPrice: string;
  sort: string;
  next?: string;
};

function readRoute(): Route {
  const params = new URLSearchParams(window.location.search);
  const rawId = Number(params.get("id"));
  return {
    view: params.get("view") || "services",
    id: Number.isFinite(rawId) && rawId > 0 ? rawId : undefined,
    q: params.get("q") || "",
    category: params.get("category") || "All services",
    maxPrice: params.get("maxPrice") || "",
    sort: params.get("sort") || "newest",
    next: params.get("next") || undefined,
  };
}

function href(route: Partial<Route>, current: Route): string {
  const params = new URLSearchParams();
  const next = { ...current, ...route };
  if (next.view && next.view !== "services") params.set("view", next.view);
  if (next.id) params.set("id", String(next.id));
  if (next.q) params.set("q", next.q);
  if (next.category && next.category !== "All services")
    params.set("category", next.category);
  if (next.maxPrice) params.set("maxPrice", next.maxPrice);
  if (next.sort && next.sort !== "newest") params.set("sort", next.sort);
  if (next.next) params.set("next", next.next);
  return params.toString() ? `/?${params}` : "/";
}

export default function Home() {
  const [route, setRoute] = useState<Route>({
    view: "services",
    q: "",
    category: "All services",
    maxPrice: "",
    sort: "newest",
  });
  const [user, setUser] = useState<User | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [catalogError, setCatalogError] = useState("");
  const [authError, setAuthError] = useState("");

  const navigate = (next: Partial<Route>, replace = false) => {
    const updated = { ...route, ...next };
    const url = href(updated, updated);
    window.history[replace ? "replaceState" : "pushState"]({}, "", url);
    setRoute(readRoute());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const loadCatalog = async () => {
    try {
      const [serviceRows, projectRows] = await Promise.all([
        api<Service[]>("/services"),
        api<Project[]>("/projects"),
      ]);
      setServices(serviceRows);
      setProjects(projectRows);
      setCatalogError("");
    } catch (error) {
      setCatalogError(
        error instanceof Error
          ? error.message
          : "The marketplace could not load. Try again.",
      );
    }
  };
  const loadSession = async () => {
    try {
      setUser(await api<User>("/me"));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) setUser(null);
      else
        setAuthError(
          error instanceof Error
            ? error.message
            : "The session could not be checked.",
        );
    } finally {
      setSessionLoading(false);
    }
  };
  useEffect(() => {
    setRoute(readRoute());
    const onPopState = () => setRoute(readRoute());
    window.addEventListener("popstate", onPopState);
    void loadSession();
    void loadCatalog();
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  const signOut = async () => {
    await api("/auth/logout", { method: "POST" });
    setUser(null);
    navigate({ view: "services", id: undefined, next: undefined });
  };
  const afterAuth = async () => {
    await loadSession();
    if (route.next) {
      const parsed = new URL(route.next, window.location.origin);
      navigate({
        view: parsed.searchParams.get("view") || "services",
        id: Number(parsed.searchParams.get("id")) || undefined,
        q: parsed.searchParams.get("q") || "",
        category: parsed.searchParams.get("category") || "All services",
        maxPrice: parsed.searchParams.get("maxPrice") || "",
        sort: parsed.searchParams.get("sort") || "newest",
        next: undefined,
      });
    } else navigate({ view: "services", next: undefined });
  };
  const needsAuth = () => navigate({ view: "auth", next: href(route, route) });

  if (sessionLoading)
    return <div className="page-loading">Loading Skill-High…</div>;
  return (
    <div className="site">
      <Header user={user} route={route} navigate={navigate} signOut={signOut} />
      {route.view !== "auth" && (
        <CategoryBar route={route} navigate={navigate} />
      )}
      <main>
        {authError && route.view !== "auth" && (
          <InlineNotice tone="error" text={authError} />
        )}
        {route.view === "auth" ? (
          <AuthScreen
            onDone={afterAuth}
            initialMode={route.next ? "login" : "register"}
            error={authError}
            setError={setAuthError}
          />
        ) : route.view === "service" && route.id ? (
          <ServiceDetail
            id={route.id}
            currentUser={user}
            services={services}
            navigate={navigate}
            needsAuth={needsAuth}
          />
        ) : route.view === "project" && route.id ? (
          <ProjectDetail
            id={route.id}
            currentUser={user}
            projects={projects}
            navigate={navigate}
            needsAuth={needsAuth}
          />
        ) : [
            "orders",
            "order",
            "create",
            "create-service",
            "profile",
            "projects-mine",
            "applications",
            "services-mine",
            "applicants",
            "admin",
          ].includes(route.view) ? (
          user ? (
            <Workspace
              user={user}
              view={route.view}
              id={route.id}
              navigate={navigate}
              onUserUpdated={setUser}
            />
          ) : (
            <SignInPrompt navigate={navigate} />
          )
        ) : route.view === "projects" ? (
          <ProjectCatalog
            projects={projects}
            route={route}
            navigate={navigate}
            catalogError={catalogError}
            loadCatalog={loadCatalog}
          />
        ) : (
          <ServiceCatalog
            services={services}
            route={route}
            navigate={navigate}
            currentUser={user}
            catalogError={catalogError}
            loadCatalog={loadCatalog}
            needsAuth={needsAuth}
          />
        )}
      </main>
      <Footer navigate={navigate} />
    </div>
  );
}

function Header({
  user,
  route,
  navigate,
  signOut,
}: {
  user: User | null;
  route: Route;
  navigate: (next: Partial<Route>) => void;
  signOut: () => Promise<void>;
}) {
  const [search, setSearch] = useState(route.q);
  const menuRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => setSearch(route.q), [route.q]);
  const go = (next: Partial<Route>) => {
    menuRef.current?.removeAttribute("open");
    navigate(next);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    navigate({
      view: route.view === "projects" ? "projects" : "services",
      id: undefined,
      q: search.trim(),
      category: "All services",
    });
  };
  return (
    <header className="site-header">
      <div className="header-inner">
        <a
          className="wordmark"
          href="/"
          onClick={(event) => {
            event.preventDefault();
            navigate({
              view: "services",
              id: undefined,
              q: "",
              category: "All services",
            });
          }}
        >
          <span className="wordmark-mark">SH</span>
          <span>Skill-High</span>
        </a>
        <form className="global-search" onSubmit={submit} role="search">
          <label className="sr-only" htmlFor="global-search">
            Search services and projects
          </label>
          <input
            id="global-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="What service do you need?"
          />
          <button type="submit">Search</button>
        </form>
        <nav className="primary-nav" aria-label="Main navigation">
          <a
            href={href({ view: "services" }, route)}
            onClick={(event) => {
              event.preventDefault();
              navigate({ view: "services", id: undefined });
            }}
          >
            Browse services
          </a>
          <a
            href={href({ view: "projects" }, route)}
            onClick={(event) => {
              event.preventDefault();
              navigate({ view: "projects", id: undefined });
            }}
          >
            Find work
          </a>
          <a
            href={href({ view: "create" }, route)}
            onClick={(event) => {
              event.preventDefault();
              navigate({ view: "create", id: undefined });
            }}
          >
            Post a project
          </a>
        </nav>
        {user ? (
          <div className="header-account">
            <a
              className="orders-link"
              href={href({ view: "orders" }, route)}
              onClick={(event) => {
                event.preventDefault();
                go({ view: "orders", id: undefined });
              }}
            >
              Orders
            </a>
            <details className="account-menu" ref={menuRef}>
              <summary>
                <span className="avatar">{initials(user.display_name)}</span>
                <span className="account-name">{user.display_name}</span>
              </summary>
              <div className="menu-panel">
                <button onClick={() => go({ view: "profile" })}>Profile</button>
                <button onClick={() => go({ view: "services-mine" })}>
                  My services
                </button>
                <button onClick={() => go({ view: "projects-mine" })}>
                  My projects
                </button>
                <button onClick={() => go({ view: "applications" })}>
                  My applications
                </button>
                <button onClick={() => go({ view: "create-service" })}>
                  Offer a service
                </button>
                <button onClick={() => go({ view: "create" })}>
                  Post a project
                </button>
                {user.is_admin && (
                  <button onClick={() => go({ view: "admin" })}>Admin</button>
                )}
                <button className="menu-signout" onClick={() => void signOut()}>
                  Sign out
                </button>
              </div>
            </details>
          </div>
        ) : (
          <div className="header-auth">
            <a
              href={href({ view: "auth", next: href(route, route) }, route)}
              onClick={(event) => {
                event.preventDefault();
                navigate({ view: "auth", next: href(route, route) });
              }}
            >
              Sign in
            </a>
            <button onClick={() => navigate({ view: "auth", next: undefined })}>
              Join
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function CategoryBar({
  route,
  navigate,
}: {
  route: Route;
  navigate: (next: Partial<Route>) => void;
}) {
  const catalogView = route.view === "projects" ? "projects" : "services";
  return (
    <nav className="category-bar" aria-label="Service categories">
      {categories.map((category) => (
        <button
          key={category}
          className={route.category === category ? "selected" : ""}
          onClick={() =>
            navigate({ view: catalogView, category, id: undefined })
          }
        >
          {category}
        </button>
      ))}
    </nav>
  );
}

function ServiceCatalog({
  services,
  route,
  navigate,
  currentUser,
  catalogError,
  loadCatalog,
  needsAuth,
}: {
  services: Service[];
  route: Route;
  navigate: (next: Partial<Route>) => void;
  currentUser: User | null;
  catalogError: string;
  loadCatalog: () => Promise<void>;
  needsAuth: () => void;
}) {
  const filtered = useMemo(
    () => filterServices(services, route),
    [services, route],
  );
  const home = !route.q && route.category === "All services" && !route.maxPrice;
  const demoLabel =
    process.env.NODE_ENV === "development"
      ? " · Demo marketplace · fictional listings"
      : "";
  return (
    <>
      {home && (
        <section className="discovery-band">
          <div>
            <h1>Find the right help for your next project.</h1>
            <p>
              Compare practical services from students and recent graduates,
              with scope and effort clear from the start.
            </p>
          </div>
          <img
            src="/images/design.jpg"
            alt="A category illustration for design services"
          />
        </section>
      )}
      <section className="catalog-shell">
        <div className="catalog-heading">
          <div>
            <h1>
              {route.q
                ? `Results for “${route.q}”`
                : route.category === "All services"
                  ? "Browse services"
                  : `${route.category} services`}
            </h1>
            <p>
              {filtered.length} service{filtered.length === 1 ? "" : "s"}{" "}
              available{demoLabel}
            </p>
          </div>
          <a
            className="text-link"
            href={href({ view: "projects" }, route)}
            onClick={(event) => {
              event.preventDefault();
              navigate({ view: "projects", id: undefined });
            }}
          >
            Looking for projects? Find work →
          </a>
        </div>
        <div className="filters">
          <label>
            Category
            <select
              value={route.category}
              onChange={(event) => navigate({ category: event.target.value })}
            >
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <label>
            Maximum price
            <select
              value={route.maxPrice}
              onChange={(event) => navigate({ maxPrice: event.target.value })}
            >
              <option value="">Any price</option>
              <option value="2000">₹2,000</option>
              <option value="3000">₹3,000</option>
              <option value="5000">₹5,000</option>
              <option value="7000">₹7,000</option>
            </select>
          </label>
          <label>
            Sort
            <select
              value={route.sort}
              onChange={(event) => navigate({ sort: event.target.value })}
            >
              <option value="newest">Newest</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
            </select>
          </label>
        </div>
        {catalogError ? (
          <InlineNotice tone="error" text={catalogError} action={loadCatalog} />
        ) : (
          <div className="service-grid">
            {filtered.length ? (
              filtered.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  navigate={navigate}
                />
              ))
            ) : (
              <EmptyState
                title="No services match those filters"
                text="Try a broader search or browse another category."
                action={() =>
                  navigate({
                    view: "services",
                    q: "",
                    category: "All services",
                    maxPrice: "",
                  })
                }
              />
            )}
          </div>
        )}
      </section>
    </>
  );
}

function ProjectCatalog({
  projects,
  route,
  navigate,
  catalogError,
  loadCatalog,
}: {
  projects: Project[];
  route: Route;
  navigate: (next: Partial<Route>) => void;
  catalogError: string;
  loadCatalog: () => Promise<void>;
}) {
  const filtered = useMemo(
    () => filterProjects(projects, route),
    [projects, route],
  );
  return (
    <section className="catalog-shell catalog-projects">
      <div className="catalog-heading">
        <div>
          <h1>
            {route.q
              ? `Projects matching “${route.q}”`
              : "Find focused project work"}
          </h1>
          <p>
            {filtered.length} open brief{filtered.length === 1 ? "" : "s"} ·
            Clear scope, budget, and effort
          </p>
        </div>
        <a
          className="text-link"
          href={href({ view: "services" }, route)}
          onClick={(event) => {
            event.preventDefault();
            navigate({ view: "services", id: undefined });
          }}
        >
          Browse services →
        </a>
      </div>
      <div className="filters">
        <label>
          Category
          <select
            value={route.category}
            onChange={(event) => navigate({ category: event.target.value })}
          >
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
        <label>
          Sort
          <select
            value={route.sort}
            onChange={(event) => navigate({ sort: event.target.value })}
          >
            <option value="newest">Newest</option>
            <option value="price-low">Budget: low to high</option>
            <option value="price-high">Budget: high to low</option>
          </select>
        </label>
      </div>
      {catalogError ? (
        <InlineNotice tone="error" text={catalogError} action={loadCatalog} />
      ) : (
        <div className="project-list">
          {filtered.length ? (
            filtered.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                navigate={navigate}
              />
            ))
          ) : (
            <EmptyState
              title="No open projects match"
              text="Try another keyword or check back soon."
            />
          )}
        </div>
      )}
    </section>
  );
}

function ServiceCard({
  service,
  navigate,
}: {
  service: Service;
  navigate: (next: Partial<Route>) => void;
}) {
  return (
    <article className="service-card">
      <a
        className="card-image-link"
        href={`/?view=service&id=${service.id}`}
        onClick={(event) => {
          event.preventDefault();
          navigate({ view: "service", id: service.id });
        }}
      >
        <img
          src={imageFor(service)}
          alt={`${categoryFor(service)} category illustration`}
        />
      </a>
      <div className="card-content">
        <div className="seller-line">
          <span className="avatar avatar-small">
            {initials(service.provider?.display_name || "Skill-High")}
          </span>
          <span>{service.provider?.display_name || "Skill-High"}</span>
        </div>
        <a
          className="card-title"
          href={`/?view=service&id=${service.id}`}
          onClick={(event) => {
            event.preventDefault();
            navigate({ view: "service", id: service.id });
          }}
        >
          {service.title}
        </a>
        <p className="card-meta">
          {service.seller_rating
            ? `★ ${service.seller_rating} (${service.seller_review_count})`
            : "New"}{" "}
          · {service.estimated_hours}h estimated
        </p>
        <div className="card-price">
          <span>From</span>
          <strong>{money(service.amount_minor, service.currency)}</strong>
        </div>
      </div>
    </article>
  );
}
function ProjectRow({
  project,
  navigate,
}: {
  project: Project;
  navigate: (next: Partial<Route>) => void;
}) {
  return (
    <article className="project-row">
      <div className="project-row-main">
        <span className="project-category">
          {categoryFor({
            title: project.title,
            required_skills: project.required_skills,
          })}
        </span>
        <a
          href={`/?view=project&id=${project.id}`}
          onClick={(event) => {
            event.preventDefault();
            navigate({ view: "project", id: project.id });
          }}
        >
          <h2>{project.title}</h2>
        </a>
        <p>{project.description}</p>
        <div className="tag-row">
          {project.required_skills.map((skill) => (
            <span className="tag" key={skill}>
              {skill}
            </span>
          ))}
        </div>
      </div>
      <div className="project-row-side">
        <strong>{money(project.amount_minor, project.currency)}</strong>
        <span>
          {project.estimated_hours}h effort · {labelStatus(project.scale)}
        </span>
        <small>Posted by {project.client?.display_name}</small>
        <a
          className="button button-secondary"
          href={`/?view=project&id=${project.id}`}
          onClick={(event) => {
            event.preventDefault();
            navigate({ view: "project", id: project.id });
          }}
        >
          View project
        </a>
      </div>
    </article>
  );
}

function ServiceDetail({
  id,
  services,
  currentUser,
  navigate,
  needsAuth,
}: {
  id: number;
  services: Service[];
  currentUser: User | null;
  navigate: (next: Partial<Route>) => void;
  needsAuth: () => void;
}) {
  const [service, setService] = useState<Service | null>(
    services.find((item) => item.id === id) ?? null,
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    void api<Service>(`/services/${id}`)
      .then((item) => {
        if (active) setService(item);
      })
      .catch((error) => {
        if (active)
          setError(
            error instanceof Error ? error.message : "Service not found",
          );
      });
    return () => {
      active = false;
    };
  }, [id]);
  if (error)
    return (
      <section className="detail-shell">
        <InlineNotice tone="error" text={error} />
        <button
          className="button button-secondary"
          onClick={() => navigate({ view: "services", id: undefined })}
        >
          Back to services
        </button>
      </section>
    );
  if (!service) return <div className="page-loading">Loading service…</div>;
  const request = async () => {
    if (!currentUser) return needsAuth();
    setBusy(true);
    try {
      const order = await api<{ id: number }>(`/services/${id}/orders`, {
        method: "POST",
      });
      navigate({ view: "order", id: order.id });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not request this service.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="detail-shell">
      <button
        className="back-link"
        onClick={() => navigate({ view: "services", id: undefined })}
      >
        ← Back to services
      </button>
      <div className="detail-grid service-detail-grid">
        <div className="service-detail-primary">
          <div className="breadcrumb">Services / {categoryFor(service)}</div>
          <h1 className="service-detail-title">{service.title}</h1>
          <div className="detail-seller service-detail-seller">
            <span className="avatar">
              {initials(service.provider.display_name)}
            </span>
            <div>
              <strong>{service.provider.display_name}</strong>
              <span>
                {labelStatus(service.provider.career_stage)} ·{" "}
                {service.seller_rating
                  ? `★ ${service.seller_rating} from ${service.seller_review_count} seller review${service.seller_review_count === 1 ? "" : "s"}`
                  : "New seller"}
              </span>
            </div>
          </div>
          <div className="detail-media">
            <img
              src={imageFor(service)}
              alt={`${categoryFor(service)} category illustration`}
            />
            <span>Category illustration</span>
          </div>
          <div className="detail-copy">
            <p className="detail-description">{service.description}</p>
            <div className="tag-row">
              {service.skills.map((skill) => (
                <span className="tag" key={skill}>
                  {skill}
                </span>
              ))}
            </div>
            <h2>About the seller</h2>
            <p>{service.provider.bio || "No bio added yet."}</p>
            {service.seller_reviews?.length ? (
              <div className="review-list">
                {service.seller_reviews.map((review) => (
                  <blockquote key={review.id}>
                    <strong>
                      ★ {review.rating} · {review.author_name}
                    </strong>
                    <p>{review.body}</p>
                  </blockquote>
                ))}
              </div>
            ) : (
              <p className="empty-inline">
                No seller reviews yet. This is a new listing.
              </p>
            )}
          </div>
        </div>
        <aside className="purchase-panel">
          <p className="panel-label">Request this service</p>
          <strong className="purchase-price">
            {money(service.amount_minor, service.currency)}
          </strong>
          <p>Estimated effort: {service.estimated_hours} hours</p>
          <p className="muted">
            Requesting starts a recorded order. The provider confirms service
            orders before work begins.
          </p>
          <button
            className="button button-primary button-wide"
            disabled={busy || currentUser?.id === service.provider_id}
            onClick={() => void request()}
          >
            {busy
              ? "Requesting…"
              : currentUser?.id === service.provider_id
                ? "This is your service"
                : "Request service"}
          </button>
          {!currentUser && (
            <small>Sign in is required to request a service.</small>
          )}
        </aside>
      </div>
    </section>
  );
}

function ProjectDetail({
  id,
  projects,
  currentUser,
  navigate,
  needsAuth,
}: {
  id: number;
  projects: Project[];
  currentUser: User | null;
  navigate: (next: Partial<Route>) => void;
  needsAuth: () => void;
}) {
  const [project, setProject] = useState<Project | null>(
    projects.find((item) => item.id === id) ?? null,
  );
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    void api<Project>(`/projects/${id}`)
      .then((item) => {
        if (active) setProject(item);
      })
      .catch((error) => {
        if (active)
          setError(
            error instanceof Error ? error.message : "Project not found",
          );
      });
    return () => {
      active = false;
    };
  }, [id]);
  useEffect(() => {
    if (currentUser)
      void api<{ project: Project; status: string }[]>("/me/applications")
        .then((rows) => {
          if (rows.some((row) => row.project.id === id)) setApplied(true);
        })
        .catch(() => undefined);
  }, [currentUser, id]);
  if (error)
    return (
      <section className="detail-shell">
        <InlineNotice tone="error" text={error} />
        <button
          className="button button-secondary"
          onClick={() => navigate({ view: "projects", id: undefined })}
        >
          Back to projects
        </button>
      </section>
    );
  if (!project) return <div className="page-loading">Loading project…</div>;
  const apply = async () => {
    if (!currentUser) return needsAuth();
    setBusy(true);
    try {
      await api(`/projects/${id}/applications`, { method: "POST" });
      setApplied(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not apply to this project.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="detail-shell">
      <button
        className="back-link"
        onClick={() => navigate({ view: "projects", id: undefined })}
      >
        ← Back to projects
      </button>
      <div className="detail-grid project-detail-grid">
        <div className="detail-copy">
          <div className="breadcrumb">
            Find work /{" "}
            {categoryFor({
              title: project.title,
              required_skills: project.required_skills,
            })}
          </div>
          <h1>{project.title}</h1>
          <div className="detail-seller">
            <span className="avatar">
              {initials(project.client.display_name)}
            </span>
            <div>
              <strong>{project.client.display_name}</strong>
              <span>{labelStatus(project.client.career_stage)} · Client</span>
            </div>
          </div>
          <h2>Project brief</h2>
          <p className="detail-description">{project.description}</p>
          <h2>Skills requested</h2>
          <div className="tag-row">
            {project.required_skills.map((skill) => (
              <span className="tag" key={skill}>
                {skill}
              </span>
            ))}
          </div>
          <div className="scope-facts">
            <div>
              <span>Budget</span>
              <strong>{money(project.amount_minor, project.currency)}</strong>
            </div>
            <div>
              <span>Estimated effort</span>
              <strong>{project.estimated_hours} hours</strong>
            </div>
            <div>
              <span>Scale</span>
              <strong>{labelStatus(project.scale)}</strong>
            </div>
          </div>
        </div>
        <aside className="purchase-panel">
          <p className="panel-label">
            {project.status === "open" ? "Open project" : "Project assigned"}
          </p>
          <strong className="purchase-price">
            {money(project.amount_minor, project.currency)}
          </strong>
          <p>
            {project.estimated_hours}h estimated effort ·{" "}
            {labelStatus(project.scale)}
          </p>
          {project.client_id === currentUser?.id ? (
            <>
              <p className="muted">This is your project.</p>
              <button
                className="button button-primary button-wide"
                onClick={() => navigate({ view: "applicants", id: project.id })}
              >
                View applicants
              </button>
            </>
          ) : project.status !== "open" ? (
            <p className="notice notice-neutral">
              This project is filled and no longer accepting applications.
            </p>
          ) : applied ? (
            <p className="notice notice-success">
              Application sent. You’ll see updates in My applications.
            </p>
          ) : (
            <button
              className="button button-primary button-wide"
              disabled={busy}
              onClick={() => void apply()}
            >
              {busy
                ? "Sending…"
                : currentUser
                  ? "Apply to project"
                  : "Sign in to apply"}
            </button>
          )}
        </aside>
      </div>
    </section>
  );
}

function AuthScreen({
  onDone,
  initialMode,
  error,
  setError,
}: {
  onDone: () => Promise<void>;
  initialMode: "login" | "register";
  error: string;
  setError: (value: string) => void;
}) {
  const [mode, setMode] = useState(initialMode);
  const [pending, setPending] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showDemo, setShowDemo] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError("");
    const body = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await api(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      await onDone();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not sign in.");
    } finally {
      setPending(false);
    }
  };
  return (
    <section className="auth-screen">
      <div className="auth-panel">
        <h1>{mode === "login" ? "Welcome back" : "Join the marketplace"}</h1>
        <p className="auth-intro">
          {mode === "login"
            ? "Keep your work, orders, and applications in one place."
            : "Create a profile to hire, apply, and build portable proof of work."}
        </p>
        <div className="auth-tabs">
          <button
            className={mode === "login" ? "selected" : ""}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Sign in
          </button>
          <button
            className={mode === "register" ? "selected" : ""}
            onClick={() => {
              setMode("register");
              setError("");
            }}
          >
            Create account
          </button>
        </div>
        <form className="form-stack" onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
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
                <input name="display_name" minLength={2} required />
              </label>
              <label>
                Career stage
                <select name="career_stage">
                  <option value="student">Student</option>
                  <option value="graduate">Graduate</option>
                </select>
              </label>
              <input type="hidden" name="timezone" value="Asia/Kolkata" />
            </>
          )}
          <button
            className="button button-primary button-wide"
            disabled={pending}
          >
            {pending
              ? "Working…"
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>
        {error && <InlineNotice tone="error" text={error} />}
        {process.env.NODE_ENV === "development" && (
          <details className="demo-details">
            <summary onClick={() => setShowDemo(!showDemo)}>
              Development demo credentials
            </summary>
            {showDemo && (
              <div className="demo-options">
                <p>Local-only accounts for testing the marketplace roles.</p>
                {[
                  ["Worker", "ravi@skillhigh-campus.com"],
                  ["Client", "maya@skillhigh-campus.com"],
                  ["Admin", "admin@skillhigh-campus.com"],
                ].map(([label, demoEmail]) => (
                  <button
                    className="button button-secondary"
                    type="button"
                    key={label}
                    onClick={() => {
                      setMode("login");
                      setEmail(demoEmail);
                      setPassword("skillhigh-demo-123");
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </details>
        )}
      </div>
    </section>
  );
}

function SignInPrompt({
  navigate,
}: {
  navigate: (next: Partial<Route>) => void;
}) {
  return (
    <section className="empty-page">
      <h1>Sign in to see this workspace</h1>
      <p>Orders, applications, and your profile are private to your account.</p>
      <button
        className="button button-primary"
        onClick={() => navigate({ view: "auth" })}
      >
        Sign in
      </button>
    </section>
  );
}
function Footer({ navigate }: { navigate: (next: Partial<Route>) => void }) {
  return (
    <footer className="site-footer">
      <span>Skill-High · practical work, made clear.</span>
      <nav>
        <button onClick={() => navigate({ view: "services" })}>Services</button>
        <button onClick={() => navigate({ view: "projects" })}>
          Find work
        </button>
        <button onClick={() => navigate({ view: "create" })}>
          Create work
        </button>
      </nav>
    </footer>
  );
}
function InlineNotice({
  tone,
  text,
  action,
}: {
  tone: "error" | "success" | "neutral";
  text: string;
  action?: () => Promise<void>;
}) {
  return (
    <div
      className={`notice notice-${tone}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <span>{text}</span>
      {action && (
        <button
          className="button button-secondary"
          onClick={() => void action()}
        >
          Retry
        </button>
      )}
    </div>
  );
}
function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: () => void;
}) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      <p>{text}</p>
      {action && (
        <button className="button button-secondary" onClick={action}>
          Clear filters
        </button>
      )}
    </div>
  );
}
function filterServices(services: Service[], route: Route) {
  const query = route.q.toLowerCase();
  const max = Number(route.maxPrice) * 100;
  return services
    .filter(
      (service) =>
        (!query ||
          `${service.title} ${service.description} ${service.skills.join(" ")}`
            .toLowerCase()
            .includes(query)) &&
        (route.category === "All services" ||
          categoryFor(service) === route.category) &&
        (!max || service.amount_minor <= max),
    )
    .sort((a, b) =>
      route.sort === "price-low"
        ? a.amount_minor - b.amount_minor
        : route.sort === "price-high"
          ? b.amount_minor - a.amount_minor
          : b.id - a.id,
    );
}
function filterProjects(projects: Project[], route: Route) {
  const query = route.q.toLowerCase();
  return projects
    .filter(
      (project) =>
        (!query ||
          `${project.title} ${project.description} ${project.required_skills.join(" ")}`
            .toLowerCase()
            .includes(query)) &&
        (route.category === "All services" ||
          categoryFor({
            title: project.title,
            required_skills: project.required_skills,
          }) === route.category),
    )
    .sort((a, b) =>
      route.sort === "price-low"
        ? a.amount_minor - b.amount_minor
        : route.sort === "price-high"
          ? b.amount_minor - a.amount_minor
          : b.id - a.id,
    );
}
