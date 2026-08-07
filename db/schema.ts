import { relations } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const requirementTypeEnum = pgEnum("requirement_type", [
  "skill",
  "tool",
  "education",
  "experience",
]);

export const requirementPriorityEnum = pgEnum("requirement_priority", [
  "required",
  "preferred",
]);

export const requirementStatusEnum = pgEnum("requirement_status", [
  "proven",
  "partial",
  "learning",
  "missing",
]);

export const evidenceTypeEnum = pgEnum("evidence_type", [
  "project",
  "cert",
  "work",
  "internship",
  "github",
  "portfolio",
]);

export const jobPostings = pgTable(
  "job_postings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // The referenced user is owned by InsForge Auth, outside this schema.
    userId: uuid("user_id").notNull(),
    title: text("title").notNull(),
    company: text("company").notNull(),
    source: text("source"),
    sourceUrl: text("source_url"),
    rawDescription: text("raw_description").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("job_postings_user_id_idx").on(table.userId),
    index("job_postings_user_created_at_idx").on(
      table.userId,
      table.createdAt,
    ),
  ],
);

export const jobRequirements = pgTable(
  "job_requirements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobPostings.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: requirementTypeEnum("type").notNull(),
    priority: requirementPriorityEnum("priority").notNull(),
    status: requirementStatusEnum("status").default("missing").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("job_requirements_job_id_idx").on(table.jobId),
    index("job_requirements_job_type_idx").on(table.jobId, table.type),
  ],
);

export const evidences = pgTable(
  "evidences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Profiles are introduced by the Career Profile feature.
    profileId: uuid("profile_id").notNull(),
    title: text("title").notNull(),
    type: evidenceTypeEnum("type").notNull(),
    url: text("url"),
    description: text("description").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("evidences_profile_id_idx").on(table.profileId),
    index("evidences_profile_type_idx").on(table.profileId, table.type),
  ],
);

export const jobPostingsRelations = relations(jobPostings, ({ many }) => ({
  requirements: many(jobRequirements),
}));

export const jobRequirementsRelations = relations(
  jobRequirements,
  ({ one }) => ({
    job: one(jobPostings, {
      fields: [jobRequirements.jobId],
      references: [jobPostings.id],
    }),
  }),
);

export type JobPosting = typeof jobPostings.$inferSelect;
export type NewJobPosting = typeof jobPostings.$inferInsert;
export type JobRequirement = typeof jobRequirements.$inferSelect;
export type NewJobRequirement = typeof jobRequirements.$inferInsert;
export type Evidence = typeof evidences.$inferSelect;
export type NewEvidence = typeof evidences.$inferInsert;
