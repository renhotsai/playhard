// Shared price-field coercion for the script create/update API routes.
//
// Rules:
//  - "" or null/undefined -> null (price intentionally left blank)
//  - a value that Number() can't turn into a finite number (e.g. "abc",
//    NaN, Infinity) -> falls back to null rather than writing NaN to the
//    DB (which would otherwise cause Prisma to throw and the route to
//    return a generic 500)
//  - anything else -> Number(value)
export function coercePriceField(value: unknown): number | null {
  if (value === "" || value == null) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

// Builds the `data` object for PUT /api/scripts/[id] from a (possibly
// partial) request body. Only sets pricePerPerson/priceGroup on `data`
// when the client actually sent that key, so a partial update (e.g. the
// admin "toggle published" control, which only sends `{ published }`)
// does not wipe existing prices by coercing `undefined` to `null`.
export function buildScriptUpdateData(
  body: Record<string, unknown>
): Record<string, unknown> {
  const { pricePerPerson, priceGroup, ...rest } = body;
  const data: Record<string, unknown> = { ...rest };

  if ("pricePerPerson" in body) {
    data.pricePerPerson = coercePriceField(pricePerPerson);
  }
  if ("priceGroup" in body) {
    data.priceGroup = coercePriceField(priceGroup);
  }

  return data;
}
