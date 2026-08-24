import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));

export const PROJECT_ROOT = path.resolve(scriptsDirectory, "../..");
export const AUTH_STATE_PATH = path.join(
  PROJECT_ROOT,
  ".playwright",
  "auth",
  "demo.json",
);
export const SCREENSHOT_ROOT = path.join(PROJECT_ROOT, "screenshots");

export const DEFAULT_BASE_URL = "http://127.0.0.1:3000";

// Viewports are expressed in CSS pixels. Keep normal review captures at 1:1;
// the portfolio export is intentionally high-density.
export const SCREENSHOT_DEVICE_SCALE_FACTOR = 1;
export const PORTFOLIO_DEVICE_SCALE_FACTOR = 2;

// Playwright hides scrollbars in headless Chromium by default, changing the
// content box compared with a normal Windows browser. Keep native scrollbar
// geometry so responsive spacing is measured against the same layout width.
export const SCREENSHOT_BROWSER_LAUNCH_OPTIONS = {
  headless: true,
  ignoreDefaultArgs: ["--hide-scrollbars"],
};

// These are the web-font faces declared by the application shell. Requiring a
// loaded FontFace (rather than trusting font-family's fallback list) prevents
// screenshots from silently capturing Arial/monospace fallback glyphs.
export const SCREENSHOT_FONT_PROBES = [
  {
    family: "Plus Jakarta Sans",
    descriptor: '400 16px "Plus Jakarta Sans"',
    sample: "ApplyFit Skor Kecocokan",
  },
  {
    family: "Geist Mono",
    descriptor: '400 16px "Geist Mono"',
    sample: "ApplyFit 0123456789",
  },
];

export const VIEWPORTS = [
  { name: "1440", width: 1440, height: 900 },
  { name: "1280", width: 1280, height: 800 },
  { name: "1024", width: 1024, height: 768 },
  { name: "768", width: 768, height: 1024 },
  { name: "430", width: 430, height: 932 },
  { name: "390", width: 390, height: 844 },
];

// Keep the reviewed authenticated routes and their post-load markers together.
// A route is ready only after its account-backed workspace has rendered.
export const SCREENSHOT_ROUTES = [
  {
    label: "Beranda",
    slug: "beranda",
    path: "/beranda",
    readySelector: ".home-header",
  },
  {
    label: "Career Profile",
    slug: "career-profile",
    path: "/profil-karier",
    readySelector: ".career-profile-hero",
  },
  {
    label: "Evidence Library",
    slug: "evidence-library",
    path: "/pustaka-bukti",
    readySelector: ".evidence-overview",
  },
  {
    label: "Job Management",
    slug: "job-management",
    path: "/lowongan",
    readySelector: ".jobs-overview, .jobs-zero-state",
  },
  {
    label: "Fit Score",
    slug: "fit-score",
    path: "/skor-kecocokan",
    readySelector: ".fit-story, .fit-score-empty",
  },
  {
    label: "Account Settings",
    slug: "account-settings",
    path: "/pengaturan",
    readySelector: ".account-settings-stack",
  },
];
// Public account-entry pages must be captured without the demo storage state.
// These routes are intentionally separate from the authenticated manifest so
// their screenshots cannot inherit cookies from the workspace capture.
export const UNAUTHENTICATED_SCREENSHOT_ROUTES = [
  {
    label: "Login",
    slug: "login",
    path: "/login",
    readySelector: "#login-title",
  },
  {
    label: "Registration",
    slug: "daftar",
    path: "/daftar",
    readySelector: "#registration-title",
  },
  {
    label: "Password Recovery",
    slug: "password-recovery",
    path: "/lupa-kata-sandi",
    readySelector: "#recovery-title",
  },
];

// Dynamic job routes are appended only after the authenticated demo job has
// been resolved. Keeping them in the shared manifest ensures responsive and
// portfolio captures use the same paths and readiness markers.
export function buildJobScreenshotRoutes(jobId) {
  const encodedJobId = encodeURIComponent(jobId);
  const jobPath = `/lowongan/${encodedJobId}`;

  return [
    {
      label: "Job Detail",
      slug: "job-detail",
      path: jobPath,
      readySelector: ".job-detail-hero",
      jobTitleSelector: "#job-detail-title",
    },
    {
      label: "Requirement Review",
      slug: "requirement-review",
      path: `${jobPath}/tinjau-syarat`,
      readySelector: ".requirement-review-overview",
      jobTitleSelector: ".requirement-review-overview dd",
    },
    {
      label: "Requirement Mapping",
      slug: "requirement-mapping",
      path: `${jobPath}/pemetaan-bukti`,
      readySelector: ".mapping-job-context",
      jobTitleSelector: "#mapping-job-title",
    },
    {
      kind: "analysis",
      label: "Job Analysis",
      slug: "job-analysis",
      path: "/skor-kecocokan",
      href: `/skor-kecocokan?job=${encodedJobId}`,
      readySelector: ".fit-story",
      jobTitleSelector: ".analyzed-job-heading strong",
    },
  ];
}
