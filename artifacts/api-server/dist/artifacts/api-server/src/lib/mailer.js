import nodemailer from "nodemailer";
import { z } from "zod";
export const emailSchema = z.object({
    to: z.string().email(),
    subject: z.string().min(1),
    body: z.string().min(1),
    applicantName: z.string().optional(),
});
export async function sendEmail({ to, subject, body, applicantName }) {
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = parseInt(process.env.SMTP_PORT || "587");
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const fromEmail = process.env.SMTP_FROM || smtpUser || "noreply@opportu-net.com";
    if (!smtpHost || !smtpUser || !smtpPass) {
        console.log(`[SIMULATED EMAIL] To: ${to}, Subject: ${subject}`);
        return {
            success: true,
            simulated: true,
            message: `Email would be sent to ${to}. Configure SMTP_HOST, SMTP_USER, SMTP_PASS environment variables for real email sending.`
        };
    }
    try {
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: { user: smtpUser, pass: smtpPass },
        });
        await transporter.sendMail({
            from: `"OpportuNet Staff" <${fromEmail}>`,
            to,
            subject,
            html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="background: #2563eb; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">OpportuNet</h1>
        </div>
        <div style="padding: 32px; background: #ffffff;">
          ${applicantName ? `<p style="font-size: 16px; color: #374151;">Dear <strong>${applicantName}</strong>,</p>` : ""}
          <div style="white-space: pre-wrap; line-height: 1.6; color: #4b5563; font-size: 15px;">${body}</div>
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #f3f4f6;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">This email was sent from OpportuNet HR Management System.</p>
        </div>
      </div>`,
        });
        return { success: true, message: `Email sent to ${to}` };
    }
    catch (err) {
        console.error(`Failed to send email to ${to}:`, err);
        throw new Error(`Failed to send email: ${err.message}`);
    }
}
