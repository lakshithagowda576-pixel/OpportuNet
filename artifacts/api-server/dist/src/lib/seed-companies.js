import { db } from "@workspace/db";
import { companiesTable } from "@workspace/db/schema";
import { logger } from "./logger";
export async function seedCompanies() {
    const companies = [
        {
            name: "Google",
            logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_\"G\"_logo.svg/1200px-Google_\"G\"_logo.svg.png",
            primaryColor: "#4285F4",
            secondaryColor: "#34A853",
            description: "Google's mission is to organize the world's information and make it universally accessible and useful.",
            foundedYear: 1998,
            headquarters: "Mountain View, California, US",
            website: "https://about.google",
            companySize: "150,000+ employees",
            industry: "Technology",
            culture: "Our culture is based on innovation, collaboration, and a commitment to making a positive impact on the world.",
            benefits: ["Health Insurance", "401(k) Matching", "Free Meals", "On-site Gyms", "Generous PTO"],
            socialLinks: {
                linkedin: "https://www.linkedin.com/company/google",
                twitter: "https://twitter.com/google",
                github: "https://github.com/google"
            },
            type: "corporate"
        },
        {
            name: "Microsoft",
            logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/2048px-Microsoft_logo.svg.png",
            primaryColor: "#F25022",
            secondaryColor: "#7FBA00",
            description: "Microsoft enables digital transformation for the era of an intelligent cloud and an intelligent edge.",
            foundedYear: 1975,
            headquarters: "Redmond, Washington, US",
            website: "https://www.microsoft.com",
            companySize: "200,000+ employees",
            industry: "Technology",
            culture: "We are grounded in a growth mindset, which allows us to constantly learn and evolve.",
            benefits: ["Employee Stock Purchase Plan", "Paid Parental Leave", "Tuition Reimbursement", "Volunteer Time Off"],
            socialLinks: {
                linkedin: "https://www.linkedin.com/company/microsoft",
                twitter: "https://twitter.com/microsoft"
            },
            type: "corporate"
        },
        {
            name: "Amazon",
            logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/1024px-Amazon_logo.svg.png",
            primaryColor: "#FF9900",
            secondaryColor: "#000000",
            description: "Amazon is guided by four principles: customer obsession rather than competitor focus, passion for invention, commitment to operational excellence, and long-term thinking.",
            foundedYear: 1994,
            headquarters: "Seattle, Washington, US",
            website: "https://www.aboutamazon.com",
            companySize: "1,500,000+ employees",
            industry: "E-commerce & Cloud",
            culture: "We strive to be Earth's most customer-centric company, Earth's safest place to work, and Earth's best employer.",
            benefits: ["Comprehensive Health Care", "401(k) with company match", "Career Choice program"],
            socialLinks: {
                linkedin: "https://www.linkedin.com/company/amazon",
                twitter: "https://twitter.com/amazon"
            },
            type: "corporate"
        },
        {
            name: "Infosys",
            logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Infosys_logo.svg/1280px-Infosys_logo.svg.png",
            primaryColor: "#007CC3",
            secondaryColor: "#FFFFFF",
            description: "Infosys is a global leader in next-generation digital services and consulting.",
            foundedYear: 1981,
            headquarters: "Bengaluru, Karnataka, India",
            website: "https://www.infosys.com",
            companySize: "300,000+ employees",
            industry: "IT Services",
            culture: "Values-led organization with a focus on lifelong learning and professional excellence.",
            benefits: ["Performance Bonuses", "Global Onsite Opportunities", "Training & Certification"],
            socialLinks: {
                linkedin: "https://www.linkedin.com/company/infosys",
                twitter: "https://twitter.com/infosys"
            },
            type: "corporate"
        },
        {
            name: "TCS",
            logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Tata_Consultancy_Services_Logo.svg/1200px-Tata_Consultancy_Services_Logo.svg.png",
            primaryColor: "#0066CC",
            secondaryColor: "#FFFFFF",
            description: "Tata Consultancy Services is an IT services, consulting and business solutions organization.",
            foundedYear: 1968,
            headquarters: "Mumbai, Maharashtra, India",
            website: "https://www.tcs.com",
            companySize: "600,000+ employees",
            industry: "IT Services",
            culture: "A part of the Tata Group, TCS carries forward the values of trust and integrity.",
            benefits: ["Tata Group Benefits", "Health Insurance", "Work-Life Balance Programs"],
            socialLinks: {
                linkedin: "https://www.linkedin.com/company/tata-consultancy-services"
            },
            type: "corporate"
        },
        {
            name: "Government of India",
            logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/800px-Emblem_of_India.svg.png",
            primaryColor: "#FF9933", // Saffron
            secondaryColor: "#128807", // Green
            description: "Official recruitment for various government departments and ministries.",
            foundedYear: 1947,
            headquarters: "New Delhi, India",
            website: "https://india.gov.in",
            companySize: "1,000,000+ employees",
            industry: "Government",
            culture: "Serving the nation with integrity, transparency, and dedication.",
            benefits: ["Pension Scheme", "Job Security", "LTC Benefits", "Quarters Facility"],
            socialLinks: {
                twitter: "https://twitter.com/mygovindia"
            },
            type: "government"
        }
    ];
    try {
        for (const company of companies) {
            await db.insert(companiesTable).values(company).onConflictDoUpdate({
                target: companiesTable.name,
                set: company
            });
        }
        logger.info("Companies seeded successfully");
    }
    catch (error) {
        logger.error({ error }, "Failed to seed companies");
    }
}
