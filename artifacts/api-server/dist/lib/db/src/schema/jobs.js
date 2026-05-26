import { pgTable, serial, text, integer, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
export const jobCategoryEnum = pgEnum("job_category", ["IT", "NON_IT", "STATE_GOVT", "CENTRAL_GOVT"]);
export const shiftEnum = pgEnum("shift_type", ["Day", "Night", "Full_time", "Part_time"]);
export const jobsTable = pgTable("jobs", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    company: text("company").notNull(),
    category: jobCategoryEnum("category").notNull(),
    location: text("location").notNull(),
    shift: shiftEnum("shift").notNull(),
    description: text("description").notNull(),
    eligibility: text("eligibility").notNull(),
    applicationGuide: text("application_guide").notNull(),
    startDate: text("start_date").notNull(),
    endDate: text("end_date").notNull(),
    hrEmail: text("hr_email").notNull(),
    salary: text("salary").notNull(),
    openings: integer("openings").notNull().default(1),
    applicationLink: text("application_link").notNull().default(""),
    official_url: text("official_url").notNull().default(""),
    isFeatured: boolean("is_featured").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const insertJobSchema = createInsertSchema(jobsTable).omit({ id: true, createdAt: true });
