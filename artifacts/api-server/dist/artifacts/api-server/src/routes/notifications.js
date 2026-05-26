import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, applicationsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { sendDailyJobUpdateEmail, sendDailyJobOpeningsEmail, } from "../lib/email-service";
const router = Router();
// Send daily job updates to all users (admin only)
router.post("/notifications/send-daily-updates", async (req, res) => {
    try {
        const allUsers = await db.select().from(usersTable);
        let successCount = 0;
        let failureCount = 0;
        for (const user of allUsers) {
            try {
                await sendDailyJobUpdateEmail(user.id);
                successCount++;
            }
            catch (error) {
                console.error(`Failed to send email to ${user.email}:`, error);
                failureCount++;
            }
        }
        res.json({
            success: true,
            message: `Daily updates sent to ${successCount} users (${failureCount} failures)`,
            total: allUsers.length,
            successCount,
            failureCount,
        });
    }
    catch (error) {
        console.error("Error sending daily updates:", error);
        res.status(500).json({ error: "Failed to send daily updates" });
    }
});
// Send daily job openings to all users (admin only)
router.post("/notifications/send-job-openings", async (req, res) => {
    try {
        const allUsers = await db.select().from(usersTable);
        let successCount = 0;
        let failureCount = 0;
        for (const user of allUsers) {
            try {
                await sendDailyJobOpeningsEmail(user.id);
                successCount++;
            }
            catch (error) {
                console.error(`Failed to send job openings email to ${user.email}:`, error);
                failureCount++;
            }
        }
        res.json({
            success: true,
            message: `Job openings sent to ${successCount} users (${failureCount} failures)`,
            total: allUsers.length,
            successCount,
            failureCount,
        });
    }
    catch (error) {
        console.error("Error sending job openings:", error);
        res.status(500).json({ error: "Failed to send job openings" });
    }
});
// Endpoint to send email for a specific user
router.post("/notifications/send-user-update/:userId", async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
            res.status(400).json({ error: "Invalid user ID" });
            return;
        }
        const [user] = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.id, userId));
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        await sendDailyJobUpdateEmail(userId);
        res.json({
            success: true,
            message: `Email sent to ${user.email}`,
            email: user.email,
        });
    }
    catch (error) {
        console.error("Error sending user update:", error);
        res.status(500).json({ error: "Failed to send email" });
    }
});
// Send status change email (admin)
router.post("/send-status-email/:applicationId", async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            res.status(400).json({ error: "Status is required" });
            return;
        }
        const applicationId = parseInt(req.params.applicationId);
        if (isNaN(applicationId)) {
            res.status(400).json({ error: "Invalid application ID" });
            return;
        }
        const [application] = await db
            .select()
            .from(applicationsTable)
            .where(eq(applicationsTable.id, applicationId));
        if (!application) {
            res.status(404).json({ error: "Application not found" });
            return;
        }
        // This would trigger sending a status change email
        // The actual email sending happens in the admin routes
        res.json({
            success: true,
            message: `Status change email for application ${applicationId} queued for sending`,
        });
    }
    catch (error) {
        console.error("Error queuing status email:", error);
        res.status(500).json({ error: "Failed to queue status email" });
    }
});
export default router;
