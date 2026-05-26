import { pgTable, text, serial, integer, timestamp, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
export const jobSourcesTable = pgTable("job_sources", {
    id: serial("id").primaryKey(),
    name: text("name").notNull().unique(), // e.g., "linkedin", "github-jobs", "indeed"
    apiUrl: text("api_url"),
    apiKey: text("api_key"), // Encrypted API key
    isActive: boolean("is_active").default(true),
    config: jsonb("config").default({}), // Source-specific config (headers, pagination, etc)
    lastSyncAt: timestamp("last_sync_at"),
    lastSyncStatus: text("last_sync_status"), // success, partial, failed
    createdAt: timestamp("created_at").defaultNow(),
});
export const jobIngestionsTable = pgTable("job_ingestions", {
    id: serial("id").primaryKey(),
    sourceId: integer("source_id")
        .notNull()
        .references(() => jobSourcesTable.id),
    jobCount: integer("job_count").default(0),
    newJobs: integer("new_jobs").default(0),
    updatedJobs: integer("updated_jobs").default(0),
    duplicates: integer("duplicates").default(0),
    status: text("status").default("pending"), // pending, processing, completed, failed
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
    sourceIdIndex: index("ingestions_source_id_idx").on(table.sourceId),
}));
export const jobSourceMappingTable = pgTable("job_source_mapping", {
    id: serial("id").primaryKey(),
    sourceId: integer("source_id")
        .notNull()
        .references(() => jobSourcesTable.id),
    externalJobId: text("external_job_id").notNull(), // External source's job ID
    internalJobId: integer("internal_job_id")
        .notNull()
        .references(() => jobsTable.id),
    externalUrl: text("external_url"), // Link to original job posting
    lastSeenAt: timestamp("last_seen_at").defaultNow(),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
});
// Import jobsTable for reference
import { jobsTable } from "./jobs";
export const createJobSourceSchema = createInsertSchema(jobSourcesTable).pick({
    name: true,
    apiUrl: true,
    apiKey: true,
    config: true,
});
export const updateJobSourceSchema = createInsertSchema(jobSourcesTable)
    .pick({
    isActive: true,
    config: true,
    lastSyncAt: true,
    lastSyncStatus: true,
})
    .partial();
