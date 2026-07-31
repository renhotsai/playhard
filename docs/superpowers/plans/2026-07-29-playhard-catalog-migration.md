# PlayHard Catalog Migration + Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the full ~46-script LARP/murder-mystery catalog and business info from the live SimplyBook.me booking site into the PlayHard Next.js app, and redesign the public UI to match the brand's dark/gold aesthetic.

**Architecture:** Extend the existing `Script` Prisma model with price/story/contact-only fields, seed it from a transcribed data file + downloaded cover images, then retheme every public-facing page/component (Tailwind v4 CSS-first theme tokens + self-hosted fonts) on top of the existing Next.js App Router structure. Admin forms get matching field additions (no visual redesign — internal tool).

**Tech Stack:** Next.js 16 (App Router), Prisma 6 + SQLite, Tailwind CSS v4 (CSS-first `@theme`, no `tailwind.config.js`), Better Auth, Node's built-in test runner (`node:test`, `.mjs` files under `tests/`, no DB/server needed — pure-function and file-structure assertions only, matching the existing convention in `tests/reservation-logic.test.mjs` and `tests/file-structure.test.mjs`).

## Global Constraints

- Source of truth for content: `docs/superpowers/specs/2026-07-29-playhard-catalog-raw-data.md` (business info, all 46 script entries, cover image URLs). Do not re-scrape the live site.
- Design spec: `docs/superpowers/specs/2026-07-29-playhard-catalog-migration-design.md`. Follow its scope decisions exactly (single `genre` string, no DB model for business info, `isContactOnly` flag, self-hosted images).
- All 46 scripts import in one pass with `published: true`.
- Tailwind v4 has no `tailwind.config.ts` in this repo — theme tokens go in `src/app/globals.css` via `@theme { ... }`, not a JS config file.
- Existing test convention: plain Node.js test runner, no framework. Run with `node --test tests/`. New tests follow the same pattern (pure functions / `existsSync` checks), no Prisma/DB/server needed to run them.
- Admin panel (`src/app/admin/**`) keeps its existing blue/gray styling — it is explicitly out of scope for the redesign.
- Don't touch `tests/auth-logic.test.mjs` — it has one pre-existing unrelated failure; not this project's concern.

---

### Task 1: Extend the Script model (price, story, contact-only fields)

**Files:**
- Modify: `prisma/schema.prisma:12-23` (the `Script` model)
- Test: `tests/schema-fields.test.mjs` (new)

**Interfaces:**
- Produces: `Script` model gains `storyText: String`, `pricePerPerson: Int?`, `priceGroup: Int?`, `isContactOnly: Boolean @default(false)`, `bookingNote: String?`. All other tasks that read/write `Script` rows depend on these existing.

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/schema-fields.test.mjs`
Expected: FAIL (all 5 assertions) — fields don't exist yet.

- [ ] **Step 3: Edit the Script model**

In `prisma/schema.prisma`, replace the existing `Script` model with:

```prisma
model Script {
  id             String    @id @default(cuid())
  title          String
  description    String
  storyText      String
  coverImage     String
  playerCount    String
  duration       String
  difficulty     String
  genre          String
  pricePerPerson Int?
  priceGroup     Int?
  isContactOnly  Boolean   @default(false)
  bookingNote    String?
  published      Boolean   @default(false)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  sessions       Session[]
}
```

- [ ] **Step 4: Push the schema change and regenerate the client**

Run: `npx prisma db push && npx prisma generate`
Expected: `Your database is now in sync with your Prisma schema.` and client generation succeeds with no errors.

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test tests/schema-fields.test.mjs`
Expected: PASS (5/5)

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma tests/schema-fields.test.mjs
git commit -m "feat(db): add price, story, and contact-only fields to Script model"
```

---

### Task 2: Business info constants file

**Files:**
- Create: `src/lib/business-info.ts`
- Test: `tests/business-info.test.mjs` (new)

**Interfaces:**
- Produces: `businessInfo` object — `{ name, address, addressNote, mapUrl, hours, email, lineId, lineUrl, facebookUrl, instagramUrl }` (all `string`). Consumed by Task 10 (Navbar/Footer), Task 12 (`/about`), Task 13 (homepage teaser).

- [ ] **Step 1: Write the failing test**

```js
// tests/business-info.test.mjs
import { test, describe } from "node:test";
import assert from "node:assert/strict";

const { businessInfo } = await import("../src/lib/business-info.ts");

describe("businessInfo constants", () => {
  test("has the expected shape and values", () => {
    assert.equal(businessInfo.name, "玩硬劇本遊戲館");
    assert.equal(businessInfo.address, "台北市中山區民權西路34號6樓");
    assert.equal(businessInfo.hours, "每日 08:00 - 24:00");
    assert.equal(businessInfo.email, "larpplayhardtw@gmail.com");
    assert.equal(businessInfo.lineId, "@tpn8301d");
    assert.ok(businessInfo.lineUrl.startsWith("https://lin.ee/"));
    assert.ok(businessInfo.mapUrl.startsWith("https://maps.app.goo.gl/"));
    assert.ok(businessInfo.facebookUrl.includes("facebook.com"));
    assert.ok(businessInfo.instagramUrl.includes("instagram.com"));
  });
});
```

Note: this test imports a `.ts` file directly. Node 20's built-in test runner cannot execute TypeScript without a loader. Run it with `tsx`'s Node API loader (already a project dependency): `node --import tsx --test tests/business-info.test.mjs`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/business-info.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the constants file**

```ts
// src/lib/business-info.ts
export const businessInfo = {
  name: "玩硬劇本遊戲館",
  address: "台北市中山區民權西路34號6樓",
  addressNote: "近民權西路站 紅線1號出口、橘線7號出口",
  mapUrl: "https://maps.app.goo.gl/qmxgVKZxgubwQhrj7",
  hours: "每日 08:00 - 24:00",
  email: "larpplayhardtw@gmail.com",
  lineId: "@tpn8301d",
  lineUrl: "https://lin.ee/nZvNhqE",
  facebookUrl: "https://www.facebook.com/larpphtw/",
  instagramUrl: "https://www.instagram.com/larpplayhardtw/",
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test tests/business-info.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/business-info.ts tests/business-info.test.mjs
git commit -m "feat: add business info constants (hours, address, contact)"
```

---

### Task 3: Download and self-host cover images

**Files:**
- Create: `scripts/download-covers.mjs`
- Create (generated by running the script): `public/scripts/*.{png,jpg}` (46 files)
- Modify: `package.json` (add `"download:covers"` script)
- Test: `tests/cover-images.test.mjs` (new)

**Interfaces:**
- Consumes: nothing from prior tasks.
- Produces: 46 image files under `public/scripts/`, referenced by filename (unchanged from source) in Task 4's `coverImage` values as `/scripts/<filename>`.

- [ ] **Step 1: Write the failing test**

```js
// tests/cover-images.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

const filenames = [
  "93aa9eb19556c35b9a1130b29ffe7a48.png",
  "b87ba45c21013f38b41b266fe80d7cd8.png",
  "54f12c248d574721f786a7830f783e82.jpg",
  "beac01f60b81ac00ca875643cb9f183b.jpg",
  "d5a354cfa59d978ee15f7416347d6009.jpg",
  "67f693b412546053dcb14d86cd42910a.png",
  "2721975a7aab017e0718e3968fdc3eb6.png",
  "083fe29f1875bdfb2ba2f34621692d3c.jpg",
  "485cb066823ebaffb2177dfe6c5fea39.jpg",
  "86297205829a5f06399924fe11e5c8b9.png",
  "ae41420c0045070b26b642f94cab3eeb.png",
  "deca4dbf090ca8771909fa6b08fe5d1d.png",
  "1bccc939fcc69fe9c34b279be89ba1af.png",
  "c121943bcbb637edbde965c747214e2e.png",
  "c0b2866e24abec4d8b12258edb0a8f98.png",
  "2af729640c71a20a793807968b32bb01.png",
  "036d2028d4c24192e6eb294cb8042e90.png",
  "9ad19bb3c9d227630e7fcdac943c3aab.png",
  "b253156f6e1e9713397bdf1e999d8f2c.png",
  "c85b487cb15db6c5dabf24db0fc34467.png",
  "b0592460005139be355af3494f80ed56.png",
  "1651329176688bcdd6fd03a0f712b456.png",
  "efddd119aa26cfb1a535b7779e6190fe.png",
  "06eadaa53ffbc7e8333b78c19fe07f2f.png",
  "d703da3085dd12a9b825db3eb42d5ad5.png",
  "9f27d977354a6fd901b7e91ba22e9546.jpg",
  "014241ed40337c08101bf6913677697e.jpg",
  "76032771ea64eb0d31e17e3e7d145102.png",
  "7b083cafa2d8ba05c7390041d562dc1d.png",
  "819891a228de8a80867ff45843046a74.png",
  "ae91b5e3bd584b3b0f7a344950a654f8.jpg",
  "173c6d86a64966c1d3687591ff37be93.png",
  "22fb6be6035d2f69dbaca940e04d068e.jpg",
  "144f3e50cee4765cd1a427ed323a72ba.png",
  "1042dc1d4c39727963b51d7cc5b59163.png",
  "7ae9b9ac9243077d79ba7c46dbd53870.png",
  "0c457563e9427c6b3aac697d04071b4b.png",
  "9a015240f2b29d069db39b434c6e9e13.png",
  "86dd2a6aa490ee5105836e35b21d801c.jpg",
  "ca4bf418a1364d04db0f311512ea08d6.png",
  "e78b9084ef1db0c6f25b19e7e64eaa3c.png",
  "654b488f4aa2bd277c594c7ab4cc5618.png",
  "604d0660c7267bb2bc332b465f1d73cd.png",
  "9fd801960815b0082d77c31038fa267a.png",
  "7088e61ea2ce6c7826ec1d0b2c2bff61.png",
  "5f0408a69d30f6eb65e934ea93a87dc5.jpg",
];

test("all 46 script cover images exist under public/scripts/", () => {
  assert.equal(filenames.length, 46);
  for (const f of filenames) {
    assert.ok(existsSync(join(ROOT, "public/scripts", f)), `missing public/scripts/${f}`);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/cover-images.test.mjs`
Expected: FAIL — `public/scripts/` doesn't exist yet.

- [ ] **Step 3: Write the download script**

The list below is copied from `docs/superpowers/specs/2026-07-29-playhard-catalog-raw-data.md` ("Cover image source URLs" section).

```js
// scripts/download-covers.mjs
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const BASE_URL = "https://larpplayhardtw.simplybook.asia/uploads/larpplayhardtw/image_files/preview/";
const OUT_DIR = join(new URL("..", import.meta.url).pathname, "public/scripts");

const filenames = [
  "93aa9eb19556c35b9a1130b29ffe7a48.png",
  "b87ba45c21013f38b41b266fe80d7cd8.png",
  "54f12c248d574721f786a7830f783e82.jpg",
  "beac01f60b81ac00ca875643cb9f183b.jpg",
  "d5a354cfa59d978ee15f7416347d6009.jpg",
  "67f693b412546053dcb14d86cd42910a.png",
  "2721975a7aab017e0718e3968fdc3eb6.png",
  "083fe29f1875bdfb2ba2f34621692d3c.jpg",
  "485cb066823ebaffb2177dfe6c5fea39.jpg",
  "86297205829a5f06399924fe11e5c8b9.png",
  "ae41420c0045070b26b642f94cab3eeb.png",
  "deca4dbf090ca8771909fa6b08fe5d1d.png",
  "1bccc939fcc69fe9c34b279be89ba1af.png",
  "c121943bcbb637edbde965c747214e2e.png",
  "c0b2866e24abec4d8b12258edb0a8f98.png",
  "2af729640c71a20a793807968b32bb01.png",
  "036d2028d4c24192e6eb294cb8042e90.png",
  "9ad19bb3c9d227630e7fcdac943c3aab.png",
  "b253156f6e1e9713397bdf1e999d8f2c.png",
  "c85b487cb15db6c5dabf24db0fc34467.png",
  "b0592460005139be355af3494f80ed56.png",
  "1651329176688bcdd6fd03a0f712b456.png",
  "efddd119aa26cfb1a535b7779e6190fe.png",
  "06eadaa53ffbc7e8333b78c19fe07f2f.png",
  "d703da3085dd12a9b825db3eb42d5ad5.png",
  "9f27d977354a6fd901b7e91ba22e9546.jpg",
  "014241ed40337c08101bf6913677697e.jpg",
  "76032771ea64eb0d31e17e3e7d145102.png",
  "7b083cafa2d8ba05c7390041d562dc1d.png",
  "819891a228de8a80867ff45843046a74.png",
  "ae91b5e3bd584b3b0f7a344950a654f8.jpg",
  "173c6d86a64966c1d3687591ff37be93.png",
  "22fb6be6035d2f69dbaca940e04d068e.jpg",
  "144f3e50cee4765cd1a427ed323a72ba.png",
  "1042dc1d4c39727963b51d7cc5b59163.png",
  "7ae9b9ac9243077d79ba7c46dbd53870.png",
  "0c457563e9427c6b3aac697d04071b4b.png",
  "9a015240f2b29d069db39b434c6e9e13.png",
  "86dd2a6aa490ee5105836e35b21d801c.jpg",
  "ca4bf418a1364d04db0f311512ea08d6.png",
  "e78b9084ef1db0c6f25b19e7e64eaa3c.png",
  "654b488f4aa2bd277c594c7ab4cc5618.png",
  "604d0660c7267bb2bc332b465f1d73cd.png",
  "9fd801960815b0082d77c31038fa267a.png",
  "7088e61ea2ce6c7826ec1d0b2c2bff61.png",
  "5f0408a69d30f6eb65e934ea93a87dc5.jpg",
];

await mkdir(OUT_DIR, { recursive: true });

let ok = 0;
let failed = [];

for (const filename of filenames) {
  const url = BASE_URL + filename;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(join(OUT_DIR, filename), buf);
    ok++;
  } catch (err) {
    failed.push({ filename, error: String(err) });
    console.error(`FAILED: ${filename} — ${err}`);
  }
}

console.log(`Downloaded ${ok}/${filenames.length} images.`);
if (failed.length > 0) {
  console.log("Failed files (seed script will fall back to empty coverImage for these):");
  for (const f of failed) console.log(`  - ${f.filename}: ${f.error}`);
}
```

- [ ] **Step 4: Add the npm script and run it**

In `package.json`, add under `"scripts"`:

```json
"download:covers": "node scripts/download-covers.mjs"
```

Run: `npm run download:covers`
Expected: `Downloaded 46/46 images.` (if any fail, note which — Task 4 must use empty `coverImage` for those specific titles instead of a local path).

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test tests/cover-images.test.mjs`
Expected: PASS (adjust the test's filename list to drop any that genuinely failed to download in Step 4, and note the affected script titles for Task 4)

- [ ] **Step 6: Commit**

```bash
git add scripts/download-covers.mjs package.json tests/cover-images.test.mjs public/scripts
git commit -m "feat: download and self-host script cover images"
```

---

### Task 4: Seed data file (all 46 scripts, transcribed)

**Files:**
- Create: `prisma/seed-data/scripts.ts`
- Test: `tests/seed-data.test.mjs` (new)

**Interfaces:**
- Consumes: `docs/superpowers/specs/2026-07-29-playhard-catalog-raw-data.md` as the content source; `public/scripts/<filename>` paths from Task 3.
- Produces: `export interface SeedScript { ... }` and `export const seedScripts: SeedScript[]` (46 entries). Consumed by Task 5's seed runner.

- [ ] **Step 1: Write the failing test**

```js
// tests/seed-data.test.mjs
import { test, describe } from "node:test";
import assert from "node:assert/strict";

const { seedScripts } = await import("../prisma/seed-data/scripts.ts");

const CONTACT_ONLY_TITLES = [
  "洗劫倫敦所有的玫瑰",
  "高天原-主神的選拔賽",
  "神木屋",
  "還願",
  "病嬌男孩的戀愛日記",
  "忍者",
  "青玉賭坊之玲瓏緣",
  "野之薔薇",
  "沙影",
  "謀殺安徒生",
  "洗劫巴黎所有的星星",
  "洗劫羅馬所有的情書",
];

const GROUP_PRICED_TITLES = ["迪賽普", "白衣死神", "芙蓉庄", "凌汛"];

describe("seedScripts data integrity", () => {
  test("has exactly 46 entries", () => {
    assert.equal(seedScripts.length, 46);
  });

  test("every title is unique", () => {
    const titles = seedScripts.map((s) => s.title);
    assert.equal(new Set(titles).size, titles.length);
  });

  test("every entry has non-empty title, storyText, description, playerCount, duration, difficulty, genre", () => {
    for (const s of seedScripts) {
      for (const field of ["title", "storyText", "description", "playerCount", "duration", "difficulty", "genre"]) {
        assert.ok(typeof s[field] === "string" && s[field].trim().length > 0, `${s.title || "?"}: ${field} is empty`);
      }
    }
  });

  test("every entry has exactly one of pricePerPerson/priceGroup set, never both, never neither", () => {
    for (const s of seedScripts) {
      const hasPerson = s.pricePerPerson != null;
      const hasGroup = s.priceGroup != null;
      assert.notEqual(hasPerson, hasGroup, `${s.title}: must set exactly one of pricePerPerson/priceGroup`);
    }
  });

  test("group-priced titles match the expected list", () => {
    const actual = seedScripts.filter((s) => s.priceGroup != null).map((s) => s.title).sort();
    assert.deepEqual(actual, [...GROUP_PRICED_TITLES].sort());
  });

  test("isContactOnly titles match the expected list", () => {
    const actual = seedScripts.filter((s) => s.isContactOnly).map((s) => s.title).sort();
    assert.deepEqual(actual, [...CONTACT_ONLY_TITLES].sort());
  });

  test("every isContactOnly entry has a non-empty bookingNote", () => {
    for (const s of seedScripts.filter((s) => s.isContactOnly)) {
      assert.ok(s.bookingNote && s.bookingNote.trim().length > 0, `${s.title}: missing bookingNote`);
    }
  });

  test("every non-contact-only entry has bookingNote null/undefined", () => {
    for (const s of seedScripts.filter((s) => !s.isContactOnly)) {
      assert.ok(s.bookingNote == null, `${s.title}: non-contact-only script should not have a bookingNote`);
    }
  });

  test("every coverImage is either empty or a /scripts/ path", () => {
    for (const s of seedScripts) {
      assert.ok(s.coverImage === "" || s.coverImage.startsWith("/scripts/"), `${s.title}: bad coverImage "${s.coverImage}"`);
    }
  });

  test("genre is one of the 6 approved theme tags", () => {
    const allowed = new Set(["恐怖", "歡樂", "情感", "推理", "新手推薦", "神秘私團"]);
    for (const s of seedScripts) {
      assert.ok(allowed.has(s.genre), `${s.title}: unexpected genre "${s.genre}"`);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/seed-data.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the seed data file**

Create `prisma/seed-data/scripts.ts` with this exact shape and field-mapping rules, then mechanically transcribe **all 46 entries** from `docs/superpowers/specs/2026-07-29-playhard-catalog-raw-data.md` (in the same order they appear there) following the rules below. Three fully-worked examples are given (a normal per-person-priced script, a group-priced script, and a contact-only script) — apply the identical pattern to the remaining 43.

**Field mapping rules (apply to every entry in the raw data file):**
- `title`: the heading text with the parenthetical `*(...)*` annotation stripped (e.g. `### 神木屋 *(isContactOnly: true — ...)*` → title `"神木屋"`).
- `description`: the short tag/keyword line directly under the title (e.g. `微恐情感/伊藤潤二/城限/不建議反串/提供換裝` or `#精分超強彩蛋 #為愛奉獻所有 #生日快樂`), taken verbatim.
- `difficulty`: the **first** `標籤⭐...` (or `標籤❤...`) rating segment on the ratings line, taken verbatim including its label (e.g. `推理難度⭐⭐⭐`). This is always the first rating shown, in every entry.
- `playerCount`: the player-count/gender-split text from the heading (e.g. `"6人- 3男3女"`, `"6-7人- 3男4女"`).
- `duration`: the duration text from the price/duration line (e.g. `"5小時"`, `"7~8小時"`).
- `genre`: look up the title in the table below — do not infer it yourself, use the assigned value exactly.
- `pricePerPerson` / `priceGroup`: read the price line. `"$X/人"` → `pricePerPerson: X, priceGroup: null`. `"$X/團"` or `"$X/全團"` → `priceGroup: X, pricePerPerson: null`. Only 迪賽普 ($4200), 白衣死神 ($4000), 芙蓉庄 ($4500), 凌汛 ($3900) use `priceGroup`; every other entry uses `pricePerPerson`.
- `storyText`: everything in the entry after the price/duration line (story paragraphs, any `＊special notes＊`, and the `角色介紹`/character list), joined with blank lines between paragraphs, **excluding** any `isContactOnly` note or "預約請直接..." contact paragraph (that goes to `bookingNote` instead, not `storyText`).
- `coverImage`: `"/scripts/<filename>"` using the filename mapped to this title in the "Cover image source URLs" section of the raw-data file (same file, zipped by position) — unless Task 3 reported that specific file failed to download, in which case use `""`.
- `isContactOnly`: `true` only for the 12 titles listed in `CONTACT_ONLY_TITLES` above; `false` (and `bookingNote: undefined`) for all others.
- `bookingNote`: for `isContactOnly` titles, use this lookup:
  - `"洗劫倫敦所有的玫瑰"` → `"預約此遊戲請直接私訊粉專小編：IG @larpplayhardtw 或官方 LINE（https://lin.ee/n4sr3Lg）。非玩硬劇本館上架劇本，無法使用玩硬相關優惠。"`
  - `"謀殺安徒生"`, `"洗劫巴黎所有的星星"`, `"洗劫羅馬所有的情書"` → `"預約此遊戲請直接私訊「芋薇私團」IG：larp_taroice_val（或中文：芋薇私團）。非玩硬劇本館上架劇本，無法使用玩硬相關優惠。"`
  - `"神木屋"` → `"預約請直接聯繫客服：IG @larpplayhardtw 或官方 LINE（https://lin.ee/woW09Ml）。系統限訂晚場，需白天場次請洽客服。"`
  - all other contact-only titles (`高天原-主神的選拔賽`, `還願`, `病嬌男孩的戀愛日記`, `忍者`, `青玉賭坊之玲瓏緣`, `野之薔薇`, `沙影`) → `"預約請直接聯繫客服：IG @larpplayhardtw 或官方 LINE（https://lin.ee/woW09Ml）。"`

**Genre lookup table (all 46 titles):**

| Title | Genre |
|---|---|
| 洗劫倫敦所有的玫瑰 | 情感 |
| 高天原-主神的選拔賽 | 歡樂 |
| 上路 | 恐怖 |
| 誠如惡魔低語 | 新手推薦 |
| 七日囚徒 | 推理 |
| 神木屋 | 恐怖 |
| 還願 | 恐怖 |
| 盛典！死亡逃生術 | 歡樂 |
| 喵的名字 | 情感 |
| 帶我回家 | 情感 |
| 偉大的一生 | 情感 |
| 十五 | 情感 |
| 一點半 | 恐怖 |
| 泉溪村 | 恐怖 |
| 迪賽普 | 恐怖 |
| 病嬌男孩的戀愛日記 | 情感 |
| 病嬌男孩的精分日記 | 推理 |
| 復生起源 | 推理 |
| 精神病院3 | 推理 |
| 精神病院4 | 歡樂 |
| 忍者 | 歡樂 |
| 它是龍 | 歡樂 |
| 花吃了那女孩 | 恐怖 |
| 格林的花園 | 情感 |
| 白衣死神 | 新手推薦 |
| 雨夜感染者 | 情感 |
| 新屋-1988 | 恐怖 |
| 青玉賭坊之玲瓏緣 | 情感 |
| 沙鯔孤兒院 | 歡樂 |
| 芙蓉庄 | 新手推薦 |
| 薔花與鳶尾 | 推理 |
| 惠子-4885 | 新手推薦 |
| 畸形屋2 | 推理 |
| 繡花鞋-1980 | 恐怖 |
| 消失的新娘 | 新手推薦 |
| 萌殺女僕咖啡廳 | 新手推薦 |
| 精神病院1 | 推理 |
| 精神病院2 | 新手推薦 |
| 野之薔薇 | 推理 |
| 沙影 | 情感 |
| 動物監友會 | 推理 |
| 畸形屋 | 新手推薦 |
| 凌汛 | 新手推薦 |
| 謀殺安徒生 | 歡樂 |
| 洗劫巴黎所有的星星 | 情感 |
| 洗劫羅馬所有的情書 | 情感 |

**Worked example 1 (normal, per-person price):**

```ts
{
  title: "上路",
  description: "最新/驚嚇橋段",
  storyText:
    "夜裡的公路駛過一台越野車，車上的孩子們一聲不吭，副駕駛座上的女人似乎是發了狂，不斷回過頭看向後座數著「1...2...3...」好不容易算好數量，女人終於放心地看向前方……「不對……」女人喃喃自語「他……不是已經死了嗎……」\n\n＊本遊戲遊戲過程中會有驚嚇橋段＊\n若有心臟病、高血壓、密閉空間恐懼症、嚴重氣喘、孕婦、癲癇等，不建議參與本活動，請評估自行身心狀況後再進行遊戲，若有特殊突發狀況，歡迎告知櫃檯或客服人員\n\n角色介紹：\n達澤明：男，爸爸。\n張雅文：女，媽媽。\n張卓君：男，哥哥。\n達雯菁：女，妹妹。\n阿花：女，妹妹。",
  coverImage: "/scripts/54f12c248d574721f786a7830f783e82.jpg",
  playerCount: "5人- 2男3女",
  duration: "3小時",
  difficulty: "推理難度⭐⭐⭐⭐",
  genre: "恐怖",
  pricePerPerson: 750,
  priceGroup: null,
  isContactOnly: false,
  bookingNote: null,
  published: true,
},
```

**Worked example 2 (group price):**

```ts
{
  title: "迪賽普",
  description: "克蘇魯/教徒們贖罪吧/SAN0瘋起來",
  storyText:
    "＊本遊戲劇情部分描寫性與暴力，但遊戲過程一切正常。＊\n＊非恐怖本，僅部分環節會環境黑暗＊\n＊沒有任何章魚受到傷害＊\n\n你悠悠轉醒，腦子昏沉沉。你試圖想起些什麼，但腦海卻一片模糊。環顧四周，你身處一個點著些許蠟燭的詭異法陣中，右手緊握著一把左輪手槍，地上還有一枚彈殼。虛弱的你用盡力氣推開房門，扶在門框上喘氣時，幽深的迴廊陸續傳來開門聲音，走廊盡頭的一間房卻如死一般寂靜。迪賽普教派一年一度的洗禮日，八位信徒被選中接受洗禮，其中一位信徒卻死在了洗禮儀式上......迪賽普教大祭司震怒宣布神諭如果你們不能找出兇手，至高存在 將親自懲戒你們！\n\n角色介紹：\n文森特 男，極鯊幫首領，心狠手辣。\n波特哥 男，暗光會首領，及肩的長髮未曾過多打理，滄桑的面容給人陰沉的感覺。\n蒙德里安 男，英俊帥氣的陰柔男子，父親是貝克蘭德一個餐館老闆。\n瑪格麗特 女，普通的社區辦事人員，天生麗質、膚白貌美讓她擁有眾多追求者。\n薇薇安 女，普通的社區辦事人員，待人友善，金黃色的長髮尤為吸引人。\n桃樂絲 女，短髮有活力的女孩，臉色蒼白似乎有些憂鬱。\n奧莉維婭 女，中產家族的大小姐，脾氣溫和，酒紅色的秀髮讓她擁有眾多的追求者。",
  coverImage: "/scripts/c0b2866e24abec4d8b12258edb0a8f98.png",
  playerCount: "6-7人- 3男4女",
  duration: "3.5小時",
  difficulty: "推理難度⭐⭐",
  genre: "恐怖",
  pricePerPerson: null,
  priceGroup: 4200,
  isContactOnly: false,
  bookingNote: null,
  published: true,
},
```

**Worked example 3 (contact-only):**

```ts
{
  title: "神木屋",
  description: "微恐情感/伊藤潤二/城限/不建議反串/提供換裝",
  storyText:
    "＊本故事經「伊藤潤二」授權，並由「伊藤潤二精選集」改編＊\n＊訂場時間由於「系統設置」關係，較為硬性。若需調整或於特殊時段訂位，請直接聯繫客服。\n\n東京郊外，一座老宅長年矗立在無人問津的荒山叢林中，新的屋主神木彻(音同撤)在此開辦民宿\"神木屋\"，卻又給客人們豎立許多古怪的規矩，有關它的怪談傳說漸漸擴散開來，膽小之人自然敬而遠之，神木屋越發荒涼。S大學\"超自然研究協會\"的5名社員偏偏不信邪，在畢業前夕結伴前往這棟古宅中留宿了一夜，第二天都毫髮無損地回到了學校，謠言似乎不攻自破。五年之後，曾經的社員們重回當年探險的老宅，誰知一夜過後，某社員竟慘死在反鎖的屋中。隨著案件的搜查，現實與人心的反轉漸漸顯露，多年的愛恨與殺戮終於隨著古宅的秘密撥開了重重迷霧......\n\n＊本遊戲遊戲過程中會有驚嚇橋段＊\n若有心臟病、高血壓、密閉空間恐懼症、嚴重氣喘、孕婦、癲癇等，不建議參與本活動，請評估自行身心狀況後再進行遊戲，若有特殊突發狀況，歡迎告知櫃檯或客服人員\n\n角色介紹：\n坂田一郎：男，27歲，寬厚而缺乏個性，坂田雜誌社社長。\n栗山亮：男，18歲，熱情殷勤，坂田雜誌社職員。\n淺野慎司：男，27歲，冷漠寡言，前坂田雜誌社編輯。\n酒井美和子：女，27歲，性感而富有主動性，前坂田雜誌社秘書，現無業，坂田前妻。\n上杉千惠：女，27歲，敏感毒舌，前坂田雜誌社簽約作家。\n神木葵：女，17歲，天真單純，神木屋年輕的看宅人。",
  coverImage: "/scripts/67f693b412546053dcb14d86cd42910a.png",
  playerCount: "6人- 3男3女",
  duration: "5小時",
  difficulty: "推理⭐⭐⭐",
  genre: "恐怖",
  pricePerPerson: 750,
  priceGroup: null,
  isContactOnly: true,
  bookingNote: "預約請直接聯繫客服：IG @larpplayhardtw 或官方 LINE（https://lin.ee/woW09Ml）。系統限訂晚場，需白天場次請洽客服。",
  published: true,
},
```

The file starts with:

```ts
// prisma/seed-data/scripts.ts
export interface SeedScript {
  title: string;
  description: string;
  storyText: string;
  coverImage: string;
  playerCount: string;
  duration: string;
  difficulty: string;
  genre: string;
  pricePerPerson: number | null;
  priceGroup: number | null;
  isContactOnly: boolean;
  bookingNote: string | null;
  published: boolean;
}

export const seedScripts: SeedScript[] = [
  // ... all 46 entries per the rules and examples above, in raw-data.md order
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test tests/seed-data.test.mjs`
Expected: PASS (all checks green — this is what confirms the transcription was done correctly)

- [ ] **Step 5: Commit**

```bash
git add prisma/seed-data/scripts.ts tests/seed-data.test.mjs
git commit -m "feat: add transcribed seed data for all 46 catalog scripts"
```

---

### Task 5: Idempotent seed runner

**Files:**
- Create: `prisma/seed-scripts.ts`
- Modify: `package.json` (add `"db:seed:scripts"` script)

**Interfaces:**
- Consumes: `seedScripts` from `prisma/seed-data/scripts.ts` (Task 4); `prisma` client from `src/lib/prisma.ts`.
- Produces: populated `Script` rows in the DB.

- [ ] **Step 1: Write the seed runner**

```ts
// prisma/seed-scripts.ts
/**
 * Seeds the full catalog of scripts. Idempotent -- running it twice does not
 * create duplicates (skips entirely if any Script rows already exist).
 *
 * Run with: npm run db:seed:scripts
 */
import prisma from "@/lib/prisma";
import { seedScripts } from "./seed-data/scripts";

async function main() {
  const existingCount = await prisma.script.count();

  if (existingCount > 0) {
    console.log(`Scripts table already has ${existingCount} row(s), skipping.`);
    return;
  }

  for (const script of seedScripts) {
    await prisma.script.create({ data: script });
  }

  console.log(`Seeded ${seedScripts.length} scripts.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 2: Add the npm script**

In `package.json`, add under `"scripts"`:

```json
"db:seed:scripts": "tsx prisma/seed-scripts.ts"
```

- [ ] **Step 3: Run it against the dev database**

Run: `npm run db:seed:scripts`
Expected: `Seeded 46 scripts.` (or the skip message if already populated — if the placeholder script from before this project already exists, delete it first via `npx prisma studio` or `DELETE FROM Script;` so the count-based guard doesn't skip real seeding)

- [ ] **Step 4: Verify manually**

Run: `npx prisma studio` (or query directly) and confirm the `Script` table has 46 rows, `published: true` on all of them, and spot-check 2-3 rows (e.g. `神木屋` has `isContactOnly: true` and a non-null `bookingNote`; `迪賽普` has `priceGroup: 4200` and `pricePerPerson: null`).

- [ ] **Step 5: Run it again to confirm idempotency**

Run: `npm run db:seed:scripts`
Expected: `Scripts table already has 46 row(s), skipping.` — no duplicates created.

- [ ] **Step 6: Commit**

```bash
git add prisma/seed-scripts.ts package.json
git commit -m "feat: add idempotent seed runner for the script catalog"
```

---

### Task 6: Admin API routes accept the new fields

**Files:**
- Modify: `src/app/api/scripts/route.ts:24-40` (POST handler)
- Test: `tests/api-scripts-fields.test.mjs` (new)

**Interfaces:**
- Consumes: `Script` model from Task 1.
- Produces: POST `/api/scripts` accepts and persists `storyText`, `pricePerPerson`, `priceGroup`, `isContactOnly`, `bookingNote` in addition to the existing fields. (`PUT /api/scripts/[id]` already does `data: body` passthrough in `src/app/api/scripts/[id]/route.ts:53`, so it needs no change — it already accepts any field present in the request body.)

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/api-scripts-fields.test.mjs`
Expected: FAIL (5 assertions) — fields not referenced yet.

- [ ] **Step 3: Update the POST handler**

In `src/app/api/scripts/route.ts`, replace the body of `POST`:

```ts
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user.role !== "owner" && session.user.role !== "employee")) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      storyText,
      coverImage,
      playerCount,
      duration,
      difficulty,
      genre,
      pricePerPerson,
      priceGroup,
      isContactOnly,
      bookingNote,
      published,
    } = body;

    const script = await prisma.script.create({
      data: {
        title,
        description,
        storyText,
        coverImage,
        playerCount,
        duration,
        difficulty,
        genre,
        pricePerPerson: pricePerPerson != null ? Number(pricePerPerson) : null,
        priceGroup: priceGroup != null ? Number(priceGroup) : null,
        isContactOnly: isContactOnly ?? false,
        bookingNote: bookingNote || null,
        published: published ?? false,
      },
    });

    return NextResponse.json(script, { status: 201 });
  } catch {
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/api-scripts-fields.test.mjs`
Expected: PASS (5/5)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/scripts/route.ts tests/api-scripts-fields.test.mjs
git commit -m "feat(api): accept price/story/contact-only fields on script creation"
```

---

### Task 7: Admin "new script" form gains the new fields

**Files:**
- Modify: `src/app/admin/scripts/new/page.tsx`

**Interfaces:**
- Consumes: POST `/api/scripts` from Task 6.

- [ ] **Step 1: Add new fields to form state**

In `src/app/admin/scripts/new/page.tsx`, update the `useState` call:

```tsx
const [form, setForm] = useState({
  title: "",
  description: "",
  storyText: "",
  coverImage: "",
  playerCount: "",
  duration: "",
  difficulty: "",
  genre: "",
  pricePerPerson: "",
  priceGroup: "",
  isContactOnly: false,
  bookingNote: "",
  published: false,
});
```

- [ ] **Step 2: Add form fields to the JSX**

Immediately after the existing `劇本簡介` (`description`) textarea block, add:

```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    完整故事與角色介紹 <span className="text-red-500">*</span>
  </label>
  <textarea
    name="storyText"
    value={form.storyText}
    onChange={handleChange}
    rows={10}
    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
    required
  />
</div>
```

Immediately after the `人數`/`時長` grid block, add:

```tsx
<div className="grid grid-cols-2 gap-4">
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">每人價格 (NT$)</label>
    <input
      type="number"
      name="pricePerPerson"
      value={form.pricePerPerson}
      onChange={handleChange}
      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="例：650（與整團價格擇一填寫）"
    />
  </div>
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">整團價格 (NT$)</label>
    <input
      type="number"
      name="priceGroup"
      value={form.priceGroup}
      onChange={handleChange}
      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="例：4200（與每人價格擇一填寫）"
    />
  </div>
</div>
```

Immediately before the existing `published` checkbox block, add:

```tsx
<div className="flex items-center gap-2">
  <input
    type="checkbox"
    name="isContactOnly"
    id="isContactOnly"
    checked={form.isContactOnly}
    onChange={handleChange}
    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
  />
  <label htmlFor="isContactOnly" className="text-sm font-medium text-gray-700">
    僅接受私訊預約（不使用場次預約系統）
  </label>
</div>

{form.isContactOnly && (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">預約說明</label>
    <textarea
      name="bookingNote"
      value={form.bookingNote}
      onChange={handleChange}
      rows={2}
      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      placeholder="例：預約請直接聯繫客服：IG @larpplayhardtw 或官方 LINE"
    />
  </div>
)}
```

Update `handleChange`'s type signature to include `HTMLTextAreaElement` for the new textarea (already covers it — the existing signature is `React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>`, no change needed there).

- [ ] **Step 3: Verify with the dev server**

Run: `npm run dev`, visit `http://localhost:3000/admin/scripts/new` (logged in as owner/employee), and confirm: the story/character textarea appears, both price fields appear side-by-side, checking "僅接受私訊預約" reveals the booking-note textarea, and submitting creates a script with all fields persisted (check via `/admin/scripts`).

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/scripts/new/page.tsx
git commit -m "feat(admin): add story/price/contact-only fields to new-script form"
```

---

### Task 8: Admin "edit script" form gains the new fields

**Files:**
- Modify: `src/app/admin/scripts/[id]/edit/EditScriptForm.tsx`

**Interfaces:**
- Consumes: PUT `/api/scripts/[id]` (already passthrough, no API change needed).

- [ ] **Step 1: Update the `Script` interface and form state**

```tsx
interface Script {
  id: string;
  title: string;
  description: string;
  storyText: string;
  coverImage: string;
  playerCount: string;
  duration: string;
  difficulty: string;
  genre: string;
  pricePerPerson: number | null;
  priceGroup: number | null;
  isContactOnly: boolean;
  bookingNote: string | null;
  published: boolean;
}
```

```tsx
const [form, setForm] = useState({
  title: script.title,
  description: script.description,
  storyText: script.storyText,
  coverImage: script.coverImage,
  playerCount: script.playerCount,
  duration: script.duration,
  difficulty: script.difficulty,
  genre: script.genre,
  pricePerPerson: script.pricePerPerson?.toString() ?? "",
  priceGroup: script.priceGroup?.toString() ?? "",
  isContactOnly: script.isContactOnly,
  bookingNote: script.bookingNote ?? "",
  published: script.published,
});
```

- [ ] **Step 2: Add the new JSX fields**

Immediately after the existing `劇本簡介` (`description`) textarea block, add:

```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    完整故事與角色介紹 <span className="text-red-500">*</span>
  </label>
  <textarea
    name="storyText"
    value={form.storyText}
    onChange={handleChange}
    rows={10}
    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
    required
  />
</div>
```

Immediately after the `人數`/`時長` grid block, add:

```tsx
<div className="grid grid-cols-2 gap-4">
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">每人價格 (NT$)</label>
    <input
      type="number"
      name="pricePerPerson"
      value={form.pricePerPerson}
      onChange={handleChange}
      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="例：650（與整團價格擇一填寫）"
    />
  </div>
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">整團價格 (NT$)</label>
    <input
      type="number"
      name="priceGroup"
      value={form.priceGroup}
      onChange={handleChange}
      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="例：4200（與每人價格擇一填寫）"
    />
  </div>
</div>
```

Immediately before the existing `published` checkbox block, add:

```tsx
<div className="flex items-center gap-2">
  <input
    type="checkbox"
    name="isContactOnly"
    id="isContactOnly"
    checked={form.isContactOnly}
    onChange={handleChange}
    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
  />
  <label htmlFor="isContactOnly" className="text-sm font-medium text-gray-700">
    僅接受私訊預約（不使用場次預約系統）
  </label>
</div>

{form.isContactOnly && (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">預約說明</label>
    <textarea
      name="bookingNote"
      value={form.bookingNote}
      onChange={handleChange}
      rows={2}
      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      placeholder="例：預約請直接聯繫客服：IG @larpplayhardtw 或官方 LINE"
    />
  </div>
)}
```

- [ ] **Step 3: Verify with the dev server**

Run: `npm run dev`, edit an existing script at `/admin/scripts/[id]/edit`, confirm all fields load with correct existing values, change one, save, and confirm the change persists (reload the page).

- [ ] **Step 4: Commit**

```bash
git add "src/app/admin/scripts/[id]/edit/EditScriptForm.tsx"
git commit -m "feat(admin): add story/price/contact-only fields to edit-script form"
```

---

### Task 9: Tailwind theme tokens + fonts

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces: Tailwind utility classes `bg-background`, `bg-surface`, `text-gold`, `bg-gold`, `border-gold`, `bg-gold-dark` (hover), and `font-heading` / `font-body` — consumed by every task from Task 10 onward.

- [ ] **Step 1: Add theme tokens to globals.css**

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  --color-background: #16161a;
  --color-surface: #232326;
  --color-gold: #e8b84b;
  --color-gold-dark: #c99a2e;
}

/* `inline` because --font-heading/--font-body are runtime CSS variables set by
   next/font's `variable` option on <html> (Task 9 Step 2) -- Tailwind v4 needs
   `@theme inline` (not plain `@theme`) to alias a token to a var(...) that
   isn't a static value known at build time. */
@theme inline {
  --font-heading: var(--font-heading);
  --font-body: var(--font-body);
}
```

- [ ] **Step 2: Load self-hosted fonts in the root layout**

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import { Noto_Serif_TC, Noto_Sans_TC } from "next/font/google";
import "./globals.css";

const notoSerifTC = Noto_Serif_TC({
  subsets: ["latin"],
  weight: ["600", "700", "900"],
  variable: "--font-heading",
});

const notoSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "PlayHard 劇本殺",
  description: "預約最優質的劇本殺體驗",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className={`h-full ${notoSerifTC.variable} ${notoSansTC.variable}`}>
      <body className="min-h-full flex flex-col bg-background text-white font-body">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Verify the build picks up the fonts and theme**

Run: `npm run build`
Expected: builds successfully with no errors about the Google Fonts import or the `@theme` block.

Run: `npm run dev`, visit `http://localhost:3000`, open devtools and confirm `<body>` has a dark background (`#16161a`) and the `--font-heading`/`--font-body` CSS variables are set on `<html>`.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat(design): add dark/gold theme tokens and self-hosted fonts"
```

---

### Task 10: Restyle Navbar and Footer, add About link + contact info

**Files:**
- Modify: `src/components/public/Navbar.tsx`
- Modify: `src/components/public/Footer.tsx`

**Interfaces:**
- Consumes: theme tokens (Task 9), `businessInfo` (Task 2).
- Produces: `/about` link in both — Task 12 must create that route for these links to resolve.

- [ ] **Step 1: Update Navbar**

```tsx
// src/components/public/Navbar.tsx
"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function Navbar() {
  const { data: session } = authClient.useSession();

  return (
    <nav className="bg-surface border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold font-heading text-gold hover:text-gold-dark transition-colors">
          PlayHard 劇本殺
        </Link>
        <div className="flex gap-6 text-sm font-medium items-center">
          <Link href="/" className="hover:text-gold transition-colors">
            首頁
          </Link>
          <Link href="/scripts" className="hover:text-gold transition-colors">
            劇本列表
          </Link>
          <Link href="/about" className="hover:text-gold transition-colors">
            關於我們
          </Link>
          {session?.user ? (
            <Link href="/account" className="hover:text-gold transition-colors">
              會員中心
            </Link>
          ) : (
            <>
              <Link href="/login" className="hover:text-gold transition-colors">
                登入
              </Link>
              <Link href="/register" className="hover:text-gold transition-colors">
                註冊
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Update Footer**

```tsx
// src/components/public/Footer.tsx
import Link from "next/link";
import { businessInfo } from "@/lib/business-info";

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-white/10 text-white/60 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
        <p className="text-lg font-semibold font-heading text-gold">{businessInfo.name}</p>
        <p className="text-sm">提供最優質的劇本殺體驗</p>
        <p className="text-sm">
          {businessInfo.hours} ・ {businessInfo.address}
        </p>
        <p className="text-sm">
          LINE {businessInfo.lineId} ・{" "}
          <a href={businessInfo.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-gold">
            Instagram
          </a>{" "}
          ・{" "}
          <a href={businessInfo.facebookUrl} target="_blank" rel="noopener noreferrer" className="hover:text-gold">
            Facebook
          </a>{" "}
          ・{" "}
          <Link href="/about" className="hover:text-gold">
            關於我們
          </Link>
        </p>
        <p className="text-xs mt-4">&copy; {new Date().getFullYear()} {businessInfo.name}. 版權所有。</p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Verify with the dev server**

Run: `npm run dev`, visit any page, confirm the navbar shows "關於我們" and the footer shows hours/address/LINE/IG/Facebook links (the `/about` link will 404 until Task 12 — that's expected at this point).

- [ ] **Step 4: Commit**

```bash
git add src/components/public/Navbar.tsx src/components/public/Footer.tsx
git commit -m "feat(design): restyle Navbar/Footer with theme tokens and business info"
```

---

### Task 11: Restyle ScriptCard (price, contact-only badge)

**Files:**
- Modify: `src/components/public/ScriptCard.tsx`

**Interfaces:**
- Consumes: theme tokens (Task 9); `Script` fields `pricePerPerson`, `priceGroup`, `isContactOnly` (Task 1).
- Produces: updated `ScriptCardProps` — consumed by Task 13 (homepage) and Task 14 (`/scripts`), both of which spread a full `Script` row into this component via `{...script}`, so no call-site changes are needed there beyond what those tasks already do.

- [ ] **Step 1: Rewrite the component**

```tsx
// src/components/public/ScriptCard.tsx
import Link from "next/link";
import Image from "next/image";

interface ScriptCardProps {
  id: string;
  title: string;
  coverImage: string;
  playerCount: string;
  genre: string;
  difficulty: string;
  duration: string;
  pricePerPerson: number | null;
  priceGroup: number | null;
  isContactOnly: boolean;
}

export default function ScriptCard({
  id,
  title,
  coverImage,
  playerCount,
  genre,
  difficulty,
  duration,
  pricePerPerson,
  priceGroup,
  isContactOnly,
}: ScriptCardProps) {
  const priceLabel =
    pricePerPerson != null ? `NT$${pricePerPerson}/人` : priceGroup != null ? `NT$${priceGroup}/團` : null;

  return (
    <Link href={`/scripts/${id}`} className="block group">
      <div className="rounded-lg bg-surface border border-white/10 overflow-hidden hover:border-gold transition-colors">
        <div className="relative h-48 bg-black/40">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/30">
              <span className="text-4xl">🎭</span>
            </div>
          )}
          {isContactOnly && (
            <span className="absolute top-2 right-2 bg-gold text-background text-xs font-semibold px-2 py-1 rounded">
              洽詢預約
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-bold font-heading text-lg text-white mb-2 line-clamp-1">{title}</h3>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="bg-gold/15 text-gold px-2 py-0.5 rounded">{genre}</span>
            <span className="bg-white/10 text-white/70 px-2 py-0.5 rounded">{difficulty}</span>
          </div>
          <div className="mt-3 flex justify-between items-center text-sm text-white/60">
            <span>
              👥 {playerCount} ・ ⏱ {duration}
            </span>
            {priceLabel && <span className="text-gold font-semibold">{priceLabel}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Verify with the dev server**

Run: `npm run dev`, visit `/scripts` (will still be blue/white until Task 14, but the cards themselves render dark now) and confirm: price shows correctly for per-person and per-group scripts, and contact-only scripts show the "洽詢預約" badge on the cover image.

- [ ] **Step 3: Commit**

```bash
git add src/components/public/ScriptCard.tsx
git commit -m "feat(design): restyle ScriptCard with price display and contact-only badge"
```

---

### Task 12: New `/about` page

**Files:**
- Create: `src/app/about/page.tsx`

**Interfaces:**
- Consumes: `businessInfo` (Task 2), theme tokens (Task 9), `Navbar`/`Footer` (Task 10).

- [ ] **Step 1: Write the page**

```tsx
// src/app/about/page.tsx
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { businessInfo } from "@/lib/business-info";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-16 w-full text-center">
        <h1 className="text-3xl font-bold font-heading text-gold mb-2">{businessInfo.name}</h1>
        <p className="text-white/60 mb-10">單專業「劇本殺」遊戲體驗服務</p>

        <div className="bg-surface border border-white/10 rounded-lg p-8 text-left space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-gold mb-1">📝 地址</h2>
            <p className="text-white/80">{businessInfo.address}</p>
            <p className="text-white/50 text-sm">{businessInfo.addressNote}</p>
            <a
              href={businessInfo.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-gold hover:text-gold-dark text-sm underline"
            >
              在 Google Map 開啟
            </a>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gold mb-1">🕓 營業時間</h2>
            <p className="text-white/80">{businessInfo.hours}</p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gold mb-1">💬 聯絡方式</h2>
            <ul className="text-white/80 space-y-1">
              <li>
                LINE：{businessInfo.lineId}（
                <a href={businessInfo.lineUrl} target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-dark underline">
                  傳送門
                </a>
                ）
              </li>
              <li>Email：{businessInfo.email}</li>
              <li>
                <a href={businessInfo.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-dark underline">
                  Instagram
                </a>{" "}
                ・{" "}
                <a href={businessInfo.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-dark underline">
                  Facebook
                </a>
              </li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 2: Verify with the dev server**

Run: `npm run dev`, visit `http://localhost:3000/about`, confirm hours/address/map link/LINE/email/IG/Facebook all render, and the Navbar/Footer "關於我們" links now resolve (no more 404).

- [ ] **Step 3: Commit**

```bash
git add src/app/about/page.tsx
git commit -m "feat: add /about page with business hours, address, and contact info"
```

---

### Task 13: Restyle homepage (hero, featured scripts, announcements, hours teaser)

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/public/AnnouncementList.tsx`
- Modify: `src/components/public/BannerCarousel.tsx:33` (empty-state only)

**Interfaces:**
- Consumes: theme tokens (Task 9), `ScriptCard` (Task 11), `businessInfo` (Task 2).

- [ ] **Step 1: Restyle the empty-banner state**

In `src/components/public/BannerCarousel.tsx`, replace the empty-state block (currently `bg-gray-800`):

```tsx
if (banners.length === 0) {
  return (
    <div className="bg-background h-72 md:h-96 flex flex-col items-center justify-center gap-2 border-b border-white/10">
      <p className="font-heading text-3xl text-gold tracking-wide">PLAY HARD</p>
      <p className="text-white/70 text-lg">玩硬劇本遊戲館</p>
      <p className="text-white/40 text-xs tracking-[0.3em] uppercase">Live Action Role Playing</p>
    </div>
  );
}
```

- [ ] **Step 2: Restyle AnnouncementList**

```tsx
// src/components/public/AnnouncementList.tsx
interface Announcement {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string | Date;
}

interface AnnouncementListProps {
  announcements: Announcement[];
}

export default function AnnouncementList({ announcements }: AnnouncementListProps) {
  if (announcements.length === 0) {
    return <p className="text-white/50 text-center py-4">目前沒有公告</p>;
  }

  return (
    <ul className="space-y-3">
      {announcements.map((a) => (
        <li key={a.id} className="bg-surface border border-white/10 rounded-lg p-4">
          <div className="flex items-start gap-2">
            {a.pinned && (
              <span className="flex-shrink-0 text-xs bg-gold/20 text-gold px-2 py-0.5 rounded font-medium mt-0.5">
                置頂
              </span>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white">{a.title}</h4>
              <p className="text-sm text-white/60 mt-1 whitespace-pre-line">{a.content}</p>
              <p className="text-xs text-white/30 mt-2">
                {new Date(a.createdAt).toLocaleDateString("zh-TW")}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 3: Restyle the homepage**

```tsx
// src/app/page.tsx
import prisma from "@/lib/prisma";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import BannerCarousel from "@/components/public/BannerCarousel";
import AnnouncementList from "@/components/public/AnnouncementList";
import ScriptCard from "@/components/public/ScriptCard";
import { businessInfo } from "@/lib/business-info";
import Link from "next/link";

export default async function HomePage() {
  const [banners, announcements, featuredScripts] = await Promise.all([
    prisma.banner.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.announcement.findMany({
      where: { active: true },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 5,
    }),
    prisma.script.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <BannerCarousel banners={banners} />

        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <section className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold font-heading text-white">精選劇本</h2>
                <Link href="/scripts" className="text-gold hover:text-gold-dark text-sm font-medium">
                  查看全部 →
                </Link>
              </div>
              {featuredScripts.length === 0 ? (
                <div className="bg-surface border border-white/10 rounded-lg p-8 text-center text-white/50">
                  目前尚無上架劇本
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {featuredScripts.map((script) => (
                    <ScriptCard key={script.id} {...script} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-2xl font-bold font-heading text-white mb-6">最新公告</h2>
              <AnnouncementList announcements={announcements} />
            </section>
          </div>

          <section className="mt-16 bg-surface border border-white/10 rounded-lg p-8 text-center">
            <h2 className="text-xl font-bold font-heading text-gold mb-3">{businessInfo.name}</h2>
            <p className="text-white/70">
              {businessInfo.hours} ・ {businessInfo.address}
            </p>
            <Link href="/about" className="inline-block mt-4 text-gold hover:text-gold-dark text-sm underline">
              查看完整營業資訊 →
            </Link>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 4: Verify with the dev server**

Run: `npm run dev`, visit `http://localhost:3000`, confirm: dark theme throughout, "PLAY HARD" hero shows when no banners exist, featured scripts show as dark cards with price, announcements are restyled, and the hours/contact teaser section at the bottom links to `/about`.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/components/public/AnnouncementList.tsx src/components/public/BannerCarousel.tsx
git commit -m "feat(design): restyle homepage with hero, dark theme, and hours teaser"
```

---

### Task 14: Restyle `/scripts` listing with genre filter

**Files:**
- Modify: `src/app/scripts/page.tsx`

**Interfaces:**
- Consumes: `ScriptCard` (Task 11), theme tokens (Task 9).

- [ ] **Step 1: Rewrite as a client-filterable page**

Since filtering must happen client-side without a full reload, convert the interactive part into a small client component embedded in the existing server page.

```tsx
// src/app/scripts/page.tsx
import prisma from "@/lib/prisma";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import ScriptsGrid from "@/components/public/ScriptsGrid";

export default async function ScriptsPage() {
  const scripts = await prisma.script.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-10 w-full">
        <h1 className="text-3xl font-bold font-heading text-white mb-8">所有劇本</h1>
        <ScriptsGrid scripts={scripts} />
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 2: Create the client-side filter + grid component**

```tsx
// src/components/public/ScriptsGrid.tsx
"use client";

import { useMemo, useState } from "react";
import ScriptCard from "./ScriptCard";

const GENRES = ["全部", "恐怖", "歡樂", "情感", "推理", "新手推薦", "神秘私團"];

interface Script {
  id: string;
  title: string;
  coverImage: string;
  playerCount: string;
  genre: string;
  difficulty: string;
  duration: string;
  pricePerPerson: number | null;
  priceGroup: number | null;
  isContactOnly: boolean;
}

export default function ScriptsGrid({ scripts }: { scripts: Script[] }) {
  const [activeGenre, setActiveGenre] = useState("全部");

  const filtered = useMemo(
    () => (activeGenre === "全部" ? scripts : scripts.filter((s) => s.genre === activeGenre)),
    [scripts, activeGenre]
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-8">
        {GENRES.map((g) => (
          <button
            key={g}
            onClick={() => setActiveGenre(g)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              activeGenre === g
                ? "bg-gold text-background border-gold"
                : "border-white/20 text-white/70 hover:border-gold hover:text-gold"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-surface border border-white/10 rounded-lg p-12 text-center text-white/50">
          此分類目前尚無劇本
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((script) => (
            <ScriptCard key={script.id} {...script} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify with the dev server**

Run: `npm run dev`, visit `http://localhost:3000/scripts`, confirm: genre filter buttons render (全部/恐怖/歡樂/情感/推理/新手推薦/神秘私團), clicking one filters the grid instantly without a page reload, and "全部" shows everything again.

- [ ] **Step 4: Commit**

```bash
git add src/app/scripts/page.tsx src/components/public/ScriptsGrid.tsx
git commit -m "feat(design): restyle /scripts with dark theme and client-side genre filter"
```

---

### Task 15: Restyle `/scripts/[id]` detail page (story, price, contact-only panel)

**Files:**
- Modify: `src/app/scripts/[id]/page.tsx`

**Interfaces:**
- Consumes: theme tokens (Task 9); `Script` fields `storyText`, `pricePerPerson`, `priceGroup`, `isContactOnly`, `bookingNote` (Task 1).

- [ ] **Step 1: Rewrite the page**

```tsx
// src/app/scripts/[id]/page.tsx
import prisma from "@/lib/prisma";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

export default async function ScriptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const now = new Date();

  const script = await prisma.script.findUnique({
    where: { id, published: true },
    include: {
      sessions: {
        where: { open: true, date: { gte: now } },
        orderBy: { date: "asc" },
      },
    },
  });

  if (!script) {
    notFound();
  }

  const priceLabel =
    script.pricePerPerson != null
      ? `NT$${script.pricePerPerson} / 人`
      : script.priceGroup != null
        ? `NT$${script.priceGroup} / 團`
        : null;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-10 w-full">
        <Link href="/scripts" className="text-gold hover:text-gold-dark text-sm mb-6 inline-block">
          ← 返回劇本列表
        </Link>

        <div className="bg-surface border border-white/10 rounded-lg overflow-hidden">
          {script.coverImage && (
            <div className="relative h-72 bg-black/40">
              <Image src={script.coverImage} alt={script.title} fill className="object-cover" />
            </div>
          )}

          <div className="p-6">
            <h1 className="text-3xl font-bold font-heading text-white mb-4">{script.title}</h1>

            <div className="flex flex-wrap gap-3 mb-6 items-center">
              <span className="bg-gold/15 text-gold px-3 py-1 rounded-full text-sm font-medium">{script.genre}</span>
              <span className="bg-white/10 text-white/70 px-3 py-1 rounded-full text-sm">{script.difficulty}</span>
              <span className="bg-white/10 text-white/70 px-3 py-1 rounded-full text-sm">👥 {script.playerCount}</span>
              <span className="bg-white/10 text-white/70 px-3 py-1 rounded-full text-sm">⏱ {script.duration}</span>
              {priceLabel && (
                <span className="text-gold font-semibold text-lg ml-auto">{priceLabel}</span>
              )}
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold font-heading text-white mb-3">劇本簡介</h2>
              <p className="text-white/70 leading-relaxed whitespace-pre-line">{script.storyText}</p>
            </div>

            {script.isContactOnly ? (
              <div className="bg-gold/10 border border-gold/30 rounded-lg p-6">
                <h2 className="text-xl font-semibold font-heading text-gold mb-3">如何預約</h2>
                <p className="text-white/80 whitespace-pre-line">{script.bookingNote}</p>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-semibold font-heading text-white mb-4">可預約場次</h2>
                {script.sessions.length === 0 ? (
                  <div className="bg-black/20 rounded-lg p-6 text-center text-white/50">
                    目前沒有開放中的場次，請關注最新公告
                  </div>
                ) : (
                  <div className="space-y-3">
                    {script.sessions.map((session) => {
                      const spotsLeft = session.maxPlayers - session.currentPlayers;
                      return (
                        <div
                          key={session.id}
                          className="border border-white/10 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div>
                            <p className="font-semibold text-white">
                              {new Date(session.date).toLocaleString("zh-TW", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                weekday: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            <p className="text-sm text-white/50 mt-1">
                              剩餘名額：{spotsLeft} / {session.maxPlayers}
                            </p>
                          </div>
                          <Link
                            href={`/scripts/${id}/reserve/${session.id}`}
                            className={`inline-block text-center px-6 py-2 rounded-lg font-medium text-sm transition-colors ${
                              spotsLeft > 0
                                ? "bg-gold text-background hover:bg-gold-dark"
                                : "bg-white/10 text-white/40 cursor-not-allowed pointer-events-none"
                            }`}
                          >
                            {spotsLeft > 0 ? "我要預約" : "名額已滿"}
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 2: Verify with the dev server**

Run: `npm run dev`, visit a normal script's detail page (confirm price, story text, and the session list all render) and a contact-only script's detail page (e.g. 神木屋 — confirm the gold "如何預約" panel with the booking note shows instead of a session list).

- [ ] **Step 3: Commit**

```bash
git add "src/app/scripts/[id]/page.tsx"
git commit -m "feat(design): restyle script detail page with story, price, and contact-only panel"
```

---

### Task 16: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `node --import tsx --test tests/`
Expected: all new tests pass (schema-fields, business-info, cover-images, seed-data, api-scripts-fields), plus all pre-existing tests except the already-known-broken `tests/auth-logic.test.mjs` failure.

- [ ] **Step 2: Type-check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: no type errors, production build succeeds.

- [ ] **Step 3: Manual walkthrough**

Run: `npm run dev` and check, in order:
1. `/` — dark theme, hero (if no banners), featured scripts with price, announcements, hours teaser linking to `/about`.
2. `/scripts` — genre filter works, ~46 scripts visible across all genres combined.
3. A normal script's `/scripts/[id]` — price, full story, character bios, open session list (if any) or the "no open sessions" message.
4. A contact-only script's `/scripts/[id]` (e.g. `神木屋` or `野之薔薇`) — gold "如何預約" panel with the correct booking note, no session list.
5. `/about` — hours, address, map link, LINE, email, IG, Facebook all present and correct.
6. `/admin/scripts/new` and `/admin/scripts/[id]/edit` — story/price/contact-only fields all present and functional (admin panel stays in its existing blue/gray style, unaffected by the redesign).

- [ ] **Step 4: Commit (only if the walkthrough required fixes)**

If any fixes were needed during the walkthrough, commit them now with a descriptive message. If nothing needed fixing, there is nothing to commit for this task.
