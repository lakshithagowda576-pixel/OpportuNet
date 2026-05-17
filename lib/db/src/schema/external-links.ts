import { pgTable, serial, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { jobsTable } from "./jobs";

export const externalLinksTable = pgTable("external_links", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobsTable.id),
  officialUrl: text("official_url").notNull(),
  lastVerified: timestamp("last_verified"),
  isActive: boolean("is_active").default(true).notNull()
});

export const insertExternalLinkSchema = createInsertSchema(externalLinksTable).omit({ id: true });
export type InsertExternalLink = typeof externalLinksTable.$inferInsert;
export type ExternalLink = typeof externalLinksTable.$inferSelect;
