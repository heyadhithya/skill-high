"use client";

import Image from "next/image";
import { useState } from "react";
import { flushSync } from "react-dom";
import { Route, Service, User, Navigate, categoryFor, imageFor, initials, money } from "./marketplace";

type LandingProps = {
  services: Service[];
  user: User | null;
  navigate: Navigate;
  catalogLoading: boolean;
  catalogError: string;
  reloadCatalog: () => Promise<void>;
};

const journey = {
  brief: {
    label: "Brief",
    title: "A clear starting point",
    copy: "Campus event poster · 3 hours estimated",
    action: "Browse projects",
    view: "projects",
    image: "/images/design.jpg",
  },
  delivery: {
    label: "Delivery",
    title: "Work with a defined handoff",
    copy: "A final export and handoff note",
    action: "Offer a service",
    view: "create-service",
    image: "/images/studio-process.jpg",
  },
  proof: {
    label: "Proof",
    title: "Keep the useful record",
    copy: "Accepted work can become part of your public profile.",
    action: "Create your profile",
    view: "profile",
    image: "/images/design.jpg",
  },
} as const;

export default function Landing({ services, user, navigate, catalogLoading, catalogError, reloadCatalog }: LandingProps) {
  const [state, setState] = useState<keyof typeof journey>("brief");
  const selected = journey[state];
  const revealJourney = (next: keyof typeof journey) => {
    const journeySection = document.getElementById("journey");
    journeySection?.scrollIntoView({ behavior: "auto", block: "start" });
    flushSync(() => setState(next));
    document.getElementById("journey-panel")?.scrollIntoView({ behavior: "auto", block: "center" });
  };
  return (
    <div className="landing">
      <section className="landing-hero">
        <div className="landing-copy">
          <h1>Good work starts before graduation.</h1>
          <p className="landing-support">For students, graduates, and the people who need their work.</p>
          <p className="landing-lede">Find focused projects, collaborate with clear scope, and build a record of work you can carry forward.</p>
          <div className="landing-actions">
            <button className="button button-primary" onClick={() => navigate({ view: "projects", id: undefined })}>Find a project</button>
            <button className="button button-secondary" onClick={() => navigate({ view: "services", id: undefined })}>Hire student talent</button>
          </div>
          <button className="landing-text-action" onClick={() => navigate({ view: "create-service", id: undefined })}>Offer a service</button>
          <JourneyTabs state={state} setState={revealJourney} className="hero-journey-tabs" />
        </div>
        <div className="landing-media" aria-label="Students collaborating in a studio">
          <Image className="landing-collaboration" src="/images/studio-collaboration.jpg" alt="Students collaborating around laptops in a shared studio" width={1400} height={2100} priority sizes="(max-width: 760px) 100vw, 42vw" />
          <Image className="landing-process" src="/images/studio-process.jpg" alt="Red ink moving across a screen-printing frame" width={1400} height={933} sizes="(max-width: 760px) 62vw, 22vw" />
        </div>
      </section>

      <section className="journey-section" id="journey" aria-labelledby="journey-title">
        <div className="section-heading">
          <h2 id="journey-title">From a useful brief to a record worth keeping.</h2>
          <p className="section-support">Illustrative work journey.</p>
        </div>
        <div className="journey-layout">
          <JourneyTabs state={state} setState={setState} className="journey-inline-tabs" />
          <div id="journey-preview" key={state} className={`journey-preview journey-${state}`}>
            <div className="journey-visual">
              {state === "proof" ? <div className="proof-record"><span>Accepted work</span><strong>Campus event poster</strong><small>Selected public proof · Poster design</small></div> : <Image src={selected.image} alt="" width={1400} height={state === "brief" ? 1125 : 933} sizes="(max-width: 760px) 100vw, 44vw" />}
            </div>
            <div className="journey-panel" id="journey-panel" aria-live="polite">
              <h3>{selected.title}</h3>
              <p>{selected.copy}</p>
              <button className="button button-primary" onClick={() => navigate({ view: selected.view, id: undefined })}>{selected.action}</button>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-services" aria-labelledby="service-preview-title">
        <div className="section-heading section-heading-row">
          <div><h2 id="service-preview-title">Start with something you can make.</h2><p className="section-support">Live from the local marketplace.</p></div>
          <button className="landing-text-action" onClick={() => navigate({ view: "services", id: undefined })}>Browse all services</button>
        </div>
        {catalogError ? <div className="notice notice-error" role="alert"><span>{catalogError}</span><button className="button button-secondary" onClick={() => void reloadCatalog()}>Retry</button></div> : catalogLoading ? <div className="landing-empty">Loading live services…</div> : services.length ? <div className="landing-service-grid">{services.slice(0, 3).map((service) => <LandingService key={service.id} service={service} navigate={navigate} />)}</div> : <div className="landing-empty"><p>No live services yet.</p><button className="button button-secondary" onClick={() => navigate({ view: "create-service", id: undefined })}>Offer a service</button></div>}
      </section>

      <section className="proof-chapter" aria-labelledby="proof-title">
        <div><h2 id="proof-title">A completed project can stay useful after the handoff.</h2><p className="section-support">The useful part of finishing.</p></div>
        <div className="proof-example"><span>Proof of work · illustrative</span><strong>Campus event poster</strong><small>Accepted delivery · Poster design</small></div>
        <div className="proof-notes"><p><strong>Agree clearly.</strong> Put scope, effort, and the next action in one place.</p><p><strong>Deliver visibly.</strong> Keep a readable handoff history for both people.</p><p><strong>Choose what travels.</strong> Public proof is opt-in and only shares the title, skills, and completion date.</p></div>
      </section>

      <section className="landing-close" aria-labelledby="close-title">
        <Image className="landing-close-image" src="/images/web.jpg" alt="Desk with a laptop and notebook" width={900} height={600} sizes="(max-width: 760px) 100vw, 46vw" unoptimized />
        <div><h2 id="close-title">Build a work identity that can move with you.</h2><p className="section-support">Keep going.</p><p>Skill-High is a local marketplace for practical work. Create an account to find briefs, publish an offer, and decide which accepted work belongs on your public profile.</p><div className="landing-actions"><button className="button button-primary" onClick={() => navigate({ view: user ? "profile" : "auth", id: undefined, mode: user ? undefined : "register" })}>{user ? "View your profile" : "Create your profile"}</button><button className="button button-secondary" onClick={() => navigate({ view: "create", id: undefined })}>Post a project</button></div></div>
      </section>
    </div>
  );
}

function LandingService({ service, navigate }: { service: Service; navigate: Navigate }) {
  return <article className="landing-service"><button className="landing-service-image" onClick={() => navigate({ view: "service", id: service.id })}><Image src={imageFor(service)} alt={`${categoryFor(service)} category context`} width={900} height={600} sizes="(max-width: 760px) 100vw, 30vw" /></button><div><span className="seller-line"><span className="avatar avatar-small">{initials(service.provider?.display_name || "Skill-High")}</span>{service.provider?.display_name || "Skill-High"}</span><button className="landing-service-title" onClick={() => navigate({ view: "service", id: service.id })}>{service.title}</button><p>{money(service.amount_minor, service.currency)} · {service.estimated_hours}h estimated</p></div></article>;
}

function JourneyTabs({ state, setState, className = "" }: { state: keyof typeof journey; setState: (value: keyof typeof journey) => void; className?: string }) {
  return <div className={`journey-tabs ${className}`} role="group" aria-label="Illustrative work journey steps">{(Object.keys(journey) as Array<keyof typeof journey>).map((key) => <button type="button" key={key} className={state === key ? "journey-tab selected" : "journey-tab"} aria-pressed={state === key} aria-controls="journey-preview" onClick={() => setState(key)}>{journey[key].label}</button>)}</div>;
}
