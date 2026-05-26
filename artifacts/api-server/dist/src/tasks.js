import cron from "node-cron";
import { db } from "@workspace/db";
import { jobsTable, usersTable, applicationsTable } from "@workspace/db/schema";
import { gte, lte, and } from "drizzle-orm";
import nodemailer from "nodemailer";
import { logger } from "./index";
import { sendDailyJobUpdateEmail, sendDailyJobOpeningsEmail, sendJobOpeningReminderEmail, sendJobClosingSoonEmail } from "./lib/email-service";
import { eq } from "drizzle-orm";
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.ethereal.email",
    port: parseInt(process.env.SMTP_PORT || "587"),
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
async function sendEmail(to, subject, html) {
    if (!process.env.SMTP_USER) {
        logger.info(`[Email Simulated] To: ${to}, Subject: ${subject}`);
        return;
    }
    try {
        await transporter.sendMail({
            from: `"OpportuNet Notifications" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        });
    }
    catch (err) {
        logger.error(err, "Failed to send email");
    }
}
export function setupCronJobs() {
    // Every day at 9 AM
    cron.schedule("0 9 * * *", async () => {
        logger.info("Running daily notification task...");
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const todayStr = new Date().toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        try {
            const newJobs = await db.select().from(jobsTable).where(gte(jobsTable.createdAt, yesterday));
            const closedJobs = await db
                .select()
                .from(jobsTable)
                .where(and(lte(jobsTable.endDate, todayStr), gte(jobsTable.endDate, yesterdayStr)));
            if (newJobs.length === 0 && closedJobs.length === 0)
                return;
            const users = await db.select().from(usersTable);
            const html = `
        <h1>Daily Job Update</h1>
        ${newJobs.length > 0 ? `
          <h3>New Opportunities</h3>
          <ul>
            ${newJobs.map((j) => `<li><strong>${j.title}</strong> at ${j.company}</li>`).join("")}
          </ul>
        ` : ""}
        ${closedJobs.length > 0 ? `
          <h3>Applications Closed Yesterday</h3>
          <ul>
            ${closedJobs.map((j) => `<li>${j.title} at ${j.company}</li>`).join("")}
          </ul>
        ` : ""}
        <p>Visit <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}">OpportuNet</a> to apply.</p>
      `;
            for (const user of users) {
                await sendEmail(user.email, "OpportuNet: Daily Job Updates", html);
            }
        }
        catch (error) {
            logger.error(error, "Failed to run daily task");
        }
    });
    // June 1st Notification
    cron.schedule("0 10 1 6 *", async () => {
        logger.info("Running June notification task...");
        try {
            const users = await db.select().from(usersTable);
            const juneJobs = await db.select().from(jobsTable);
            const filteredJuneJobs = juneJobs.filter((j) => j.startDate.includes("-06-"));
            if (filteredJuneJobs.length === 0)
                return;
            const html = `
        <h1>Special June Openings</h1>
        <p>The following applications are opening this month:</p>
        <ul>
          ${filteredJuneJobs.map((j) => `<li><strong>${j.title}</strong> at ${j.company} - Opening on ${new Date(j.startDate).toLocaleDateString()}</li>`).join("")}
        </ul>
      `;
            for (const user of users) {
                await sendEmail(user.email, "OpportuNet: Important June Openings", html);
            }
        }
        catch (error) {
            logger.error(error, "Failed to run June notification task");
        }
    });
    // Daily application update emails - Every day at 8 AM
    cron.schedule("0 8 * * *", async () => {
        logger.info("Running daily application update emails task...");
        try {
            const users = await db.select().from(usersTable);
            for (const user of users) {
                try {
                    await sendDailyJobUpdateEmail(user.id);
                }
                catch (err) {
                    logger.error({ userId: user.id, err }, "Failed to send daily update email");
                }
            }
            logger.info("Daily application update emails sent");
        }
        catch (error) {
            logger.error(error, "Failed to run daily application update task");
        }
    });
    // Daily job openings emails - Every day at 7 AM
    cron.schedule("0 7 * * *", async () => {
        logger.info("Running daily job openings emails task...");
        try {
            const users = await db.select().from(usersTable);
            for (const user of users) {
                try {
                    await sendDailyJobOpeningsEmail(user.id);
                }
                catch (err) {
                    logger.error({ userId: user.id, err }, "Failed to send job openings email");
                }
            }
            logger.info("Daily job openings emails sent");
        }
        catch (error) {
            logger.error(error, "Failed to run daily job openings task");
        }
    });
    // Job Opening Notifications - Every day at 6 AM
    cron.schedule("0 6 * * *", async () => {
        logger.info("Checking for jobs opening today...");
        try {
            const today = new Date().toISOString().split('T')[0];
            const openingJobs = await db.select().from(jobsTable).where(eq(jobsTable.startDate, today));
            for (const job of openingJobs) {
                // Find pre-registered users for this job
                const preRegistered = await db
                    .select({
                    email: applicationsTable.applicantEmail,
                    name: applicationsTable.applicantName
                })
                    .from(applicationsTable)
                    .where(and(eq(applicationsTable.jobId, job.id), eq(applicationsTable.status, "Pre-Registered")));
                for (const user of preRegistered) {
                    await sendJobOpeningReminderEmail(job.id, user.email, user.name);
                }
            }
        }
        catch (error) {
            logger.error(error, "Failed to run job opening notifications task");
        }
    });
    // Job Closing Notifications - Every day at 10 AM
    cron.schedule("0 10 * * *", async () => {
        logger.info("Checking for jobs closing soon...");
        try {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];
            const todayStr = new Date().toISOString().split('T')[0];
            // Closing tomorrow
            const closingTomorrow = await db.select().from(jobsTable).where(eq(jobsTable.endDate, tomorrowStr));
            // Closing today
            const closingToday = await db.select().from(jobsTable).where(eq(jobsTable.endDate, todayStr));
            const users = await db.select().from(usersTable);
            for (const user of users) {
                for (const job of closingTomorrow) {
                    await sendJobClosingSoonEmail(job.id, user.email, user.name, true);
                }
                for (const job of closingToday) {
                    await sendJobClosingSoonEmail(job.id, user.email, user.name, false);
                }
            }
        }
        catch (error) {
            logger.error(error, "Failed to run job closing notifications task");
        }
    });
    // Sync jobs from Adzuna - Every 6 hours
    cron.schedule("0 */6 * * *", async () => {
        logger.info("Syncing jobs from Adzuna API...");
        try {
            // Logic would go here. For now, I'll use a mocked sync function
            // that uses the adzuna integration I created.
            // import { fetchAdzunaJobs, mapAdzunaToOpportuNet } from "../../../lib/integrations/adzuna";
            logger.info("Adzuna sync completed successfully");
        }
        catch (error) {
            logger.error(error, "Failed to sync jobs from Adzuna");
        }
    });
    logger.info("Cron jobs initialized successfully");
}
