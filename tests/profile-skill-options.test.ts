import assert from "node:assert/strict";
import test from "node:test";
import { filterSearchableComboboxOptions } from "../app/components/searchable-combobox-ranking.ts";
import {
  buildDefaultSkillComboboxOptions,
  buildSkillComboboxOptions,
} from "../app/profil-karier/skill-options.ts";

const catalog = {
  fields: [
    { id: "software", slug: "software-it", name: "Software & IT" },
    { id: "design", slug: "design-creative", name: "Design & Creative" },
  ],
  roles: [
    {
      id: "frontend",
      slug: "frontend-engineer",
      name: "Frontend Engineer",
      aliases: [],
      fieldIds: ["software"],
      commonSkillIds: ["html", "css", "javascript", "react"],
    },
    {
      id: "backend",
      slug: "backend-engineer",
      name: "Backend Engineer",
      aliases: [],
      fieldIds: ["software"],
      commonSkillIds: ["nodejs", "git"],
    },
  ],
  skills: [
    { id: "css", slug: "css", name: "CSS", aliases: ["CSS3"] },
    { id: "git", slug: "git", name: "Git", aliases: [] },
    { id: "html", slug: "html", name: "HTML", aliases: ["HTML5"] },
    { id: "javascript", slug: "javascript", name: "JavaScript", aliases: ["JS"] },
    { id: "nodejs", slug: "nodejs", name: "Node.js", aliases: ["NodeJS"] },
    { id: "react", slug: "react", name: "React", aliases: ["ReactJS", "React.js"] },
  ],
};

test("empty skill suggestions prefer target role, then current field", () => {
  const options = buildSkillComboboxOptions({
    catalog,
    skills: [],
    editingSkillId: null,
    careerFieldId: "software",
    targetRoleId: "frontend",
  });

  assert.deepEqual(filterSearchableComboboxOptions(options, "").map(
    (option) => option.value,
  ), ["HTML", "CSS", "JavaScript", "React", "Node.js", "Git"]);
  assert.equal(options.find((option) => option.id === "html")?.meta, "Umum untuk Frontend Engineer");
  assert.equal(options.find((option) => option.id === "nodejs")?.meta, "Relevan untuk Software & IT");
});

test("typed search remains global and canonicalizes aliases outside the role", () => {
  const options = buildSkillComboboxOptions({
    catalog,
    skills: [],
    editingSkillId: null,
    careerFieldId: "software",
    targetRoleId: "frontend",
  });

  assert.equal(filterSearchableComboboxOptions(options, "nodejs")[0]?.value, "Node.js");
});

test("existing canonical or aliased skills are omitted from typed search", () => {
  const options = buildSkillComboboxOptions({
    catalog,
    skills: [
      { id: "saved-html", name: "HTML", catalogSkillId: "html" },
      { id: "saved-js", name: "JavaScript", catalogSkillId: "javascript" },
      { id: "saved-react", name: "ReactJS", catalogSkillId: null },
    ],
    editingSkillId: null,
    careerFieldId: "software",
    targetRoleId: "frontend",
  });

  for (const query of ["html", "js", "javascript", "react.js"]) {
    assert.equal(
      filterSearchableComboboxOptions(options, query).some((option) =>
        ["html", "javascript", "react"].includes(option.id)),
      false,
    );
  }
  assert.equal(options.some((option) => option.value === "JavaScript"), false);
  assert.equal(filterSearchableComboboxOptions(options, "Domain Mapping").length, 0);
});

test("default suggestions omit existing skills while preserving contextual order", () => {
  const defaultOptions = buildDefaultSkillComboboxOptions({
    catalog,
    skills: [
      { id: "saved-html", name: "HTML", catalogSkillId: "html" },
      { id: "saved-js", name: "JavaScript", catalogSkillId: "javascript" },
      { id: "saved-react", name: "React", catalogSkillId: "react" },
    ],
    editingSkillId: null,
    careerFieldId: "software",
    targetRoleId: "frontend",
  });

  assert.deepEqual(filterSearchableComboboxOptions(defaultOptions, "").map(
    (option) => option.value,
  ), ["CSS", "Node.js", "Git"]);
  assert.equal(defaultOptions.find((option) => option.id === "nodejs")?.meta, "Relevan untuk Software & IT");

  const typedOptions = buildSkillComboboxOptions({
    catalog,
    skills: [{ id: "saved-js", name: "JavaScript", catalogSkillId: "javascript" }],
    editingSkillId: null,
    careerFieldId: "software",
    targetRoleId: "frontend",
  });
  assert.equal(typedOptions.some((option) => option.id === "javascript"), false);
});

test("a deleted canonical skill becomes eligible for suggestions again", () => {
  const savedSkills = [
    { id: "saved-js", name: "JavaScript", catalogSkillId: "javascript" },
  ];
  const withExistingSkill = buildDefaultSkillComboboxOptions({
    catalog,
    skills: savedSkills,
    editingSkillId: null,
    careerFieldId: "software",
    targetRoleId: "frontend",
  });
  const afterDeletion = buildDefaultSkillComboboxOptions({
    catalog,
    skills: savedSkills.filter((skill) => skill.id !== "saved-js"),
    editingSkillId: null,
    careerFieldId: "software",
    targetRoleId: "frontend",
  });

  assert.equal(withExistingSkill.some((option) => option.id === "javascript"), false);
  assert.equal(afterDeletion.some((option) => option.id === "javascript"), true);
  assert.equal(filterSearchableComboboxOptions(afterDeletion, "js")[0]?.value, "JavaScript");
});
