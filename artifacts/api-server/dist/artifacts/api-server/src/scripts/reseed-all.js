import { db } from "@workspace/db";
import { jobsTable, examsTable, studyMaterialsTable } from "@workspace/db/schema";
import { IT_JOBS, NONIT_JOBS, STATE_GOVT_JOBS, CENTRAL_GOVT_JOBS, buildJobRows } from "../lib/seed-data";
import { sql } from "drizzle-orm";
async function reseedAll() {
    console.log("Starting Full Portal Reseed with TRUNCATE CASCADE...");
    try {
        // 1. Aggressive clear
        console.log("Truncating all tables...");
        await db.execute(sql `TRUNCATE TABLE applications, study_materials, exams, jobs, college_cutoffs, college_fees, colleges RESTART IDENTITY CASCADE`);
        // 2. Seed Jobs
        console.log("Seeding Jobs...");
        const allJobs = [
            ...buildJobRows(IT_JOBS, "IT"),
            ...buildJobRows(NONIT_JOBS, "NON_IT"),
            ...buildJobRows(STATE_GOVT_JOBS, "STATE_GOVT"),
            ...buildJobRows(CENTRAL_GOVT_JOBS, "CENTRAL_GOVT"),
        ];
        await db.insert(jobsTable).values(allJobs);
        // 3. Seed PGCET Exams (Separate entries for MBA, MCA, M.Tech as requested)
        console.log("Seeding Karnataka PGCET Exams (MBA, MCA, M.Tech)...");
        const exams = await db.insert(examsTable).values([
            {
                name: "Karnataka PGCET 2026 - MBA",
                fullName: "Post Graduate Common Entrance Test 2026 (MBA)",
                description: "Entrance test for admission to MBA programs in Karnataka. Managed by KEA.",
                examDate: "2026-06-15",
                applicationStartDate: "2026-04-01",
                applicationEndDate: "2026-05-15",
                applyLink: "https://kea.kar.nic.in/pgcet2026",
                eligibility: "Any Bachelor's degree with 50% aggregate (45% for SC/ST/OBC-I).",
                applicationGuide: "Step 1: Visit KEA portal.\nStep 2: Register for PGCET MBA.\nStep 3: Fill details and pay fee.",
                officialWebsite: "https://kea.kar.nic.in",
            },
            {
                name: "Karnataka PGCET 2026 - MCA",
                fullName: "Post Graduate Common Entrance Test 2026 (MCA)",
                description: "Entrance test for admission to MCA programs in Karnataka. Managed by KEA.",
                examDate: "2026-06-15",
                applicationStartDate: "2026-04-01",
                applicationEndDate: "2026-05-15",
                applyLink: "https://kea.kar.nic.in/pgcet2026",
                eligibility: "BCA/B.Sc (CS/IT) or any degree with Maths with 50% aggregate.",
                applicationGuide: "Step 1: Visit KEA portal.\nStep 2: Register for PGCET MCA.\nStep 3: Fill details and pay fee.",
                officialWebsite: "https://kea.kar.nic.in",
            },
            {
                name: "Karnataka PGCET 2026 - M.Tech",
                fullName: "Post Graduate Common Entrance Test 2026 (M.Tech/M.E/M.Arch)",
                description: "Entrance test for admission to M.Tech and other technical PG programs in Karnataka.",
                examDate: "2026-06-15",
                applicationStartDate: "2026-04-01",
                applicationEndDate: "2026-05-15",
                applyLink: "https://kea.kar.nic.in/pgcet2026",
                eligibility: "B.E/B.Tech in relevant branch with 50% aggregate.",
                applicationGuide: "Step 1: Visit KEA portal.\nStep 2: Register for PGCET M.Tech.\nStep 3: Fill details and pay fee.",
                officialWebsite: "https://kea.kar.nic.in",
            }
        ]).returning();
        const mbaId = exams[0].id;
        const mcaId = exams[1].id;
        const mtechId = exams[2].id;
        // 4. Seed Study Materials (Syllabus, Classes, Videos, Papers, Quizzes)
        console.log("Restoring and Expanding Study Materials for all PGCET exams...");
        await db.insert(studyMaterialsTable).values([
            // MBA Materials
            { examId: mbaId, title: "MBA PGCET Official Syllabus 2026", subject: "Syllabus", type: "PDF", description: "Comprehensive syllabus and exam pattern for MBA.", url: "https://kea.kar.nic.in/pgcet2026/syllabus_mba.pdf" },
            { examId: mbaId, title: "Quantitative Aptitude Video Classes", subject: "Mathematics", type: "Video", description: "Complete video playlist for MBA aptitude preparation.", url: "https://www.youtube.com/watch?v=K-HMk9dw8Qk" },
            { examId: mbaId, title: "Logical Reasoning Full Course", subject: "Reasoning", type: "Video", description: "Expert lectures on logical and analytical reasoning.", url: "https://www.youtube.com/watch?v=tTrT0xmSuPA" },
            { examId: mbaId, title: "MBA Previous Year Papers (2020-2025)", subject: "Previous Papers", type: "PDF", description: "Consolidated archive of solved MBA PGCET papers.", url: "https://kea.kar.nic.in/pgcet/mba_papers.zip" },
            { examId: mbaId, title: "MBA Proficiency Test (Full Length Quiz)", subject: "Mock Test", type: "Practice_Test", description: "Timed mock test covering all sections of the MBA PGCET.", url: "https://www.indiabix.com/online-test/aptitude-test/" },
            { examId: mbaId, title: "English Language Mastery Notes", subject: "Verbal Ability", type: "Notes", description: "Grammar, RC, and vocabulary notes for MBA.", url: "https://www.geeksforgeeks.org/english-grammar-for-competitive-exams/" },
            // MCA Materials
            { examId: mcaId, title: "MCA PGCET Official Syllabus 2026", subject: "Syllabus", type: "PDF", description: "Detailed MCA syllabus including Mathematics and Computer sections.", url: "https://kea.kar.nic.in/pgcet2026/syllabus_mca.pdf" },
            { examId: mcaId, title: "Computer Awareness & Architecture Classes", subject: "Computer Science", type: "Video", description: "Video series on hardware, OS, and computer fundamentals.", url: "https://www.youtube.com/watch?v=KUa2TORY23Q" },
            { examId: mcaId, title: "Discrete Mathematics - NPTEL Course", subject: "Mathematics", type: "Video", description: "In-depth mathematical concepts for MCA entrance.", url: "https://www.youtube.com/watch?v=Z03yYqARnms" },
            { examId: mcaId, title: "MCA Previous Year Solved Papers", subject: "Previous Papers", type: "PDF", description: "KEA archive of original MCA PGCET question papers.", url: "https://kea.kar.nic.in/pgcet/mca_papers.zip" },
            { examId: mcaId, title: "Computer Science IQ Quiz", subject: "Mock Test", type: "Practice_Test", description: "Interactive test on data structures, OS, and C programming.", url: "https://www.indiabix.com/online-test/computer-science-test/" },
            { examId: mcaId, title: "General Awareness for MCA Notes", subject: "General Knowledge", type: "Notes", description: "Important current affairs and static GK for MCA.", url: "https://www.gktoday.in/current-affairs/" },
            // M.Tech Materials
            { examId: mtechId, title: "M.Tech PGCET Syllabus - All Branches", subject: "Syllabus", type: "PDF", description: "Common and branch-specific syllabus for M.Tech/ME.", url: "https://kea.kar.nic.in/pgcet2026/syllabus_mtech.pdf" },
            { examId: mtechId, title: "Engineering Mathematics - NPTEL Video Series", subject: "Engineering Maths", type: "Video", description: "Advanced calculus and linear algebra for M.Tech.", url: "https://www.youtube.com/watch?v=Me4TZN4qRuo" },
            { examId: mtechId, title: "Technical Subject Masterclass (GATE/PGCET)", subject: "Technical", type: "Video", description: "High-level technical lectures for competitive engineering exams.", url: "https://www.youtube.com/watch?v=cTIBsZFk_ck" },
            { examId: mtechId, title: "M.Tech Previous Year Papers Archive", subject: "Previous Papers", type: "PDF", description: "Branch-wise question papers from last 5 years.", url: "https://kea.kar.nic.in/pgcet/mtech_papers.zip" },
            { examId: mtechId, title: "Engineering Math Mock Challenge", subject: "Mock Test", type: "Practice_Test", description: "Challenge your math skills with this PGCET-style quiz.", url: "https://www.indiabix.com/online-test/engineering-mathematics-test/" },
            { examId: mtechId, title: "General Awareness & Verbal Ability Notes", subject: "General Aptitude", type: "Notes", description: "Quick revision notes for the common aptitude section.", url: "https://www.fresherslive.com/online-test/general-awareness-test/questions-and-answers" },
        ]);
        // 5. Seed Colleges
        console.log("Seeding Expanded Karnataka Colleges...");
        const { seedColleges } = await import("../lib/seed-colleges");
        await seedColleges();
        console.log("Full Reseed Completed Successfully! 3 PGCET exams restored (no repetition) and all materials added.");
        process.exit(0);
    }
    catch (err) {
        console.error("Reseed Failed:", err);
        process.exit(1);
    }
}
reseedAll();
