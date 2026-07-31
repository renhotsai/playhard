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
