import { pgTable, serial, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { jobsTable } from "./jobs";
import { usersTable } from "./users";
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "completed", "failed", "refunded"]);
export const paymentsTable = pgTable("payments", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => usersTable.id).notNull(),
    jobId: integer("job_id").references(() => jobsTable.id), // Can be null if it's a general subscription
    stripeSessionId: text("stripe_session_id").notNull().unique(),
    amount: integer("amount").notNull(), // in cents
    currency: text("currency").default("usd").notNull(),
    status: paymentStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
