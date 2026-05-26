import { pgTable, serial, text, integer, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { jobsTable } from "./jobs";
import { usersTable } from "./users";
import { examsTable } from "./exams";
export const applicationStatusEnum = pgEnum("application_status", [
    "Pre-Registered",
    "Pending",
    "Reviewed",
    "Interview",
    "Offered",
    "Rejected",
    "Redirected",
]);
export const applicationsTable = pgTable("applications", {
    id: serial("id").primaryKey(),
    jobId: integer("job_id")
        .references(() => jobsTable.id),
    examId: integer("exam_id")
        .references(() => examsTable.id),
    userId: integer("user_id").references(() => usersTable.id),
    applicantName: text("applicant_name").notNull(),
    applicantEmail: text("applicant_email").notNull(),
    applicantPhone: text("applicant_phone"),
    applicantAddress: text("applicant_address"),
    education: text("education"),
    qualification: text("qualification"),
    currentLocation: text("current_location"),
    yearsOfExperience: text("years_of_experience"),
    currentCompany: text("current_company"),
    age: integer("age"),
    resumeUrl: text("resume_url"),
    photoUrl: text("photo_url"),
    portfolioLink: text("portfolio_link"),
    linkedinProfile: text("linkedin_profile"),
    skills: text("skills"),
    acceptedTerms: boolean("accepted_terms").notNull().default(false),
    coverLetter: text("cover_letter"),
    course: text("course"), // For PGCET (MBA, MCA, M.Tech)
    status: applicationStatusEnum("status").notNull().default("Pending"),
    appliedAt: timestamp("applied_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const insertApplicationSchema = createInsertSchema(applicationsTable).omit({
    id: true,
    appliedAt: true,
    status: true,
});
