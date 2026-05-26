import { db } from "./index";
import { companiesTable } from "./schema/companies";
const companies = [
    {
        name: "Google",
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_\"G\"_logo.svg/1200px-Google_\"G\"_logo.svg.png",
        primaryColor: "#4285F4",
        secondaryColor: "#34A853",
        description: "Google's mission is to organize the world's information and make it universally accessible and useful.",
        foundedYear: 1998,
        headquarters: "Mountain View, California, USA",
        website: "https://about.google",
        companySize: "100,000+ employees",
        industry: "Technology",
        culture: "Focus on innovation, collaboration, and making a positive impact on the world.",
        benefits: ["Health Insurance", "Free Meals", "Professional Development", "Gyms"],
        socialLinks: {
            linkedin: "https://linkedin.com/company/google",
            twitter: "https://twitter.com/google"
        },
        type: "corporate"
    },
    {
        name: "Microsoft",
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/1024px-Microsoft_logo.svg.png",
        primaryColor: "#F25022",
        secondaryColor: "#7FBA00",
        description: "Our mission is to empower every person and every organization on the planet to achieve more.",
        foundedYear: 1975,
        headquarters: "Redmond, Washington, USA",
        website: "https://microsoft.com",
        companySize: "100,000+ employees",
        industry: "Technology",
        culture: "Growth mindset, diversity and inclusion, customer obsession.",
        benefits: ["Generous time off", "Wellness programs", "401(k)"],
        socialLinks: {
            linkedin: "https://linkedin.com/company/microsoft",
            twitter: "https://twitter.com/microsoft"
        },
        type: "corporate"
    },
    {
        name: "Amazon",
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/1200px-Amazon_logo.svg.png",
        primaryColor: "#FF9900",
        secondaryColor: "#000000",
        description: "Earth's most customer-centric company, where customers can find and discover anything they might want to buy online.",
        foundedYear: 1994,
        headquarters: "Seattle, Washington, USA",
        website: "https://aboutamazon.com",
        companySize: "1,000,000+ employees",
        industry: "E-commerce & Cloud Computing",
        culture: "Leadership Principles, day 1 mentality, customer obsession.",
        benefits: ["Medical Insurance", "401(k) Match", "Career Choice"],
        socialLinks: {
            linkedin: "https://linkedin.com/company/amazon",
            twitter: "https://twitter.com/amazon"
        },
        type: "corporate"
    },
    {
        name: "TCS",
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Tata_Consultancy_Services_Logo.svg/1200px-Tata_Consultancy_Services_Logo.svg.png",
        primaryColor: "#0066CC",
        secondaryColor: "#004B99",
        description: "A purpose-led organization that is building a meaningful future through innovation, technology, and collective knowledge.",
        foundedYear: 1968,
        headquarters: "Mumbai, India",
        website: "https://tcs.com",
        companySize: "600,000+ employees",
        industry: "IT Services",
        culture: "Integrity, excellence, respect for the individual, learning and sharing.",
        benefits: ["Health Insurance", "Bonuses", "Training"],
        socialLinks: {
            linkedin: "https://linkedin.com/company/tata-consultancy-services",
            twitter: "https://twitter.com/tcs"
        },
        type: "corporate"
    },
    {
        name: "Infosys",
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Infosys_logo.svg/1280px-Infosys_logo.svg.png",
        primaryColor: "#2C6E9E",
        secondaryColor: "#007CC3",
        description: "A global leader in next-generation digital services and consulting.",
        foundedYear: 1981,
        headquarters: "Bengaluru, India",
        website: "https://infosys.com",
        companySize: "300,000+ employees",
        industry: "IT Services",
        culture: "C-LIFE values",
        benefits: ["Health Insurance", "Work-Life Balance"],
        socialLinks: {
            linkedin: "https://linkedin.com/company/infosys",
            twitter: "https://twitter.com/infosys"
        },
        type: "corporate"
    },
    {
        name: "Government of India",
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/800px-Emblem_of_India.svg.png",
        primaryColor: "#FF9933",
        secondaryColor: "#128807",
        description: "Official recruitment portal for government services.",
        foundedYear: 1947,
        headquarters: "New Delhi, India",
        website: "https://india.gov.in",
        companySize: "Government Body",
        industry: "Government",
        culture: "Service to the nation",
        benefits: ["Job Security", "Pension", "Medical"],
        socialLinks: {
            twitter: "https://twitter.com/mygovindia"
        },
        type: "government"
    }
];
export async function seedCompanies() {
    console.log("Seeding companies...");
    for (const company of companies) {
        try {
            await db.insert(companiesTable).values(company).onConflictDoUpdate({
                target: companiesTable.name,
                set: company
            });
        }
        catch (e) {
            console.error(`Error seeding ${company.name}:`, e);
        }
    }
    console.log("Finished seeding companies.");
}
