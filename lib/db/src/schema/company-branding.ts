import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const companyBrandingTable = pgTable("company_branding", {
  id: serial("id").primaryKey(),
  companyName: varchar("company_name", { length: 255 }).notNull().unique(),
  primaryColor: varchar("primary_color", { length: 7 }), // Hex code like #4285F4
  secondaryColor: varchar("secondary_color", { length: 7 }),
  logoUrl: text("logo_url"),
  formBackgroundColor: varchar("form_background_color", { length: 7 }),
  buttonColor: varchar("button_color", { length: 7 }),
  buttonTextColor: varchar("button_text_color", { length: 7 })
});

export const insertCompanyBrandingSchema = createInsertSchema(companyBrandingTable).omit({ id: true });
export type InsertCompanyBranding = typeof companyBrandingTable.$inferInsert;
export type CompanyBranding = typeof companyBrandingTable.$inferSelect;
