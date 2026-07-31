// tests/schema-fields.test.mjs
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const schema = readFileSync(join(ROOT, "prisma/schema.prisma"), "utf-8");

describe("Script model has the new catalog-migration fields", () => {
  test("has storyText String field", () => {
    assert.match(schema, /storyText\s+String/);
  });
  test("has pricePerPerson Int? field", () => {
    assert.match(schema, /pricePerPerson\s+Int\?/);
  });
  test("has priceGroup Int? field", () => {
    assert.match(schema, /priceGroup\s+Int\?/);
  });
  test("has isContactOnly Boolean field with default false", () => {
    assert.match(schema, /isContactOnly\s+Boolean\s+@default\(false\)/);
  });
  test("has bookingNote String? field", () => {
    assert.match(schema, /bookingNote\s+String\?/);
  });
});
