import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("session bootstrap is owned by the persistent root provider", async () => {
  const [routeSource, providerSource, sidebarSource, layoutSource, proxySource, cssSource] =
    await Promise.all([
      readFile(new URL("../app/components/AuthenticatedRoute.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/components/AuthSessionProvider.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/components/AppSidebar.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
      readFile(new URL("../proxy.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    ]);

  assert.match(routeSource, /Menyiapkan ruang kerjamu…/);
  assert.doesNotMatch(routeSource, /WorkspaceContentLoadingState|AppSidebar/);
  assert.match(providerSource, /useEffect\(\(\) => \{[\s\S]+bootstrapAuthSession\(\)/);
  assert.match(providerSource, /useSyncExternalStore/);
  assert.doesNotMatch(providerSource, /createContext|\.Provider>/);
  assert.match(layoutSource, /<AuthSessionProvider>\{children\}<\/AuthSessionProvider>/);
  assert.doesNotMatch(layoutSource, /cookies\(|initialWorkspaceTransition/);

  assert.match(sidebarSource, /from "next\/link"/);
  assert.match(sidebarSource, /<Link[\s\S]+className=\{`nav-item/);
  assert.doesNotMatch(sidebarSource, /document\.cookie|WORKSPACE_TRANSITION/);
  assert.doesNotMatch(proxySource, /WORKSPACE_TRANSITION/);

  assert.match(cssSource, /@keyframes session-logo-flip/);
  assert.match(cssSource, /rotateY\(360deg\)/);
  assert.doesNotMatch(cssSource, /session-content-skeleton/);
  assert.match(
    cssSource,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]+\.session-route-check \.session-logo-flip[\s\S]+animation: none/,
  );
});

test("page data loading never renders page-level loaders", async () => {
  const loadingSources = await Promise.all([
    "../app/beranda/AdaptiveHomeDashboard.tsx",
    "../app/profil-karier/CareerProfileWorkspace.tsx",
    "../app/pustaka-bukti/EvidenceLibraryWorkspace.tsx",
    "../app/lowongan/JobsWorkspace.tsx",
    "../app/components/FitScoreWorkspace.tsx",
    "../app/lowongan/[id]/PersistedJobDetail.tsx",
    "../app/lowongan/[id]/tinjau-syarat/RequirementReviewWorkspace.tsx",
    "../app/lowongan/[id]/pemetaan-bukti/EvidenceMappingPageWorkspace.tsx",
    "../app/pengaturan/AccountSettings.tsx",
  ].map((path) => readFile(new URL(path, import.meta.url), "utf8")));

  for (const source of loadingSources) {
    assert.doesNotMatch(source, /ContentSkeleton|content-skeleton|LoaderCircle[^\n]+loading/i);
    assert.doesNotMatch(
      source,
      /Menyiapkan ringkasan|Menyiapkan lowongan|Menyiapkan analisis|Menyiapkan pemetaan|Memuat profil karier|Memuat pustaka|Memuat lowongan|Memuat requirement|Memuat pengaturan/,
    );
  }

  const dashboardSource = loadingSources[0];
  assert.match(dashboardSource, /dashboardDataCache = new Map<string, DashboardData>/);
  assert.match(dashboardSource, /dashboardDataCache\.get\(userId\)/);
  assert.doesNotMatch(dashboardSource, /const emptyDashboardData|data \?\? emptyDashboardData/);
});
