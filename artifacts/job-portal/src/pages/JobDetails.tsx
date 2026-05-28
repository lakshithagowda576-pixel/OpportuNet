import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";
import { 
  useGetJob, 
  useGetJobApplicantCount, 
  useCreateApplication
} from "@workspace/api-client-react";
import { 
  Building2, MapPin, Clock, IndianRupee, 
  Calendar, CheckCircle2, Users, AlertCircle, 
  Loader2, ArrowLeft, Mail, BookOpen, ListChecks, Briefcase, ExternalLink, Send, X, GraduationCap, Sparkles
} from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useAuth } from "@/context/AuthContext";

export default function JobDetails() {
  const [, params] = useRoute("/jobs/:id");
  const jobId = Number(params?.id);
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: job, isLoading: isJobLoading } = useGetJob(jobId);
  const { data: applicantStats } = useGetJobApplicantCount(jobId);
  const { isLoading: isAuthLoading } = useAuth();

  const [hasApplied, setHasApplied] = useState(false);
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (job) {
      trackEvent({
        eventType: "job_viewed",
        eventCategory: "Job",
        eventAction: "view",
        page: `/jobs/${jobId}`,
        metadata: { jobId, company: job.company, category: job.category },
      });
    }
  }, [job, jobId]);

  const canApply = user && new Date() <= new Date(job?.endDate || new Date());

  const getShiftLabel = (shift: string) => {
    switch (shift) {
      case "Full_time": return "Full Time";
      case "Part_time": return "Part Time";
      default: return shift;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "IT": return "IT Sector";
      case "NON_IT": return "Non-IT";
      case "STATE_GOVT": return "State Government";
      case "CENTRAL_GOVT": return "Central Government";
      default: return category.replace("_", " ");
    }
  };

  const steps = job?.applicationGuide?.split("\n").filter(s => s.trim()) ?? [];
  const externalApplyUrl = job?.official_url || job?.applicationLink || "";
  
  // Generate fallback URL if no official URL exists
  const getFallbackUrl = (company: string) => {
    const cleanCompany = company.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    return `https://www.google.com/search?q=${encodeURIComponent(cleanCompany + ' careers jobs official website')}`;
  };
  
  const applyUrl = externalApplyUrl && externalApplyUrl.startsWith("http") ? externalApplyUrl : getFallbackUrl(job?.company || "");

  const handleOneClickApply = async () => {
    if (!user || !user.resumeUrl) return;
    setIsRedirecting(true);
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          applicantName: user.name,
          applicantEmail: user.email,
          applicantPhone: user.phone || "Not Provided",
          applicantAddress: user.address || "Not Provided",
          education: user.education || "Not Specified",
          qualification: user.qualification || "Not Specified",
          resumeUrl: user.resumeUrl,
          acceptedTerms: true,
        }),
      });

      if (response.ok) {
        setHasApplied(true);
        toast({ title: "Success!", description: "Fast Apply complete! Your profile was sent." });
        trackEvent({
          eventType: "application_submitted",
          eventCategory: "Application",
          eventAction: "submit",
          page: `/jobs/${jobId}`,
          metadata: { jobId, company: job?.company, applicantEmail: user.email },
        });
      } else {
        const err = await response.json();
        throw new Error(err.error || "Fast Apply failed");
      }
    } catch (error: any) {
      toast({ title: "Apply Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsRedirecting(false);
    }
  };

  if (isJobLoading) {
    return <div className="flex justify-center py-32"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }
  if (!job) {
    return <div className="text-center py-32 text-xl font-bold">Job not found.</div>;
  }

  const hasResume = !!user?.resumeUrl;

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto space-y-6"
      >
      <Link href="/jobs" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors gap-1">
        <ArrowLeft className="w-4 h-4" /> Back to Jobs
      </Link>

      {/* Header */}
      <div className="bg-card rounded-3xl p-8 border border-border shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-accent to-primary"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                {getCategoryLabel(job.category)}
              </span>
              {new Date() > new Date(job.endDate) ? (
                 <span className="flex items-center gap-1 text-sm font-medium text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-200">
                    <AlertCircle className="w-4 h-4" /> Application Closed
                 </span>
              ) : new Date() < new Date(job.startDate) ? (
                 <span className="flex items-center gap-1 text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-200">
                    <Calendar className="w-4 h-4" /> Application Opens {format(new Date(job.startDate), "MMMM d, yyyy")}
                 </span>
              ) : (
                 <span className="flex items-center gap-1 text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4" /> Accepting Applications
                 </span>
              )}
              <span className="flex items-center gap-1 text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-200">
                <Clock className="w-4 h-4" /> {getShiftLabel(job.shift)}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">{job.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5 text-foreground font-semibold">
                <Building2 className="w-5 h-5 text-primary" /> {job.company}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-5 h-5 text-primary/70" /> {job.location}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
            {hasApplied && (
               <div className="w-full md:w-64 bg-emerald-50 border-2 border-emerald-500 rounded-xl p-4 text-center animate-in zoom-in-95 duration-500 shadow-lg shadow-emerald-200">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
                  <p className="text-emerald-700 font-bold">Applied Successfully!</p>
                  <p className="text-emerald-600 text-[10px] mt-1">HR will be notified shortly.</p>
               </div>
            )}
            {!hasApplied && (
               user ? (
                    <Link 
                      href={`/jobs/${jobId}/apply`}
                      className={`w-full md:w-64 px-6 py-4 rounded-xl font-bold text-lg text-center transition-all duration-300 flex items-center justify-center gap-2 ${
                        canApply
                          ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:-translate-y-1'
                          : 'bg-muted text-muted-foreground cursor-not-allowed'
                      }`}
                    >
                      <Sparkles className="w-5 h-5" /> {canApply ? 'Apply Now' : 'Application Closed'}
                    </Link>
               ) : (
                 <Link 
                   href="/login"
                   className="w-full md:w-64 px-6 py-4 rounded-xl font-bold text-lg text-center bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
                 >
                   <Send className="w-4 h-4" /> Sign In to Apply
                 </Link>
               )
            )}
            
            {!hasApplied && job.official_url && (
              <p className="text-xs text-center text-muted-foreground italic">
                Official website: {job.official_url}
              </p>
            )}
            {!hasApplied && (
               <>
                 <Link 
                   href="/applications"
                   className="w-full md:w-60 px-6 py-3 rounded-xl font-semibold bg-card text-muted-foreground hover:bg-secondary flex items-center justify-center gap-2 transition-colors text-sm border border-border"
                 >
                   Track Applications
                 </Link>
                 <Link 
                   href={`/jobs/${jobId}/applications`}
                   className="w-full md:w-60 px-6 py-3 rounded-xl font-semibold bg-card text-muted-foreground hover:bg-secondary flex items-center justify-center gap-2 transition-colors text-sm border border-border"
                 >
                   <Users className="w-4 h-4" /> View Applicants
                 </Link>
               </>
            )}
            {hasApplied && (
               <Link 
                 href={`/jobs/${jobId}/applications`}
                 className="w-full md:w-60 px-6 py-3 rounded-xl font-semibold bg-card text-muted-foreground hover:bg-secondary flex items-center justify-center gap-2 transition-colors text-sm border border-border"
               >
                 <Users className="w-4 h-4" /> View More Applicants
               </Link>
            )}
            <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-60">
              <a 
                href={`mailto:${job.hrEmail}`}
                className="flex-1 px-6 py-3 rounded-xl font-semibold bg-card text-muted-foreground hover:bg-secondary flex items-center justify-center gap-2 transition-colors text-sm border border-border"
              >
                <Mail className="w-4 h-4 text-primary" /> Email HR
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(job.hrEmail);
                  toast({ title: "Copied!", description: "HR Email copied to clipboard." });
                }}
                className="p-3 rounded-xl bg-card text-muted-foreground hover:bg-secondary border border-border transition-colors"
                title="Copy Email"
              >
                <Sparkles className="w-4 h-4 text-primary" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Key info strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm flex flex-col gap-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5"><IndianRupee className="w-3.5 h-3.5" /> Salary / Package</span>
          <span className="font-bold text-foreground text-sm">{job.salary}</span>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm flex flex-col gap-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Openings</span>
          <span className="font-bold text-foreground text-sm">{job.openings} Position{job.openings !== 1 ? "s" : ""}</span>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm flex flex-col gap-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-emerald-500" /> Application Opens</span>
          <span className="font-bold text-emerald-600 text-sm">{formatDate(job.startDate)}</span>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm flex flex-col gap-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-destructive" /> Last Date to Apply</span>
          <span className="font-bold text-destructive text-sm">{formatDate(job.endDate)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Company Summary */}
          <section className="bg-card rounded-2xl p-8 border border-border shadow-sm">
            <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" /> About {job.company}
            </h2>
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm leading-relaxed">
                {job.company} is a leading organization committed to excellence and innovation. We are looking for talented individuals to join our growing team and contribute to our success.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground font-semibold">Industry</p>
                  <p className="text-sm font-bold mt-1">{getCategoryLabel(job.category)}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground font-semibold">Locations</p>
                  <p className="text-sm font-bold mt-1">{job.location}</p>
                </div>
              </div>
            </div>
          </section>





          {/* Job Description */}
          <section className="bg-card rounded-2xl p-8 border border-border shadow-sm">
            <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" /> Job Description
            </h2>
            <div className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
              {job.description}
            </div>
            <div className="mt-5 pt-5 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Location:</span>
                <span className="font-semibold text-foreground">{job.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Work Type:</span>
                <span className="font-semibold text-foreground">{getShiftLabel(job.shift)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">HR Contact:</span>
                <a href={`mailto:${job.hrEmail}`} className="font-semibold text-primary hover:underline">{job.hrEmail}</a>
              </div>
              <div className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Package:</span>
                <span className="font-semibold text-foreground">{job.salary}</span>
              </div>
            </div>
          </section>

          {/* Job Requirements */}
          <section className="bg-card rounded-2xl p-8 border border-border shadow-sm">
            <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" /> Job Requirements
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-blue-900 space-y-3">
              <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                {job.description}
              </div>
              <div className="border-t border-blue-300 pt-4 mt-4">
                <p className="text-xs font-bold text-blue-700 mb-3">KEY REQUIREMENTS:</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
                    <span>Must meet the eligibility criteria mentioned below</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
                    <span>Valid educational qualifications as specified</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
                    <span>Required experience in the relevant field</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
                    <span>Strong communication and problem-solving skills</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Eligibility - Qualifications */}
          <section className="bg-card rounded-2xl p-8 border border-border shadow-sm">
            <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> Eligibility & Qualifications
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-sm mb-3 text-foreground">Eligibility Criteria:</h3>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-amber-900 text-sm leading-relaxed whitespace-pre-wrap">
                  {job.eligibility}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-3 text-foreground">Preferred Qualifications:</h3>
                <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-2">
                  <div className="text-green-900 text-sm space-y-2">
                    <p className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>Bachelor's degree in relevant field</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>0-3 years of relevant experience</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>Proficiency in relevant tools and technologies</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>Strong analytical and communication abilities</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Application Guide */}
          <section className="bg-card rounded-2xl p-8 border border-border shadow-sm">
            <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-primary" /> How to Apply - Step by Step Guide
            </h2>
            <div className="space-y-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 px-1">Check off steps as you complete them:</p>
              {steps.length > 0 ? (
                steps.map((step, i) => (
                  <label key={i} className="flex gap-4 items-start bg-secondary/20 p-5 rounded-2xl border border-transparent hover:border-primary/20 hover:bg-secondary/40 transition-all cursor-pointer group">
                    <div className="relative flex items-center mt-1">
                      <input type="checkbox" className="w-5 h-5 rounded-md border-2 border-primary/30 checked:bg-primary accent-primary transition-all cursor-pointer" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-primary uppercase tracking-tighter">Step {i + 1}</span>
                      <p className="text-sm text-foreground font-medium leading-relaxed group-has-[:checked]:text-muted-foreground group-has-[:checked]:line-through transition-all">
                        {step.replace(/^Step \d+:\s*/i, "")}
                      </p>
                    </div>
                  </label>
                ))
              ) : (
                <div className="space-y-3">
                  {[
                    "Visit the official portal link or use the 'Official Portal' button",
                    "Click on 'Apply Now' or create your account if you're a new user",
                    "Fill in the application form with accurate details",
                    "Upload required documents and certificate copies",
                    "Review and submit your application before the deadline"
                  ].map((step, i) => (
                    <label key={i} className="flex gap-4 items-start bg-secondary/20 p-4 rounded-xl border border-transparent hover:border-primary/20 transition-all cursor-pointer group">
                       <input type="checkbox" className="w-5 h-5 mt-1 rounded-md border-2 border-primary/30 checked:bg-primary accent-primary transition-all cursor-pointer" />
                       <div className="space-y-1">
                         <span className="text-[10px] font-black text-primary uppercase tracking-tighter">Step {i + 1}</span>
                         <p className="text-sm text-foreground font-medium leading-relaxed group-has-[:checked]:text-muted-foreground group-has-[:checked]:line-through transition-all">{step}</p>
                       </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-900">
                <span className="font-semibold">Important:</span> Make sure to submit your application before {formatDate(job.endDate)}. Late submissions will not be accepted.
              </p>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Application timeline */}
          <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
            <h3 className="font-display font-bold text-base border-b pb-3 mb-4">Application Timeline</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-0.5 shrink-0"></div>
                <div>
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p className="font-semibold text-emerald-600">{formatDate(job.startDate)}</p>
                </div>
              </div>
              <div className="w-0.5 h-6 bg-border ml-1.25"></div>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive mt-0.5 shrink-0"></div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Date</p>
                  <p className="font-semibold text-destructive">{formatDate(job.endDate)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick info */}
          <div className="bg-card rounded-2xl p-6 border border-border shadow-sm space-y-4">
            <h3 className="font-display font-bold text-base border-b pb-3">Quick Info</h3>
            {[
              { label: "Salary", value: job.salary, icon: <IndianRupee className="w-4 h-4 text-primary" /> },
              { label: "Openings", value: `${job.openings} posts`, icon: <AlertCircle className="w-4 h-4 text-amber-500" /> },
              { label: "Location", value: job.location, icon: <MapPin className="w-4 h-4 text-blue-500" /> },
              { label: "Work Mode", value: getShiftLabel(job.shift), icon: <Clock className="w-4 h-4 text-purple-500" /> },
            ].map(({ label, value, icon }) => (
              <div key={label} className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">{icon}</div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-semibold text-foreground text-sm">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Applicant stats */}
          {applicantStats && (
            <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
              <h3 className="font-display font-bold text-base border-b pb-3 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Applicant Stats
              </h3>
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-foreground">{applicantStats.total}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Applicants</p>
              </div>
              <div className="space-y-2">
                {Object.entries(applicantStats.byStatus).map(([status, count]) => (
                  count > 0 && (
                    <div key={status} className="flex items-center justify-between text-sm">
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold",
                        status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                        status === "Reviewed" ? "bg-blue-100 text-blue-700" :
                        status === "Interview" ? "bg-purple-100 text-purple-700" :
                        status === "Offered" ? "bg-green-100 text-green-700" :
                        "bg-red-100 text-red-700"
                      )}>{status}</span>
                      <span className="font-bold">{count as number}</span>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

    </motion.div>
    </>
  );
}
