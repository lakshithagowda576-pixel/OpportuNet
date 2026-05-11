import {
  pgTable,
  serial,
  text,
  timestamp,
  pgEnum,
  boolean,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { usersTable } from "./users";
import { jobCategoryEnum } from "./jobs";

export const alertFrequencyEnum = pgEnum("alert_frequency", ["daily", "weekly"]);
export const emailStatusEnum = pgEnum("email_status", ["sent", "failed", "bounced"]);

export const jobAlertsTable = pgTable("job_alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name"),
  // Filter criteria stored as JSONB
  filters: jsonb("filters").$type<{
    categories?: string[];
    locations?: string[];
    minSalary?: number;
    maxSalary?: number;
    keywords?: string[];
    shifts?: string[];
  }>(),
  frequency: alertFrequencyEnum("frequency").notNull().default("daily"),
  isActive: boolean("is_active").notNull().default(true),
  lastSentAt: timestamp("last_sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const alertEmailsSentTable = pgTable("alert_emails_sent", {
  id: serial("id").primaryKey(),
  alertId: integer("alert_id")
    .notNull()
    .references(() => jobAlertsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  jobCount: integer("job_count").notNull().default(0),
  recipientEmail: text("recipient_email").notNull(),
  status: emailStatusEnum("status")
    .notNull()
    .default("sent"),
  errorMessage: text("error_message"),
});

export const insertJobAlertSchema = createInsertSchema(jobAlertsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSentAt: true,
});

export const insertAlertEmailSchema = createInsertSchema(alertEmailsSentTable).omit({
  id: true,
  sentAt: true,
});

export type InsertJobAlert = typeof jobAlertsTable.$inferInsert;
export type JobAlert = typeof jobAlertsTable.$inferSelect;
export type InsertAlertEmail = typeof alertEmailsSentTable.$inferInsert;
export type AlertEmail = typeof alertEmailsSentTable.$inferSelect;
