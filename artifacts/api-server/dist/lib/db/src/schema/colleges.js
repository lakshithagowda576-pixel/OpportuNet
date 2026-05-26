import { pgTable, serial, text, integer, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { examsTable } from "./exams";
import { usersTable } from "./users";
export const collegesTable = pgTable("colleges", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    location: text("location").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    collegeCode: varchar("college_code", { length: 50 }),
    affiliation: text("affiliation"),
    about: text("about"),
    websiteUrl: text("website_url"),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    establishedYear: integer("established_year"),
    facilities: text("facilities").array(),
    qualification: text("qualification"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const collegeCutoffsTable = pgTable("college_cutoffs", {
    id: serial("id").primaryKey(),
    collegeId: integer("college_id")
        .notNull()
        .references(() => collegesTable.id),
    courseName: text("course_name").notNull(),
    category: varchar("category", { length: 50 }).default("General"),
    cutoffScore: integer("cutoff_score").notNull(),
    ugSeats: integer("ug_seats").default(0),
    pgSeats: integer("pg_seats").default(0),
    academicYear: varchar("academic_year", { length: 20 }).default("2024-25"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const collegeFeesTable = pgTable("college_fees", {
    id: serial("id").primaryKey(),
    collegeId: integer("college_id")
        .notNull()
        .references(() => collegesTable.id),
    courseType: varchar("course_type", { length: 10 }).notNull(), // 'UG' or 'PG'
    courseName: text("course_name").notNull(),
    annualFees: text("annual_fees"),
    totalFees: text("total_fees"),
    description: text("description"),
    academicYear: varchar("academic_year", { length: 20 }).default("2024-25"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const examResultsTable = pgTable("exam_results", {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
        .notNull()
        .references(() => usersTable.id),
    examId: integer("exam_id")
        .notNull()
        .references(() => examsTable.id),
    score: integer("score").notNull(),
    totalMarks: integer("total_marks").default(600),
    percentile: varchar("percentile", { length: 10 }),
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});
export const insertCollegeSchema = createInsertSchema(collegesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCollegeCutoffSchema = createInsertSchema(collegeCutoffsTable).omit({ id: true, createdAt: true });
export const insertCollegeFeeSchema = createInsertSchema(collegeFeesTable).omit({ id: true, createdAt: true });
export const insertExamResultSchema = createInsertSchema(examResultsTable).omit({ id: true, submittedAt: true });
