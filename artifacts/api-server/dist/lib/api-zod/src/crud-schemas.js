import { z } from "zod";
// ============================================================================
// JOB SCHEMAS
// ============================================================================
export const createJobSchema = z.object({
    title: z.string().min(2, "Job title required").max(255),
    company: z.string().min(2, "Company name required").max(255),
    category: z.enum(["IT", "NON_IT", "STATE_GOVT", "CENTRAL_GOVT"]),
    location: z.string().min(2, "Location required").max(255),
    shift: z.enum(["Day", "Night", "Full_time", "Part_time"]),
    description: z.string().min(10, "Description required"),
    eligibility: z.string().min(10, "Eligibility criteria required"),
    applicationGuide: z.string().min(10, "Application guide required"),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
    hrEmail: z.string().email("Valid HR email required"),
    salary: z.string().min(1, "Salary information required"),
    openings: z.coerce.number().int().positive("Openings must be positive"),
    applicationLink: z.string().url().optional().default(""),
    official_url: z.string().url().optional().default(""),
});
export const updateJobSchema = createJobSchema.partial();
// ============================================================================
// COLLEGE SCHEMAS
// ============================================================================
export const createCollegeSchema = z.object({
    name: z.string().min(2, "College name required").max(255),
    location: z.string().min(2, "Location required").max(255),
    city: z.string().min(2, "City required").max(100),
    state: z.string().min(2, "State required").max(100),
    collegeCode: z.string().max(50).optional(),
    affiliation: z.string().max(255).optional(),
    about: z.string().optional(),
    websiteUrl: z.string().url().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
    establishedYear: z.coerce.number().int().min(1800).max(new Date().getFullYear()).optional(),
    facilities: z.array(z.string()).optional().default([]),
    qualification: z.string().optional(),
});
export const updateCollegeSchema = createCollegeSchema.partial();
// College Cutoff Schemas
export const createCollegeCutoffSchema = z.object({
    collegeId: z.number().int().positive("Valid college ID required"),
    courseName: z.string().min(2, "Course name required").max(255),
    category: z.string().max(50).default("General"),
    cutoffScore: z.coerce.number().int().min(0, "Cutoff score must be non-negative"),
    ugSeats: z.coerce.number().int().min(0).default(0),
    pgSeats: z.coerce.number().int().min(0).default(0),
    academicYear: z.string().max(20).default("2024-25"),
});
export const updateCollegeCutoffSchema = createCollegeCutoffSchema.partial().omit({ collegeId: true });
// College Fee Schemas
export const createCollegeFeeSchema = z.object({
    collegeId: z.number().int().positive("Valid college ID required"),
    courseType: z.enum(["UG", "PG"]),
    courseName: z.string().min(2, "Course name required").max(255),
    annualFees: z.string().optional(),
    totalFees: z.string().optional(),
    description: z.string().optional(),
    academicYear: z.string().max(20).default("2024-25"),
});
export const updateCollegeFeeSchema = createCollegeFeeSchema.partial().omit({ collegeId: true });
// ============================================================================
// EXAM SCHEMAS
// ============================================================================
export const createExamSchema = z.object({
    name: z.string().min(2, "Exam name required").max(100),
    fullName: z.string().min(2, "Full exam name required").max(255),
    description: z.string().min(10, "Description required"),
    examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
    applicationStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
    applicationEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
    applyLink: z.string().url("Valid URL required"),
    eligibility: z.string().min(10, "Eligibility criteria required"),
    applicationGuide: z.string().min(10, "Application guide required"),
    officialWebsite: z.string().url("Valid website URL required"),
});
export const updateExamSchema = createExamSchema.partial();
// ============================================================================
// STUDY MATERIAL SCHEMAS
// ============================================================================
export const createStudyMaterialSchema = z.object({
    examId: z.number().int().positive("Valid exam ID required"),
    title: z.string().min(2, "Title required").max(255),
    subject: z.string().min(2, "Subject required").max(100),
    type: z.enum(["PDF", "Video", "Notes", "Practice_Test"]),
    description: z.string().min(10, "Description required"),
    url: z.string().url("Valid URL required"),
});
export const updateStudyMaterialSchema = createStudyMaterialSchema.partial().omit({ examId: true });
// Query schemas
export const listQuerySchema = z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    limit: z.coerce.number().int().positive().optional().default(100),
    offset: z.coerce.number().int().min(0).optional().default(0),
});
