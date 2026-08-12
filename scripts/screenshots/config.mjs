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
];
