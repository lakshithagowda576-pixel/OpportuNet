import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
export const companiesTable = pgTable("companies", {
    id: serial("id").primaryKey(),
    name: text("name").notNull().unique(),
    logoUrl: text("logo_url"),
    primaryColor: text("primary_color").notNull().default("#4285F4"),
    secondaryColor: text("secondary_color"),
    description: text("description"),
    foundedYear: integer("founded_year"),
    headquarters: text("headquarters"),
    website: text("website"),
    companySize: text("company_size"),
    industry: text("industry"),
    culture: text("culture"),
    benefits: jsonb("benefits").$type(),
    socialLinks: jsonb("social_links").$type(),
    type: text("type").notNull().default("corporate"), // corporate or government
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const insertCompanySchema = createInsertSchema(companiesTable).omit({ id: true, createdAt: true });
