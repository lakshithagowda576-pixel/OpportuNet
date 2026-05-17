import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { jobsTable, companyBrandingTable, externalLinksTable } from "@workspace/db/schema";
import { eq, like, or, and } from "drizzle-orm";
import { ListJobsQueryParams, GetJobParams } from "@workspace/api-zod";
import { normalizeJobRecord } from "../lib/normalize-job";

const router: IRouter = Router();

router.get("/jobs", async (req, res) => {
  const query = ListJobsQueryParams.parse(req.query);

  const conditions = [];

  if (query.category) {
    conditions.push(eq(jobsTable.category, query.category as any));
  }

  if (query.search) {
    const term = `%${query.search}%`;
    conditions.push(
      or(
        like(jobsTable.title, term),
        like(jobsTable.company, term),
        like(jobsTable.location, term),
        like(jobsTable.description, term),
        like(jobsTable.eligibility, term),
        like(jobsTable.salary, term)
      )
    );
  }

  const queryBuilder = db
    .select({
      job: jobsTable,
      branding: companyBrandingTable,
      externalLink: externalLinksTable,
    })
    .from(jobsTable)
    .leftJoin(companyBrandingTable, eq(jobsTable.company, companyBrandingTable.companyName))
    .leftJoin(externalLinksTable, eq(jobsTable.id, externalLinksTable.jobId));

  const results =
    conditions.length === 0
      ? await queryBuilder
      : conditions.length === 1
      ? await queryBuilder.where(conditions[0])
      : await queryBuilder.where(and(...conditions));

  const formatted = results.map(({ job, branding, externalLink }) => {
    const norm = normalizeJobRecord(job);
    return {
      ...norm,
      branding: branding || null,
      externalLink: externalLink || null,
      applicationLink: (externalLink?.isActive && externalLink.officialUrl) || norm.applicationLink,
      official_url: (externalLink?.isActive && externalLink.officialUrl) || norm.official_url,
    };
  });
  res.json(formatted);
});

router.get("/jobs/:id", async (req, res) => {
  const params = GetJobParams.parse({ id: parseInt(req.params.id) });
  const [result] = await db
    .select({
      job: jobsTable,
      branding: companyBrandingTable,
      externalLink: externalLinksTable,
    })
    .from(jobsTable)
    .leftJoin(companyBrandingTable, eq(jobsTable.company, companyBrandingTable.companyName))
    .leftJoin(externalLinksTable, eq(jobsTable.id, externalLinksTable.jobId))
    .where(eq(jobsTable.id, params.id));

  if (!result) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const norm = normalizeJobRecord(result.job);
  res.json({
    ...norm,
    branding: result.branding || null,
    externalLink: result.externalLink || null,
    applicationLink: (result.externalLink?.isActive && result.externalLink.officialUrl) || norm.applicationLink,
    official_url: (result.externalLink?.isActive && result.externalLink.officialUrl) || norm.official_url,
  });
});

router.post("/favorites", (req, res) => {
  res.json({ success: true });
});

export default router;

