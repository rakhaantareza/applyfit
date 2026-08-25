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
  assert.match(html, /<title>Cara Fit Score dihitung \| ApplyFit<\/title>/i);
  assert.match(
    html,
    /fonts\.googleapis\.com\/css2\?family=Inter:wght@400;500;600(?:&|&amp;)family=Geist\+Mono:wght@400;500;600(?:&|&amp;)display=swap/i,
  );
  assert.match(html, /<h1>Cara Fit Score dihitung<\/h1>/i);
  assert.doesNotMatch(html, /__variable_plus_jakarta_sans/i);
  assert.doesNotMatch(html, /Plus\+Jakarta\+Sans/i);
});

test("root layout tolerates browser-extension attributes without masking page content", async () => {
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /<html lang="id" suppressHydrationWarning>/);
  assert.match(layout, /<body suppressHydrationWarning>/);
});

test("production worker serves the implemented calculation route", async () => {
  const response = await render("/contoh-perhitungan");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<title>Cara Fit Score dihitung \| ApplyFit<\/title>/i);
  assert.match(html, /<h1>Cara Fit Score dihitung<\/h1>/i);
});

test("Fit Score education uses one explainer and a quiet analysis link", async () => {
  const [response, sidebarSource, analysisSource] = await Promise.all([
    render("/contoh-perhitungan"),
    readFile(new URL("../app/components/AppSidebar.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/FitScoreWorkspace.tsx", import.meta.url), "utf8"),
  ]);

  assert.equal(response.status, 200);
  const html = await response.text();
  for (const label of ["Proven", "Partial", "Learning", "Missing", "Wajib", "Preferensi"]) {
    assert.match(html, new RegExp(`>${label}<`, "i"));
  }
  assert.match(html, /Bobot × multiplier status/i);
  assert.match(html, /Total poin saat ini ÷ total poin maksimum × 100/i);
  assert.match(html, /<h2[^>]*>Contoh perhitungan<\/h2>/i);
  assert.match(html, /87,5%/i);

  assert.match(sidebarSource, /className="sidebar-fit-guide-expanded"/);
  assert.match(sidebarSource, /className=\{`sidebar-fit-guide-collapsed nav-item/);
  assert.match(sidebarSource, /href="\/contoh-perhitungan"/);
  assert.match(sidebarSource, /Cara Fit Score dihitung/);

  assert.match(analysisSource, /className="fit-score-guide-link"/);
  assert.match(analysisSource, /Cara Fit Score dihitung/);
  assert.doesNotMatch(analysisSource, /scoring-disclosure|Transparansi skor|formula-card/);
});

test("global navigation and job workspace use distinct scopes", async () => {
  const [
    sidebarSource,
    workspaceNavSource,
    analysisSource,
    legacySource,
    rootSource,
    proxySource,
  ] = await Promise.all([
    readFile(new URL("../app/components/AppSidebar.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/JobWorkspaceNav.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lowongan/[id]/analisis/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/skor-kecocokan/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../proxy.ts", import.meta.url), "utf8"),
  ]);

  assert.match(rootSource, /redirect\("\/beranda"\)/);
  for (const label of ["Ringkasan", "Profil", "Portfolio & Pengalaman", "Lowongan"]) {
    assert.match(sidebarSource, new RegExp(`label: ["']${label}["']`));
  }
  assert.match(sidebarSource, /group:\s*"Karier"/);
  assert.match(sidebarSource, /label:\s*"Pengaturan"/);
  assert.match(sidebarSource, /className="sidebar-utility"/);
  assert.doesNotMatch(sidebarSource, /careerChild|nav-item-child/);
  assert.doesNotMatch(sidebarSource, /separated|nav-item-separated/);
  assert.doesNotMatch(sidebarSource, /label:\s*"Skor Kecocokan"/);
  assert.doesNotMatch(sidebarSource, /Semua Lowongan/);
  assert.doesNotMatch(sidebarSource, /profileReadiness|Kelengkapan profil|readSidebarJson/);
  assert.doesNotMatch(sidebarSource, /useAuthSession|sidebar-user|accountEmail/);

  assert.match(
    workspaceNavSource,
    /label: "Detail"[\s\S]+label: "Persyaratan"[\s\S]+label: "Cocokkan Profil"[\s\S]+label: "Analisis"/,
  );
  assert.match(analysisSource, /<FitScoreWorkspace jobId=\{id\}\s*\/>/);
  assert.match(legacySource, /encodeURIComponent\(job\).*\/analisis/);
  assert.match(proxySource, /"\/skor-kecocokan\/:path\*"/);
});

test("canonical product routes retain redirects from legacy URLs", async () => {
  const [
    sidebarSource,
    workspaceNavSource,
    evidenceRedirectSource,
    requirementsRedirectSource,
    matchingRedirectSource,
    proxySource,
  ] = await Promise.all([
    readFile(new URL("../app/components/AppSidebar.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/JobWorkspaceNav.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/pustaka-bukti/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lowongan/[id]/tinjau-syarat/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lowongan/[id]/pemetaan-bukti/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../proxy.ts", import.meta.url), "utf8"),
  ]);

  assert.match(sidebarSource, /href: "\/portfolio-pengalaman"/);
  assert.match(workspaceNavSource, /path: "\/persyaratan"/);
  assert.match(workspaceNavSource, /path: "\/cocokkan-profil"/);
  assert.match(evidenceRedirectSource, /redirect\("\/portfolio-pengalaman"\)/);
  assert.match(requirementsRedirectSource, /\/persyaratan/);
  assert.match(matchingRedirectSource, /\/cocokkan-profil/);
  assert.match(proxySource, /"\/portfolio-pengalaman\/:path\*"/);
  assert.match(proxySource, /"\/pustaka-bukti\/:path\*"/);
});

test("shared layout families separate the app shell from focused job work", async () => {
  const [
    appShellSource,
    focusShellSource,
    homePageSource,
    jobsPageSource,
    detailSource,
    reviewPageSource,
    reviewWorkspaceSource,
    mappingPageSource,
    mappingWorkspaceSource,
    analysisPageSource,
    fitScoreSource,
  ] = await Promise.all([
    readFile(new URL("../app/components/AppShell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/JobFocusShell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/beranda/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lowongan/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lowongan/[id]/PersistedJobDetail.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lowongan/[id]/persyaratan/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lowongan/[id]/persyaratan/RequirementReviewWorkspace.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lowongan/[id]/cocokkan-profil/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lowongan/[id]/cocokkan-profil/EvidenceMappingPageWorkspace.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lowongan/[id]/analisis/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/FitScoreWorkspace.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(appShellSource, /<AppSidebar activeItem=\{activeItem\}/);
  assert.match(appShellSource, /<AppTopBar showSidebarControls \/>/);
  assert.doesNotMatch(appShellSource, /defaultContexts|contextSegments|context\?:/);
  assert.match(homePageSource, /<AppShell activeItem="Ringkasan"/);
  assert.match(jobsPageSource, /<AppShell activeItem="Lowongan"/);

  assert.match(focusShellSource, /<AppTopBar/);
  assert.match(focusShellSource, /backHref="\/lowongan"/);
  assert.match(focusShellSource, /context=\{\["Lowongan", jobContext\]\}/);
  assert.match(focusShellSource, /variant="focus"/);
  assert.match(focusShellSource, /title \|\| "Lowongan"/);
  assert.match(focusShellSource, /company \|\| "Memuat konteks lowongan/);
  assert.match(focusShellSource, /<JobWorkspaceNav activeStep=\{activeStep\} jobId=\{jobId\}/);
  assert.doesNotMatch(detailSource, /job-detail-page-header/);

  for (const routeSource of [reviewPageSource, mappingPageSource, analysisPageSource]) {
    assert.doesNotMatch(routeSource, /AppSidebar/);
  }
  for (const workspaceSource of [detailSource, reviewWorkspaceSource, mappingWorkspaceSource, fitScoreSource]) {
    assert.match(workspaceSource, /JobFocusShell/);
  }
});

test("appearance foundation uses semantic tokens and persisted System, Light, and Dark preferences", async () => {
  const [layoutSource, providerSource, topBarSource, sidebarSource, stylesSource] =
    await Promise.all([
      readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/components/AppearanceProvider.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/components/AppTopBar.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/components/AppSidebar.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    ]);

  assert.match(layoutSource, /family=Inter:wght@400;500;600/);
  assert.match(layoutSource, /<AppearanceProvider>/);
  assert.match(providerSource, /applyfit-appearance/);
  assert.match(providerSource, /prefers-color-scheme: dark/);
  assert.match(providerSource, /"system" \| "light" \| "dark"/);
  assert.match(providerSource, /localStorage\.removeItem\(appearanceStorageKey\)/);

  assert.match(topBarSource, /className="app-topbar-brand"/);
  assert.match(topBarSource, /<AppSidebarToggle \/>/);
  assert.match(topBarSource, /context = \[\]/);
  assert.match(topBarSource, /context\.length > 0/);
  assert.match(topBarSource, /<AccountMenu \/>/);
  for (const option of ["System", "Light", "Dark"]) {
    assert.match(topBarSource, new RegExp(`label: ["']${option}["']`));
  }
  assert.doesNotMatch(sidebarSource, /useAuthSession|Keluar|email/i);

  for (const token of ["--background", "--surface", "--foreground", "--border", "--primary", "--accent", "--destructive"]) {
    assert.match(stylesSource, new RegExp(token));
  }
  assert.match(stylesSource, /html\[data-theme="dark"\]/);
  assert.doesNotMatch(stylesSource, /app-shell:has\(\.sidebar-collapsed\)[^{]*\.app-topbar-brand > span:last-child/);
  assert.doesNotMatch(stylesSource, /\.main-content \.page-container\s*{[^}]*margin-left:\s*0/);
  assert.match(stylesSource, /\.main-content \.page-container\s*{[^}]*max-width:\s*var\(--content-max\)/);
  assert.match(stylesSource, /\.job-focus-main \.page-container\s*{[^}]*max-width:\s*var\(--job-shell-width\)/);
  assert.doesNotMatch(stylesSource, /\.(?:account-settings|evidence-mapping)-page\s*{[^}]*max-width/);
  assert.doesNotMatch(stylesSource, /\.app-topbar-app \.app-topbar-context\s*{/);
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
