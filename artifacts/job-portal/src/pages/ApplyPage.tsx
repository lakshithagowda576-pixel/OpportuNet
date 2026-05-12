import React, { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { trackEvent } from "@/lib/analytics";
import { useGetJob } from "@workspace/api-client-react";
import { CompanyBrandedLayout } from "@/components/branding/CompanyBrandedLayout";
import { CompanyDetails } from "@/components/branding/CompanyDetails";
import { JobDetailsSection } from "@/components/branding/JobDetailsSection";
import { ApplicationForm } from "@/components/branding/ApplicationForm";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const ApplyPage: React.FC = () => {
  const [, params] = useRoute("/jobs/:id/apply");
  const jobId = Number(params?.id);
  const [company, setCompany] = useState<any>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);

  // Fetch job details using the proper API client hook
  const { data: job, isLoading: isLoadingJob } = useGetJob(jobId);

  // Fetch company branding details when job is loaded
  useEffect(() => {
    if (job?.company) {
      setIsLoadingCompany(true);
      fetch(`/api/companies/${encodeURIComponent(job.company)}`)
        .then(res => res.json())
        .then(data => setCompany(data))
        .catch(err => console.error("Failed to fetch company:", err))
        .finally(() => setIsLoadingCompany(false));
    }
  }, [job?.company]);

  useEffect(() => {
    if (job) {
      trackEvent({
        eventType: "application_page_view",
        eventCategory: "Application",
        eventAction: "view",
        page: `/jobs/${jobId}/apply`,
        metadata: { jobId, company: job.company, category: job.category },
      });
    }
  }, [job, jobId]);

  if (isLoadingJob || isLoadingCompany) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <h2 className="text-2xl font-bold mb-4">Job Not Found</h2>
        <Button onClick={() => window.history.back()}>Go Back</Button>
      </div>
    );
  }

  // Use default branding if company details are missing
  const branding = {
    primaryColor: company?.primaryColor || (job.category.includes("GOVT") ? "#FF9933" : "#4285F4"),
    secondaryColor: company?.secondaryColor || (job.category.includes("GOVT") ? "#128807" : "#34A853"),
  };

  return (
    <CompanyBrandedLayout primaryColor={branding.primaryColor} secondaryColor={branding.secondaryColor}>
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => window.history.back()}
          className="text-gray-600 hover:text-[var(--brand-primary)]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Listing
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Job & Company Details */}
        <div className="lg:col-span-1 space-y-8">
          {company ? (
            <CompanyDetails company={company} />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
              <h2 className="text-2xl font-bold mb-4">{job.company}</h2>
              <p className="text-gray-500">Corporate Member</p>
            </div>
          )}
        </div>

        {/* Right Column: Job Section & Application Form */}
        <div className="lg:col-span-2">
          <JobDetailsSection job={job} />
          <ApplicationForm 
            jobId={job.id} 
            companyName={job.company} 
            isGovernment={job.category.includes("GOVT")} 
          />
        </div>
      </div>
    </CompanyBrandedLayout>
  );
};

export default ApplyPage;
