// tests/api-scripts-fields.test.mjs
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const routeSrc = readFileSync(join(ROOT, "src/app/api/scripts/route.ts"), "utf-8");

describe("POST /api/scripts destructures the new catalog fields", () => {
  for (const field of ["storyText", "pricePerPerson", "priceGroup", "isContactOnly", "bookingNote"]) {
    test(`destructures and persists ${field}`, () => {
      assert.match(routeSrc, new RegExp(field));
    });
  }
});
