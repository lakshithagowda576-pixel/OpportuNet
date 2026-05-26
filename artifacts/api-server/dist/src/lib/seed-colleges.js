import { db } from "@workspace/db";
import { collegesTable, collegeCutoffsTable, collegeFeesTable } from "@workspace/db/schema";
import { karnatakaColeges } from "../data/karnataka-colleges";
import { logger } from "./logger";
export async function seedColleges() {
    try {
        // Check if colleges already seeded
        const existingColleges = await db.select().from(collegesTable);
        if (existingColleges.length > 0) {
            logger.info(`Colleges already seeded (${existingColleges.length} colleges found), skipping...`);
            return;
        }
        logger.info("Starting to seed Karnataka colleges...");
        for (const collegeData of karnatakaColeges) {
            // Insert college
            const [college] = await db.insert(collegesTable).values({
                name: collegeData.name,
                location: collegeData.location,
                city: collegeData.city,
                state: collegeData.state,
                collegeCode: collegeData.collegeCode,
                affiliation: collegeData.affiliation,
                about: collegeData.about,
                websiteUrl: collegeData.websiteUrl,
                contactEmail: collegeData.contactEmail,
                contactPhone: collegeData.contactPhone,
                establishedYear: collegeData.establishedYear,
                facilities: collegeData.facilities,
                qualification: collegeData.qualification,
            }).returning();
            logger.info(`Seeded college: ${college.name}`);
            // Insert cutoffs
            for (const cutoff of collegeData.cutoffs) {
                await db.insert(collegeCutoffsTable).values({
                    collegeId: college.id,
                    courseName: cutoff.courseName,
                    category: cutoff.category,
                    cutoffScore: cutoff.cutoffScore,
                    ugSeats: cutoff.ugSeats,
                    pgSeats: cutoff.pgSeats,
                    academicYear: cutoff.academicYear,
                });
            }
            // Insert fees
            for (const fee of collegeData.fees) {
                await db.insert(collegeFeesTable).values({
                    collegeId: college.id,
                    courseType: fee.courseType,
                    courseName: fee.courseName,
                    annualFees: fee.annualFees,
                    totalFees: fee.totalFees,
                    description: fee.description,
                    academicYear: fee.academicYear,
                });
            }
        }
        logger.info(`Successfully seeded ${karnatakaColeges.length} colleges with cutoffs and fees!`);
    }
    catch (error) {
        logger.error(error, "Failed to seed colleges");
        throw error;
    }
}
