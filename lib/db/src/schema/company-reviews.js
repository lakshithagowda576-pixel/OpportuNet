import { pgTable, serial, text, timestamp, pgEnum, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { usersTable } from "./users";
import { companiesTable } from "./companies";
export const reviewStatusEnum = pgEnum("review_status", ["pending", "approved", "rejected"]);
export const reviewVoteTypeEnum = pgEnum("review_vote_type", ["helpful", "unhelpful"]);
export const companyReviewsTable = pgTable("company_reviews", {
    id: serial("id").primaryKey(),
    companyId: integer("company_id").notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
    userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
    rating: integer("rating").notNull().default(5),
    title: text("title"),
    content: text("content"),
    isAnonymous: boolean("is_anonymous").notNull().default(false),
    interviewExperience: integer("interview_experience"),
    cultureRating: integer("culture_rating"),
    workLifeBalanceRating: integer("work_life_balance_rating"),
    salaryRating: integer("salary_rating"),
    managementRating: integer("management_rating"),
    helpfulCount: integer("helpful_count").notNull().default(0),
    unhelpfulCount: integer("unhelpful_count").notNull().default(0),
    status: reviewStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const reviewVotesTable = pgTable("review_votes", {
    id: serial("id").primaryKey(),
    reviewId: integer("review_id").notNull().references(() => companyReviewsTable.id, { onDelete: "cascade" }),
    userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    voteType: reviewVoteTypeEnum("vote_type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const insertCompanyReviewSchema = createInsertSchema(companyReviewsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertReviewVoteSchema = createInsertSchema(reviewVotesTable).omit({ id: true, createdAt: true });
