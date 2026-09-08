import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeCatalogSearch,
  resolveCatalogSkillFromCatalog,
  type CareerCatalog,
} from "../server/services/career-catalog.ts";

const catalog: CareerCatalog = {
  fields: [{ id: "field-software", slug: "software-it", name: "Software & IT" }],
  roles: [],
  skills: [
    {
      id: "skill-javascript",
      slug: "javascript",
      name: "JavaScript",
      aliases: ["JS", "ECMAScript"],
    },
    {
      id: "skill-react",
      slug: "react",
      name: "React",
      aliases: ["ReactJS", "React.js"],
    },
    {
      id: "skill-html",
      slug: "html",
      name: "HTML",
      aliases: ["HTML5"],
    },
    {
      id: "skill-typescript",
      slug: "typescript",
      name: "TypeScript",
      aliases: ["TS"],
    },
    {
      id: "skill-nodejs",
      slug: "nodejs",
      name: "Node.js",
      aliases: ["NodeJS", "Node"],
    },
  ],
};

test("catalog search normalization is deterministic", () => {
  assert.equal(normalizeCatalogSearch("  React   JS  "), "reactjs");
  assert.equal(normalizeCatalogSearch("React.js"), "reactjs");
  assert.equal(normalizeCatalogSearch("RÉACT-JS"), "reactjs");
});

test("skill aliases resolve to the canonical skill", () => {
  assert.deepEqual(resolveCatalogSkillFromCatalog(catalog, { name: "JS" }), {
    name: "JavaScript",
    catalogSkillId: "skill-javascript",
  });
  assert.deepEqual(resolveCatalogSkillFromCatalog(catalog, { name: "React.js" }), {
    name: "React",
    catalogSkillId: "skill-react",
  });
  assert.deepEqual(resolveCatalogSkillFromCatalog(catalog, { name: "html" }), {
    name: "HTML",
    catalogSkillId: "skill-html",
  });
  assert.deepEqual(resolveCatalogSkillFromCatalog(catalog, { name: "ts" }), {
    name: "TypeScript",
    catalogSkillId: "skill-typescript",
  });
  assert.deepEqual(resolveCatalogSkillFromCatalog(catalog, { name: "nodejs" }), {
    name: "Node.js",
    catalogSkillId: "skill-nodejs",
  });
});

test("custom skill input remains available", () => {
  assert.deepEqual(resolveCatalogSkillFromCatalog(catalog, { name: "Domain Mapping" }), {
    name: "Domain Mapping",
    catalogSkillId: null,
  });
});
