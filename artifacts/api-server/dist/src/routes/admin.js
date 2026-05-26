import { Router } from "express";
import { db } from "@workspace/db";
import { applicationsTable, jobsTable, hrEmailsTable, usersTable, collegesTable, collegeCutoffsTable, collegeFeesTable, examsTable, studyMaterialsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdmin, requireAdminOrHR } from "../middleware/requireAuth";
import { z } from "zod";
import { sendEmail } from "../lib/mailer";
import { normalizeJobRecord } from "../lib/normalize-job";
import { createJobSchema, updateJobSchema, createCollegeSchema, updateCollegeSchema, createCollegeCutoffSchema, updateCollegeCutoffSchema, createCollegeFeeSchema, updateCollegeFeeSchema, createExamSchema, updateExamSchema, createStudyMaterialSchema, updateStudyMaterialSchema } from "@workspace/api-zod";
const router = Router();
// General admin/hr routes
router.use("/applications", requireAdminOrHR);
router.use("/send-email", requireAdminOrHR);
router.use("/jobs", requireAdminOrHR);
router.use("/stats", requireAdminOrHR);
// Strictly admin routes
router.use("/hr-emails", requireAdmin);
router.use("/users", requireAdmin);
// Get all applications (admin)
router.get("/applications", async (req, res) => {
    const apps = await db.select({
        id: applicationsTable.id,
        jobId: applicationsTable.jobId,
        applicantName: applicationsTable.applicantName,
        applicantEmail: applicationsTable.applicantEmail,
        coverLetter: applicationsTable.coverLetter,
        status: applicationsTable.status,
        appliedAt: applicationsTable.appliedAt,
        jobTitle: jobsTable.title,
        company: jobsTable.company,
        hrEmail: jobsTable.hrEmail,
    }).from(applicationsTable)
        .leftJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
        .orderBy(desc(applicationsTable.appliedAt));
    res.json(apps.map((a) => ({ ...a, appliedAt: a.appliedAt.toISOString() })));
});
// Update application status (admin)
router.patch("/applications/:id/status", async (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = z.object({
        status: z.enum(["Pre-Registered", "Pending", "Reviewed", "Interview", "Offered", "Rejected"])
    }).parse(req.body);
    const [updated] = await db.update(applicationsTable)
        .set({ status })
        .where(eq(applicationsTable.id, id))
        .returning();
    if (!updated) {
        res.status(404).json({ error: "Application not found" });
        return;
    }
    const [appWithJob] = await db.select({
        applicantName: applicationsTable.applicantName,
        applicantEmail: applicationsTable.applicantEmail,
        jobTitle: jobsTable.title,
        company: jobsTable.company
    }).from(applicationsTable)
        .leftJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
        .where(eq(applicationsTable.id, id));
    if (!appWithJob) {
        res.status(404).json({ error: "Application details not found" });
        return;
    }
    // Send automated email for specific status changes
    if (["Pending", "Reviewed", "Interview", "Offered", "Rejected"].includes(status)) {
        try {
            const subject = `Application Status Updated: ${status} - OpportuNet`;
            let body = "";
            switch (status) {
                case "Pending":
                    body = `Hi ${appWithJob.applicantName},\n\nYour application for ${appWithJob.jobTitle || 'the position'} at ${appWithJob.company || 'our company'} is currently being processed and is under review. We will contact you once there is an update.`;
                    break;
                case "Reviewed":
                    body = `Hi ${appWithJob.applicantName},\n\nYour application for ${appWithJob.jobTitle || 'the position'} at ${appWithJob.company || 'our company'} has been reviewed. Our team is considering your profile for the next steps.`;
                    break;
                case "Interview":
                    body = `Hi ${appWithJob.applicantName},\n\nGreat news! You have been shortlisted for an interview for the position of ${appWithJob.jobTitle || 'the position'} at ${appWithJob.company || 'our company'}. Please wait for our HR team to reach out with the schedule.`;
                    break;
                case "Offered":
                    body = `Hi ${appWithJob.applicantName},\n\nCongratulations! We are pleased to extend an offer for the position of ${appWithJob.jobTitle || 'the position'} at ${appWithJob.company || 'our company'}. Please check your portal or wait for a formal offer letter via email.`;
                    break;
                case "Rejected":
                    body = `Hi ${appWithJob.applicantName},\n\nThank you for your interest in joining ${appWithJob.company || 'our company'}. After careful consideration, we regret to inform you that we will not be moving forward with your application at this time. We wish you the best in your future endeavors.`;
                    break;
            }
            await sendEmail({
                to: appWithJob.applicantEmail,
                subject,
                body,
                applicantName: appWithJob.applicantName,
            });
            console.log(`Automated ${status} email sent to ${appWithJob.applicantEmail}`);
        }
        catch (err) {
            console.error(`Failed to send automated email:`, err);
        }
    }
    res.json({ ...updated, appliedAt: updated.appliedAt.toISOString() });
});
// Send email to applicant (admin)
router.post("/send-email", async (req, res) => {
    const payload = z.object({
        to: z.string().email(),
        subject: z.string().min(1),
        body: z.string().min(1),
        applicantName: z.string().optional(),
    }).parse(req.body);
    try {
        const result = await sendEmail(payload);
        res.json(result);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Get all HR emails
router.get("/hr-emails", async (req, res) => {
    const emails = await db.select({
        id: hrEmailsTable.id,
        jobId: hrEmailsTable.jobId,
        email: hrEmailsTable.email,
        label: hrEmailsTable.label,
        addedBy: hrEmailsTable.addedBy,
        createdAt: hrEmailsTable.createdAt,
        jobTitle: jobsTable.title,
        company: jobsTable.company,
    }).from(hrEmailsTable)
        .leftJoin(jobsTable, eq(hrEmailsTable.jobId, jobsTable.id))
        .orderBy(desc(hrEmailsTable.createdAt));
    res.json(emails.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() })));
});
// Add HR email (admin)
router.post("/hr-emails", async (req, res) => {
    const { jobId, email, label } = z.object({
        jobId: z.number().optional(),
        email: z.string().email(),
        label: z.string().optional().default("Primary"),
    }).parse(req.body);
    const adminUser = req.session?.userId ? `admin-${req.session.userId}` : "admin";
    const [created] = await db.insert(hrEmailsTable).values({
        jobId: jobId ?? null,
        email, label,
        addedBy: adminUser,
    }).returning();
    res.status(201).json({ ...created, createdAt: created.createdAt.toISOString() });
});
// Delete HR email (admin)
router.delete("/hr-emails/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    await db.delete(hrEmailsTable).where(eq(hrEmailsTable.id, id));
    res.json({ success: true });
});
// Get all users (admin)
router.get("/users", async (req, res) => {
    const users = await db.select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        role: usersTable.role,
        provider: usersTable.provider,
        createdAt: usersTable.createdAt,
    }).from(usersTable).orderBy(desc(usersTable.createdAt));
    res.json(users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })));
});
// Get all jobs (admin)
router.get("/jobs", async (req, res) => {
    const jobs = await db.select().from(jobsTable).orderBy(desc(jobsTable.id));
    res.json(jobs.map((j) => normalizeJobRecord(j)));
});
// Dashboard stats (admin)
router.get("/stats", async (req, res) => {
    const allApps = await db.select().from(applicationsTable);
    const allJobs = await db.select().from(jobsTable);
    const allUsers = await db.select().from(usersTable);
    const allHrEmails = await db.select().from(hrEmailsTable);
    const appsWithCategory = await db
        .select({
        status: applicationsTable.status,
        category: jobsTable.category,
    })
        .from(applicationsTable)
        .leftJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id));
    const byStatus = {};
    const byCategory = {};
    for (const row of appsWithCategory) {
        byStatus[row.status] = (byStatus[row.status] || 0) + 1;
        const category = row.category || "UNKNOWN";
        byCategory[category] = (byCategory[category] || 0) + 1;
    }
    res.json({
        totalApplications: allApps.length,
        totalJobs: allJobs.length,
        totalUsers: allUsers.length,
        totalHrEmails: allHrEmails.length,
        pendingApplications: allApps.filter((a) => a.status === "Pending").length,
        offeredApplications: allApps.filter((a) => a.status === "Offered").length,
        rejectedApplications: allApps.filter((a) => a.status === "Rejected").length,
        byStatus,
        byCategory,
    });
});
// ============================================================================
// JOBS CRUD ENDPOINTS
// ============================================================================
// Create job
router.post("/jobs/create", async (req, res) => {
    try {
        const data = createJobSchema.parse(req.body);
        const [job] = await db.insert(jobsTable).values(data).returning();
        res.status(201).json(normalizeJobRecord(job));
    }
    catch (err) {
        res.status(400).json({ error: err.message || "Failed to create job" });
    }
});
// Update job
router.put("/jobs/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const data = updateJobSchema.parse(req.body);
        const [job] = await db.update(jobsTable).set({ ...data, updatedAt: new Date() }).where(eq(jobsTable.id, id)).returning();
        if (!job) {
            res.status(404).json({ error: "Job not found" });
            return;
        }
        res.json(normalizeJobRecord(job));
    }
    catch (err) {
        res.status(400).json({ error: err.message || "Failed to update job" });
    }
});
// Delete job
router.delete("/jobs/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await db.delete(jobsTable).where(eq(jobsTable.id, id));
        res.json({ success: true, message: "Job deleted successfully" });
    }
    catch (err) {
        res.status(400).json({ error: err.message || "Failed to delete job" });
    }
});
// ============================================================================
// COLLEGES CRUD ENDPOINTS
// ============================================================================
// Create college
router.post("/colleges/create", async (req, res) => {
    try {
        const data = createCollegeSchema.parse(req.body);
        const [college] = await db.insert(collegesTable).values(data).returning();
        res.status(201).json(college);
    }
    catch (err) {
        res.status(400).json({ error: err.message || "Failed to create college" });
    }
});
// Update college
router.put("/colleges/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const data = updateCollegeSchema.parse(req.body);
        const [college] = await db.update(collegesTable).set({ ...data, updatedAt: new Date() }).where(eq(collegesTable.id, id)).returning();
        if (!college) {
            res.status(404).json({ error: "College not found" });
            return;
        }
        res.json(college);
    }
    catch (err) {
        res.status(400).json({ error: err.message || "Failed to update college" });
    }
});
// Delete college
router.delete("/colleges/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        // Delete related cutoffs and fees first
        await db.delete(collegeCutoffsTable).where(eq(collegeCutoffsTable.collegeId, id));
        await db.delete(collegeFeesTable).where(eq(collegeFeesTable.collegeId, id));
        await db.delete(collegesTable).where(eq(collegesTable.id, id));
        res.json({ success: true, message: "College and related data deleted successfully" });
    }
    catch (err) {
        res.status(400).json({ error: err.message || "Failed to delete college" });
    }
});
// Get colleges with cutoffs and fees
router.get("/colleges", async (req, res) => {
    try {
        const colleges = await db.select().from(collegesTable).orderBy(desc(collegesTable.id));
        const collegesWithDetails = await Promise.all(colleges.map(async (college) => {
            const cutoffs = await db.select().from(collegeCutoffsTable).where(eq(collegeCutoffsTable.collegeId, college.id));
            const fees = await db.select().from(collegeFeesTable).where(eq(collegeFeesTable.collegeId, college.id));
            return { ...college, cutoffs, fees };
        }));
        res.json(collegesWithDetails);
    }
    catch (err) {
        res.status(400).json({ error: err.message || "Failed to fetch colleges" });
    }
});
// Create college cutoff
router.post("/college-cutoffs/create", async (req, res) => {
    try {
        const data = createCollegeCutoffSchema.parse(req.body);
        const [cutoff] = await db.insert(collegeCutoffsTable).values(data).returning();
        res.status(201).json(cutoff);
    }
    catch (err) {
        res.status(400).json({ error: err.message || "Failed to create college cutoff" });
    }
});
// Update college cutoff
router.put("/college-cutoffs/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const data = updateCollegeCutoffSchema.parse(req.body);
        const [cutoff] = await db.update(collegeCutoffsTable).set(data).where(eq(collegeCutoffsTable.id, id)).returning();
        if (!cutoff) {
            res.status(404).json({ error: "College cutoff not found" });
            return;
        }
        res.json(cutoff);
    }
    catch (err) {
        res.status(400).json({ error: err.message || "Failed to update college cutoff" });
    }
});
// Delete college cutoff
router.delete("/college-cutoffs/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await db.delete(collegeCutoffsTable).where(eq(collegeCutoffsTable.id, id));
        res.json({ success: true, message: "College cutoff deleted successfully" });
    }
    catch (err) {
        res.status(400).json({ error: err.message || "Failed to delete college cutoff" });
    }
});
// Create college fee
router.post("/college-fees/create", async (req, res) => {
    try {
        const data = createCollegeFeeSchema.parse(req.body);
        const [fee] = await db.insert(collegeFeesTable).values(data).returning();
        res.status(201).json(fee);
    }
    catch (err) {
        res.status(400).json({ error: err.message || "Failed to create college fee" });
    }
});
// Update college fee
router.put("/college-fees/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const data = updateCollegeFeeSchema.parse(req.body);
        const [fee] = await db.update(collegeFeesTable).set(data).where(eq(collegeFeesTable.id, id)).returning();
        if (!fee) {
            res.status(404).json({ error: "College fee not found" });
            return;
        }
        res.json(fee);
    }
    catch (err) {
        res.status(400).json({ error: err.message || "Failed to update college fee" });
    }
});
// Delete college fee
router.delete("/college-fees/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await db.delete(collegeFeesTable).where(eq(collegeFeesTable.id, id));
        res.json({ success: true, message: "College fee deleted successfully" });
    }
    catch (err) {
        res.status(400).json({ error: err.message || "Failed to delete college fee" });
    }
});
// ============================================================================
// EXAMS CRUD ENDPOINTS
// ============================================================================
// Create exam
router.post("/exams/create", async (req, res) => {
    try {
        const data = createExamSchema.parse(req.body);
        const [exam] = await db.insert(examsTable).values(data).returning();
        res.status(201).json(exam);
    }
    catch (err) {
        res.status(400).json({ error: err.message || "Failed to create exam" });
    }
});
// Update exam
router.put("/exams/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const data = updateExamSchema.parse(req.body);
        const [exam] = await db.update(examsTable).set(data).where(eq(examsTable.id, id)).returning();
        if (!exam) {
            res.status(404).json({ error: "Exam not found" });
            return;
        }
        res.json(exam);
    }
    catch (err) {
        res.status(400).json({ error: err.message || "Failed to update exam" });
    }
});
// Delete exam
router.delete("/exams/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        // Delete related study materials first
        await db.delete(studyMaterialsTable).where(eq(studyMaterialsTable.examId, id));
        await db.delete(examsTable).where(eq(examsTable.id, id));
        res.json({ success: true, message: "Exam and related study materials deleted successfully" });
    }
    catch (err) {
        res.status(400).json({ error: err.message || "Failed to delete exam" });
    }
});
// Get exams
router.get("/exams", async (req, res) => {
    try {
        const exams = await db.select().from(examsTable).orderBy(desc(examsTable.id));
        const examsWithMaterials = await Promise.all(exams.map(async (exam) => {
            const materials = await db.select().from(studyMaterialsTable).where(eq(studyMaterialsTable.examId, exam.id));
            return { ...exam, materials };
        }));
        res.json(examsWithMaterials);
    }
    catch (err) {
        res.status(400).json({ error: err.message || "Failed to fetch exams" });
    }
});
// ============================================================================
// STUDY MATERIALS CRUD ENDPOINTS
// ============================================================================
// Create study material
router.post("/study-materials/create", async (req, res) => {
    try {
        const data = createStudyMaterialSchema.parse(req.body);
        const [material] = await db.insert(studyMaterialsTable).values(data).returning();
        res.status(201).json(material);
    }
    catch (err) {
        res.status(400).json({ error: err.message || "Failed to create study material" });
    }
});
// Update study material
router.put("/study-materials/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const data = updateStudyMaterialSchema.parse(req.body);
        const [material] = await db.update(studyMaterialsTable).set(data).where(eq(studyMaterialsTable.id, id)).returning();
        if (!material) {
            res.status(404).json({ error: "Study material not found" });
            return;
        }
        res.json(material);
    }
    catch (err) {
        res.status(400).json({ error: err.message || "Failed to update study material" });
    }
});
// Delete study material
router.delete("/study-materials/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await db.delete(studyMaterialsTable).where(eq(studyMaterialsTable.id, id));
        res.json({ success: true, message: "Study material deleted successfully" });
    }
    catch (err) {
        res.status(400).json({ error: err.message || "Failed to delete study material" });
    }
});
export default router;
