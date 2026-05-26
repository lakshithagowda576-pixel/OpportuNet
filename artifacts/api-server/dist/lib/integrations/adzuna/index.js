import axios from "axios";
export async function fetchAdzunaJobs(query = "developer", location = "india") {
    const appId = process.env.ADZUNA_APP_ID || "placeholder_id";
    const appKey = process.env.ADZUNA_APP_KEY || "placeholder_key";
    const url = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${appId}&app_key=${appKey}&what=${query}&where=${location}&content-type=application/json`;
    try {
        const response = await axios.get(url);
        return response.data.results;
    }
    catch (error) {
        console.error("Error fetching jobs from Adzuna:", error);
        return [];
    }
}
export function mapAdzunaToOpportuNet(job) {
    return {
        title: job.title,
        company: job.company.display_name,
        category: "IT", // Defaulting to IT for now
        location: job.location.display_name,
        shift: "Full_time",
        description: job.description,
        eligibility: "Check official link for details",
        applicationGuide: "Apply via the official link provided.",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        hrEmail: "external@adzuna.com",
        salary: job.salary_min ? `${job.salary_min} - ${job.salary_max || ''}` : "Not specified",
        applicationLink: job.redirect_url,
        official_url: job.redirect_url,
    };
}
