/**
 * Behavioral regression tests for src/lib/scriptPriceFields.ts, the
 * price-coercion helper shared by POST /api/scripts and
 * PUT /api/scripts/[id].
 *
 * These import and exercise the REAL exported functions (not a
 * regex-matched copy of the route source), so they actually catch
 * regressions in the coercion/partial-update behavior rather than just
 * confirming a field name appears somewhere in the file.
 *
 * Covers the final-review Critical 2 bug: PUT /api/scripts/[id] used to
 * destructure pricePerPerson/priceGroup unconditionally and treat
 * "sent vs. absent" the same as "blank", so a partial body like
 * `{ published: true }` (exactly what the admin "toggle published"
 * button sends) silently wiped both prices to null on every click.
 *
 * Uses Node.js built-in test runner (node:test), run via
 * `node --import tsx --test tests/` so the TypeScript import below
 * resolves (tsx is already a devDependency of this repo).
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { coercePriceField, buildScriptUpdateData } from "../src/lib/scriptPriceFields.ts";

describe("coercePriceField", () => {
  test('"" coerces to null, not 0', () => {
    assert.equal(coercePriceField(""), null);
  });

  test("null coerces to null", () => {
    assert.equal(coercePriceField(null), null);
  });

  test("undefined coerces to null", () => {
    assert.equal(coercePriceField(undefined), null);
  });

  test("a numeric string coerces to a number", () => {
    assert.equal(coercePriceField("650"), 650);
  });

  test("a number passes through", () => {
    assert.equal(coercePriceField(0), 0);
  });

  test("non-numeric garbage falls back to null instead of NaN", () => {
    assert.equal(coercePriceField("abc"), null);
  });

  test("Infinity falls back to null", () => {
    assert.equal(coercePriceField("Infinity"), null);
  });
});

describe("buildScriptUpdateData (PUT /api/scripts/[id] partial-update safety)", () => {
  test("a body that omits pricePerPerson/priceGroup does NOT add those keys to data", () => {
    // This is exactly the request ScriptTogglePublished.tsx sends:
    // JSON.stringify({ published: !isPublished })
    const body = { published: true };
    const data = buildScriptUpdateData(body);

    assert.equal("pricePerPerson" in data, false);
    assert.equal("priceGroup" in data, false);
    assert.deepEqual(data, { published: true });
  });

  test("a body that explicitly sends pricePerPerson: \"\" coerces it to null in data", () => {
    const body = { pricePerPerson: "", priceGroup: "" };
    const data = buildScriptUpdateData(body);

    assert.equal(data.pricePerPerson, null);
    assert.equal(data.priceGroup, null);
  });

  test("a body that sends real prices coerces them to numbers in data", () => {
    const body = { pricePerPerson: "650", priceGroup: "4200" };
    const data = buildScriptUpdateData(body);

    assert.equal(data.pricePerPerson, 650);
    assert.equal(data.priceGroup, 4200);
  });

  test("a body that sends only pricePerPerson leaves priceGroup untouched", () => {
    const body = { pricePerPerson: "800" };
    const data = buildScriptUpdateData(body);

    assert.equal(data.pricePerPerson, 800);
    assert.equal("priceGroup" in data, false);
  });

  test("other fields in the body pass through unchanged", () => {
    const body = { title: "New Title", published: false };
    const data = buildScriptUpdateData(body);

    assert.equal(data.title, "New Title");
    assert.equal(data.published, false);
    assert.equal("pricePerPerson" in data, false);
    assert.equal("priceGroup" in data, false);
  });
});
