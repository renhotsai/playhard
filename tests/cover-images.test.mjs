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
