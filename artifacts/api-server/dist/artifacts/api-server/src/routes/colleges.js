import { Router } from "express";
import { db } from "@workspace/db";
import { examResultsTable, collegesTable, collegeCutoffsTable, collegeFeesTable, usersTable } from "@workspace/db/schema";
import { eq, gte } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth";
const router = Router();
// Submit exam result
router.post("/results/submit", requireAuth, async (req, res) => {
    try {
        const user = req.session?.userId ?
            (await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)))[0]
            : null;
        if (!user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const { examId, score, totalMarks } = z.object({
            examId: z.coerce.number(),
            score: z.coerce.number().min(0),
            totalMarks: z.coerce.number().default(600),
        }).parse(req.body);
        // Calculate percentile
        const percentile = ((score / totalMarks) * 100).toFixed(2);
        const [result] = await db.insert(examResultsTable).values({
            userId: user.id,
            examId,
            score,
            totalMarks,
            percentile,
        }).returning();
        res.status(201).json({
            ...result,
            submittedAt: result.submittedAt.toISOString(),
            message: "Result submitted successfully! Check colleges matching your score."
        });
    }
    catch (error) {
        console.error("Submission Error:", error);
        res.status(400).json({ error: error.message });
    }
});
// Get user's exam results
router.get("/results", requireAuth, async (req, res) => {
    try {
        const userId = req.session?.userId;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const results = await db.select().from(examResultsTable).where(eq(examResultsTable.userId, userId));
        res.json(results.map((r) => ({ ...r, submittedAt: r.submittedAt.toISOString() })));
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get colleges matching exam score
router.get("/matching-score/:score", async (req, res) => {
    try {
        const score = parseInt(req.params.score);
        const course = req.query.course;
        // Get all colleges with cutoffs that match the score
        const matchingColleges = await db.select({
            collegeId: collegesTable.id,
            collegeName: collegesTable.name,
            collegeLocation: collegesTable.location,
            collegeCity: collegesTable.city,
            about: collegesTable.about,
            websiteUrl: collegesTable.websiteUrl,
            contactEmail: collegesTable.contactEmail,
            contactPhone: collegesTable.contactPhone,
            courseName: collegeCutoffsTable.courseName,
            category: collegeCutoffsTable.category,
            cutoffScore: collegeCutoffsTable.cutoffScore,
            ugSeats: collegeCutoffsTable.ugSeats,
            pgSeats: collegeCutoffsTable.pgSeats,
        }).from(collegesTable)
            .leftJoin(collegeCutoffsTable, eq(collegesTable.id, collegeCutoffsTable.collegeId))
            .where(gte(collegeCutoffsTable.cutoffScore, 0));
        // Filter on application side for <= comparison and optional course
        const filtered = matchingColleges.filter((c) => {
            const scoreMatch = c.cutoffScore && score >= c.cutoffScore;
            const courseMatch = !course || c.courseName === course;
            return scoreMatch && courseMatch;
        });
        res.json(filtered);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get college details including fees
router.get("/:collegeId/details", async (req, res) => {
    try {
        const collegeId = parseInt(req.params.collegeId);
        const [college] = await db.select().from(collegesTable).where(eq(collegesTable.id, collegeId));
        const cutoffs = await db.select().from(collegeCutoffsTable).where(eq(collegeCutoffsTable.collegeId, collegeId));
        const fees = await db.select().from(collegeFeesTable).where(eq(collegeFeesTable.collegeId, collegeId));
        if (!college) {
            res.status(404).json({ error: "College not found" });
            return;
        }
        res.json({
            ...college,
            createdAt: college.createdAt.toISOString(),
            cutoffs: cutoffs.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })),
            fees: fees.map((f) => ({ ...f, createdAt: f.createdAt.toISOString() })),
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get all colleges by city
router.get("/city/:city", async (req, res) => {
    try {
        const city = req.params.city;
        const collegeList = await db.select().from(collegesTable).where(eq(collegesTable.city, city));
        res.json(collegeList.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })));
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Admin: Add college (admin only)
router.post("", async (req, res) => {
    try {
        const { name, location, city, state, collegeCode, affiliation, about, websiteUrl, contactEmail, contactPhone, establishedYear } = z.object({
            name: z.string().min(1),
            location: z.string().min(1),
            city: z.string().min(1),
            state: z.string().default("Karnataka"),
            collegeCode: z.string().optional(),
            affiliation: z.string().optional(),
            about: z.string().optional(),
            websiteUrl: z.string().optional(),
            contactEmail: z.string().email().optional(),
            contactPhone: z.string().optional(),
            establishedYear: z.number().optional(),
        }).parse(req.body);
        const [college] = await db.insert(collegesTable).values({
            name,
            location,
            city,
            state,
            collegeCode,
            affiliation,
            about,
            websiteUrl,
            contactEmail,
            contactPhone,
            establishedYear,
        }).returning();
        res.status(201).json({ ...college, createdAt: college.createdAt.toISOString() });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// Admin: Add college cutoff (admin only)
router.post("/:collegeId/cutoffs", async (req, res) => {
    try {
        const collegeId = parseInt(req.params.collegeId);
        const { courseName, category, cutoffScore, ugSeats, pgSeats, academicYear } = z.object({
            courseName: z.string().min(1),
            category: z.string().default("General"),
            cutoffScore: z.number().min(0),
            ugSeats: z.number().optional(),
            pgSeats: z.number().optional(),
            academicYear: z.string().optional(),
        }).parse(req.body);
        const [cutoff] = await db.insert(collegeCutoffsTable).values({
            collegeId,
            courseName,
            category,
            cutoffScore,
            ugSeats,
            pgSeats,
            academicYear,
        }).returning();
        res.status(201).json({ ...cutoff, createdAt: cutoff.createdAt.toISOString() });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// Admin: Add college fees (admin only)
router.post("/:collegeId/fees", async (req, res) => {
    try {
        const collegeId = parseInt(req.params.collegeId);
        const { courseType, courseName, annualFees, totalFees, description, academicYear } = z.object({
            courseType: z.enum(["UG", "PG"]),
            courseName: z.string().min(1),
            annualFees: z.string().optional(),
            totalFees: z.string().optional(),
            description: z.string().optional(),
            academicYear: z.string().optional(),
        }).parse(req.body);
        const [fee] = await db.insert(collegeFeesTable).values({
            collegeId,
            courseType,
            courseName,
            annualFees,
            totalFees,
            description,
            academicYear,
        }).returning();
        res.status(201).json({ ...fee, createdAt: fee.createdAt.toISOString() });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
export default router;
