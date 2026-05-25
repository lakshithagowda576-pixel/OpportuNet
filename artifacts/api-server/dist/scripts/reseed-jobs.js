import { db } from "@workspace/db";
import { jobsTable, applicationsTable } from "@workspace/db/schema";
import { IT_JOBS, NONIT_JOBS, STATE_GOVT_JOBS, CENTRAL_GOVT_JOBS, buildJobRows } from "../lib/seed-data";
async function reseed() {
    console.log("Starting Job Reseed...");
    // 1. Clear existing applications (due to FK constraints)
    await db.delete(applicationsTable);
    console.log("Cleared applications table");
    // 2. Clear existing jobs
    await db.delete(jobsTable);
    console.log("Cleared jobs table");
    // 3. Re-seed jobs with fresh data
    const allJobs = [
        ...buildJobRows(IT_JOBS, "IT"),
        ...buildJobRows(NONIT_JOBS, "NON_IT"),
        ...buildJobRows(STATE_GOVT_JOBS, "STATE_GOVT"),
        ...buildJobRows(CENTRAL_GOVT_JOBS, "CENTRAL_GOVT"),
    ];
    const batchSize = 50;
    for (let i = 0; i < allJobs.length; i += batchSize) {
        const batch = allJobs.slice(i, i + batchSize);
        await db.insert(jobsTable).values(batch);
    }
    console.log(`Successfully re-seeded ${allJobs.length} jobs with live URLs and statuses!`);
    process.exit(0);
}
reseed().catch(err => {
    console.error("Reseed failed:", err);
    process.exit(1);
});
