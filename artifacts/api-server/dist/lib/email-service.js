import nodemailer from "nodemailer";
import { db } from "@workspace/db";
import { usersTable, applicationsTable, jobsTable, examsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "./mailer";
// Create transporter for direct email sending (used in cron jobs)
const createTransporter = () => {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || "587");
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    if (!smtpHost || !smtpUser || !smtpPass) {
        return null;
    }
    return nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    });
};
function getStatusColor(status) {
    const colors = {
        Pending: "#f59e0b",
        Reviewed: "#3b82f6",
        Interview: "#8b5cf6",
        Offered: "#10b981",
        Rejected: "#ef4444",
    };
    return colors[status] || "#6b7280";
}
export async function sendDailyJobUpdateEmail(userId) {
    try {
        const [user] = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.id, userId));
        if (!user) {
            console.log(`User ${userId} not found for email notification`);
            return;
        }
        // Get user's applications with status updates
        const userApplications = await db
            .select({
            id: applicationsTable.id,
            jobId: applicationsTable.jobId,
            status: applicationsTable.status,
            appliedAt: applicationsTable.appliedAt,
            jobTitle: jobsTable.title,
            company: jobsTable.company,
            jobDescription: jobsTable.description,
        })
            .from(applicationsTable)
            .leftJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
            .where(eq(applicationsTable.applicantEmail, user.email));
        if (userApplications.length === 0) {
            console.log(`No applications found for user ${user.email}`);
            return;
        }
        const statusCounts = {
            Pending: 0,
            Reviewed: 0,
            Interview: 0,
            Offered: 0,
            Rejected: 0,
        };
        let applicationsList = "";
        for (const app of userApplications) {
            statusCounts[app.status]++;
            applicationsList += `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: left;">${app.jobTitle}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: left;">${app.company}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <span style="background-color: ${getStatusColor(app.status)}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">${app.status}</span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #666;">${new Date(app.appliedAt).toLocaleDateString()}</td>
        </tr>
      `;
        }
        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: white; padding: 20px; margin-top: 20px; border-radius: 8px; }
            .stats { display: flex; gap: 10px; margin: 20px 0; }
            .stat-box { background: #f3f4f6; padding: 15px; border-radius: 6px; text-align: center; flex: 1; }
            .stat-number { font-size: 24px; font-weight: bold; color: #667eea; }
            .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #e5e7eb; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Daily Job Application Update</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Your application status for ${new Date().toLocaleDateString()}</p>
            </div>

            <div class="content">
              <p>Hi ${user.name},</p>
              <p>Here's your daily update on all job applications:</p>

              <div class="stats">
                <div class="stat-box">
                  <div class="stat-number">${userApplications.length}</div>
                  <div class="stat-label">Total Applications</div>
                </div>
                <div class="stat-box">
                  <div class="stat-number">${statusCounts.Pending}</div>
                  <div class="stat-label">Pending</div>
                </div>
                <div class="stat-box">
                  <div class="stat-number">${statusCounts.Interview}</div>
                  <div class="stat-label">Interviews</div>
                </div>
                <div class="stat-box">
                  <div class="stat-number">${statusCounts.Offered}</div>
                  <div class="stat-label">Offers</div>
                </div>
              </div>

              <h2 style="margin-top: 25px; margin-bottom: 15px; color: #1f2937;">Application Status Details</h2>
              <table>
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Company</th>
                    <th>Status</th>
                    <th>Applied Date</th>
                  </tr>
                </thead>
                <tbody>
                  ${applicationsList}
                </tbody>
              </table>

              <div style="margin-top: 25px; padding: 15px; background: #f0f9ff; border-left: 4px solid #667eea; border-radius: 4px;">
                <p style="margin: 0; color: #1e3a8a; font-size: 14px;">
                  <strong>💡 Tip:</strong> Keep checking back daily for updates. If your status changes, you'll see it here immediately!
                </p>
              </div>
            </div>

            <div class="footer">
              <p>© 2026 OpportuNet. All rights reserved.<br/>
              You're receiving this email because you have active job applications on our platform.</p>
            </div>
          </div>
        </body>
      </html>
    `;
        const result = await sendEmail({
            to: user.email,
            subject: `📊 Daily Job Application Update - ${userApplications.length} applications`,
            body: applicationsList,
            applicantName: user.name,
        });
        // If sendEmail is using HTML, we need to send directly
        const transporter = createTransporter();
        if (transporter) {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || "OpportuNet <noreply@opportunet.com>",
                to: user.email,
                subject: `📊 Daily Job Application Update - ${userApplications.length} applications`,
                html,
            });
            console.log(`Daily update email sent to ${user.email}`);
        }
        else {
            console.log(`[SIMULATED EMAIL] Daily update would be sent to ${user.email}`);
        }
    }
    catch (error) {
        console.error(`Failed to send email to user ${userId}:`, error);
    }
}
export async function sendApplicationStatusChangeEmail(applicationId, newStatus) {
    try {
        const [application] = await db
            .select({
            applicantEmail: applicationsTable.applicantEmail,
            applicantName: applicationsTable.applicantName,
            jobTitle: jobsTable.title,
            company: jobsTable.company,
            status: applicationsTable.status,
        })
            .from(applicationsTable)
            .leftJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
            .where(eq(applicationsTable.id, applicationId));
        if (!application) {
            return;
        }
        const statusMessages = {
            Pending: "Your application has been received and is pending review.",
            Reviewed: "Your application has been reviewed! We'll contact you soon if you're selected for the next round.",
            Interview: "Great news! You've been selected for an interview. Please check your email for interview details.",
            Offered: "Congratulations! You've received a job offer. Please check your email for offer details.",
            Rejected: "Thank you for applying. Unfortunately, you weren't selected for this position. We encourage you to apply for other opportunities.",
        };
        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; }
            .content { background: white; padding: 30px; margin-top: 20px; border-radius: 8px; }
            .status-badge { display: inline-block; background-color: ${getStatusColor(newStatus)}; color: white; padding: 10px 20px; border-radius: 6px; font-weight: bold; margin: 15px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Application Status Update</h1>
            </div>

            <div class="content">
              <p>Hi ${application.applicantName},</p>
              
              <p>We have an update on your application for:</p>
              <h2 style="margin: 10px 0; color: #667eea;">${application.jobTitle}</h2>
              <p style="color: #666; margin: 0;">at <strong>${application.company}</strong></p>

              <div class="status-badge">${newStatus}</div>

              <p style="margin-top: 20px;">${statusMessages[newStatus] || "Your application status has been updated."}</p>

              <p style="margin-top: 20px;">If you have any questions, please don't hesitate to reach out.</p>
              
              <p style="margin-top: 30px;">Best regards,<br/>
              <strong>OpportuNet Team</strong></p>
            </div>

            <div class="footer">
              <p>© 2026 OpportuNet. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
        const transporter = createTransporter();
        if (transporter) {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || "OpportuNet <noreply@opportunet.com>",
                to: application.applicantEmail,
                subject: `Application Status Update: ${newStatus} - ${application.jobTitle}`,
                html,
            });
            console.log(`Status change email sent to ${application.applicantEmail}`);
        }
        else {
            console.log(`[SIMULATED EMAIL] Status update email would be sent to ${application.applicantEmail}`);
        }
    }
    catch (error) {
        console.error(`Failed to send status change email for application ${applicationId}:`, error);
    }
}
export async function sendDailyJobOpeningsEmail(userId) {
    try {
        const [user] = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.id, userId));
        if (!user) {
            return;
        }
        // Get all jobs (or filter by user preferences if available)
        const allJobs = await db.select().from(jobsTable);
        if (allJobs.length === 0) {
            return;
        }
        let jobsList = "";
        for (const job of allJobs.slice(0, 10)) {
            jobsList += `
        <div style="padding: 15px; background: #f9fafb; border-radius: 6px; margin-bottom: 10px; border-left: 4px solid #667eea;">
          <h3 style="margin: 0 0 5px 0; color: #1f2937;">${job.title}</h3>
          <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">
            <strong>${job.company}</strong> • ${job.location}
            <br/>
            <strong>Package:</strong> ${job.salary} | <strong>Openings:</strong> ${job.openings}
          </p>
          <a href="${process.env.FRONTEND_URL}/jobs/${job.id}" style="color: #667eea; text-decoration: none; font-weight: bold; font-size: 14px;">View Details →</a>
        </div>
      `;
        }
        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: white; padding: 20px; margin-top: 20px; border-radius: 8px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 New Job Opportunities</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Latest openings for ${new Date().toLocaleDateString()}</p>
            </div>

            <div class="content">
              <p>Hi ${user.name},</p>
              <p>We found <strong>${allJobs.length}</strong> new job opportunities that might interest you!</p>

              ${jobsList}

              <div style="margin-top: 25px; padding: 15px; background: #f0f9ff; border-left: 4px solid #667eea; border-radius: 4px;">
                <p style="margin: 0; color: #1e3a8a; font-size: 14px;">
                  <strong>📌 Don't miss out!</strong> New jobs are posted regularly. Check back daily or apply now to increase your chances.
                </p>
              </div>
            </div>

            <div class="footer">
              <p>© 2026 OpportuNet. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
        const transporter = createTransporter();
        if (transporter) {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || "OpportuNet <noreply@opportunet.com>",
                to: user.email,
                subject: `🎯 Today's Top Job Opportunities - ${allJobs.length} New Openings`,
                html,
            });
            console.log(`Job openings email sent to ${user.email}`);
        }
        else {
            console.log(`[SIMULATED EMAIL] Job openings email would be sent to ${user.email}`);
        }
    }
    catch (error) {
        console.error(`Failed to send job openings email to user ${userId}:`, error);
    }
}
export async function sendApplicationConfirmationEmail(applicationId) {
    try {
        const [application] = await db
            .select({
            id: applicationsTable.id,
            examId: applicationsTable.examId,
            course: applicationsTable.course,
            applicantEmail: applicationsTable.applicantEmail,
            applicantName: applicationsTable.applicantName,
            jobTitle: jobsTable.title,
            company: jobsTable.company,
            examName: examsTable.name,
        })
            .from(applicationsTable)
            .leftJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
            .leftJoin(examsTable, eq(applicationsTable.examId, examsTable.id))
            .where(eq(applicationsTable.id, applicationId));
        if (!application)
            return;
        const isExam = !!application.examId;
        const title = isExam ? `Registration Confirmation: ${application.examName}` : `Application Submitted: ${application.jobTitle}`;
        const entityName = isExam ? application.examName : application.company;
        // Company specific text logic
        let specificText = "";
        if (!isExam) {
            const company = (application.company || "").toLowerCase();
            if (company.includes("accenture")) {
                specificText = "Accenture values your interest. Our recruitment team will review your profile against our high standards of innovation and excellence.";
            }
            else if (company.includes("tcs") || company.includes("tata")) {
                specificText = "Thank you for choosing TCS. We are committed to building a digital future together.";
            }
            else if (company.includes("google")) {
                specificText = "Your application is being processed. We look for individuals who bring diverse perspectives and a passion for solving complex problems.";
            }
            else {
                specificText = `Thank you for your interest in joining ${application.company}. We have received your application and will be in touch shortly.`;
            }
        }
        else {
            specificText = `You have successfully registered for the ${application.examName} for the course: <strong>${application.course || "General"}</strong>. Please keep your application number safe for future reference.`;
        }
        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px; border-radius: 12px; }
            .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
            .content { background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .id-box { margin: 30px 0; padding: 20px; background: #f0f9ff; border-left: 4px solid #4f46e5; border-radius: 8px; text-align: center; }
            .id-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; margin-bottom: 5px; }
            .id-value { font-size: 28px; color: #1e1b4b; font-weight: 900; font-family: monospace; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; }
            .btn { display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: 700; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${isExam ? "Exam Registration" : "Application Received"}</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${application.applicantName}</strong>,</p>
              <p>Success! We've received your ${isExam ? "registration" : "application"} for:</p>
              <h2 style="color: #4f46e5; margin: 10px 0;">${isExam ? application.examName : application.jobTitle}</h2>
              ${!isExam ? `<p style="color: #64748b; font-weight: 700;">@ ${application.company}</p>` : ""}
              
              <div class="id-box">
                <p class="id-label">${isExam ? "Application Number" : "Tracking ID"}</p>
                <p class="id-value">#${application.id.toString().padStart(6, "0")}</p>
                ${isExam ? `<p style="margin-top: 10px; font-size: 14px; font-weight: 700; color: #4f46e5;">Course: ${application.course}</p>` : ""}
              </div>

              <p style="background: #f8fafc; padding: 20px; border-radius: 8px; font-style: italic; color: #475569; border: 1px solid #e2e8f0;">
                "${specificText}"
              </p>

              <p style="margin-top: 30px;">
                You can track the status of your ${isExam ? "registration" : "application"} directly from your OpportuNet dashboard.
              </p>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/applications" class="btn">View My Dashboard</a>
              </div>

              <p style="margin-top: 40px; border-top: 1px solid #e2e8f0; pt-20; font-size: 14px;">
                Best regards,<br/>
                <strong>The OpportuNet Team</strong>
              </p>
            </div>
            <div class="footer">
              <p>© 2026 OpportuNet Portal. Empowering Careers in Karnataka.</p>
            </div>
          </div>
        </body>
      </html>
    `;
        const transporter = createTransporter();
        if (transporter) {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || "OpportuNet <noreply@opportunet.com>",
                to: application.applicantEmail,
                subject: `${title} - ID: #${application.id.toString().padStart(6, "0")}`,
                html,
            });
            console.log(`Confirmation email sent to ${application.applicantEmail}`);
        }
        else {
            console.log(`[SIMULATED EMAIL] Confirmation email for ${isExam ? "Exam" : "Job"} would be sent to ${application.applicantEmail}`);
        }
    }
    catch (error) {
        console.error(`Failed to send confirmation email for application ${applicationId}:`, error);
    }
}
export async function sendPreRegistrationConfirmationEmail(applicationId) {
    try {
        const [application] = await db
            .select({
            id: applicationsTable.id,
            applicantEmail: applicationsTable.applicantEmail,
            applicantName: applicationsTable.applicantName,
            jobTitle: jobsTable.title,
            company: jobsTable.company,
            startDate: jobsTable.startDate,
        })
            .from(applicationsTable)
            .leftJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
            .where(eq(applicationsTable.id, applicationId));
        if (!application)
            return;
        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px; border-radius: 12px; }
            .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
            .content { background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .info-box { margin: 30px 0; padding: 20px; background: #f0f9ff; border-left: 4px solid #0f172a; border-radius: 8px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; }
            .btn { display: inline-block; padding: 12px 24px; background: #0f172a; color: white; text-decoration: none; border-radius: 8px; font-weight: 700; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Pre-Registration Confirmed</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${application.applicantName}</strong>,</p>
              <p>You have successfully pre-registered for:</p>
              <h2 style="color: #0f172a; margin: 10px 0;">${application.jobTitle}</h2>
              <p style="color: #64748b; font-weight: 700;">@ ${application.company}</p>
              
              <div class="info-box">
                <p style="margin: 0; font-weight: 700;">Application Opening Date:</p>
                <p style="font-size: 20px; color: #0f172a; font-weight: 900;">${application.startDate ? new Date(application.startDate).toLocaleDateString() : 'To be announced'}</p>
              </div>

              <p>We'll notify you as soon as the official application window opens. This pre-registration ensures you're among the first to be notified.</p>
              
              <p style="margin-top: 30px;">
                You can view your pre-registrations in your dashboard.
              </p>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/applications" class="btn">View My Dashboard</a>
              </div>

              <p style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 14px;">
                Best regards,<br/>
                <strong>The OpportuNet Team</strong>
              </p>
            </div>
            <div class="footer">
              <p>© 2026 OpportuNet Portal.</p>
            </div>
          </div>
        </body>
      </html>
    `;
        const transporter = createTransporter();
        if (transporter) {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || "OpportuNet <noreply@opportunet.com>",
                to: application.applicantEmail,
                subject: `Pre-Registration Confirmed: ${application.jobTitle} at ${application.company}`,
                html,
            });
            console.log(`Pre-registration confirmation email sent to ${application.applicantEmail}`);
        }
        else {
            console.log(`[SIMULATED EMAIL] Pre-registration email for ${application.jobTitle} would be sent to ${application.applicantEmail}`);
        }
    }
    catch (error) {
        console.error(`Failed to send pre-registration email:`, error);
    }
}
export async function sendJobOpeningReminderEmail(jobId, userEmail, userName) {
    try {
        const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId));
        if (!job)
            return;
        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px; border-radius: 12px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
            .content { background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .btn { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: 700; margin-top: 20px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Applications Now Open!</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${userName}</strong>,</p>
              <p>Good news! The application window for the position you pre-registered for is now <strong>OPEN</strong>:</p>
              <h2 style="color: #10b981; margin: 10px 0;">${job.title}</h2>
              <p style="color: #64748b; font-weight: 700;">@ ${job.company}</p>
              
              <p>You can now head over to our portal to complete your application. Don't wait too long, as positions might fill up quickly!</p>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/jobs/${jobId}" class="btn">Apply Now</a>
              </div>

              <p style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 14px;">
                Best regards,<br/>
                <strong>The OpportuNet Team</strong>
              </p>
            </div>
            <div class="footer">
              <p>© 2026 OpportuNet Portal.</p>
            </div>
          </div>
        </body>
      </html>
    `;
        const transporter = createTransporter();
        if (transporter) {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || "OpportuNet <noreply@opportunet.com>",
                to: userEmail,
                subject: `Now Open: Apply for ${job.title} at ${job.company}`,
                html,
            });
            console.log(`Job opening reminder email sent to ${userEmail}`);
        }
        else {
            console.log(`[SIMULATED EMAIL] Job opening reminder for ${job.title} would be sent to ${userEmail}`);
        }
    }
    catch (error) {
        console.error(`Failed to send job opening reminder:`, error);
    }
}
export async function sendJobClosingSoonEmail(jobId, userEmail, userName, isOneDayLeft = false) {
    try {
        const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId));
        if (!job)
            return;
        const title = isOneDayLeft ? "Closing in 24 Hours!" : "Application Period Ending Soon";
        const subject = isOneDayLeft ? `URGENT: ${job.title} applications close tomorrow!` : `Reminder: ${job.title} applications closing soon`;
        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px; border-radius: 12px; }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
            .content { background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .btn { display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 8px; font-weight: 700; margin-top: 20px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; }
            .timer { font-size: 18px; font-weight: bold; color: #ef4444; margin: 20px 0; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${title}</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${userName}</strong>,</p>
              <p>This is a reminder that the application window for the following position is closing soon:</p>
              <h2 style="color: #ef4444; margin: 10px 0;">${job.title}</h2>
              <p style="color: #64748b; font-weight: 700;">@ ${job.company}</p>
              
              <div class="timer">
                Application Deadline: ${job.endDate ? new Date(job.endDate).toLocaleDateString() : 'Closing soon'}
              </div>

              <p>If you haven't completed your application yet, now is the time! Make sure to submit your details before the deadline to be considered for this role.</p>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/jobs/${jobId}" class="btn">Complete Application</a>
              </div>

              <p style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 14px;">
                Best regards,<br/>
                <strong>The OpportuNet Team</strong>
              </p>
            </div>
            <div class="footer">
              <p>© 2026 OpportuNet Portal.</p>
            </div>
          </div>
        </body>
      </html>
    `;
        const transporter = createTransporter();
        if (transporter) {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || "OpportuNet <noreply@opportunet.com>",
                to: userEmail,
                subject,
                html,
            });
            console.log(`Job closing reminder email sent to ${userEmail}`);
        }
        else {
            console.log(`[SIMULATED EMAIL] Job closing reminder for ${job.title} would be sent to ${userEmail}`);
        }
    }
    catch (error) {
        console.error(`Failed to send job closing reminder:`, error);
    }
}
