import app from "./app";
export { logger } from "./lib/logger";
import { logger } from "./lib/logger";
import { db } from "@workspace/db";
import { jobsTable, examsTable, studyMaterialsTable, usersTable } from "@workspace/db/schema";
import { count, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { IT_JOBS, NONIT_JOBS, STATE_GOVT_JOBS, CENTRAL_GOVT_JOBS, buildJobRows } from "./lib/seed-data";
import { seedColleges } from "./lib/seed-colleges";
import { seedCompanies } from "./lib/seed-companies";
const port = Number(process.env["PORT"]) || 3001;
function validateIntegrationConfig() {
    const oauthCallbackBase = process.env.OAUTH_CALLBACK_BASE_URL;
    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
        logger.warn("FRONTEND_URL is not set. Social login redirects may fail.");
    }
    if (!oauthCallbackBase) {
        logger.warn("OAUTH_CALLBACK_BASE_URL is not set. Falling back to request host for OAuth callbacks.");
    }
    const oauthProviders = [
        { name: "Google", id: process.env.GOOGLE_CLIENT_ID, secret: process.env.GOOGLE_CLIENT_SECRET },
        { name: "GitHub", id: process.env.GITHUB_CLIENT_ID, secret: process.env.GITHUB_CLIENT_SECRET },
    ];
    for (const provider of oauthProviders) {
        if (!provider.id || !provider.secret) {
            logger.warn({ provider: provider.name }, "OAuth provider not fully configured");
        }
    }
    if (!process.env.API_KEY) {
        logger.warn("API_KEY is not set. Third-party API integrations may not work.");
    }
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        logger.warn("SMTP credentials are incomplete. Email sending will run in simulation mode.");
    }
}
async function ensureAdminUser() {
    const adminEmail = "admin@govportal.com";
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, adminEmail));
    if (!existing) {
        const passwordHash = await bcrypt.hash("Admin@123", 10);
        await db.insert(usersTable).values({
            name: "GovPortal Admin",
            email: adminEmail,
            passwordHash,
            role: "admin",
            provider: "email",
        });
        logger.info("Default admin user created: admin@govportal.com / Admin@123");
    }
}
async function autoSeed() {
    const [jobsCount] = await db.select({ count: count() }).from(jobsTable);
    const [examsCount] = await db.select({ count: count() }).from(examsTable);
    // Auto-seed if empty
    if (jobsCount.count === 0) {
        logger.info("Jobs table is empty — seeding live jobs...");
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
        logger.info({ inserted: allJobs.length }, "Jobs seeded");
    }
    if (examsCount.count === 0) {
        logger.info("Exams table is empty — seeding exams and materials...");
        const exams = await db.insert(examsTable).values([
            // ... (rest of the exams insertion from the original file)
            {
                name: "Karnataka PGCET 2026",
                fullName: "Post Graduate Common Entrance Test 2026 (MBA/MCA/M.Tech)",
                description: "Comprehensive entrance test for admission to MBA, MCA, M.Tech, M.E, M.Arch, and M.Plan programs in Karnataka. Managed by the Karnataka Examinations Authority (KEA).",
                examDate: "2026-06-15",
                applicationStartDate: "2026-04-01",
                applicationEndDate: "2026-05-15",
                applyLink: "https://kea.kar.nic.in/pgcet2026",
                eligibility: "MBA: Any Bachelor's degree with 50% aggregate.\nMCA: BCA/B.Sc (CS/IT) or any degree with Mathematics with 50% aggregate.\nM.Tech: B.E/B.Tech in relevant branch with 50% aggregate.\n(45% for SC/ST/OBC-I candidates).",
                applicationGuide: "Step 1: Visit the official KEA portal (kea.kar.nic.in) and select 'PGCET 2026'.\nStep 2: Choose your desired course (MBA, MCA, or M.Tech) for application.\nStep 3: Register using your mobile number and Aadhaar details.\nStep 4: Fill in personal and academic information accurately.\nStep 5: Upload your photograph, signature, and thumb impression.\nStep 6: Pay the application fee (₹650 for Gen/OBC, ₹500 for SC/ST).\nStep 7: Submit the application and download the confirmation page.\nStep 8: Preserve the Application Number and course details for future reference.",
                officialWebsite: "https://kea.kar.nic.in",
            },
        ]).returning();
        await db.insert(studyMaterialsTable).values([
            { examId: exams[0].id, title: "M.Tech Engineering Mathematics – NPTEL Notes", subject: "Engineering Mathematics", type: "Notes", description: "Comprehensive notes on Calculus, Linear Algebra, Differential Equations, Numerical Methods, and Transforms for PG-CET M.Tech prep.", url: "https://nptel.ac.in/courses/111104086" },
            { examId: exams[0].id, title: "Data Structures & Algorithms – NPTEL Video Course", subject: "Computer Science", type: "Video", description: "Complete video course covering Arrays, Linked Lists, Trees, Graphs, Dynamic Programming for M.Tech CSE PG-CET.", url: "https://nptel.ac.in/courses/106102064" },
            { examId: exams[0].id, title: "MBA PGCET Quantitative Aptitude – IndiaBIX", subject: "Quantitative Aptitude", type: "Practice_Test", description: "500+ QA problems on Arithmetic, Algebra, DI, and Time/Speed for MBA PGCET prep.", url: "https://www.indiabix.com/aptitude/questions-and-answers/" },
            { examId: exams[0].id, title: "Verbal Ability – MBA PGCET YouTube Course", subject: "Verbal Ability", type: "Video", description: "English grammar, RC strategies, verbal reasoning, and para-jumbles for MBA PGCET on YouTube.", url: "https://www.youtube.com/results?search_query=MBA+PGCET+verbal+ability+preparation" },
            { examId: exams[0].id, title: "MCA PG-CET Mathematics – NPTEL Discrete Maths", subject: "Mathematics", type: "Video", description: "Algebra, Calculus, Probability & Statistics, Set Theory, Mathematical Logic for MCA PG-CET.", url: "https://nptel.ac.in/courses/106106094" },
            { examId: exams[0].id, title: "C Programming & Data Structures – NPTEL", subject: "Computer Science", type: "Video", description: "C Programming, Data Structures, DBMS, OS, Computer Networks for MCA PG-CET by IIT faculty.", url: "https://nptel.ac.in/courses/106105085" },
            { examId: exams[0].id, title: "Previous Year Papers – KEA Archive", subject: "All Subjects", type: "PDF", description: "Consolidated archive of previous year question papers for MBA, MCA, and M.Tech PGCET.", url: "https://prepp.in/karnataka-pgcet-exam/question-paper" },
            { examId: exams[0].id, title: "General Awareness – GK Today", subject: "General Awareness", type: "Notes", description: "Monthly current affairs and static GK for PGCET preparation.", url: "https://www.gktoday.in/current-affairs/" },
        ]);
        logger.info("Auto-seed completed: 3exams, 24 study materials");
    }
}
import { setupCronJobs } from "./tasks";
async function main() {
    validateIntegrationConfig();
    try {
        await autoSeed();
        await seedColleges();
        await seedCompanies();
        await ensureAdminUser();
        setupCronJobs();
    }
    catch (err) {
        logger.error({ err }, "Startup tasks failed, continuing anyway");
    }
    app.listen(port, (err) => {
        if (err) {
            logger.error({ err }, "Error listening on port");
            process.exit(1);
        }
        logger.info({ port }, "Server listening");
    });
}
if (process.env.NODE_ENV !== 'test' && (import.meta.url.endsWith('index.ts') || import.meta.url.endsWith('index.mjs'))) {
    main().catch(err => {
        logger.error(err, "Server failed to start");
        process.exit(1);
    });
}
export { main };
