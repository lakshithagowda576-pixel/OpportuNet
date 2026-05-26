import { Router } from "express";
import { db } from "@workspace/db";
import { messagesTable, jobsTable, usersTable } from "@workspace/db/schema";
import { desc, eq, or } from "drizzle-orm";
import { SendMessageBody } from "@workspace/api-zod";
import { z } from "zod";
import { requireAuth, requireAdminOrHR } from "../middleware/requireAuth";
import { buildDefaultHrEmail, normalizeJobRecord } from "../lib/normalize-job";
const router = Router();
router.use("/messages", requireAuth);
async function getSessionUser(req) {
    if (!req.session?.userId)
        return null;
    const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, req.session.userId));
    return user;
}
router.get("/messages", async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) {
        res.status(401).json({ error: "Unauthorized. Please log in." });
        return;
    }
    const isPrivileged = user.role === "admin" || user.role === "hr";
    const baseQuery = db
        .select({
        id: messagesTable.id,
        jobId: messagesTable.jobId,
        senderName: messagesTable.senderName,
        senderEmail: messagesTable.senderEmail,
        hrEmail: messagesTable.hrEmail,
        subject: messagesTable.subject,
        body: messagesTable.body,
        isReply: messagesTable.isReply,
        sentAt: messagesTable.sentAt,
        job: jobsTable,
    })
        .from(messagesTable)
        .leftJoin(jobsTable, eq(messagesTable.jobId, jobsTable.id));
    const msgs = isPrivileged
        ? await baseQuery.orderBy(desc(messagesTable.sentAt))
        : await baseQuery
            .where(or(eq(messagesTable.senderEmail, user.email), eq(messagesTable.hrEmail, user.email)))
            .orderBy(desc(messagesTable.sentAt));
    const formatted = msgs.map((m) => ({
        ...m,
        sentAt: m.sentAt.toISOString(),
        job: m.job ? normalizeJobRecord(m.job) : undefined,
    }));
    res.json(formatted);
});
router.post("/messages", async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) {
        res.status(401).json({ error: "Unauthorized. Please log in." });
        return;
    }
    const body = SendMessageBody.parse(req.body);
    const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, body.jobId));
    if (!job) {
        res.status(404).json({ error: "Job not found" });
        return;
    }
    const hrEmail = job.hrEmail || buildDefaultHrEmail(job.company);
    const [msg] = await db
        .insert(messagesTable)
        .values({
        jobId: body.jobId,
        senderName: user.name || body.senderName,
        senderEmail: user.email || body.senderEmail,
        hrEmail,
        subject: body.subject,
        body: body.body,
        isReply: false,
    })
        .returning();
    res.status(201).json({ ...msg, sentAt: msg.sentAt.toISOString() });
});
router.post("/messages/:id/reply", requireAdminOrHR, async (req, res) => {
    const params = z.object({ id: z.coerce.number().int().positive() }).parse(req.params);
    const body = z.object({ body: z.string().min(1), subject: z.string().optional() }).parse(req.body);
    const user = await getSessionUser(req);
    if (!user) {
        res.status(401).json({ error: "Unauthorized. Please log in." });
        return;
    }
    const [source] = await db
        .select()
        .from(messagesTable)
        .where(eq(messagesTable.id, params.id));
    if (!source) {
        res.status(404).json({ error: "Message not found." });
        return;
    }
    const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, source.jobId));
    const fallbackHrEmail = buildDefaultHrEmail(job?.company);
    const senderEmail = user.email || job?.hrEmail || fallbackHrEmail;
    const senderName = user.name || `HR - ${job?.company || "Team"}`;
    const subject = body.subject || (source.subject.startsWith("Re:") ? source.subject : `Re: ${source.subject}`);
    const [reply] = await db
        .insert(messagesTable)
        .values({
        jobId: source.jobId,
        senderName,
        senderEmail,
        hrEmail: source.senderEmail,
        subject,
        body: body.body,
        isReply: true,
    })
        .returning();
    res.status(201).json({ ...reply, sentAt: reply.sentAt.toISOString() });
});
export default router;
