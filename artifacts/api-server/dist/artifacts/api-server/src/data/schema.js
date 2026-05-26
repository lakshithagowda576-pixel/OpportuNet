import { pgTable, serial, text, varchar, integer, jsonb } from 'drizzle-orm/pg-core';
// Define the companies table schema
export const companies = pgTable('companies', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    logoUrl: text('logo_url').notNull(),
    primaryColor: varchar('primary_color', { length: 7 }).notNull(),
    secondaryColor: varchar('secondary_color', { length: 7 }).notNull(),
    description: text('description').notNull(),
    foundedYear: integer('founded_year').notNull(),
    headquarters: varchar('headquarters', { length: 255 }).notNull(),
    website: text('website').notNull(),
    socialLinks: jsonb('social_links').notNull(),
    size: varchar('size', { length: 50 }).notNull(),
    industry: varchar('industry', { length: 100 }).notNull(),
    cultureDescription: text('culture_description').notNull(),
    benefits: jsonb('benefits').notNull(),
});
