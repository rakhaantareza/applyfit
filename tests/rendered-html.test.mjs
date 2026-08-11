import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders ApplyFit with the shared production fonts", async () => {
  const response = await render("/contoh-perhitungan");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Contoh Perhitungan \| ApplyFit<\/title>/i);
  assert.match(
    html,
    /fonts\.googleapis\.com\/css2\?family=Plus\+Jakarta\+Sans(?:&|&amp;)display=swap/i,
  );
  assert.match(
    html,
    /fonts\.googleapis\.com\/css2\?family=Geist\+Mono(?:&|&amp;)display=swap/i,
  );
  assert.match(html, /<h1>Contoh Perhitungan<\/h1>/i);
  assert.doesNotMatch(html, /__variable_plus_jakarta_sans/i);
});

test("root layout tolerates browser-extension attributes without masking page content", async () => {
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /<body suppressHydrationWarning>/);
  assert.doesNotMatch(layout, /<html[^>]*suppressHydrationWarning/);
});

test("production worker serves the implemented calculation route", async () => {
  const response = await render("/contoh-perhitungan");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<title>Contoh Perhitungan \| ApplyFit<\/title>/i);
  assert.match(html, /<h1>Contoh Perhitungan<\/h1>/i);
});

test("root and Fit Score use distinct routes", async () => {
  const [rootSource, scoreSource, sidebarSource, proxySource] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/skor-kecocokan/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/AppSidebar.tsx", import.meta.url), "utf8"),
    readFile(new URL("../proxy.ts", import.meta.url), "utf8"),
  ]);

  assert.match(rootSource, /redirect\("\/beranda"\)/);
  assert.doesNotMatch(rootSource, /FitScoreWorkspace/);
  assert.match(scoreSource, /<FitScoreWorkspace\s*\/>/);
  assert.match(sidebarSource, /href:\s*"\/skor-kecocokan"/);
  assert.match(proxySource, /"\/skor-kecocokan\/:path\*"/);
});

test("unauthenticated visitors can directly open login and registration", async () => {
  const [loginResponse, registrationResponse] = await Promise.all([
    render("/login"),
    render("/daftar"),
  ]);

  assert.equal(loginResponse.status, 200);
  assert.equal(registrationResponse.status, 200);

  const [loginHtml, registrationHtml] = await Promise.all([
    loginResponse.text(),
    registrationResponse.text(),
  ]);
  assert.match(loginHtml, /<title>Masuk \| ApplyFit<\/title>/i);
  assert.match(registrationHtml, /<title>Buat Akun \| ApplyFit<\/title>/i);
});

test("internal route links preserve the root session through client navigation", async () => {
  const [stableLink, fitScoreWorkspace] = await Promise.all([
    readFile(new URL("../app/components/StableLink.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/FitScoreWorkspace.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(stableLink, /from ["']next\/link["']/);
  assert.match(stableLink, /<NextLink href=\{href\}/);
  assert.doesNotMatch(stableLink, /<a href=\{href\}/);
  assert.match(fitScoreWorkspace, /StableLink as Link/);
  assert.doesNotMatch(fitScoreWorkspace, /from ["']next\/link["']/);
});

test("production worker exposes the saved-job creation entry point and form", async () => {
  const [listResponse, formResponse] = await Promise.all([
    render("/lowongan"),
    render("/lowongan/baru"),
  ]);

  assert.equal(listResponse.status, 307);
  assert.match(listResponse.headers.get("location") ?? "", /^\/login\?next=%2Flowongan$/);
  assert.equal(formResponse.status, 307);
  assert.match(formResponse.headers.get("location") ?? "", /^\/login\?next=%2Flowongan%2Fbaru$/);

  const [listSource, formSource] = await Promise.all([
    readFile(new URL("../app/lowongan/JobsWorkspace.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lowongan/baru/JobCreationForm.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(listSource, /href="\/lowongan\/baru"/i);
  assert.match(listSource, /Tambah lowongan/i);
  for (const field of ["title", "company", "source", "location", "workArrangement", "rawDescription"]) {
    assert.match(formSource, new RegExp(`name=["']${field}["']`, "i"));
  }
});

test("saved-job empty states stay focused and deletion requires confirmation", async () => {
  const [jobsSource, fitScoreSource, jobInfoSource] = await Promise.all([
    readFile(new URL("../app/lowongan/JobsWorkspace.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/FitScoreWorkspace.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lowongan/[id]/JobInfoEditor.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(jobsSource, /className="page-empty-state jobs-zero-state"/);
  assert.match(fitScoreSource, /className="page-empty-state fit-score-empty"/);
  assert.match(jobInfoSource, /Hapus lowongan/);
  assert.match(jobInfoSource, /role="alertdialog"/);
  assert.match(jobInfoSource, /method:\s*"DELETE"/);
  assert.match(jobInfoSource, /window\.location\.assign\("\/lowongan"\)/);
});
