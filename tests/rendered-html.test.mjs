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
    /fonts\.googleapis\.com\/css2\?family=DM\+Sans:wght@400;500;600;700(?:&|&amp;)display=swap/i,
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

test("Fit Score education uses one explainer and consistent Indonesian result labels", async () => {
  const [response, sidebarSource, analysisSource, matchingSource, detailSource, listSource, labelsSource] = await Promise.all([
    render("/contoh-perhitungan"),
    readFile(new URL("../app/components/AppSidebar.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/FitScoreWorkspace.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lowongan/[id]/cocokkan-profil/EvidenceMappingWorkspace.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/RequirementDetail.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/RequirementList.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/fit-status-labels.ts", import.meta.url), "utf8"),
  ]);

  assert.equal(response.status, 200);
  const html = await response.text();
  for (const label of ["Terbukti", "Belum terbukti", "Sedang dipelajari", "Belum ada kecocokan", "Wajib", "Preferensi"]) {
    assert.match(html, new RegExp(`>${label}<`, "i"));
  }
  assert.match(html, /Bobot × multiplier status/i);
  assert.match(html, /Total poin saat ini ÷ total poin maksimum × 100/i);
  assert.match(html, /<h2[^>]*>Contoh perhitungan<\/h2>/i);
  assert.match(html, /87,5%/i);

  assert.match(sidebarSource, /className="sidebar-utility"/);
  assert.match(sidebarSource, /className="nav-text">\{t\("Panduan Fit Score"\)\}/);
  assert.match(sidebarSource, /href="\/contoh-perhitungan"/);
  assert.match(sidebarSource, /Cara Fit Score dihitung/);

  assert.match(analysisSource, /className="fit-score-guide-link"/);
  assert.match(analysisSource, /Cara Fit Score dihitung/);
  assert.doesNotMatch(analysisSource, /scoring-disclosure|Transparansi skor|formula-card/);

  assert.match(matchingSource, /"Perlu dicocokkan"/);
  assert.match(matchingSource, /"Sudah ditinjau · tanpa bukti"/);
  assert.match(matchingSource, /fitScoreStatusLabels/);
  assert.doesNotMatch(
    matchingSource,
    /"Ditandai tanpa bukti"|"Dikonfirmasi tanpa bukti"|"Belum selesai dipetakan"|"Tidak ada kecocokan langsung"/,
  );
  assert.match(analysisSource, /<RequirementList requirements=/);
  assert.match(detailSource, /requirementStatusLabels/);
  for (const [key, label] of [
    ["Proven", "Terbukti"],
    ["Partial", "Belum terbukti"],
    ["Learning", "Sedang dipelajari"],
    ["Missing", "Belum ada kecocokan"],
  ]) {
    assert.match(labelsSource, new RegExp(`${key}: "${label}"`));
  }
  assert.match(listSource, /<option value="Proven">\{t\("Terbukti"\)\}<\/option>/);
  assert.match(listSource, /<option value="Partial">\{t\("Belum terbukti"\)\}<\/option>/);
  assert.match(listSource, /<option value="Learning">\{t\("Sedang dipelajari"\)\}<\/option>/);
  assert.match(listSource, /<option value="Missing">\{t\("Belum ada kecocokan"\)\}<\/option>/);
});

test("Ringkasan keeps one primary focus and conditional quiet continuations", async () => {
  const [source, css] = await Promise.all([
    readFile(new URL("../app/beranda/AdaptiveHomeDashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/design-system.css", import.meta.url), "utf8"),
  ]);

  for (const copy of [
    "Buat profil kariermu",
    "Tambahkan skill utama",
    "Skillmu belum punya pendukung",
    "Tambahkan lowongan pertamamu",
    "Cek lowongan berikutnya",
    "Lowongan terbaru",
    "Lihat semua lowongan",
  ]) {
    assert.match(source, new RegExp(copy));
  }
  assert.match(source, /function SummaryCheckpoint/);
  assert.match(source, /if \(jobs\.length < 2\) return null/);
  assert.doesNotMatch(source, /FoundationContextLink|OnboardingFlowPreview|Lihat detail lowongan|Profilmu akan dipakai kembali/);
  assert.match(source, /jobs\.length === 1/);
  assert.match(source, /\.slice\(0, 3\)/);
  assert.match(source, /if \(!currentWork\.isCompleted\)/);
  assert.doesNotMatch(source, /Profil kariermu siap dipakai untuk lowongan berikutnya/);
  assert.match(css, /\.summary-secondary\s*\{/);
  assert.doesNotMatch(css, /\.summary-secondary\s*\{[^}]*background/s);
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
  assert.doesNotMatch(sidebarSource, /sidebar-user|accountEmail/);
  assert.match(sidebarSource, /mobile-menu-profile/);

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
  assert.match(appShellSource, /<AppTopBar activeItem=\{activeItem\} showSidebarControls \/>/);
  assert.doesNotMatch(appShellSource, /defaultContexts|contextSegments|context\?:/);
  assert.match(homePageSource, /<AppShell activeItem="Ringkasan"/);
  assert.match(jobsPageSource, /<AppShell activeItem="Lowongan"/);

  assert.match(focusShellSource, /<AppTopBar/);
  assert.match(focusShellSource, /backHref="\/lowongan"/);
  assert.match(focusShellSource, /context=\{\["Lowongan", jobContext\]\}/);
  assert.match(focusShellSource, /variant="focus"/);
  assert.match(focusShellSource, /const jobContext = title \?/);
  assert.match(focusShellSource, /t\("Memuat konteks lowongan…"\)/);
  assert.match(focusShellSource, /<JobWorkspaceNav activeStep=\{activeStep\} jobId=\{jobId\}/);
  assert.doesNotMatch(detailSource, /job-detail-page-header/);

  for (const routeSource of [reviewPageSource, mappingPageSource, analysisPageSource]) {
    assert.doesNotMatch(routeSource, /AppSidebar/);
  }
  for (const workspaceSource of [detailSource, reviewWorkspaceSource, mappingWorkspaceSource, fitScoreSource]) {
    assert.match(workspaceSource, /JobFocusShell/);
  }
});

test("light-only foundation retains semantic tokens and a persisted language preference", async () => {
  const [layoutSource, providerSource, topBarSource, sidebarSource, stylesSource] =
    await Promise.all([
      readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/components/LanguageProvider.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/components/AppTopBar.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/components/AppSidebar.tsx", import.meta.url), "utf8"),
      Promise.all([readFile(new URL("../app/globals.css", import.meta.url), "utf8"), readFile(new URL("../app/design-system.css", import.meta.url), "utf8")]).then(parts => parts.join("\n")),
    ]);

  assert.match(layoutSource, /family=DM\+Sans:wght@400;500;600;700/);
  assert.match(layoutSource, /<LanguageProvider>/);
  assert.match(providerSource, /applyfit-language/);
  assert.doesNotMatch(layoutSource, /AppearanceProvider|prefers-color-scheme/);
  assert.match(stylesSource, /color-scheme:\s*light/);

  assert.match(topBarSource, /className="app-topbar-brand"/);
  assert.match(topBarSource, /<AppSidebarToggle \/>/);
  assert.match(topBarSource, /context = \[\]/);
  assert.match(topBarSource, /context\.length > 0/);
  assert.match(topBarSource, /<AccountMenu \/>/);
  assert.match(topBarSource, /<LanguagePicker \/>/);
  assert.doesNotMatch(topBarSource, /appearanceOptions|useAppearance/);
  assert.match(sidebarSource, /useAuthSession/);
  assert.match(sidebarSource, /mobile-menu-signout/);
  assert.match(sidebarSource, /<SignOutButton/);

  for (const token of ["--background", "--surface", "--foreground", "--border", "--primary", "--accent", "--destructive"]) {
    assert.match(stylesSource, new RegExp(token));
  }
  assert.doesNotMatch(stylesSource, /data-theme="dark"/);
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

test("shared action links preserve the root session through client navigation", async () => {
  const [stableLink, actionControl, fitScoreWorkspace] = await Promise.all([
    readFile(new URL("../app/components/StableLink.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/ActionControl.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/FitScoreWorkspace.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(stableLink, /from ["']next\/link["']/);
  assert.match(stableLink, /<NextLink href=\{href\}/);
  assert.doesNotMatch(stableLink, /<a href=\{href\}/);
  assert.match(actionControl, /import \{ StableLink \} from ["']\.\/StableLink["']/);
  assert.match(actionControl, /<StableLink/);
  assert.match(fitScoreWorkspace, /ActionLink/);
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

  const [listSource, formSource, sourceField] = await Promise.all([
    readFile(new URL("../app/lowongan/JobsWorkspace.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lowongan/baru/JobCreationForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/JobSourceField.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(listSource, /href="\/lowongan\/baru"/i);
  assert.match(listSource, /Tambah lowongan/i);
  assert.match(formSource, /<JobSourceField disabled=\{isBusy\}/);
  assert.match(sourceField, /<select/);
  assert.match(sourceField, /value="custom"/);
  assert.match(sourceField, /type="hidden" name="source"/);
  for (const field of ["title", "company", "source", "location", "workArrangement", "rawDescription"]) {
    assert.match(field === "source" ? sourceField : formSource, new RegExp(`name=["']${field}["']`, "i"));
  }
});

test("saved-job empty states stay focused and deletion requires confirmation", async () => {
  const [jobsSource, fitScoreSource, jobInfoSource] = await Promise.all([
    readFile(new URL("../app/lowongan/JobsWorkspace.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/FitScoreWorkspace.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lowongan/[id]/JobInfoEditor.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(jobsSource, /<EmptyCollectionState/);
  assert.match(jobsSource, /className="jobs-zero-state"/);
  assert.match(jobsSource, /<JobsPageHeader showAction=\{false\}/);
  const emptyStateSource = await readFile(new URL("../app/components/EmptyCollectionState.tsx", import.meta.url), "utf8");
  assert.match(emptyStateSource, /<CollectionIllustration kind=\{kind\}/);
  assert.match(emptyStateSource, /<h2 id=\{titleId\}>\{title\}<\/h2>/);
  assert.match(emptyStateSource, /\{action\}/);
  assert.match(fitScoreSource, /className="page-empty-state fit-score-empty"/);
  assert.match(jobInfoSource, /Hapus lowongan/);
  assert.match(jobInfoSource, /role="alertdialog"/);
  assert.match(jobInfoSource, /method:\s*"DELETE"/);
  assert.match(jobInfoSource, /window\.location\.assign\("\/lowongan"\)/);
});
