import { pgTable, foreignKey, serial, integer, text, timestamp, unique, boolean, varchar, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const applicationStatus = pgEnum("application_status", ['Pending', 'Reviewed', 'Interview', 'Offered', 'Rejected', 'Redirected'])
export const authProvider = pgEnum("auth_provider", ['email', 'google', 'github', 'facebook', 'linkedin'])
export const jobCategory = pgEnum("job_category", ['IT', 'NON_IT', 'STATE_GOVT', 'CENTRAL_GOVT'])
export const shiftType = pgEnum("shift_type", ['Day', 'Night', 'Full_time', 'Part_time'])
export const studyMaterialType = pgEnum("study_material_type", ['PDF', 'Video', 'Notes', 'Practice_Test'])
export const userRole = pgEnum("user_role", ['user', 'admin', 'hr'])


export const applications = pgTable("applications", {
	id: serial().primaryKey().notNull(),
	jobId: integer("job_id").notNull(),
	userId: integer("user_id"),
	applicantName: text("applicant_name").notNull(),
	applicantEmail: text("applicant_email").notNull(),
	applicantPhone: text("applicant_phone"),
	applicantAddress: text("applicant_address"),
	age: integer("age"),
	college: text("college"),
	education: text("education"),
	qualification: text("qualification"),
	skills: text("skills"),
	yearsOfExperience: text("years_of_experience"),
	currentCompany: text("current_company"),
	currentLocation: text("current_location"),
	resumeUrl: text("resume_url"),
	photoUrl: text("photo_url"),
	portfolioLink: text("portfolio_link"),
	linkedinProfile: text("linkedin_profile"),
	digitalSignature: text("digital_signature"),
	acceptedTerms: boolean("accepted_terms").default(false).notNull(),
	coverLetter: text("cover_letter"),
	status: applicationStatus().default('Pending').notNull(),
	appliedAt: timestamp("applied_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.jobId],
			foreignColumns: [jobs.id],
			name: "applications_job_id_jobs_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "applications_user_id_users_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	passwordHash: text("password_hash"),
	role: userRole().default('user').notNull(),
	provider: authProvider().default('email').notNull(),
	providerId: text("provider_id"),
	avatar: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const studyMaterials = pgTable("study_materials", {
	id: serial().primaryKey().notNull(),
	examId: integer("exam_id").notNull(),
	title: text().notNull(),
	subject: text().notNull(),
	type: studyMaterialType().notNull(),
	description: text().notNull(),
	url: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.examId],
			foreignColumns: [exams.id],
			name: "study_materials_exam_id_exams_id_fk"
		}),
]);

export const hrEmails = pgTable("hr_emails", {
	id: serial().primaryKey().notNull(),
	jobId: integer("job_id"),
	email: text().notNull(),
	label: text().default('Primary').notNull(),
	addedBy: text("added_by").default('admin').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.jobId],
			foreignColumns: [jobs.id],
			name: "hr_emails_job_id_jobs_id_fk"
		}),
]);

export const messages = pgTable("messages", {
	id: serial().primaryKey().notNull(),
	jobId: integer("job_id").notNull(),
	senderName: text("sender_name").notNull(),
	senderEmail: text("sender_email").notNull(),
	hrEmail: text("hr_email").notNull(),
	subject: text().notNull(),
	body: text().notNull(),
	isReply: boolean("is_reply").default(false).notNull(),
	sentAt: timestamp("sent_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.jobId],
			foreignColumns: [jobs.id],
			name: "messages_job_id_jobs_id_fk"
		}),
]);

export const session = pgTable("session", {
	sid: varchar().primaryKey().notNull(),
	sess: text().notNull(),
	expire: timestamp({ precision: 6, mode: 'string' }).notNull(),
});

export const exams = pgTable("exams", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	fullName: text("full_name").notNull(),
	description: text().notNull(),
	examDate: text("exam_date").notNull(),
	applicationStartDate: text("application_start_date").notNull(),
	applicationEndDate: text("application_end_date").notNull(),
	applyLink: text("apply_link").notNull(),
	eligibility: text().notNull(),
	applicationGuide: text("application_guide").notNull(),
	officialWebsite: text("official_website").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const jobs = pgTable("jobs", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	company: text().notNull(),
	category: jobCategory().notNull(),
	location: text().notNull(),
	shift: shiftType().notNull(),
	description: text().notNull(),
	eligibility: text().notNull(),
	applicationGuide: text("application_guide").notNull(),
	startDate: text("start_date").notNull(),
	endDate: text("end_date").notNull(),
	hrEmail: text("hr_email").notNull(),
	salary: text().notNull(),
	openings: integer().default(1).notNull(),
	applicationLink: text("application_link").default('').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	officialUrl: text("official_url").default('').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	briefIntroduction: text("brief_introduction").default('').notNull(),
	roleDescription: text("role_description").default('').notNull(),
	requiredSkills: text("required_skills").default('').notNull(),
	qualificationsAndExperience: text("qualifications_and_experience").default('').notNull(),
	stepsToApply: text("steps_to_apply").default('').notNull(),
});

export const examResults = pgTable("exam_results", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	examId: integer("exam_id").notNull(),
	score: integer().notNull(),
	totalMarks: integer("total_marks").default(600).notNull(),
	percentile: text(), // DECIMAL as string for compatibility
	submittedAt: timestamp("submitted_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "exam_results_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.examId],
			foreignColumns: [exams.id],
			name: "exam_results_exam_id_exams_id_fk"
		}),
]);

export const colleges = pgTable("colleges", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	location: text().notNull(),
	city: text().notNull(),
	state: text().default('Karnataka').notNull(),
	collegeCode: text("college_code"),
	affiliation: text(),
	about: text(),
	websiteUrl: text("website_url"),
	contactEmail: text("contact_email"),
	contactPhone: text("contact_phone"),
	establishedYear: integer("established_year"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("colleges_college_code_unique").on(table.collegeCode),
]);

export const collegeCutoffs = pgTable("college_cutoffs", {
	id: serial().primaryKey().notNull(),
	collegeId: integer("college_id").notNull(),
	courseName: text("course_name").notNull(),
	category: text().default('General').notNull(),
	cutoffScore: integer("cutoff_score").notNull(),
	ugSeats: integer("ug_seats"),
	pgSeats: integer("pg_seats"),
	academicYear: text("academic_year"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.collegeId],
			foreignColumns: [colleges.id],
			name: "college_cutoffs_college_id_colleges_id_fk"
		}),
]);

export const collegeFees = pgTable("college_fees", {
	id: serial().primaryKey().notNull(),
	collegeId: integer("college_id").notNull(),
	courseType: text("course_type").notNull(), // 'UG' or 'PG'
	courseName: text("course_name").notNull(),
	annualFees: text("annual_fees"), // DECIMAL as string
	totalFees: text("total_fees"), // DECIMAL as string
	description: text(),
	academicYear: text("academic_year"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.collegeId],
			foreignColumns: [colleges.id],
			name: "college_fees_college_id_colleges_id_fk"
		}),
]);
