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
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Skor Kecocokan \| ApplyFit<\/title>/i);
  assert.match(
    html,
    /fonts\.googleapis\.com\/css2\?family=Plus\+Jakarta\+Sans(?:&|&amp;)display=swap/i,
  );
  assert.match(
    html,
    /fonts\.googleapis\.com\/css2\?family=Geist\+Mono(?:&|&amp;)display=swap/i,
  );
  assert.match(html, /href="\/contoh-perhitungan"/i);
  assert.doesNotMatch(html, /__variable_plus_jakarta_sans/i);
});

test("production worker serves the implemented calculation route", async () => {
  const response = await render("/contoh-perhitungan");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<title>Contoh Perhitungan \| ApplyFit<\/title>/i);
  assert.match(html, /<h1>Contoh Perhitungan<\/h1>/i);
});

test("internal route links use the Vinext-safe navigation primitive", async () => {
  const [stableLink, homePage] = await Promise.all([
    readFile(new URL("../app/components/StableLink.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(stableLink, /<a href=\{href\}/);
  assert.match(homePage, /StableLink as Link/);
  assert.doesNotMatch(homePage, /from ["']next\/link["']/);
});
