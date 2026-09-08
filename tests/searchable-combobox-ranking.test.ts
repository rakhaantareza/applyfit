import assert from "node:assert/strict";
import test from "node:test";
import {
  filterSearchableComboboxOptions,
  findExactSearchableComboboxOption,
  normalizeComboboxSearch,
  type SearchableComboboxOption,
} from "../app/components/searchable-combobox-ranking.ts";

const options: SearchableComboboxOption[] = [
  { id: "html", value: "HTML", aliases: ["HTML5"], priority: 3 },
  { id: "css", value: "CSS", aliases: ["CSS3"], priority: 2 },
  { id: "javascript", value: "JavaScript", aliases: ["JS", "ECMAScript"], priority: 5 },
  { id: "typescript", value: "TypeScript", aliases: ["TS"], priority: 4 },
  { id: "react", value: "React", aliases: ["ReactJS", "React.js"], priority: 0 },
  { id: "nextjs", value: "Next.js", aliases: ["NextJS"], priority: 1 },
  { id: "nodejs", value: "Node.js", aliases: ["NodeJS", "Node"], priority: 0 },
  { id: "vuejs", value: "Vue.js", aliases: ["VueJS"], priority: 0 },
];

test("skill search uses canonical and alias ranking before substrings", () => {
  assert.equal(filterSearchableComboboxOptions(options, "html")[0]?.value, "HTML");
  assert.equal(filterSearchableComboboxOptions(options, "js")[0]?.value, "JavaScript");
  assert.equal(filterSearchableComboboxOptions(options, "ts")[0]?.value, "TypeScript");
  assert.equal(filterSearchableComboboxOptions(options, "reactjs")[0]?.value, "React");
  assert.equal(filterSearchableComboboxOptions(options, "react.js")[0]?.value, "React");
  assert.equal(filterSearchableComboboxOptions(options, "nodejs")[0]?.value, "Node.js");
});

test("typed search is global and is not reordered by role context", () => {
  const results = filterSearchableComboboxOptions(options, "js");
  assert.deepEqual(results.map((option) => option.value).slice(0, 3), [
    "JavaScript",
    "Next.js",
    "Node.js",
  ]);
});

test("empty search follows contextual priority", () => {
  assert.deepEqual(filterSearchableComboboxOptions(options, "").slice(0, 4).map(
    (option) => option.value,
  ), ["Node.js", "React", "Vue.js", "Next.js"]);
});

test("exact aliases resolve to canonical choices and custom input stays unmatched", () => {
  assert.equal(findExactSearchableComboboxOption(options, "JS")?.value, "JavaScript");
  assert.equal(findExactSearchableComboboxOption(options, "React.js")?.value, "React");
  assert.equal(findExactSearchableComboboxOption(options, "custom domain skill"), undefined);
  assert.deepEqual(filterSearchableComboboxOptions(options, "custom domain skill"), []);
});

test("search normalization ignores case, accents, spaces, and punctuation", () => {
  assert.equal(normalizeComboboxSearch("  RÉACT.js  "), "reactjs");
});
