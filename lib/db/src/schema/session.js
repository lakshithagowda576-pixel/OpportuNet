import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
export const sessionTable = pgTable("session", {
    sid: varchar("sid").primaryKey(),
    sess: text("sess").notNull(),
    expire: timestamp("expire", { precision: 6 }).notNull(),
});
