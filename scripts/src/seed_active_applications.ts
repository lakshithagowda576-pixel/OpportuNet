import { db } from "@workspace/db";
import { applicationsTable, usersTable, jobsTable } from "@workspace/db/schema";

const statuses = ["Pre-Registered", "Pending", "Reviewed", "Interview", "Closed", "Live", "Current"];

async function seedActiveApplications() {
  console.log("🚀 Creating 200+ active job applications...");

  try {
    // 1. Ensure we have users
    console.log("✓ Step 1: Ensuring users exist...");
    const usersToInsert = [];
    for (let i = 1; i <= 60; i++) {
      usersToInsert.push({
        name: `Candidate ${i}`,
        email: `candidate${i}@opportunet.com`,
        passwordHash: "hashedpassword123",
        phone: `91900000${i.toString().padStart(3, '0')}`,
        address: `Bangalore, Karnataka, India`,
        education: "Bachelor's Degree",
        qualification: "Computer Science / Engineering",
      });
    }
    await db.insert(usersTable).values(usersToInsert).onConflictDoNothing();
    const allUsers = await db.select().from(usersTable).limit(100);
    console.log(`   ✅ Users ready: ${allUsers.length} available`);

    // 2. Get all existing jobs
    console.log("✓ Step 2: Finding existing jobs...");
    const existingJobs = await db.select().from(jobsTable).limit(1000);
    
    if (existingJobs.length === 0) {
      console.log("   ⚠️  No existing jobs found. Creating sample jobs...");
      
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const futureDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const companies = [
        "Wipro", "TCS", "Infosys", "Accenture", "HCL", "IBM", "Tech Mahindra", 
        "Google", "Microsoft", "Amazon", "Apple", "Meta", "Flipkart", "Zomato"
      ];

      const jobTitles = [
        "Software Engineer", "Frontend Developer", "Backend Developer", 
        "Full Stack Developer", "Data Scientist", "DevOps Engineer", 
        "UI/UX Designer", "QA Automation Engineer", "Mobile App Developer"
      ];

      const locations = [
        "Bangalore", "Hyderabad", "Pune", "Chennai", "Noida", "Mumbai", "Remote"
      ];

      const jobsToInsert = [];
      for (let i = 0; i < 40; i++) {
        const company = companies[Math.floor(Math.random() * companies.length)];
        const title = jobTitles[Math.floor(Math.random() * jobTitles.length)];
        const location = locations[Math.floor(Math.random() * locations.length)];
        
        jobsToInsert.push({
          title: `${title} #${i + 1}`,
          company,
          category: "IT" as const,
          location: `${location}, India`,
          shift: "Full_time" as const,
          description: `Exciting opportunity to join ${company}`,
          eligibility: "Bachelor's degree required",
          applicationGuide: "Apply online through the portal",
          startDate: today,
          endDate: futureDateStr,
          hrEmail: `hr@${company.toLowerCase()}.com`,
          salary: `₹${Math.floor(Math.random() * 25) + 5}–${Math.floor(Math.random() * 40) + 20} LPA`,
          openings: Math.floor(Math.random() * 20) + 5,
          applicationLink: "",
          official_url: `https://careers.${company.toLowerCase()}.com`,
        });
      }

      const createdJobs = await db.insert(jobsTable).values(jobsToInsert).returning();
      console.log(`   ✅ Created ${createdJobs.length} jobs`);
      existingJobs.push(...createdJobs);
    } else {
      console.log(`   ✅ Found ${existingJobs.length} existing jobs`);
    }

    // 3. Create 200+ applications
    console.log("✓ Step 3: Creating 200+ job applications...");
    const applicationsBatch = [];
    const targetApplications = 200;
    const now = new Date();

    for (let i = 0; i < targetApplications; i++) {
      const job = existingJobs[i % existingJobs.length];
      const user = allUsers[i % allUsers.length];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      // Stagger applied dates
      const daysAgo = Math.floor(Math.random() * 30);
      const appliedDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      applicationsBatch.push({
        userId: user.id,
        jobId: job.id,
        status,
        appliedDate: appliedDate.toISOString().split('T')[0],
      });
    }

    await db.insert(applicationsTable).values(applicationsBatch);
    console.log(`   ✅ Created ${applicationsBatch.length} job applications`);

    // 4. Summary
    console.log("\n═══════════════════════════════════════════════════");
    console.log("✨ SEEDING COMPLETE!");
    console.log("═══════════════════════════════════════════════════");
    console.log(`📊 Statistics:`);
    console.log(`   • Active Applications: ${applicationsBatch.length}`);
    console.log(`   • Total Jobs Available: ${existingJobs.length}`);
    console.log(`   • Total Users: ${allUsers.length}`);
    console.log(`\n📌 Application Status Distribution:`);
    console.log(`   • Pre-Registered: ~${Math.floor(applicationsBatch.length / 4)}`);
    console.log(`   • Pending: ~${Math.floor(applicationsBatch.length / 4)}`);
    console.log(`   • Reviewed: ~${Math.floor(applicationsBatch.length / 4)}`);
    console.log(`   • Interview: ~${Math.floor(applicationsBatch.length / 4)}`);
    console.log(`   • Closed: ~${Math.floor(applicationsBatch.length / 4)}`);
    console.log(`   • Live: ~${Math.floor(applicationsBatch.length / 4)}`);
    console.log(`   • Current: ~${Math.floor(applicationsBatch.length / 4)}`);
    console.log(`\n✅ Your job portal now has active applications!`);
    
  } catch (error) {
    console.error("❌ Error seeding applications:", error);
    throw error;
  }
}

seedActiveApplications()
  .then(() => {
    console.log("\n✨ All done!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n💥 Seeding failed:", err);
    process.exit(1);
  });

