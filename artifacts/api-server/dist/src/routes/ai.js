import { Router } from "express";
import { db } from "@workspace/db";
import { jobsTable, resumesTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth";
const router = Router();
// Get job recommendations for the current user
router.get("/recommendations", requireAuth, async (req, res) => {
    const userId = req.session?.userId;
    if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    try {
        // 1. Get user's latest resume/profile
        const [resume] = await db.select().from(resumesTable).where(eq(resumesTable.userId, userId)).orderBy(desc(resumesTable.createdAt));
        // 2. Fetch all active jobs
        const allJobs = await db.select().from(jobsTable).orderBy(desc(jobsTable.createdAt));
        if (!resume) {
            // If no resume, just return latest jobs as "recommended"
            res.json(allJobs.slice(0, 5));
            return;
        }
        // 3. Simple Recommendation Logic (Keyword Matching)
        // In a real app, this would use embeddings (OpenAI) or a dedicated recommendation engine
        const userSkills = resume.skills || [];
        const skillNames = userSkills.map(s => s.name.toLowerCase());
        const userSummary = (resume.summary || "").toLowerCase();
        const scoredJobs = allJobs.map(job => {
            let score = 0;
            const jobText = (job.title + " " + job.description + " " + job.eligibility).toLowerCase();
            // Score based on skills
            skillNames.forEach(skill => {
                if (jobText.includes(skill))
                    score += 10;
            });
            // Score based on summary keywords
            const summaryKeywords = userSummary.split(/\s+/).filter(w => w.length > 4);
            summaryKeywords.forEach(word => {
                if (jobText.includes(word))
                    score += 2;
            });
            // Bonus for featured jobs
            if (job.isFeatured)
                score += 5;
            return { ...job, matchScore: score };
        });
        // 4. Sort by score and return top 5
        const recommendations = scoredJobs
            .filter(j => j.matchScore > 0)
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 5);
        // If not enough recommendations, pad with latest jobs
        if (recommendations.length < 3) {
            const remainingCount = 5 - recommendations.length;
            const latestJobs = allJobs.filter(j => !recommendations.find(r => r.id === j.id)).slice(0, remainingCount);
            res.json([...recommendations, ...latestJobs]);
        }
        else {
            res.json(recommendations);
        }
    }
    catch (err) {
        console.error("Recommendation error:", err);
        res.status(500).json({ error: err.message });
    }
});
export default router;
