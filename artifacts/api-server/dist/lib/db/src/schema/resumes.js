import { pgTable, text, serial, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { usersTable } from "./users";
export const resumesTable = pgTable("resumes", {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
        .notNull()
        .references(() => usersTable.id, { onDelete: "cascade" }),
    fileName: text("file_name").notNull(),
    fileUrl: text("file_url").notNull(), // S3 or local storage path
    fileSize: integer("file_size"), // in bytes
    mimeType: text("mime_type").default("application/pdf"),
    // Parsed content
    fullName: text("full_name"),
    email: text("email"),
    phone: text("phone"),
    location: text("location"),
    summary: text("summary"), // Professional summary/objective
    // Array fields stored as JSONB
    skills: jsonb("skills").default([]), // [{ name, proficiency, endorsements }]
    experience: jsonb("experience").default([]), // [{ title, company, duration, description }]
    education: jsonb("education").default([]), // [{ degree, field, school, year }]
    certifications: jsonb("certifications").default([]), // [{ name, issuer, date, url }]
    languages: jsonb("languages").default([]), // [{ name, proficiency }]
    // Metadata
    isPublic: boolean("is_public").default(false), // Share profile with employers
    parsedAt: timestamp("parsed_at"),
    parsingStatus: text("parsing_status").default("pending"), // pending, processing, completed, failed
    parsingError: text("parsing_error"), // Error message if parsing failed
    // Timestamps
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
export const createResumeSchema = createInsertSchema(resumesTable).pick({
    userId: true,
    fileName: true,
    fileUrl: true,
    fileSize: true,
    mimeType: true,
});
export const updateResumeSchema = createInsertSchema(resumesTable).pick({
    fullName: true,
    email: true,
    phone: true,
    location: true,
    summary: true,
    skills: true,
    experience: true,
    education: true,
    certifications: true,
    languages: true,
    isPublic: true,
}).partial();
export const publishResumeSchema = z.object({
    isPublic: z.boolean(),
});
