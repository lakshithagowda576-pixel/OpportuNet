import { Router } from "express";
import { db } from "@workspace/db";
import { examsTable, studyMaterialsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { GetExamParams } from "@workspace/api-zod";
import { normalizeExamRecord } from "../lib/normalize-exam";
const router = Router();
router.get("/exams", async (req, res) => {
    const exams = await db.select().from(examsTable);
    const formatted = exams.map((e) => normalizeExamRecord(e));
    res.json(formatted);
});
router.get("/exams/:id", async (req, res) => {
    const params = GetExamParams.parse({ id: parseInt(req.params.id) });
    const [exam] = await db.select().from(examsTable).where(eq(examsTable.id, params.id));
    if (!exam) {
        res.status(404).json({ error: "Exam not found" });
        return;
    }
    res.json(normalizeExamRecord(exam));
});
router.get("/study-materials", async (req, res) => {
    const materials = await db.select().from(studyMaterialsTable);
    const formatted = materials.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
    }));
    res.json(formatted);
});
export default router;
