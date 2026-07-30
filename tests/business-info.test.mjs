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
    assert.equal(businessInfo.mapUrl, "https://maps.app.goo.gl/qmxgVKZxgubwQhrj7");
    assert.equal(businessInfo.lineUrl, "https://lin.ee/nZvNhqE");
    assert.equal(businessInfo.facebookUrl, "https://www.facebook.com/larpphtw/");
    assert.equal(businessInfo.instagramUrl, "https://www.instagram.com/larpplayhardtw/");
    assert.equal(businessInfo.addressNote, "近民權西路站 紅線1號出口、橘線7號出口");
  });
});
