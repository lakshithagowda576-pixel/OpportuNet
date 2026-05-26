import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
export const studyMaterialTypeEnum = pgEnum("study_material_type", [
    "PDF",
    "Video",
    "Notes",
    "Practice_Test",
]);
export const examsTable = pgTable("exams", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    fullName: text("full_name").notNull(),
    description: text("description").notNull(),
    examDate: text("exam_date").notNull(),
    applicationStartDate: text("application_start_date").notNull(),
    applicationEndDate: text("application_end_date").notNull(),
    applyLink: text("apply_link").notNull(),
    eligibility: text("eligibility").notNull(),
    applicationGuide: text("application_guide").notNull(),
    officialWebsite: text("official_website").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const studyMaterialsTable = pgTable("study_materials", {
    id: serial("id").primaryKey(),
    examId: integer("exam_id")
        .notNull()
        .references(() => examsTable.id),
    title: text("title").notNull(),
    subject: text("subject").notNull(),
    type: studyMaterialTypeEnum("type").notNull(),
    description: text("description").notNull(),
    url: text("url").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const insertExamSchema = createInsertSchema(examsTable).omit({ id: true, createdAt: true });
export const insertStudyMaterialSchema = createInsertSchema(studyMaterialsTable).omit({ id: true, createdAt: true });
