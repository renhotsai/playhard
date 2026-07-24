/**
 * Verifies that all expected API route files and key source files exist
 * at the paths described in the spec.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

function exists(relativePath) {
  return existsSync(join(ROOT, relativePath));
}

describe("Required file structure", () => {
  // Infrastructure
  test("prisma/schema.prisma exists", () => {
    assert.ok(exists("prisma/schema.prisma"), "prisma/schema.prisma not found");
  });

  test(".env.example exists", () => {
    assert.ok(exists(".env.example"), ".env.example not found");
  });

  // Library helpers
  test("src/lib/prisma.ts exists", () => {
    assert.ok(exists("src/lib/prisma.ts"), "src/lib/prisma.ts not found");
  });

  test("src/middleware.ts exists", () => {
    assert.ok(exists("src/middleware.ts"), "src/middleware.ts not found");
  });

  // Better Auth library files (Edge case 11)
  test("src/lib/auth.ts exists", () => {
    assert.ok(exists("src/lib/auth.ts"), "src/lib/auth.ts not found");
  });

  test("src/lib/auth-client.ts exists", () => {
    assert.ok(exists("src/lib/auth-client.ts"), "src/lib/auth-client.ts not found");
  });

  test("src/lib/auth-access-control.ts exists", () => {
    assert.ok(exists("src/lib/auth-access-control.ts"), "src/lib/auth-access-control.ts not found");
  });

  // Auth API routes (Edge case 11)
  test("src/app/api/auth/[...all]/route.ts exists", () => {
    assert.ok(exists("src/app/api/auth/[...all]/route.ts"));
  });

  test("prisma/seed.ts exists", () => {
    assert.ok(exists("prisma/seed.ts"));
  });

  // Customer-facing auth pages (Edge case 11)
  test("src/app/register/page.tsx exists", () => {
    assert.ok(exists("src/app/register/page.tsx"));
  });

  test("src/app/login/page.tsx exists", () => {
    assert.ok(exists("src/app/login/page.tsx"));
  });

  test("src/app/account/page.tsx exists", () => {
    assert.ok(exists("src/app/account/page.tsx"));
  });

  // Owner-only employee management (Edge case 11)
  test("src/app/admin/employees/page.tsx exists", () => {
    assert.ok(exists("src/app/admin/employees/page.tsx"));
  });

  // Deleted iron-session files (Edge case 12)
  test("src/lib/session.ts does NOT exist (deleted)", () => {
    assert.ok(!exists("src/lib/session.ts"), "src/lib/session.ts should have been deleted");
  });

  test("src/app/api/auth/login/route.ts does NOT exist (deleted)", () => {
    assert.ok(
      !exists("src/app/api/auth/login/route.ts"),
      "src/app/api/auth/login/route.ts should have been deleted"
    );
  });

  test("src/app/api/auth/logout/route.ts does NOT exist (deleted)", () => {
    assert.ok(
      !exists("src/app/api/auth/logout/route.ts"),
      "src/app/api/auth/logout/route.ts should have been deleted"
    );
  });

  // Scripts API routes
  test("src/app/api/scripts/route.ts exists", () => {
    assert.ok(exists("src/app/api/scripts/route.ts"));
  });

  test("src/app/api/scripts/[id]/route.ts exists", () => {
    assert.ok(exists("src/app/api/scripts/[id]/route.ts"));
  });

  // Sessions API routes
  test("src/app/api/sessions/route.ts exists", () => {
    assert.ok(exists("src/app/api/sessions/route.ts"));
  });

  test("src/app/api/sessions/[id]/route.ts exists", () => {
    assert.ok(exists("src/app/api/sessions/[id]/route.ts"));
  });

  // Reservations API route
  test("src/app/api/reservations/route.ts exists", () => {
    assert.ok(exists("src/app/api/reservations/route.ts"));
  });

  // Banners API routes
  test("src/app/api/banners/route.ts exists", () => {
    assert.ok(exists("src/app/api/banners/route.ts"));
  });

  test("src/app/api/banners/[id]/route.ts exists", () => {
    assert.ok(exists("src/app/api/banners/[id]/route.ts"));
  });

  // Announcements API routes
  test("src/app/api/announcements/route.ts exists", () => {
    assert.ok(exists("src/app/api/announcements/route.ts"));
  });

  test("src/app/api/announcements/[id]/route.ts exists", () => {
    assert.ok(exists("src/app/api/announcements/[id]/route.ts"));
  });

  // Public pages
  test("src/app/page.tsx exists (homepage)", () => {
    assert.ok(exists("src/app/page.tsx"));
  });

  test("src/app/scripts/page.tsx exists", () => {
    assert.ok(exists("src/app/scripts/page.tsx"));
  });

  test("src/app/scripts/[id]/page.tsx exists", () => {
    assert.ok(exists("src/app/scripts/[id]/page.tsx"));
  });

  test("src/app/scripts/[id]/reserve/[sessionId]/page.tsx exists", () => {
    assert.ok(exists("src/app/scripts/[id]/reserve/[sessionId]/page.tsx"));
  });

  // Admin pages
  test("src/app/admin/login/page.tsx exists", () => {
    assert.ok(exists("src/app/admin/login/page.tsx"));
  });

  test("src/app/admin/page.tsx exists (dashboard)", () => {
    assert.ok(exists("src/app/admin/page.tsx"));
  });

  test("src/app/admin/scripts/page.tsx exists", () => {
    assert.ok(exists("src/app/admin/scripts/page.tsx"));
  });

  test("src/app/admin/scripts/new/page.tsx exists", () => {
    assert.ok(exists("src/app/admin/scripts/new/page.tsx"));
  });

  test("src/app/admin/scripts/[id]/edit/page.tsx exists", () => {
    assert.ok(exists("src/app/admin/scripts/[id]/edit/page.tsx") ||
              exists("src/app/admin/scripts/[id]/page.tsx"),
              "admin scripts edit page not found");
  });

  test("src/app/admin/sessions/page.tsx exists", () => {
    assert.ok(exists("src/app/admin/sessions/page.tsx"));
  });

  test("src/app/admin/sessions/new/page.tsx exists", () => {
    assert.ok(exists("src/app/admin/sessions/new/page.tsx"));
  });

  test("src/app/admin/reservations/page.tsx exists", () => {
    assert.ok(exists("src/app/admin/reservations/page.tsx"));
  });

  test("src/app/admin/banners/page.tsx exists", () => {
    assert.ok(exists("src/app/admin/banners/page.tsx"));
  });

  test("src/app/admin/announcements/page.tsx exists", () => {
    assert.ok(exists("src/app/admin/announcements/page.tsx"));
  });

  // Components
  test("src/components/public/Navbar.tsx exists", () => {
    assert.ok(exists("src/components/public/Navbar.tsx"));
  });

  test("src/components/public/Footer.tsx exists", () => {
    assert.ok(exists("src/components/public/Footer.tsx"));
  });

  test("src/components/public/BannerCarousel.tsx exists", () => {
    assert.ok(exists("src/components/public/BannerCarousel.tsx"));
  });

  test("src/components/public/ScriptCard.tsx exists", () => {
    assert.ok(exists("src/components/public/ScriptCard.tsx"));
  });

  test("src/components/public/AnnouncementList.tsx exists", () => {
    assert.ok(exists("src/components/public/AnnouncementList.tsx"));
  });

  test("src/components/admin/Sidebar.tsx exists", () => {
    assert.ok(exists("src/components/admin/Sidebar.tsx"));
  });

  test("src/components/admin/AdminHeader.tsx exists", () => {
    assert.ok(exists("src/components/admin/AdminHeader.tsx"));
  });
});
