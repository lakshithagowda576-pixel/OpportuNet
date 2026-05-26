import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { jobsTable } from "./schema/jobs";
import { applicationsTable } from "./schema/applications";
import * as dotenv from "dotenv";
dotenv.config({ path: "../../.env" });
const { Pool } = pg;
async function seed() {
    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL must be set.");
        process.exit(1);
    }
    console.log("Connecting to the database...");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool);
    console.log("Clearing existing applications...");
    await db.delete(applicationsTable);
    console.log("Clearing existing jobs...");
    await db.delete(jobsTable);
    console.log("Seeding curated jobs...");
    const curatedJobs = [
        {
            title: "Associate Software Engineer",
            company: "Accenture India",
            category: "IT",
            location: "Pan India (Bangalore, Hyderabad, Pune)",
            shift: "Full_time",
            description: "Join Accenture as an Associate Software Engineer and work on cutting-edge technologies. This role is ideal for freshers who want to build a career in software development and consulting.",
            eligibility: "B.E/B.Tech/M.E/M.Tech/MCA/M.Sc (All branches) with 60% or 6.5 CGPA.",
            applicationGuide: "Step 1: Click the 'Official Portal' button to visit the Accenture Careers page.\nStep 2: Search for 'Associate Software Engineer' in the job search bar.\nStep 3: Click on the relevant job listing and then click 'Apply Now'.\nStep 4: Create an account or log in to the Accenture portal.\nStep 5: Upload your Resume and fill in the required academic details.\nStep 6: Complete the Cognitive and Technical Assessment after receiving the link via email.",
            startDate: "2026-03-01",
            endDate: "2026-12-31",
            hrEmail: "campus.queries@accenture.com",
            salary: "₹4.5 LPA - ₹6.5 LPA",
            openings: 500,
            applicationLink: "https://www.accenture.com/in-en/careers/jobdetails?id=ASE_India_2024",
            official_url: "https://www.accenture.com/in-en/careers"
        },
        {
            title: "Graduate Engineer Trainee (GET)",
            company: "TATA Consultancy Services (TCS)",
            category: "IT",
            location: "Remote/Office Hybrid",
            shift: "Full_time",
            description: "TCS is looking for bright engineering graduates for its NQT-based hiring. You will be part of global teams working on digital transformation projects.",
            eligibility: "Engineering Graduates (B.E/B.Tech) with no active backlogs.",
            applicationGuide: "Step 1: Visit the TCS NextStep portal using the official link.\nStep 2: Register under the 'IT' category if you haven't already.\nStep 3: Note down your CT/DT Reference ID.\nStep 4: Apply for the TCS NQT (National Qualifier Test).\nStep 5: Update your profile and click 'Apply for Drive'.",
            startDate: "2026-03-15",
            endDate: "2026-11-30",
            hrEmail: "global.hiring@tcs.com",
            salary: "₹3.6 LPA - ₹7 LPA",
            openings: 1000,
            applicationLink: "https://www.tcs.com/careers/india",
            official_url: "https://nextstep.tcs.com/campus/"
        },
        {
            title: "Software Engineer - New Grad",
            company: "Google",
            category: "IT",
            location: "Bangalore / Hyderabad",
            shift: "Full_time",
            description: "Google is hiring new graduates to help build the next generation of products. You'll work on complex problems and have a real impact on millions of users.",
            eligibility: "Bachelor's or Master's degree in Computer Science or related field.",
            applicationGuide: "Step 1: Go to Google Careers portal.\nStep 2: Sign in with your Google account.\nStep 3: Upload your Resume (PDF format preferred).\nStep 4: Fill in the Education and Experience sections.\nStep 5: Answer the voluntary self-identification questions and submit.",
            startDate: "2026-04-01",
            endDate: "2026-10-15",
            hrEmail: "recruiting-feedback@google.com",
            salary: "₹18 LPA - ₹32 LPA",
            openings: 50,
            applicationLink: "https://careers.google.com/jobs/results/",
            official_url: "https://careers.google.com"
        },
        {
            title: "Scientist/Engineer 'SC'",
            company: "ISRO",
            category: "CENTRAL_GOVT",
            location: "Bangalore / Sriharikota / Ahmedabad",
            shift: "Full_time",
            description: "Opportunity to join India's premier space agency as a Scientist/Engineer. Contribute to satellite missions and space exploration.",
            eligibility: "First class B.E/B.Tech with minimum 65% marks or 6.84 CGPA.",
            applicationGuide: "Step 1: Visit the ISRO Careers portal (VSSC/ISAC/SDSC).\nStep 2: Fill the online application form with personal and academic details.\nStep 3: Pay the application fee of ₹250 online.\nStep 4: Upload your photo and signature in the specified format.\nStep 5: Take a printout of the generated application for future reference.",
            startDate: "2026-04-10",
            endDate: "2026-12-20",
            hrEmail: "icrb@isro.gov.in",
            salary: "₹56,100 - ₹1,77,500 (Level 10)",
            openings: 120,
            applicationLink: "https://www.isro.gov.in/Careers.html",
            official_url: "https://www.isro.gov.in"
        },
        {
            title: "Assistant Professor Recruitment",
            company: "Karnataka Examination Authority (KEA)",
            category: "STATE_GOVT",
            location: "Karnataka (Various Government Colleges)",
            shift: "Full_time",
            description: "Government of Karnataka recruitment for Assistant Professors in various subjects for Government First Grade Colleges.",
            eligibility: "Master's Degree with 55% and NET/SLET/SET or PhD qualification.",
            applicationGuide: "Step 1: Visit the KEA Official Website (cetonline.karnataka.gov.in/kea).\nStep 2: Click on 'Recruitment' tab and select 'Assistant Professor 2024'.\nStep 3: Register and create a login ID.\nStep 4: Fill the application form subject-wise.\nStep 5: Upload Challan/Payment details and submit.",
            startDate: "2026-04-20",
            endDate: "2026-07-31",
            hrEmail: "keaug2024@gmail.com",
            salary: "₹57,700 - ₹1,82,400",
            openings: 1242,
            applicationLink: "https://cetonline.karnataka.gov.in/kea/",
            official_url: "https://kea.kar.nic.in"
        },
        {
            title: "Customer Support Associate",
            company: "Amazon India",
            category: "NON_IT",
            location: "Bangalore / Remote",
            shift: "Full_time",
            description: "Join Amazon's world-class customer service team. Help customers solve problems and provide a great experience.",
            eligibility: "10+2 / Any Graduate with good communication skills in English.",
            applicationGuide: "Step 1: Visit Amazon Jobs portal.\nStep 2: Select 'Customer Service' category.\nStep 3: Filter by 'India' and 'Bangalore'.\nStep 4: Click 'Apply' and complete the Virtual Job Tryout assessment.\nStep 5: Complete the registration and submit.",
            startDate: "2026-01-01",
            endDate: "2026-12-31",
            hrEmail: "cs-hiring@amazon.com",
            salary: "₹3 LPA - ₹4.5 LPA",
            openings: 200,
            applicationLink: "https://www.amazon.jobs/en/job_categories/customer-service",
            official_url: "https://www.amazon.jobs"
        },
        {
            title: "Bank PO (Probationary Officer)",
            company: "HDFC Bank",
            category: "NON_IT",
            location: "Pan India",
            shift: "Full_time",
            description: "Start your banking career with HDFC Bank as a Probationary Officer through the Future Bankers Program.",
            eligibility: "Any Graduate with 55% marks. Age between 21-26 years.",
            applicationGuide: "Step 1: Visit HDFC Bank Careers - Future Bankers page.\nStep 2: Register for the assessment test.\nStep 3: Complete the online aptitude test and interview.\nStep 4: On selection, undergo the 1-year PGDBF program.\nStep 5: Post-successful completion, join as a Deputy Manager.",
            startDate: "2026-02-15",
            endDate: "2026-12-15",
            hrEmail: "careers@hdfcbank.com",
            salary: "₹4 LPA - ₹6 LPA",
            openings: 300,
            applicationLink: "https://www.hdfcbank.com/personal/about-us/careers",
            official_url: "https://www.hdfcbank.com"
        }
    ];
    // Placeholder loop removed to prevent broken links
    await db.insert(jobsTable).values(curatedJobs);
    console.log(`Successfully seeded ${curatedJobs.length} curated jobs.`);
    await pool.end();
    process.exit(0);
}
seed().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
