import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { jobsTable } from "./jobs";
export const messagesTable = pgTable("messages", {
    id: serial("id").primaryKey(),
    jobId: integer("job_id")
        .notNull()
        .references(() => jobsTable.id),
    senderName: text("sender_name").notNull(),
    senderEmail: text("sender_email").notNull(),
    hrEmail: text("hr_email").notNull(),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    isReply: boolean("is_reply").notNull().default(false),
    sentAt: timestamp("sent_at").defaultNow().notNull(),
});
export const insertMessageSchema = createInsertSchema(messagesTable).omit({
    id: true,
    sentAt: true,
    isReply: true,
});
