import { db } from "@workspace/db";
import { companyBrandingTable, externalLinksTable, jobsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("🚀 Starting Seeding of Company Branding & External Links...");

  try {
    // 1. Seed Company Branding
    const brandings = [
      {
        companyName: "Google",
        primaryColor: "#4285F4", // Google Blue
        secondaryColor: "#f32715ff", // Google Red
        logoUrl: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png",
        formBackgroundColor: "#FFFFFF",
        buttonColor: "#4285F4",
        buttonTextColor: "#FFFFFF",
      },
      {
        companyName: "Microsoft",
        primaryColor: "#F25022", // Microsoft Orange/Red
        secondaryColor: "#7FBA00", // Microsoft Green
        logoUrl: "https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageArtwork/RE1Mu3b?ver=5c5a",
        formBackgroundColor: "#FFFFFF",
        buttonColor: "#00A4EF", // Microsoft Blue
        buttonTextColor: "#FFFFFF",
      },
      {
        companyName: "Amazon",
        primaryColor: "#FF9900", // Amazon Orange
        secondaryColor: "#146B93", // Amazon Blue
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
        formBackgroundColor: "#FFFFFF",
        buttonColor: "#FF9900",
        buttonTextColor: "#111111",
      },
      {
        companyName: "TCS",
        primaryColor: "#1B365D", // TCS Dark Blue
        secondaryColor: "#0082C9", // TCS Light Blue
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b1/Tata_Consultancy_Services_Logo.svg",
        formBackgroundColor: "#FFFFFF",
        buttonColor: "#1B365D",
        buttonTextColor: "#FFFFFF",
      },
      {
        companyName: "Infosys",
        primaryColor: "#007CC3", // Infosys Blue
        secondaryColor: "#FFFFFF",
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg",
        formBackgroundColor: "#FFFFFF",
        buttonColor: "#007CC3",
        buttonTextColor: "#FFFFFF",
      },
      {
        companyName: "Wipro",
        primaryColor: "#000000",
        secondaryColor: "#7F7F7F",
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Wipro_Logo.svg",
        formBackgroundColor: "#FFFFFF",
        buttonColor: "#000000",
        buttonTextColor: "#FFFFFF",
      },
      {
        companyName: "HDFC Bank",
        primaryColor: "#004C8F", // HDFC Blue
        secondaryColor: "#E31E24", // HDFC Red
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/2/28/HDFC_Bank_Logo.svg",
        formBackgroundColor: "#FFFFFF",
        buttonColor: "#004C8F",
        buttonTextColor: "#FFFFFF",
      },
      {
        companyName: "KPSC",
        primaryColor: "#FF9933", // Government Saffron
        secondaryColor: "#138808", // Government Green
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/8/84/Government_of_Karnataka_Seal.svg",
        formBackgroundColor: "#FFF9E6", // Light Saffron Tint
        buttonColor: "#FF9933",
        buttonTextColor: "#FFFFFF",
      },
      {
        companyName: "SSC",
        primaryColor: "#FF9933",
        secondaryColor: "#138808",
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e3/Emblem_of_India.svg",
        formBackgroundColor: "#FFF9E6",
        buttonColor: "#000080", // Navy Blue
        buttonTextColor: "#FFFFFF",
      },
      {
        companyName: "UPSC",
        primaryColor: "#FF9933",
        secondaryColor: "#138808",
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e3/Emblem_of_India.svg",
        formBackgroundColor: "#FFF9E6",
        buttonColor: "#000080",
        buttonTextColor: "#FFFFFF",
      },
    ];

    console.log("Inserting/updating company branding...");
    for (const b of brandings) {
      await db
        .insert(companyBrandingTable)
        .values(b)
        .onConflictDoUpdate({
          target: companyBrandingTable.companyName,
          set: {
            primaryColor: b.primaryColor,
            secondaryColor: b.secondaryColor,
            logoUrl: b.logoUrl,
            formBackgroundColor: b.formBackgroundColor,
            buttonColor: b.buttonColor,
            buttonTextColor: b.buttonTextColor,
          },
        });
    }
    console.log("✅ Company branding seeded successfully.");

    // 2. Fetch all jobs in the database to link them to external URLs
    console.log("Fetching existing jobs...");
    const jobs = await db.select().from(jobsTable);
    console.log(`Found ${jobs.length} jobs in database.`);

    const careerUrls: Record<string, string> = {
      Google: "https://careers.google.com/jobs/",
      Microsoft: "https://careers.microsoft.com/us/en",
      Amazon: "https://www.amazon.jobs/",
      TCS: "https://www.tcs.com/careers",
      Infosys: "https://www.infosys.com/careers.html",
      Wipro: "https://careers.wipro.com/",
      "HDFC Bank": "https://careers.hdfcbank.com/",
      KPSC: "https://kpsc.kar.nic.in/",
      SSC: "https://ssc.gov.in/",
      UPSC: "https://upsc.gov.in/",
    };

    console.log("Seeding external career links...");
    let seededCount = 0;
    for (const job of jobs) {
      // Find a matching career URL or fallback
      let officialUrl = careerUrls[job.company] || job.official_url || job.applicationLink;
      if (!officialUrl || officialUrl === "") {
        // Build a fallback URL based on company name
        const cleanName = job.company.toLowerCase().replace(/[^a-z0-9]/g, "");
        officialUrl = `https://${cleanName || "organization"}.com/careers`;
      }

      // Check if external link already exists for this job
      const [existing] = await db
        .select()
        .from(externalLinksTable)
        .where(eq(externalLinksTable.jobId, job.id));

      if (existing) {
        await db
          .update(externalLinksTable)
          .set({ officialUrl, lastVerified: new Date() })
          .where(eq(externalLinksTable.jobId, job.id));
      } else {
        await db.insert(externalLinksTable).values({
          jobId: job.id,
          officialUrl,
          lastVerified: new Date(),
          isActive: true,
        });
      }
      seededCount++;
    }
    console.log(`✅ Seeded ${seededCount} external career links.`);
    console.log("🎉 Seeding Completed Successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

main();
