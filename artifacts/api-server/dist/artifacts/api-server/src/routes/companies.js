import { Router } from "express";
import { db } from "@workspace/db";
import { companiesTable } from "@workspace/db/schema";
import { ilike } from "drizzle-orm";
const router = Router();
// List all companies
router.get("/", async (req, res) => {
    try {
        const companies = await db.select().from(companiesTable);
        res.json(companies);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch companies" });
    }
});
// Get company by name
router.get("/:name", async (req, res) => {
    try {
        const { name } = req.params;
        const [company] = await db
            .select()
            .from(companiesTable)
            .where(ilike(companiesTable.name, name))
            .limit(1);
        if (!company) {
            return res.status(404).json({ error: "Company not found" });
        }
        return res.json(company);
    }
    catch (error) {
        return res.status(500).json({ error: "Failed to fetch company details" });
    }
});
export default router;
