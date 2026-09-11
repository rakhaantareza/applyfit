import assert from "node:assert/strict";
import test from "node:test";
import { translate } from "../app/lib/i18n/translate.ts";

test("UI translations preserve Indonesian and non-text values", () => {
  assert.equal(translate("Persyaratan", "id"), "Persyaratan");
  assert.equal(translate("Persyaratan", "en"), "Requirements");
  const data = { score: 92.3, priority: "required" };
  assert.equal(translate(data, "en"), data);
  assert.equal(translate(92.3, "en"), 92.3);
});

test("dynamic UI messages preserve interpolated names and counts", () => {
  assert.equal(translate("Hapus Proyek React $&", "en"), "Delete Proyek React $&");
  assert.equal(translate("2 bukti pendukung", "en"), "2 supporting evidence");
  assert.equal(translate("3 dari 5 persyaratan sudah didukung oleh skill dan pengalamanmu.", "en"), "3 of 5 requirements are supported by your skills and experience.");
});
