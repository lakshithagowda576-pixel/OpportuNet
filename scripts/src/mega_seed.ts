import { db } from "@workspace/db";
import { jobsTable, applicationsTable, usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

async function megaSeed() {
  console.log("Starting MEGA bulk seeding (5500+ Jobs and Applications)...");

  // 1. Create Dummy Users
  console.log("Ensuring we have enough dummy users...");
  const usersToInsert = [];
  for (let i = 1; i <= 100; i++) {
    usersToInsert.push({
      name: `Candidate ${i}`,
      email: `candidate${i}@opportunet.com`,
      passwordHash: "password123",
      phone: `91000000${i.toString().padStart(2, '0')}`,
      address: `Bengaluru, Karnataka, India`,
      education: "Bachelor's Degree",
      qualification: "Computer Science / Business Administration",
    });
  }
  
  await db.insert(usersTable).values(usersToInsert).onConflictDoNothing();
  const users = await db.select().from(usersTable);
  console.log(`Available users: ${users.length}`);

  // 2. Generate 5500 Jobs
  console.log("Generating 5500 jobs across all months...");
  const companies = [
    "Wipro", "TCS", "Infosys", "Accenture", "HCL", "IBM", "Tech Mahindra", "Mphasis", 
    "Mahindra Group", "ITC Limited", "Reliance Industries", "HDFC Bank", "Hindustan Unilever", 
    "Bajaj Allianz", "Byju's", "Delhivery", "Google", "Microsoft", "Amazon", "Apple", 
    "Meta", "Flipkart", "Zomato", "Swiggy", "Ola", "Uber", "Zoho", "Atlassian", "Oracle", 
    "ConsenSys", "Nestlé", "ABB", "Taj Hotels", "Sabyasachi", "Adfactors PR", "Karnataka PWD", 
    "KEA", "KPSC", "SSC", "UPSC", "RRB", "IBPS", "ISRO", "DRDO", "Cognizant", "Capgemini",
    "L&T Infotech", "Mindtree", "Paytm", "PhonePe", "BharatPe", "Groww", "Zerodha"
  ];

  const jobTitles: Record<string, string[]> = {
    IT: [
      "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer", 
      "Data Scientist", "DevOps Engineer", "UI/UX Designer", "Cloud Solutions Architect", 
      "Cybersecurity Analyst", "Mobile App Developer", "QA Automation Engineer", 
      "Machine Learning Engineer", "Blockchain Developer", "Database Administrator", 
      "System Administrator", "Site Reliability Engineer", "Security Engineer", 
      "Data Engineer", "AI Researcher", "Embedded Systems Engineer"
    ],
    NON_IT: [
      "HR Executive", "Marketing Manager", "Operations Coordinator", "Finance Analyst", 
      "Supply Chain Manager", "Sales Executive", "Content Writer", "Logistics Executive", 
      "Brand Manager", "Public Relations Manager", "Legal Counsel", "Administrative Assistant", 
      "Customer Support Specialist", "Business Development Manager", "Finance Manager",
      "Accountant", "Project Manager", "Office Administrator", "Receptionist"
    ],
    STATE_GOVT: [
      "Junior Engineer (Civil)", "Assistant Professor", "Police Sub Inspector", 
      "Commercial Tax Inspector", "Agriculture Officer", "Staff Nurse", 
      "Village Administrative Officer", "Revenue Inspector", "Assistant Engineer", 
      "School Teacher", "FDA", "SDA", "Police Constable", "Panchayat Development Officer"
    ],
    CENTRAL_GOVT: [
      "SSC CGL Officer", "UPSC Civil Servant", "RRB Technician", "IBPS Probationary Officer", 
      "ISRO Scientist", "DRDO Researcher", "SSC CHSL Assistant", "NDA Cadet", 
      "Postal Assistant", "Income Tax Inspector", "Assistant Section Officer",
      "Auditor", "Accountant", "Statistical Investigator", "Railway Guard"
    ]
  };

  const locations = [
    "Bangalore, Karnataka", "Hyderabad, Telangana", "Pune, Maharashtra", 
    "Chennai, Tamil Nadu", "Noida, Uttar Pradesh", "Mumbai, Maharashtra", 
    "Kolkata, West Bengal", "Delhi NCR", "Mysore, Karnataka", "Hubli, Karnataka", 
    "Ahmedabad, Gujarat", "Remote", "Mangalore, Karnataka", "Belgaum, Karnataka",
    "Gulbarga, Karnataka", "Bellary, Karnataka", "Dharwad, Karnataka"
  ];

  const categories = ["IT", "NON_IT", "STATE_GOVT", "CENTRAL_GOVT"] as const;
  const shifts = ["Day", "Full_time", "Night", "Part_time"] as const;

  // 2. Generate and Insert 5500 Jobs in batches
  console.log("Generating 5500 jobs across all months in batches...");
  const totalJobs = 5500;
  const batchSize = 500;
  const insertedJobs: any[] = [];

  for (let b = 0; b < totalJobs; b += batchSize) {
    const currentBatchSize = Math.min(batchSize, totalJobs - b);
    const batchJobs = [];
    
    for (let i = 0; i < currentBatchSize; i++) {
      const jobId = b + i;
      const category = categories[Math.floor(Math.random() * categories.length)];
      const title = jobTitles[category][Math.floor(Math.random() * jobTitles[category].length)];
      const company = companies[Math.floor(Math.random() * companies.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const shift = shifts[Math.floor(Math.random() * shifts.length)];
      
      const month = Math.floor(Math.random() * 12) + 1;
      const startDay = Math.floor(Math.random() * 20) + 1;
      const endDay = startDay + Math.floor(Math.random() * 30) + 10;
      
      const startDate = `2026-${month.toString().padStart(2, '0')}-${startDay.toString().padStart(2, '0')}`;
      const endDate = `2026-${Math.min(month + 2, 12).toString().padStart(2, '0')}-${Math.min(endDay, 28).toString().padStart(2, '0')}`;
      
      batchJobs.push({
        title: `${title} #${jobId + 1}`,
        company,
        category,
        location,
        shift,
        description: `Join ${company} as a ${title}. We are looking for talented individuals to join our team in ${location}. This is a great opportunity to grow your career in a dynamic environment. Applicants should be motivated and ready to take on new challenges.`,
        eligibility: "Bachelor's degree in relevant field. 0-5 years of experience. Strong technical and communication skills.",
        applicationGuide: "1. Visit careers portal\n2. Search for the job code\n3. Apply with your updated resume\n4. Complete the online assessment",
        startDate,
        endDate,
        hrEmail: `careers@${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        salary: `₹${Math.floor(Math.random() * 20) + 5}–${Math.floor(Math.random() * 30) + 15} LPA`,
        openings: Math.floor(Math.random() * 100) + 5,
        official_url: `https://careers.${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      });
    }

    const result = await db.insert(jobsTable).values(batchJobs).returning();
    insertedJobs.push(...result.map(j => ({ id: j.id, startDate: j.startDate })));
    console.log(`Inserted batch ${b / batchSize + 1}: ${insertedJobs.length} jobs total...`);
  }

  // 3. Create 5500 Applications in batches
  console.log("Creating 5500 applications in batches...");
  const statuses = ["Pre-Registered", "Pending", "Reviewed", "Interview", "Offered", "Rejected", "Redirected"];
  
  for (let i = 0; i < insertedJobs.length; i += batchSize) {
    const chunk = insertedJobs.slice(i, i + batchSize);
    const appsToInsert = chunk.map(job => {
      const user = users[Math.floor(Math.random() * users.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)] as any;
      return {
        jobId: job.id,
        userId: user.id,
        applicantName: user.name,
        applicantEmail: user.email,
        applicantPhone: user.phone,
        status,
        acceptedTerms: true,
        appliedAt: new Date(job.startDate),
      };
    });

    await db.insert(applicationsTable).values(appsToInsert);
    console.log(`Inserted ${i + appsToInsert.length} applications...`);
  }

  console.log("MEGA seeding completed successfully!");
}

megaSeed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
