import { Router, type IRouter } from "express";
import fs from "node:fs";
import { pool } from "@workspace/db";

const router: IRouter = Router();

router.get("/health", async (_req, res) => {
  const start = Date.now();
  const result: any = { status: "ok", checks: {} };

  // DB connectivity check
  try {
    const t0 = Date.now();
    await pool.query("SELECT 1");
    const t1 = Date.now();
    result.checks.db = { ok: true, latencyMs: t1 - t0 };
  } catch (err: any) {
    result.status = "degraded";
    result.checks.db = { ok: false, error: String(err?.message ?? err) };
  }

  // Uploads directory check
  try {
    const uploadsExists = fs.existsSync("uploads");
    result.checks.uploads = { ok: uploadsExists };
    if (!uploadsExists) {
      result.status = "degraded";
    }
  } catch (err: any) {
    result.status = "degraded";
    result.checks.uploads = { ok: false, error: String(err?.message ?? err) };
  }

  // SMTP config presence check
  const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  result.checks.smtp = { configured: smtpConfigured };
  if (!smtpConfigured) result.status = "degraded";

  result.uptimeMs = process.uptime() * 1000;
  result.elapsedMs = Date.now() - start;

  res.json(result);
});

export default router;
