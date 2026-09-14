import { describe, expect, test } from "bun:test";
import { earningsByCurrency, readRoute, routeHref } from "./marketplace";

describe("route helpers", () => {
  test("defaults to home", () => {
    expect(readRoute("").view).toBe("home");
  });

  test("keeps explicit service and project routes", () => {
    expect(routeHref({ view: "services" }, readRoute(""))).toBe("/?view=services");
    expect(routeHref({ view: "service", id: 12 }, readRoute(""))).toBe("/?view=service&id=12");
    expect(routeHref({ view: "edit-service", id: 12 }, readRoute(""))).toBe("/?view=edit-service&id=12");
    expect(routeHref({ view: "edit-project", id: 12 }, readRoute(""))).toBe("/?view=edit-project&id=12");
  });

  test("only accepts positive integer resource ids", () => {
    expect(readRoute("?view=service&id=-1").id).toBeUndefined();
    expect(readRoute("?view=service&id=1.5").id).toBeUndefined();
    expect(readRoute("?view=service&id=nope").id).toBeUndefined();
  });

  test("clears resource id when moving to a workspace", () => {
    const current = readRoute("?view=service&id=12");
    expect(routeHref({ view: "dashboard" }, current)).toBe("/?view=dashboard");
  });

  test("preserves filters and exact resource through auth", () => {
    const current = readRoute("?view=service&id=12&q=poster&category=Design&maxPrice=3000&sort=price-low");
    const auth = routeHref({ view: "auth", mode: "login", next: routeHref(current, current) }, current);
    expect(auth).toContain("q=poster");
    expect(auth).toContain("category=Design");
    expect(auth).toContain("next=%2F%3Fview%3Dservice%26id%3D12%26q%3Dposter%26category%3DDesign%26maxPrice%3D3000%26sort%3Dprice-low");
    expect(readRoute(auth).next).toContain("view=service");
  });

  test("rejects external auth destinations and drops recovery tokens on ordinary routes", () => {
    const route = readRoute("?view=reset-password&token=secret");
    expect(routeHref({ view: "dashboard" }, route)).toBe("/?view=dashboard");
    expect(readRoute("?view=auth&next=https%3A%2F%2Fevil.example").next).toBeUndefined();
  });
});

test("earnings are separated by currency and exclude buyers, cancelled work, and refunded payouts", () => {
  const totals = earningsByCurrency([
    { id: 1, client_id: 8, worker_id: 2, amount_minor: 10000, fee_minor: 1000, currency: "INR", status: "completed", payment_status: "paid", payout_status: "ready" },
    { id: 2, client_id: 8, worker_id: 2, amount_minor: 2000, fee_minor: 200, currency: "USD", status: "completed", payment_status: "paid", payout_status: "paid" },
    { id: 3, client_id: 2, worker_id: 8, amount_minor: 9000, fee_minor: 900, currency: "INR", status: "completed", payment_status: "paid", payout_status: "paid" },
    { id: 4, client_id: 8, worker_id: 2, amount_minor: 7000, fee_minor: 700, currency: "INR", status: "cancelled", payment_status: "failed", payout_status: "blocked" },
    { id: 5, client_id: 8, worker_id: 2, amount_minor: 6000, fee_minor: 600, currency: "INR", status: "completed", payment_status: "refunded", payout_status: "blocked" },
  ], 2);
  expect(totals).toEqual([
    { currency: "INR", completed_net_minor: 14400, paid_net_minor: 0 },
    { currency: "USD", completed_net_minor: 1800, paid_net_minor: 1800 },
  ]);
});
