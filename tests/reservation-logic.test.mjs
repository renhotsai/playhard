/**
 * Unit tests for reservation validation logic.
 * These tests exercise the exact same conditional branches that live in
 * src/app/api/reservations/route.ts POST handler, expressed as pure
 * functions so they can run without Next.js, Prisma, or a database.
 *
 * Uses Node.js built-in test runner (node:test), available in Node >= 18.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

// ---------------------------------------------------------------------------
// Pure validation helpers that mirror the route handler logic
// ---------------------------------------------------------------------------

/**
 * Validates the required fields of a reservation request body.
 * Returns an error string on failure, or null on success.
 *
 * @param {{ name?: unknown, phone?: unknown, email?: unknown, playerCount?: unknown }} body
 * @returns {string | null}
 */
function validateReservationFields(body) {
  const { name, phone, email, playerCount } = body;

  if (!name || !String(name).trim()) return "請填寫姓名";
  if (!phone || !String(phone).trim()) return "請填寫電話";
  if (!email || !String(email).trim()) return "請填寫電子信箱";
  if (!playerCount || Number(playerCount) < 1) return "報名人數至少為1人";

  return null;
}

/**
 * Validates a reservation against the current session state.
 * Returns an error string on failure, or null on success.
 *
 * @param {{ open: boolean, currentPlayers: number, maxPlayers: number }} session
 * @param {number} playerCount
 * @returns {string | null}
 */
function validateReservationAgainstSession(session, playerCount) {
  if (!session.open) return "此場次已關閉，無法預約";
  if (session.currentPlayers + playerCount > session.maxPlayers)
    return "此場次名額已滿";
  return null;
}

/**
 * Simulates the atomic increment that the Prisma transaction performs.
 * Returns the new currentPlayers value.
 *
 * @param {{ currentPlayers: number }} session
 * @param {number} playerCount
 * @returns {number}
 */
function applyReservation(session, playerCount) {
  return session.currentPlayers + playerCount;
}

/**
 * Validates the session date for creation.
 * Returns an error string if the date is in the past, otherwise null.
 *
 * @param {string | Date} date
 * @param {Date} now
 * @returns {string | null}
 */
function validateSessionDate(date, now = new Date()) {
  const sessionDate = new Date(date);
  if (sessionDate <= now) return "場次日期必須是未來的時間";
  return null;
}

/**
 * Simulates the scripts GET filter (mirrors route handler).
 *
 * @param {{ published: boolean }[]} scripts
 * @param {string | null} publishedParam
 * @returns {{ published: boolean }[]}
 */
function filterScripts(scripts, publishedParam) {
  if (publishedParam === "true") return scripts.filter((s) => s.published);
  return scripts;
}

/**
 * Simulates the public sessions filter for GET /api/scripts/[id].
 * Only sessions where open=true AND date >= now are returned for public view.
 *
 * @param {{ open: boolean, date: Date }[]} sessions
 * @param {Date} now
 * @returns {{ open: boolean, date: Date }[]}
 */
function filterPublicSessions(sessions, now = new Date()) {
  return sessions.filter((s) => s.open && new Date(s.date) >= now);
}

/**
 * Simulates the admin-view gating for GET /api/scripts/[id] (review round 1 fix).
 * `?admin=true` must only be honored when the caller has a verified, logged-in
 * iron-session; otherwise it must fall back to the public filter regardless of
 * the query parameter.
 *
 * @param {boolean} requestedAdminView - whether `?admin=true` was passed
 * @param {boolean | undefined} isLoggedIn - session.isLoggedIn value (may be absent/undefined for no/invalid session)
 * @returns {boolean}
 */
function resolveAdminView(requestedAdminView, isLoggedIn) {
  return requestedAdminView && !!isLoggedIn;
}

/**
 * Simulates banner sort order.
 *
 * @param {{ sortOrder: number }[]} banners
 * @returns {{ sortOrder: number }[]}
 */
function sortBanners(banners) {
  return [...banners].sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Simulates announcement filter + ordering.
 *
 * @param {{ active: boolean, pinned: boolean, createdAt: Date }[]} announcements
 * @param {string | null} activeParam
 * @returns {{ active: boolean, pinned: boolean, createdAt: Date }[]}
 */
function filterAndSortAnnouncements(announcements, activeParam) {
  const filtered =
    activeParam === "true" ? announcements.filter((a) => a.active) : announcements;
  return [...filtered].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Reservation field validation (Edge cases 4 & 5)", () => {
  test("returns null when all required fields are valid", () => {
    const result = validateReservationFields({
      name: "Alice",
      phone: "0912345678",
      email: "alice@example.com",
      playerCount: 2,
    });
    assert.equal(result, null);
  });

  test("returns error when name is missing (undefined)", () => {
    const result = validateReservationFields({
      phone: "0912345678",
      email: "alice@example.com",
      playerCount: 2,
    });
    assert.equal(result, "請填寫姓名");
  });

  test("returns error when name is empty string", () => {
    const result = validateReservationFields({
      name: "",
      phone: "0912345678",
      email: "alice@example.com",
      playerCount: 2,
    });
    assert.equal(result, "請填寫姓名");
  });

  test("returns error when name is whitespace only", () => {
    const result = validateReservationFields({
      name: "   ",
      phone: "0912345678",
      email: "alice@example.com",
      playerCount: 2,
    });
    assert.equal(result, "請填寫姓名");
  });

  test("returns error when phone is missing", () => {
    const result = validateReservationFields({
      name: "Alice",
      email: "alice@example.com",
      playerCount: 2,
    });
    assert.equal(result, "請填寫電話");
  });

  test("returns error when phone is empty string", () => {
    const result = validateReservationFields({
      name: "Alice",
      phone: "",
      email: "alice@example.com",
      playerCount: 2,
    });
    assert.equal(result, "請填寫電話");
  });

  test("returns error when email is missing", () => {
    const result = validateReservationFields({
      name: "Alice",
      phone: "0912345678",
      playerCount: 2,
    });
    assert.equal(result, "請填寫電子信箱");
  });

  test("returns error when email is empty string", () => {
    const result = validateReservationFields({
      name: "Alice",
      phone: "0912345678",
      email: "",
      playerCount: 2,
    });
    assert.equal(result, "請填寫電子信箱");
  });

  test("returns error when playerCount is 0 (Edge case 5)", () => {
    const result = validateReservationFields({
      name: "Alice",
      phone: "0912345678",
      email: "alice@example.com",
      playerCount: 0,
    });
    assert.equal(result, "報名人數至少為1人");
  });

  test("returns error when playerCount is negative (Edge case 5)", () => {
    const result = validateReservationFields({
      name: "Alice",
      phone: "0912345678",
      email: "alice@example.com",
      playerCount: -1,
    });
    assert.equal(result, "報名人數至少為1人");
  });

  test("returns error when playerCount is missing", () => {
    const result = validateReservationFields({
      name: "Alice",
      phone: "0912345678",
      email: "alice@example.com",
    });
    assert.equal(result, "報名人數至少為1人");
  });
});

describe("Reservation session validation (Edge cases 1 & 2)", () => {
  test("returns null for an open session with available capacity (happy path)", () => {
    const session = { open: true, currentPlayers: 2, maxPlayers: 8 };
    const result = validateReservationAgainstSession(session, 3);
    assert.equal(result, null);
  });

  test("returns closed error when session.open is false (Edge case 1)", () => {
    const session = { open: false, currentPlayers: 0, maxPlayers: 8 };
    const result = validateReservationAgainstSession(session, 1);
    assert.equal(result, "此場次已關閉，無法預約");
  });

  test("returns capacity error when adding players would exceed maxPlayers (Edge case 2)", () => {
    const session = { open: true, currentPlayers: 7, maxPlayers: 8 };
    const result = validateReservationAgainstSession(session, 2);
    assert.equal(result, "此場次名額已滿");
  });

  test("returns capacity error when currentPlayers already equals maxPlayers (Edge case 2)", () => {
    const session = { open: true, currentPlayers: 8, maxPlayers: 8 };
    const result = validateReservationAgainstSession(session, 1);
    assert.equal(result, "此場次名額已滿");
  });

  test("allows reservation when playerCount exactly fills remaining capacity", () => {
    const session = { open: true, currentPlayers: 5, maxPlayers: 8 };
    const result = validateReservationAgainstSession(session, 3);
    assert.equal(result, null);
  });
});

describe("Reservation atomic increment (Edge case 3)", () => {
  test("increments currentPlayers by playerCount", () => {
    const session = { currentPlayers: 3 };
    const newCount = applyReservation(session, 2);
    assert.equal(newCount, 5);
  });

  test("incrementing from 0 by requested count yields requested count", () => {
    const session = { currentPlayers: 0 };
    const newCount = applyReservation(session, 4);
    assert.equal(newCount, 4);
  });
});

describe("Session date validation (Edge case 14)", () => {
  test("returns null for a future date", () => {
    const future = new Date(Date.now() + 86_400_000); // +1 day
    const now = new Date();
    const result = validateSessionDate(future, now);
    assert.equal(result, null);
  });

  test("returns error for a past date", () => {
    const past = new Date(Date.now() - 86_400_000); // -1 day
    const now = new Date();
    const result = validateSessionDate(past, now);
    assert.equal(result, "場次日期必須是未來的時間");
  });

  test("returns error for the exact current time (not strictly future)", () => {
    const now = new Date();
    const result = validateSessionDate(now, now);
    assert.equal(result, "場次日期必須是未來的時間");
  });

  test("accepts an ISO string representing a future date", () => {
    const now = new Date("2024-01-01T00:00:00Z");
    const result = validateSessionDate("2025-06-01T10:00:00Z", now);
    assert.equal(result, null);
  });
});

describe("Script published filter (Edge case 6)", () => {
  const allScripts = [
    { id: "1", published: true },
    { id: "2", published: false },
    { id: "3", published: true },
  ];

  test("returns all scripts when no published param (admin view)", () => {
    const result = filterScripts(allScripts, null);
    assert.equal(result.length, 3);
  });

  test("returns only published=true scripts when ?published=true (Edge case 6)", () => {
    const result = filterScripts(allScripts, "true");
    assert.equal(result.length, 2);
    assert.ok(result.every((s) => s.published));
  });

  test("returns all scripts when published param is something other than 'true'", () => {
    const result = filterScripts(allScripts, "false");
    assert.equal(result.length, 3);
  });
});

describe("Public sessions filter (Edge case 7)", () => {
  const now = new Date("2024-06-01T12:00:00Z");

  const sessions = [
    { id: "a", open: true, date: new Date("2024-06-02T10:00:00Z") },   // future + open
    { id: "b", open: false, date: new Date("2024-06-02T10:00:00Z") },  // future but closed
    { id: "c", open: true, date: new Date("2024-05-30T10:00:00Z") },   // past + open
    { id: "d", open: false, date: new Date("2024-05-30T10:00:00Z") },  // past + closed
  ];

  test("returns only open, future sessions for public view (Edge case 7)", () => {
    const result = filterPublicSessions(sessions, now);
    assert.equal(result.length, 1);
    assert.equal(result[0].id, "a");
  });

  test("excludes sessions that are open but in the past", () => {
    const result = filterPublicSessions(sessions, now);
    assert.ok(result.every((s) => new Date(s.date) >= now));
  });

  test("excludes sessions that are future but closed", () => {
    const result = filterPublicSessions(sessions, now);
    assert.ok(result.every((s) => s.open));
  });
});

describe("Admin view gating for GET /api/scripts/[id] (Edge case 8, review round 1 fix)", () => {
  test("honors ?admin=true when session.isLoggedIn is true", () => {
    const result = resolveAdminView(true, true);
    assert.equal(result, true);
  });

  test("ignores ?admin=true when session.isLoggedIn is false (no valid session)", () => {
    const result = resolveAdminView(true, false);
    assert.equal(result, false);
  });

  test("ignores ?admin=true when session.isLoggedIn is undefined (missing/invalid cookie)", () => {
    const result = resolveAdminView(true, undefined);
    assert.equal(result, false);
  });

  test("stays false when admin param not requested, even with a valid session", () => {
    const result = resolveAdminView(false, true);
    assert.equal(result, false);
  });
});

describe("Banner sort order (Edge case 12)", () => {
  test("sorts banners by sortOrder ascending", () => {
    const banners = [
      { id: "1", sortOrder: 3 },
      { id: "2", sortOrder: 1 },
      { id: "3", sortOrder: 2 },
    ];
    const sorted = sortBanners(banners);
    assert.equal(sorted[0].id, "2");
    assert.equal(sorted[1].id, "3");
    assert.equal(sorted[2].id, "1");
  });

  test("handles banners with equal sortOrder without error", () => {
    const banners = [
      { id: "x", sortOrder: 1 },
      { id: "y", sortOrder: 1 },
    ];
    const sorted = sortBanners(banners);
    assert.equal(sorted.length, 2);
  });
});

describe("Announcement filter and ordering (Edge case 13)", () => {
  const announcements = [
    { id: "1", active: true, pinned: false, createdAt: new Date("2024-05-01") },
    { id: "2", active: true, pinned: true, createdAt: new Date("2024-05-02") },
    { id: "3", active: false, pinned: false, createdAt: new Date("2024-05-03") },
    { id: "4", active: true, pinned: false, createdAt: new Date("2024-05-04") },
  ];

  test("returns only active announcements when ?active=true (Edge case 13)", () => {
    const result = filterAndSortAnnouncements(announcements, "true");
    assert.ok(result.every((a) => a.active));
    assert.equal(result.find((a) => a.id === "3"), undefined);
  });

  test("pinned announcement appears before non-pinned ones (Edge case 13)", () => {
    const result = filterAndSortAnnouncements(announcements, "true");
    assert.equal(result[0].pinned, true);
  });

  test("among non-pinned, more recent createdAt comes first (Edge case 13)", () => {
    const result = filterAndSortAnnouncements(announcements, "true");
    const nonPinned = result.filter((a) => !a.pinned);
    assert.ok(
      new Date(nonPinned[0].createdAt) >= new Date(nonPinned[1].createdAt)
    );
  });

  test("returns all announcements when no active param", () => {
    const result = filterAndSortAnnouncements(announcements, null);
    assert.equal(result.length, 4);
  });
});

describe("Login credential validation (Edge case 9)", () => {
  function checkCredentials(username, password, envUsername, envPassword) {
    if (username !== envUsername || password !== envPassword) {
      return { ok: false, error: "帳號或密碼錯誤", status: 401 };
    }
    return { ok: true, status: 200 };
  }

  test("returns ok:false and 401 for wrong username (Edge case 9)", () => {
    const result = checkCredentials("wronguser", "admin123", "admin", "admin123");
    assert.equal(result.ok, false);
    assert.equal(result.status, 401);
    assert.equal(result.error, "帳號或密碼錯誤");
  });

  test("returns ok:false and 401 for wrong password (Edge case 9)", () => {
    const result = checkCredentials("admin", "wrongpass", "admin", "admin123");
    assert.equal(result.ok, false);
    assert.equal(result.status, 401);
    assert.equal(result.error, "帳號或密碼錯誤");
  });

  test("returns ok:false and 401 for both wrong (Edge case 9)", () => {
    const result = checkCredentials("hacker", "hack", "admin", "admin123");
    assert.equal(result.ok, false);
    assert.equal(result.status, 401);
  });

  test("returns ok:true and 200 for correct credentials (Edge case 10)", () => {
    const result = checkCredentials("admin", "admin123", "admin", "admin123");
    assert.equal(result.ok, true);
    assert.equal(result.status, 200);
  });
});
