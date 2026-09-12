import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { AUTH_STATE_PATH, DEFAULT_BASE_URL } from "./config.mjs";
import { ensureDevelopmentServer } from "./workflow.mjs";
const browser = await chromium.launch();
try {
  const base = await ensureDevelopmentServer(DEFAULT_BASE_URL);
  const context = await browser.newContext({
    storageState: AUTH_STATE_PATH,
    reducedMotion: "reduce",
  });
  await context.route("**/api/**", (route) =>
    ["GET", "HEAD"].includes(route.request().method())
      ? route.continue()
      : route.fulfill({
          status: 400,
          json: { error: { message: "Read-only checkpoint QA" } },
        }),
  );
  const page = await context.newPage();
  const profile = {
    targetRole: "Graphic Designer",
    careerField: "Design & Creative",
  };
  const job = {
    id: "checkpoint-job",
    title: "Graphic Designer",
    company: "Studio Contoh",
    updatedAt: "2026-09-12T00:00:00Z",
  };
  const requirement = {
    id: "checkpoint-requirement",
    type: "skill",
    priority: "required",
    reviewedWithoutEvidence: false,
    skills: [],
  };
  const complete = {
    profile,
    skills: [{ id: "s1", name: "Figma", status: "active" }],
    evidences: [{ id: "e1" }],
    jobs: [],
    jobContexts: [],
    recentAnalyses: [],
  };
  const mapping = {
    requirements: [requirement],
    informationalRequirements: [],
    mappedCount: 0,
    totalMappableRequirements: 1,
  };
  const cases = [
    [
      "onboarding",
      { ...complete, profile: null },
      "Buat profil kariermu",
      "/profil-karier",
    ],
    [
      "direction",
      { ...complete, profile: { targetRole: "", careerField: "" } },
      "Lengkapi arah kariermu",
      "/profil-karier",
    ],
    [
      "skills",
      { ...complete, skills: [] },
      "Tambahkan skill utama",
      "/profil-karier",
    ],
    [
      "portfolio",
      { ...complete, evidences: [] },
      "Skillmu belum punya pendukung",
      "/portfolio-pengalaman",
    ],
    ["jobs", complete, "Tambahkan lowongan pertamamu", "/lowongan/baru"],
    [
      "detail",
      { ...complete, jobs: [job] },
      "Ambil persyaratan",
      "/lowongan/checkpoint-job",
    ],
    [
      "requirements",
      {
        ...complete,
        jobs: [job],
        jobContexts: [
          { jobId: job.id, requirements: [requirement], mapping: null },
        ],
      },
      "Periksa persyaratan",
      "/lowongan/checkpoint-job/persyaratan",
    ],
    [
      "matching",
      {
        ...complete,
        jobs: [job],
        jobContexts: [{ jobId: job.id, requirements: [requirement], mapping }],
      },
      "Cocokkan Profil",
      "/lowongan/checkpoint-job/cocokkan-profil",
    ],
    [
      "analysis",
      {
        ...complete,
        jobs: [job],
        jobContexts: [
          {
            jobId: job.id,
            requirements: [requirement],
            mapping: {
              ...mapping,
              requirements: [{ ...requirement, reviewedWithoutEvidence: true }],
            },
          },
        ],
      },
      "Buka analisis",
      "/lowongan/checkpoint-job/analisis",
    ],
  ];
  cases.push([
    "completed",
    {
      ...cases.at(-1)[1],
      recentAnalyses: [
        {
          jobId: job.id,
          score: 0,
          summary: "Belum ada skill yang mendukung persyaratan.",
        },
      ],
    },
    "Lihat analisis",
    "/lowongan/checkpoint-job/analisis",
  ]);
  for (const sourceName of ["detail", "completed"]) {
    const [name, data, title, href] = cases.find(
      (item) => item[0] === sourceName,
    );
    cases.push([
      name + "-multiple",
      {
        ...data,
        jobs: [job, { ...job, id: "other-job", title: "Visual Designer" }],
      },
      title,
      href,
    ]);
  }
  await mkdir("screenshots/checkpoints", { recursive: true });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of [390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [name, data, title, href] of cases) {
      await page.route("**/api/workspace?scope=dashboard", (route) =>
        route.fulfill({ json: { data } }),
      );
      await page.goto(base + "/beranda");
      await page.getByText(title, { exact: true }).first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      assert.equal(
        await page
          .locator(".summary-primary-action")
          .first()
          .getAttribute("href"),
        href,
      );
      assert.equal(
        await page.locator("main .collection-illustration").count(),
        name.startsWith("completed") ? 0 : 1,
      );
      if (name.startsWith("completed"))
        assert.match(
          await page.locator(".summary-fit-score").innerText(),
          /0%/,
        );
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${name} ${width}: overflow`,
      );
      await page.screenshot({
        path: `screenshots/checkpoints/${width}-${name}.png`,
        fullPage: true,
      });
      assert.equal(await page.locator(".summary-primary-action").count(), 1);
      const duplicateLinks = await page
        .locator(".summary-secondary-nav a")
        .evaluateAll(
          (links, primaryHref) =>
            links.filter((link) => link.getAttribute("href") === primaryHref)
              .length,
          href,
        );
      assert.equal(
        duplicateLinks,
        0,
        "Secondary action must not duplicate the checkpoint action",
      );
      await checkButtons(page);
      console.log(`PASS ${width} ${name}`);
      await page.unroute("**/api/workspace?scope=dashboard");
    }
    await page.route("**/api/workspace?scope=profile", async (route) => {
      const response = await route.fetch();
      const body = await response.json();
      body.data.skills = [];
      await route.fulfill({ response, json: body });
    });
    await page.goto(base + "/profil-karier");
    await page.locator(".skill-empty-state").waitFor();
    assert.equal(
      await page.locator(".skill-empty-state .collection-illustration").count(),
      1,
    );
    assert.equal(
      await page.locator(".skill-empty-state .brand-motif").count(),
      0,
    );
    await page.screenshot({
      path: `screenshots/checkpoints/${width}-skill-empty.png`,
      fullPage: true,
    });
    assert.equal(
      await page
        .getByRole("button", { name: "Tambah skill", exact: true })
        .count(),
      1,
    );
    await checkButtons(page);
    await page.locator(".skill-empty-state button").click();
    await page.locator(".skill-editor").waitFor();
    await page.unroute("**/api/workspace?scope=profile");
    console.log(`PASS ${width} skill-empty and add editor`);
    for (const [scope, routePath, emptySelector] of [
      ["portfolio", "/portfolio-pengalaman", ".evidence-empty-state"],
      ["jobs", "/lowongan", ".jobs-zero-state"],
    ]) {
      const pattern = "**/api/workspace?scope=" + scope;
      await page.route(pattern, (route) =>
        route.fulfill({
          json: {
            data:
              scope === "jobs" ? { jobs: [] } : { evidences: [], skills: [] },
          },
        }),
      );
      await page.goto(base + routePath);
      await page.locator(emptySelector).waitFor();
      assert.equal(
        await page.locator("main .empty-collection-state").count(),
        1,
      );
      assert.equal(
        await page
          .locator(
            scope === "jobs" ? ".jobs-add-button" : ".evidence-add-button",
          )
          .count(),
        scope === "jobs" ? 1 : 0,
      );
      assert.equal(
        await page
          .locator(".evidence-filter-panel, .jobs-filter-panel")
          .count(),
        0,
      );
      await checkButtons(page);
      await page.screenshot({
        path: `screenshots/checkpoints/${width}-${scope}-empty.png`,
        fullPage: true,
      });
      if (scope === "portfolio") {
        await page
          .getByRole("button", { name: "Tambah portfolio", exact: true })
          .click();
        await page.locator(".evidence-editor").waitFor();
        assert.equal(await page.locator(".empty-collection-state").count(), 0);
      }
      await page.unroute(pattern);
      console.log(`PASS ${width} ${scope} empty state`);
    }
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}

async function checkButtons(page) {
  const buttons = page.locator(
    "main :is(button, a.ui-button, a.ui-text-cta):visible",
  );
  for (let index = 0; index < (await buttons.count()); index++) {
    const button = buttons.nth(index);
    await button.hover();
    assert.equal(
      await button.evaluate(
        (element) => getComputedStyle(element).textDecorationLine,
      ),
      "none",
    );
  }
}
