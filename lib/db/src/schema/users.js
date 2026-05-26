import { pgTable, serial, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
export const userRoleEnum = pgEnum("user_role", ["user", "admin", "hr"]);
export const authProviderEnum = pgEnum("auth_provider", ["email", "google", "github", "facebook", "linkedin"]);
export const usersTable = pgTable("users", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash"),
    role: userRoleEnum("role").notNull().default("user"),
    provider: authProviderEnum("provider").notNull().default("email"),
    providerId: text("provider_id"),
    avatar: text("avatar"),
    phone: text("phone"),
    address: text("address"),
    bio: text("bio"),
    skills: text("skills"),
    resumeUrl: text("resume_url"),
    education: text("education"),
    qualification: text("qualification"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
