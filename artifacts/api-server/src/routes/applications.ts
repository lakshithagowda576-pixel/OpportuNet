import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { applicationsTable, jobsTable, usersTable, examsTable } from "@workspace/db/schema";
import { and, eq, sql, desc } from "drizzle-orm";
import {
  CreateApplicationBody,
  UpdateApplicationStatusBody,
  UpdateApplicationStatusParams,
  GetJobApplicantCountParams,
  internalApplicationSchema,
} from "@workspace/api-zod";
import { buildDefaultHrEmail, normalizeJobRecord } from "../lib/normalize-job";
import { requireAuth } from "../middleware/requireAuth";
import { sendApplicationConfirmationEmail, sendPreRegistrationConfirmationEmail } from "../lib/email-service";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for both resume and photo
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'resume') {
      const allowedTypes = [".pdf", ".doc", ".docx"];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedTypes.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error("Only .pdf, .doc and .docx files are allowed for resume"));
      }
    } else if (file.fieldname === 'photo') {
      const allowedTypes = [".jpg", ".jpeg", ".png"];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedTypes.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error("Only .jpg, .jpeg and .png files are allowed for photo"));
      }
    } else {
      cb(new Error("Invalid file field"));
    }
  },
});

const router: IRouter = Router();

router.post("/applications/pre-register", async (req, res) => {
  const { name, email, password, jobId } = req.body;

  if (!email || !jobId) {
    res.status(400).json({ error: "Email and Job ID are required" });
    return;
  }

  try {
    // 1. Check if user already exists, if not create one (like a mini-registration)
    let [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    
    if (!user && name && password) {
      const passwordHash = await bcrypt.hash(password, 10);
      const [newUser] = await db.insert(usersTable).values({
        name,
        email,
        passwordHash,
        provider: "email",
        role: "user"
      }).returning();
      user = newUser;
      
      // Auto-login after pre-reg registration
      if (req.session) {
        req.session.userId = user.id;
        req.session.userRole = user.role;
      }
    }

    // 2. Create the application record with "Pre-Registered" status
    const [existing] = await db
      .select()
      .from(applicationsTable)
      .where(and(eq(applicationsTable.jobId, jobId), eq(applicationsTable.applicantEmail, email)));

    if (existing) {
      res.status(400).json({ error: "You are already pre-registered or applied for this job." });
      return;
    }

    // Verify user exists if ID is provided
    let finalUserId: number | null = user?.id || null;
    if (finalUserId) {
      const [userExists] = await db.select().from(usersTable).where(eq(usersTable.id, finalUserId));
      if (!userExists) finalUserId = null;
    }

    const [app] = await db.insert(applicationsTable).values({
      jobId,
      userId: finalUserId,
      applicantName: name || user?.name || email.split('@')[0],
      applicantEmail: email,
      status: "Pre-Registered" as any,
      acceptedTerms: true,
    }).returning();

    // 3. Send confirmation email
    sendPreRegistrationConfirmationEmail(app.id);

    res.status(201).json({ success: true, applicationId: app.id });
  } catch (err: any) {
    console.error("Pre-registration error details:", err);
    res.status(500).json({ error: err.message || "Pre-registration failed" });
  }
});

router.post("/applications/internal", async (req, res) => {
  try {
    const body = internalApplicationSchema.parse(req.body);
    const { jobId, fullName, email, password, age, qualification, yearsOfExperience, currentCompany, skills, resumeUrl, coverLetter, acceptedTerms } = body;

    // 1. Get or create user
    let user;
    const [existingUser] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (!existingUser) {
      const passwordHash = await bcrypt.hash(password, 10);
      const [newUser] = await db.insert(usersTable).values({
        name: fullName,
        email,
        passwordHash,
        provider: "email",
        role: "user"
      }).returning();
      user = newUser;
    } else {
      user = existingUser;
      // If user exists and password is provided, verify it (unless they are already logged in as this user)
      if (req.session?.userId !== user.id) {
        const match = await bcrypt.compare(password, user.passwordHash || "");
        if (!match) {
          res.status(401).json({ error: "Incorrect password for existing account." });
          return;
        }
      }
    }

    // Auto-login
    if (req.session) {
      req.session.userId = user.id;
      req.session.userRole = user.role;
    }

    // 2. Check if already applied
    const [existingApp] = await db
      .select()
      .from(applicationsTable)
      .where(and(eq(applicationsTable.jobId, jobId), eq(applicationsTable.applicantEmail, email)));

    if (existingApp) {
      res.status(400).json({ error: "You have already applied for this job." });
      return;
    }

    // 3. Create the application
    const [app] = await db.insert(applicationsTable).values({
      jobId,
      userId: user.id,
      applicantName: fullName,
      applicantEmail: email,
      age,
      qualification,
      yearsOfExperience: yearsOfExperience?.toString(),
      currentCompany,
      skills,
      resumeUrl,
      coverLetter,
      acceptedTerms: !!acceptedTerms,
      status: "Pending" as any
    }).returning();

    // Send confirmation email
    sendApplicationConfirmationEmail(app.id);

    res.status(201).json({ success: true, applicationId: app.id });
  } catch (err: any) {
    console.error("Internal application submission error:", err);
    res.status(500).json({ error: err.message || "Failed to submit application" });
  }
});

router.post("/applications/track", async (req, res) => {
  const { jobId, applicantName, applicantEmail } = req.body;

  if (!jobId) {
    res.status(400).json({ error: "Job ID is required" });
    return;
  }

  try {
    const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId));
    if (!job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    const user = await getSessionUser(req);
    const email = user?.email || applicantEmail || "guest@opportunet.com";
    const name = user?.name || applicantName || "Guest User";

    // Check if they already applied or tracked
    const [existing] = await db
      .select()
      .from(applicationsTable)
      .where(and(eq(applicationsTable.jobId, jobId), eq(applicationsTable.applicantEmail, email)));

    let app;
    if (existing) {
      // Just update status to Redirected if not already applied
      if (existing.status !== "Redirected") {
        [app] = await db.update(applicationsTable).set({ status: "Redirected" as any }).where(eq(applicationsTable.id, existing.id)).returning();
      } else {
        app = existing;
      }
    } else {
      [app] = await db
        .insert(applicationsTable)
        .values({
          jobId,
          userId: user?.id || null,
          applicantName: name,
          applicantEmail: email,
          status: "Redirected" as any,
          acceptedTerms: true,
        })
        .returning();
    }

    const normalizedJob = normalizeJobRecord(job);
    sendApplicationConfirmationEmail(app.id);

    res.json({
      trackingId: app.id,
      officialUrl: normalizedJob.official_url,
      official_url: normalizedJob.official_url,
      applicationLink: normalizedJob.applicationLink,
      hrEmail: normalizedJob.hrEmail || buildDefaultHrEmail(job.company),
      success: true
    });
  } catch (err: any) {
    console.error("Track application error:", err);
    res.status(500).json({ error: err.message || "Failed to track application" });
  }
});

router.post("/upload-resume", upload.single("resume"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No resume file provided" });
    return;
  }
  res.json({ url: `/uploads/${req.file.filename}` });
});

router.use("/applications", requireAuth);

async function getSessionUser(req: any) {
  if (!req.session?.userId) return null;
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId));
  return user;
}

router.get("/applications", async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized. Please log in." });
    return;
  }
  const isPrivileged = user.role === "admin" || user.role === "hr";
  const jobId = req.query.jobId ? parseInt(req.query.jobId as string) : null;

  // Build the base query
  let baseQuery = db
    .select({
      id: applicationsTable.id,
      jobId: applicationsTable.jobId,
      examId: applicationsTable.examId,
      course: applicationsTable.course,
      applicantName: applicationsTable.applicantName,
      applicantEmail: applicationsTable.applicantEmail,
      status: applicationsTable.status,
      appliedAt: applicationsTable.appliedAt,
      job: jobsTable,
      examName: examsTable.name,
    })
    .from(applicationsTable)
    .leftJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
    .leftJoin(examsTable, eq(applicationsTable.examId, examsTable.id)) as any;

  // Apply filtering based on conditions
  if (jobId) {
    baseQuery = baseQuery.where(eq(applicationsTable.jobId, jobId));
  } else if (!isPrivileged) {
    baseQuery = baseQuery.where(
      sql`${applicationsTable.userId} = ${user.id} OR ${applicationsTable.applicantEmail} = ${user.email}`
    );
  }

  // Apply ordering and execute query
  const apps = await baseQuery.orderBy(desc(applicationsTable.appliedAt));

  const formatted = apps.map((a: any) => ({
    ...a,
    appliedAt: a.appliedAt.toISOString(),
    job: a.job ? normalizeJobRecord(a.job) : undefined,
  }));
  res.json(formatted);
});

router.post("/applications", async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized. Please log in." });
    return;
  }

  const { jobId, examId, course, applicantName, applicantEmail, applicantPhone, applicantAddress, education, qualification, resumeUrl, acceptedTerms, coverLetter } = req.body;

  // Check if already applied
  const [existing] = await db
    .select()
    .from(applicationsTable)
    .where(
      and(
        jobId ? eq(applicationsTable.jobId, jobId) : eq(applicationsTable.examId, examId!),
        eq(applicationsTable.applicantEmail, user.email || applicantEmail)
      )
    );

  if (existing) {
    res.status(400).json({ error: "You have already applied for this." });
    return;
  }

  const [app] = await db
    .insert(applicationsTable)
    .values({
      jobId,
      examId,
      course,
      userId: user.id,
      applicantName: user.name || applicantName,
      applicantEmail: user.email || applicantEmail,
      applicantPhone,
      applicantAddress,
      education,
      qualification,
      resumeUrl,
      acceptedTerms,
      coverLetter,
    })
    .returning();

  const formattedApp = { ...app, appliedAt: app.appliedAt.toISOString() };
  res.status(201).json(formattedApp);

  // Send the specific email based on type
  sendApplicationConfirmationEmail(app.id);
});

router.post("/applications/direct", upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'photo', maxCount: 1 }
]) as any, async (req, res) => {
  try {
    const user = await getSessionUser(req);
    const body = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const resumeFile = files?.resume?.[0];
    const photoFile = files?.photo?.[0];

    // Check if already applied
    if (user || body.applicantEmail) {
      const [existing] = await db
        .select()
        .from(applicationsTable)
        .where(
          and(
            eq(applicationsTable.jobId, parseInt(body.jobId)),
            eq(applicationsTable.applicantEmail, user?.email || body.applicantEmail)
          )
        );

      if (existing) {
        return res.status(400).json({ error: "You have already applied for this job." });
      }
    }

    const applicationPayload = {
      jobId: parseInt(body.jobId),
      userId: user?.id || null,
      applicantName: body.applicantName,
      applicantEmail: body.applicantEmail,
      applicantPhone: body.applicantPhone,
      age: body.age ? parseInt(body.age) : null,
      college: body.college,
      currentLocation: body.currentLocation,
      yearsOfExperience: body.yearsOfExperience,
      currentCompany: body.currentCompany,
      resumeUrl: resumeFile ? `/uploads/${resumeFile.filename}` : (body.resumeUrl || null),
      photoUrl: photoFile ? `/uploads/${photoFile.filename}` : null,
      portfolioLink: body.portfolioLink,
      linkedinProfile: body.linkedinProfile,
      education: body.education,
      skills: body.skills,
      digitalSignature: body.digitalSignature,
      coverLetter: body.coverLetter,
      status: "Pending" as any,
      acceptedTerms: true,
    } as any;

    const [app] = await db
      .insert(applicationsTable)
      .values(applicationPayload)
      .returning();

    // Send confirmation email
    sendApplicationConfirmationEmail(app.id);

    return res.status(201).json({
      success: true,
      applicationId: app.id,
      message: "Application submitted successfully",
    });
  } catch (error: any) {
    console.error("Direct application error:", error);
    return res.status(500).json({ error: error.message || "Failed to submit application" });
  }
});

router.patch("/applications/:id/status", async (req, res) => {
  const params = UpdateApplicationStatusParams.parse({ id: parseInt(req.params.id) });
  const body = UpdateApplicationStatusBody.parse(req.body);

  const [updated] = await db
    .update(applicationsTable)
    .set({ status: body.status as any })
    .where(eq(applicationsTable.id, params.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  res.json({ ...updated, appliedAt: updated.appliedAt.toISOString() });
});

router.get("/jobs/:id/applicant-count", async (req, res) => {
  const params = GetJobApplicantCountParams.parse({ id: parseInt(req.params.id) });

  const apps = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.jobId, params.id));

  const byStatus: Record<string, number> = {
    Pending: 0,
    Reviewed: 0,
    Interview: 0,
    Offered: 0,
    Rejected: 0,
  };

  for (const app of apps) {
    byStatus[app.status]++;
  }

  res.json({
    jobId: params.id,
    total: apps.length,
    byStatus,
  });
});

// Track route removed and moved to the public section of this file

router.get("/applications/summary", async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized. Please log in." });
    return;
  }

  const isPrivileged = user.role === "admin" || user.role === "hr";
  const rows = await db
    .select({
      status: applicationsTable.status,
      category: jobsTable.category,
    })
    .from(applicationsTable)
    .leftJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
    .where(isPrivileged ? undefined : eq(applicationsTable.applicantEmail, user.email));

  const byStatus: Record<string, number> = {};
  const byCategory: Record<string, number> = {};

  for (const row of rows) {
    const status = row.status || "Pending";
    const category = row.category || "UNKNOWN";
    byStatus[status] = (byStatus[status] || 0) + 1;
    byCategory[category] = (byCategory[category] || 0) + 1;
  }

  res.json({
    total: rows.length,
    byStatus,
    byCategory,
  });
});

import { createMeeting } from "../../../../lib/integrations/video-meet";

router.post("/applications/:id/schedule-interview", async (req, res) => {
  const id = parseInt(req.params.id);
  const { provider, startTime, durationMinutes } = req.body;

  try {
    const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, id));
    if (!app) {
      res.status(404).json({ error: "Application not found" });
      return;
    }

    const meeting = await createMeeting(provider || "google_meet", new Date(startTime), durationMinutes || 30);
    
    // Update application status to Interview
    await db.update(applicationsTable)
      .set({ status: "Interview" as any, updatedAt: new Date() })
      .where(eq(applicationsTable.id, id));

    // In a real app, we would save the meeting link to the database
    // and send an email to the applicant.
    
    res.json({
      success: true,
      message: "Interview scheduled successfully",
      meeting,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
