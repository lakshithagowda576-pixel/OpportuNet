import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { jobsTable } from "./jobs";
export const hrEmailsTable = pgTable("hr_emails", {
    id: serial("id").primaryKey(),
    jobId: integer("job_id").references(() => jobsTable.id),
    email: text("email").notNull(),
    label: text("label").notNull().default("Primary"),
    addedBy: text("added_by").notNull().default("admin"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
