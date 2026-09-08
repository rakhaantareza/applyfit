import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Auth pages share one durable proposition and keep Beta isolated", async () => {
  const [brand, login, register, recovery, reset] = await Promise.all([
    readFile(new URL("../app/components/AuthBrandPanel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/login/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/daftar/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lupa-kata-sandi/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/reset-kata-sandi/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(brand, /Cek kesiapanmu sebelum melamar\./);
  assert.match(brand, /Bandingkan persyaratan lowongan dengan skill dan pengalaman/);
  assert.match(brand, /className="auth-beta"/);

  for (const page of [login, register, recovery, reset]) {
    assert.match(page, /<AuthBrandPanel titleId=/);
    assert.doesNotMatch(page, /title="|description="/);
  }

  assert.match(login, /Masuk ke ApplyFit/);
  assert.match(register, /Buat akun ApplyFit/);
  assert.match(recovery, /Lupa kata sandi\?/);
  assert.match(reset, /Buat kata sandi baru/);
  assert.doesNotMatch(`${brand}\n${login}\n${register}\n${recovery}\n${reset}`, /ruang kerja|Career readiness berbasis bukti/i);
});

test("Auth forms use the approved concise actions and no pseudo-legal consent", async () => {
  const [login, register, recovery, reset] = await Promise.all([
    readFile(new URL("../app/login/LoginForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/daftar/RegistrationForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lupa-kata-sandi/PasswordRecoveryForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/reset-kata-sandi/PasswordResetForm.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(login, /Coba demo/);
  assert.match(login, /atau masuk dengan akunmu/);
  assert.match(login, /\? "Masuk…" : "Masuk"/);
  assert.match(register, /\? "Membuat akun…" : "Buat akun"/);
  assert.doesNotMatch(register, /acceptTerms|Saya setuju data akun|registration-consent/);
  assert.match(recovery, /\? "Mengirim kode…" : "Kirim kode"/);
  assert.match(reset, /\? "Menyimpan kata sandi…" : "Simpan kata sandi"/);
});
