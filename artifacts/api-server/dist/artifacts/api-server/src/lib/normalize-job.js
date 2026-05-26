export function buildDefaultHrEmail(company) {
    const normalized = (company || "organization")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 20);
    return `hr@${normalized || "organization"}.com`;
}
function normalizeLink(value) {
    return typeof value === "string" ? value.trim() : "";
}
export function normalizeJobRecord(job) {
    if (!job)
        return job;
    const officialUrl = normalizeLink(job.officialUrl || job.official_url || job.officialWebsite);
    const applicationLink = normalizeLink(job.applicationLink || officialUrl || job.applyLink);
    const canonicalLink = officialUrl || applicationLink;
    const hrEmail = normalizeLink(job.hrEmail) || buildDefaultHrEmail(job.company);
    return {
        ...job,
        hrEmail,
        applicationLink: applicationLink || canonicalLink,
        official_url: canonicalLink,
        officialUrl: canonicalLink,
        createdAt: typeof job.createdAt === "string"
            ? job.createdAt
            : job.createdAt?.toISOString?.() ?? job.createdAt,
    };
}
