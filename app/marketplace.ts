export type User = {
  id: number;
  email: string;
  display_name: string;
  career_stage: string;
  timezone?: string;
  bio?: string;
  is_admin: boolean;
  is_verified?: boolean;
};

export type PublicPerson = {
  id: number;
  display_name: string;
  career_stage: string;
  bio: string;
  skills: string[];
};

export type ServiceReview = {
  id: number;
  rating: number;
  body: string;
  author_name: string;
};

export type Service = {
  id: number;
  provider_id: number;
  title: string;
  description: string;
  amount_minor: number;
  currency: string;
  estimated_hours: number;
  created_at?: string;
  skills: string[];
  provider: PublicPerson;
  seller_rating: number | null;
  seller_review_count: number;
  seller_reviews?: ServiceReview[];
};

export type Project = {
  id: number;
  client_id: number;
  title: string;
  description: string;
  amount_minor: number;
  currency: string;
  estimated_hours: number;
  scale: string;
  status: string;
  created_at?: string;
  required_skills: string[];
  client: PublicPerson;
  application_count?: number;
  order_id?: number | null;
};

export type Application = {
  id: number;
  project_id?: number;
  status: string;
  created_at?: string;
  worker?: PublicPerson;
  project: Project;
  order_id: number | null;
};

export type Delivery = {
  id: number;
  author_id: number;
  message: string;
  submission_url: string;
  created_at?: string;
};
export type Review = {
  id: number;
  author_id: number;
  recipient_id: number;
  rating: number;
  body: string;
};
export type Dispute = { id: number; reason: string; status: string };

export type Order = {
  id: number;
  client_id: number;
  worker_id: number;
  title: string;
  scope_snapshot: string;
  amount_minor: number;
  fee_minor: number;
  currency: string;
  estimated_hours: number;
  status: string;
  payment_status: string;
  payout_status: string;
  latest_delivery_id: number | null;
  project_id?: number | null;
  service_id?: number | null;
  created_at?: string;
  client?: PublicPerson;
  worker?: PublicPerson;
  deliveries?: Delivery[];
  reviews?: Review[];
  disputes?: Dispute[];
};

export type Message = {
  id: number;
  author_id: number;
  body: string;
  created_at?: string;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function csrf() {
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("sh_csrf="))
      ?.split("=")[1] ?? ""
  );
}

function readableDetail(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail
      .map((item) =>
        typeof item === "object" && item && "msg" in item
          ? String((item as { msg: unknown }).msg)
          : String(item),
      )
      .join("; ");
  return "Request failed";
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
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
    throw new ApiError(readableDetail(body.detail), response.status);
  }
  return (response.status === 204 ? null : response.json()) as Promise<T>;
}

export const money = (amount: number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(amount ?? 0) / 100);

export const categories = [
  "All services",
  "Design",
  "Development",
  "Writing",
  "Video",
  "Presentations",
  "Photography",
] as const;
export type Category = (typeof categories)[number] | "Other";

// ponytail: categories are inferred from skills/title until the taxonomy earns a persisted column.
const categoryRules: Array<[Category, string[]]> = [
  ["Photography", ["photo", "image"]],
  ["Presentations", ["presentation", "pitch", "deck"]],
  ["Video", ["video"]],
  ["Writing", ["writing", "copy", "proofread", "research"]],
  [
    "Development",
    ["frontend", "web", "accessibility", "website", "development"],
  ],
  ["Design", ["design", "poster", "graphic"]],
];

export function categoryFor(item: {
  title: string;
  skills?: string[];
  required_skills?: string[];
}): Category {
  const haystack =
    `${item.title} ${(item.skills ?? item.required_skills ?? []).join(" ")}`.toLowerCase();
  return (
    categoryRules.find(([, terms]) =>
      terms.some((term) => haystack.includes(term)),
    )?.[0] ?? "Other"
  );
}

export function imageFor(item: {
  title: string;
  skills?: string[];
  required_skills?: string[];
}): string {
  const category = categoryFor(item);
  return {
    Design: "/images/design.jpg",
    Development: "/images/web.jpg",
    Writing: "/images/writing.jpg",
    Video: "/images/video.jpg",
    Presentations: "/images/presentation.jpg",
    Photography: "/images/photo.jpg",
    "All services": "/images/design.jpg",
    Other: "/images/design.jpg",
  }[category];
}

export function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "SH"
  );
}

export function safeUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? value
      : "";
  } catch {
    return "";
  }
}

export function labelStatus(value: string) {
  return value.replaceAll("_", " ");
}
