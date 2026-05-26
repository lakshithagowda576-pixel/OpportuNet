import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { usersTable } from "./users";
export const analyticsEventsTable = pgTable("analytics_events", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => usersTable.id),
    eventType: text("event_type").notNull(),
    eventCategory: text("event_category"),
    eventAction: text("event_action").notNull(),
    eventLabel: text("event_label"),
    eventValue: integer("event_value"),
    page: text("page"),
    route: text("route"),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at").defaultNow(),
});
export const createAnalyticsEventSchema = createInsertSchema(analyticsEventsTable).pick({
    userId: true,
    eventType: true,
    eventCategory: true,
    eventAction: true,
    eventLabel: true,
    eventValue: true,
    page: true,
    route: true,
    metadata: true,
});
