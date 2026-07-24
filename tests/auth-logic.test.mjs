/**
 * Unit tests for Better Auth role/gating/resolver logic.
 * These tests exercise the exact same conditional branches that live in
 * src/middleware.ts, src/app/api/reservations/route.ts, the admin API
 * route guards, and prisma/seed.ts, expressed as pure functions so they
 * can run without Next.js, Prisma, or a database (see spec's Edge cases
 * note: "mirror the DECISION LOGIC as pure functions ... in the style of
 * tests/reservation-logic.test.mjs").
 *
 * Edge case 9 (distinct role permission sets) imports the REAL
 * `ac`/`owner`/`employee`/`user` objects from src/lib/auth-access-control.ts
 * instead of re-typing the permission lists, so a future accidental change
 * to the access-control lists breaks this test instead of passing silently.
 *
 * Uses Node.js built-in test runner (node:test), run via `npx tsx --test`
 * so the TypeScript import above resolves (tsx is already a devDependency
 * of this repo, added for prisma/seed.ts).
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { owner, employee, user, isAdminRole } from "../src/lib/auth-access-control.ts";

// ---------------------------------------------------------------------------
// Pure gating/resolver helpers that mirror src/middleware.ts,
// src/app/api/reservations/route.ts, the admin API route guard pattern,
// and prisma/seed.ts
// ---------------------------------------------------------------------------

/**
 * Mirrors the /admin/* gate in src/middleware.ts.
 * @param {"owner" | "employee" | "user" | undefined} role
 * @returns {boolean}
 */
function canAccessAdmin(role) {
  return role === "owner" || role === "employee";
}

/**
 * Mirrors the /admin/employees* gate in src/middleware.ts (and the
 * redirect-if-not-owner guard in src/app/admin/employees/page.tsx).
 * @param {"owner" | "employee" | "user" | undefined} role
 * @returns {boolean}
 */
function canManageEmployees(role) {
  return role === "owner";
}

/**
 * Mirrors the /account/* gate in src/middleware.ts.
 * @param {boolean} isAuthenticated
 * @returns {boolean}
 */
function canAccessAccount(isAuthenticated) {
  return !!isAuthenticated;
}

/**
 * Mirrors the full /admin/* redirect logic in src/middleware.ts.
 * @param {"owner" | "employee" | "user" | undefined} role
 * @param {string} pathname
 * @returns {string | null} redirect target, or null if no redirect needed
 */
function adminRedirectTarget(role, pathname) {
  if (pathname === "/admin/login") return null;
  if (!canAccessAdmin(role)) return "/admin/login";
  if (pathname.startsWith("/admin/employees") && !canManageEmployees(role)) {
    return "/admin";
  }
  return null;
}

/**
 * Mirrors the /account/* redirect logic in src/middleware.ts.
 * @param {boolean} isAuthenticated
 * @returns {string | null}
 */
function accountRedirectTarget(isAuthenticated) {
  return canAccessAccount(isAuthenticated) ? null : "/login";
}

/**
 * Mirrors `const userId = session?.user.id ?? null;` in
 * src/app/api/reservations/route.ts POST.
 * @param {{ user: { id: string } } | null | undefined} session
 * @returns {string | null}
 */
function resolveReservationUserId(session) {
  return session?.user.id ?? null;
}

/**
 * Mirrors the admin API route guard pattern shared by
 * src/app/api/{scripts,sessions,banners,announcements,reservations}/route.ts:
 * `if (!session || (role !== "owner" && role !== "employee")) -> 401`.
 * @param {{ user: { role: string } } | null | undefined} session
 * @returns {boolean} true if authorized (owner/employee session)
 */
function isAuthorizedAdmin(session) {
  return !!session && (session.user.role === "owner" || session.user.role === "employee");
}

/**
 * Mirrors the guard predicate producing the { error: "未授權" } 401 shape.
 * @param {{ user: { role: string } } | null | undefined} session
 * @returns {{ status: number, body: { error: string } } | null} null when authorized
 */
function adminGuardResponse(session) {
  if (!isAuthorizedAdmin(session)) {
    return { status: 401, body: { error: "未授權" } };
  }
  return null;
}

/**
 * Mirrors the idempotency guard in prisma/seed.ts:
 * `if (existing) { skip } else { create + elevate }`.
 * @param {unknown} existingUser - result of prisma.user.findUnique({ where: { email } })
 * @returns {boolean} true if the seed should create the owner
 */
function shouldCreateOwner(existingUser) {
  return !existingUser;
}

// The `defaultRole` configured for self-registration in src/lib/auth.ts
// (adminPlugin({ ..., defaultRole: "user" })). Mirrored here as a constant
// since it is a config literal, not a function.
const DEFAULT_SELF_REGISTER_ROLE = "user";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("canAccessAdmin (Edge case 1)", () => {
  test("returns true for owner", () => {
    assert.equal(canAccessAdmin("owner"), true);
  });

  test("returns true for employee", () => {
    assert.equal(canAccessAdmin("employee"), true);
  });

  test("returns false for user", () => {
    assert.equal(canAccessAdmin("user"), false);
  });

  test("returns false for undefined (anonymous)", () => {
    assert.equal(canAccessAdmin(undefined), false);
  });
});

describe("canManageEmployees (Edge case 2)", () => {
  test("returns true ONLY for owner", () => {
    assert.equal(canManageEmployees("owner"), true);
  });

  test("returns false for employee", () => {
    assert.equal(canManageEmployees("employee"), false);
  });

  test("returns false for user", () => {
    assert.equal(canManageEmployees("user"), false);
  });

  test("returns false for undefined (anonymous)", () => {
    assert.equal(canManageEmployees(undefined), false);
  });
});

describe("canAccessAccount (Edge case 3)", () => {
  test("returns true for any authenticated session", () => {
    assert.equal(canAccessAccount(true), true);
  });

  test("returns false when unauthenticated", () => {
    assert.equal(canAccessAccount(false), false);
  });
});

describe("adminRedirectTarget (Edge case 4)", () => {
  test("anonymous on /admin -> redirects to /admin/login", () => {
    assert.equal(adminRedirectTarget(undefined, "/admin"), "/admin/login");
  });

  test("user role on /admin -> redirects to /admin/login", () => {
    assert.equal(adminRedirectTarget("user", "/admin"), "/admin/login");
  });

  test("/admin/login is always allowed even when anonymous (no redirect loop)", () => {
    assert.equal(adminRedirectTarget(undefined, "/admin/login"), null);
  });

  test("employee on /admin/employees -> redirects to /admin", () => {
    assert.equal(adminRedirectTarget("employee", "/admin/employees"), "/admin");
  });

  test("owner on /admin/employees -> no redirect (null)", () => {
    assert.equal(adminRedirectTarget("owner", "/admin/employees"), null);
  });

  test("owner on plain /admin -> no redirect (null)", () => {
    assert.equal(adminRedirectTarget("owner", "/admin"), null);
  });

  test("employee on plain /admin (not /admin/employees) -> no redirect", () => {
    assert.equal(adminRedirectTarget("employee", "/admin"), null);
  });
});

describe("accountRedirectTarget (Edge case 5)", () => {
  test("unauthenticated on /account/* -> redirects to /login", () => {
    assert.equal(accountRedirectTarget(false), "/login");
  });

  test("authenticated -> no redirect (null)", () => {
    assert.equal(accountRedirectTarget(true), null);
  });
});

describe("resolveReservationUserId (Edge case 6, 7, 8)", () => {
  test("returns session.user.id when a session exists (Edge case 8)", () => {
    const session = { user: { id: "user_123" } };
    assert.equal(resolveReservationUserId(session), "user_123");
  });

  test("returns null when session is null (anonymous, Edge case 7)", () => {
    assert.equal(resolveReservationUserId(null), null);
  });

  test("returns null when session is undefined (Edge case 7)", () => {
    assert.equal(resolveReservationUserId(undefined), null);
  });

  test("anonymous reservation POST path does not require a session to resolve a value (Edge case 7)", () => {
    // Mirrors that the POST handler never throws/blocks on a missing
    // session -- it just falls back to null and continues the transaction.
    assert.doesNotThrow(() => resolveReservationUserId(undefined));
    assert.equal(resolveReservationUserId(undefined), null);
  });
});

describe("Role permission sets are distinct (Edge case 9, imports real auth-access-control.ts)", () => {
  test("user has no admin-panel capabilities (empty user-resource actions)", () => {
    assert.deepEqual(user.statements.user, []);
  });

  test("employee has an EMPTY user-resource action list AND an EMPTY session-resource action list (Edge case 1, 2)", () => {
    assert.deepEqual(employee.statements.user, []);
    // Fixed finding: employee must no longer inherit session list/revoke/delete
    // via ...adminAc.statements -- session is now explicitly zeroed too.
    assert.deepEqual(employee.statements.session, []);
  });

  test("owner has a NON-empty user-resource action list including 'create' (Edge case 4)", () => {
    assert.ok(owner.statements.user.length > 0);
    assert.ok(owner.statements.user.includes("create"));
  });

  test("owner retains full session-management capability: non-empty and includes 'list' and 'revoke' (Edge case 3)", () => {
    assert.ok(owner.statements.session.length > 0);
    assert.ok(owner.statements.session.includes("list"));
    assert.ok(owner.statements.session.includes("revoke"));
  });

  test("owner's user-resource actions are a strict superset of employee's (which is empty)", () => {
    assert.ok(owner.statements.user.length > employee.statements.user.length);
  });

  test("owner's session-resource actions are a strict superset of employee's (which is now empty)", () => {
    assert.ok(owner.statements.session.length > employee.statements.session.length);
  });
});

describe("isAdminRole (Edge cases 5, 6, 7, 8, 9 -- imports the real helper)", () => {
  test("returns true for owner", () => {
    assert.equal(isAdminRole("owner"), true);
  });

  test("returns true for employee", () => {
    assert.equal(isAdminRole("employee"), true);
  });

  test("returns false for user (customer role)", () => {
    assert.equal(isAdminRole("user"), false);
  });

  test("returns false for undefined (missing role, fail-closed)", () => {
    assert.equal(isAdminRole(undefined), false);
  });

  test("returns false for null", () => {
    assert.equal(isAdminRole(null), false);
  });
});

describe("adminLoginRoleDecision (Edge case 10, mirrors src/app/admin/login/page.tsx handleSubmit)", () => {
  /**
   * Mirrors the exact decision tree in the admin-login page's handleSubmit,
   * expressed as a pure function over the { data, error } shape returned by
   * authClient.signIn.email, so it can be tested without React or a network
   * call. Returns a description of the resulting UI action instead of
   * performing it.
   * @param {{ data?: { user?: { role?: string } }, error?: unknown }} signInResult
   * @returns {{ action: "error" | "signOutAndError" | "navigate", message?: string }}
   */
  function adminLoginRoleDecision({ data, error: signInError }) {
    if (signInError) {
      return { action: "error", message: "帳號或密碼錯誤" };
    } else if (!isAdminRole(data?.user?.role)) {
      return { action: "signOutAndError", message: "此帳號沒有管理員權限" };
    } else {
      return { action: "navigate" };
    }
  }

  test("sign-in error -> shows error, no navigation, no sign-out", () => {
    const result = adminLoginRoleDecision({ error: { message: "Invalid email or password" } });
    assert.deepEqual(result, { action: "error", message: "帳號或密碼錯誤" });
  });

  test("successful sign-in with role 'user' -> signs out and shows admin-permission error", () => {
    const result = adminLoginRoleDecision({ data: { user: { role: "user" } }, error: null });
    assert.deepEqual(result, { action: "signOutAndError", message: "此帳號沒有管理員權限" });
  });

  test("successful sign-in with role 'owner' -> navigates", () => {
    const result = adminLoginRoleDecision({ data: { user: { role: "owner" } }, error: null });
    assert.deepEqual(result, { action: "navigate" });
  });

  test("successful sign-in with role 'employee' -> navigates", () => {
    const result = adminLoginRoleDecision({ data: { user: { role: "employee" } }, error: null });
    assert.deepEqual(result, { action: "navigate" });
  });

  test("successful sign-in with missing role -> treated as non-admin, signs out and shows error", () => {
    const result = adminLoginRoleDecision({ data: { user: {} }, error: null });
    assert.deepEqual(result, { action: "signOutAndError", message: "此帳號沒有管理員權限" });
  });
});

describe("isAuthorizedAdmin / adminGuardResponse (Edge case 10)", () => {
  test("rejects an anonymous caller with 401 and the 未授權 error shape", () => {
    const result = adminGuardResponse(null);
    assert.deepEqual(result, { status: 401, body: { error: "未授權" } });
  });

  test("rejects a user-role caller with 401 and the 未授權 error shape", () => {
    const session = { user: { role: "user" } };
    const result = adminGuardResponse(session);
    assert.deepEqual(result, { status: 401, body: { error: "未授權" } });
  });

  test("allows an owner-role caller (no guard response)", () => {
    const session = { user: { role: "owner" } };
    assert.equal(adminGuardResponse(session), null);
  });

  test("allows an employee-role caller (no guard response)", () => {
    const session = { user: { role: "employee" } };
    assert.equal(adminGuardResponse(session), null);
  });
});

describe("shouldCreateOwner (Edge case 13, seed idempotency)", () => {
  test("returns false when an owner with the seed email already exists", () => {
    const existing = { id: "u1", email: "owner@playhard.local", role: "owner" };
    assert.equal(shouldCreateOwner(existing), false);
  });

  test("returns true when no existing user is found", () => {
    assert.equal(shouldCreateOwner(null), true);
  });
});

describe("defaultRole for self-registration (Edge case 14)", () => {
  test("the configured default role is 'user', never owner/employee", () => {
    assert.equal(DEFAULT_SELF_REGISTER_ROLE, "user");
    assert.notEqual(DEFAULT_SELF_REGISTER_ROLE, "owner");
    assert.notEqual(DEFAULT_SELF_REGISTER_ROLE, "employee");
  });

  test("a freshly registered customer's role field mirrors the default (not elevated)", () => {
    // Mirrors: a newly self-registered account always gets role: "user"
    // because adminPlugin({ defaultRole: "user" }) applies to signUp.email,
    // and nothing in the register flow ever sets role to owner/employee.
    const newlyRegisteredUser = { id: "u2", email: "new@customer.com", role: DEFAULT_SELF_REGISTER_ROLE };
    assert.equal(newlyRegisteredUser.role, "user");
  });
});
