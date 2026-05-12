import { useState } from "react";
import { Link } from "wouter";
import { Building2, MapPin, Clock, IndianRupee, Users, ChevronRight, Calendar, Mail, ExternalLink, AlertCircle, CheckCircle2, Eye, ArrowRight, X, Briefcase } from "lucide-react";
import { Job, JobCategory } from "@workspace/api-client-react";
import { formatDate, cn } from "@/lib/utils";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PreRegisterForm } from "./PreRegisterForm";
import { trackEvent } from "@/lib/analytics";
import { useTranslation } from "react-i18next";

interface JobCardProps {
  job: Job;
  applicantCount?: number;
}

import { motion } from "framer-motion";

export function JobCard({ job, applicantCount }: JobCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showPreRegister, setShowPreRegister] = useState(false);
  const [saved, setSaved] = useState(false);
  const externalApplyUrl = job.official_url || job.applicationLink;
  const hasExternalApply = !!externalApplyUrl && externalApplyUrl.startsWith("http");
  const { t } = useTranslation();
  
  // Generate fallback URL if no official URL exists
  const getFallbackUrl = (company: string) => {
    const cleanCompany = company.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    return `https://www.google.com/search?q=${encodeURIComponent(cleanCompany + ' careers jobs official website')}`;
  };
  
  const applyUrl = hasExternalApply ? externalApplyUrl : getFallbackUrl(job.company);
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case JobCategory.IT: return "bg-blue-50 text-blue-600 border-blue-100";
      case JobCategory.NON_IT: return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case JobCategory.STATE_GOVT: return "bg-purple-50 text-purple-600 border-purple-100";
      case JobCategory.CENTRAL_GOVT: return "bg-amber-50 text-amber-600 border-amber-100";
      default: return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "IT": return "IT Sector";
      case "NON_IT": return "Corporate";
      case "STATE_GOVT": return "State Govt";
      case "CENTRAL_GOVT": return "Central Govt";
      default: return category.replace("_", " ");
    }
  };

  const getShiftLabel = (shift: string) => {
    switch (shift) {
      case "Full_time": return "Full Time";
      case "Part_time": return "Part Time";
      default: return shift;
    }
  };

  const today = new Date();
  const start = new Date(job.startDate);
  const end = new Date(job.endDate);
  end.setHours(23, 59, 59, 999);

  const isClosed = today > end;
  const isFuture = today < start;
  const isOpen = !isClosed && !isFuture;

  const daysLeft = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const getStatusBadge = () => {
    if (isClosed) {
      return (
        <span className="flex items-center gap-1.5 text-[10px] uppercase font-black text-red-600 bg-red-50/50 px-2 py-1 rounded-lg border border-red-100">
          <div className="w-1 h-1 rounded-full bg-red-600 animate-pulse"></div> Closed
        </span>
      );
    }
    if (isFuture) {
      return (
        <span className="flex items-center gap-1.5 text-[10px] uppercase font-black text-blue-600 bg-blue-50/50 px-2 py-1 rounded-lg border border-blue-100">
          <Calendar className="w-3 h-3" /> Opening Soon
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-[10px] uppercase font-black text-emerald-600 bg-emerald-50/50 px-2 py-1 rounded-lg border border-emerald-100">
        <div className="w-1 h-1 rounded-full bg-emerald-600 animate-ping"></div> Live Now
      </span>
    );
  };

  return (
    <motion.div 
      whileHover={{ y: -2, scale: 1.005 }}
      className="group bg-white dark:bg-slate-900 rounded-3xl p-5 border border-border/50 hover:border-primary/20 shadow-sm transition-all duration-300 flex flex-col h-full relative"
    >

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-start mb-5 gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={cn("px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border", getCategoryColor(job.category))}>
                {getCategoryLabel(job.category)}
              </span>
              {getStatusBadge()}
              <span className={cn("text-[10px] font-bold px-2 py-1 rounded-lg", daysLeft < 7 ? 'text-red-500 bg-red-50' : 'text-green-500 bg-green-50')}>
                {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
              </span>
            </div>
            <h3 className="font-display font-black text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-[1.2]">
              {job.title}
            </h3>
            <div className="flex items-center gap-2 mt-2 text-muted-foreground">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center p-1.5">
                <Building2 className="w-full h-full text-muted-foreground" />
              </div>
              <span className="text-sm font-bold truncate">{job.company}</span>
            </div>
          </div>
        </div>

        {/* Description snippet */}
        <p className="text-sm text-muted-foreground/80 line-clamp-2 mb-6 leading-relaxed font-medium">
          {job.description}
        </p>

        {/* Details row */}
        <div className="flex flex-wrap gap-2 mb-6">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/50 text-[10px] font-bold text-muted-foreground">
            <MapPin className="w-3 h-3" /> {job.location}
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/50 text-[10px] font-bold text-muted-foreground">
            <Clock className="w-3 h-3" /> {getShiftLabel(job.shift)}
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-[10px] font-black text-primary">
            <IndianRupee className="w-3 h-3" /> {job.salary}
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-border/50 flex items-center gap-2">
          <button
            onClick={() => {
              setShowDetails(true);
              trackEvent({
                eventType: "job_details_viewed",
                eventCategory: "Job",
                eventAction: "view_details",
                metadata: { jobId: job.id, company: job.company, category: job.category },
              });
            }}
            className="p-2.5 rounded-xl bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
            title={t("jobs.viewDetails")}
          >
            <Eye className="w-4 h-4" />
          </button>

          <button 
            onClick={() => {
              fetch('/api/favorites', { method: 'POST', body: JSON.stringify({ jobId: job.id }) });
              setSaved(true);
              trackEvent({
                eventType: "job_saved",
                eventCategory: "Job",
                eventAction: "save",
                metadata: { jobId: job.id, company: job.company },
              });
            }}
            className={cn(
              "p-2.5 rounded-xl transition-all flex items-center gap-2 text-xs font-bold",
              saved ? "bg-amber-100 text-amber-600" : "bg-secondary text-muted-foreground hover:bg-amber-50 hover:text-amber-600"
            )}
            title={saved ? t("jobs.saved") : t("jobs.saveJob")}
          >
            {saved ? '⭐ ' + t("jobs.saved") : '☆ ' + t("jobs.saveJob")}
          </button>
 
            <button
              onClick={() => {
                const eventType = isFuture ? "job_pre_registered" : "job_apply_clicked";
                trackEvent({
                  eventType,
                  eventCategory: "Application",
                  eventAction: "apply_click",
                  metadata: { jobId: job.id, company: job.company, category: job.category, status: isClosed ? "closed" : isFuture ? "future" : "open" },
                });
                if (isFuture) {
                  setShowPreRegister(true);
                } else {
                  // Open link in a new tab safely
                  try {
                    const a = document.createElement('a');
                    a.href = applyUrl;
                    a.target = '_blank';
                    a.rel = 'noopener noreferrer';
                    a.click();
                  } catch (e) {
                    const newWin = window.open(applyUrl, '_blank');
                    if (newWin) newWin.opener = null;
                  }
                }
              }}
              className={cn(
                "flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all group/btn",
                isClosed
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-white hover:bg-primary/90 hover:scale-[1.01]"
              )}
              disabled={isClosed}
            >
              {isClosed ? "Closed" : isFuture ? "Pre-Register" : t("jobs.apply")}
              {!isClosed && <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />}
            </button>
        </div>
      </div>


      {/* Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold text-foreground">{job.title}</DialogTitle>
                <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                  <Building2 className="w-5 h-5" />
                  <span className="font-semibold">{job.company}</span>
                </div>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Quick Info */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-xs text-blue-600 font-semibold">Location</div>
                <div className="text-sm text-blue-900 font-medium mt-1">{job.location}</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-xs text-green-600 font-semibold">Shift</div>
                <div className="text-sm text-green-900 font-medium mt-1">{getShiftLabel(job.shift)}</div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="text-xs text-purple-600 font-semibold">Salary</div>
                <div className="text-sm text-purple-900 font-medium mt-1">{job.salary}</div>
              </div>
            </div>

            {/* Company Summary */}
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-4 border border-primary/20">
              <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" /> About {job.company}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {job.company} is a leading organization committed to excellence and innovation. We foster a culture of continuous learning and professional growth for our team members.
              </p>
            </div>

            {/* Job Description */}
            <div>
              <h3 className="font-bold text-foreground mb-2">About the Role</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{job.description}</p>
            </div>

            {/* Requirements */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-bold text-blue-900 mb-3">Job Requirements</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-blue-900">Must meet the specified eligibility criteria</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-blue-900">Strong technical and communication skills</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-blue-900">Ability to work in a collaborative environment</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-blue-900">Commitment to professional development</span>
                </div>
              </div>
            </div>

            {/* Eligibility & Qualifications */}
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h3 className="font-bold text-amber-900 mb-2">Eligibility Criteria</h3>
                <p className="text-sm text-amber-900">{job.eligibility || "Candidates meeting the job requirements and company standards are eligible to apply."}</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <h3 className="font-bold text-orange-900 mb-2">Required Qualifications</h3>
                <p className="text-sm text-orange-900">Bachelor's degree in relevant field or equivalent professional experience. Industry-specific certifications preferred.</p>
              </div>
            </div>

            {/* Application Timeline */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5" /> Application Timeline
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-purple-900">Application Opens:</span>
                  <span className="font-semibold text-purple-700">{formatDate(job.startDate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-purple-900">Application Closes:</span>
                  <span className="font-semibold text-destructive">{formatDate(job.endDate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-purple-900">Total Openings:</span>
                  <span className="font-semibold text-purple-700">{job.openings}</span>
                </div>
              </div>
            </div>

            {/* Application Steps */}
            <div className="space-y-3">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-primary" /> How to Apply
              </h3>
              <div className="bg-gray-50 border border-border rounded-xl p-4 space-y-3">
                {job.applicationGuide ? (
                  job.applicationGuide.split("\n").filter(s => s.trim()).map((step, i) => {
                    const cleanStep = step.replace(/^Step \d+:\s*/i, "");
                    const parts = cleanStep.split(/:(.+)/);
                    return (
                      <div key={i} className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">{i + 1}</div>
                        <div>
                          <div className={cn("text-foreground", parts[1] ? "font-semibold" : "pt-1 text-sm font-medium")}>{parts[0]}</div>
                          {parts[1] && <div className="text-sm text-muted-foreground mt-0.5">{parts[1].trim()}</div>}
                        </div>
                      </div>
                    );
                  })
                ) : hasExternalApply ? (
                  <>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                      <div>
                        <div className="font-semibold text-foreground">Redirect to Official Portal</div>
                        <div className="text-sm text-muted-foreground mt-0.5">Click the apply button to visit the employer's official website.</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                      <div>
                        <div className="font-semibold text-foreground">Create/Login to Account</div>
                        <div className="text-sm text-muted-foreground mt-0.5">Register or log in to the external career portal.</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                      <div>
                        <div className="font-semibold text-foreground">Submit Application</div>
                        <div className="text-sm text-muted-foreground mt-0.5">Fill in your details and upload required documents on their platform.</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                      <div>
                        <div className="font-semibold text-foreground">Click Apply Button</div>
                        <div className="text-sm text-muted-foreground mt-0.5">Start your application directly through OpportuNet.</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                      <div>
                        <div className="font-semibold text-foreground">Review Profile Data</div>
                        <div className="text-sm text-muted-foreground mt-0.5">Ensure your OpportuNet profile and resume are up-to-date.</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                      <div>
                        <div className="font-semibold text-foreground">One-Click Submit</div>
                        <div className="text-sm text-muted-foreground mt-0.5">Submit your application instantly and track it in your dashboard.</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <button
                onClick={() => isFuture ? (setShowDetails(false), setShowPreRegister(true)) : (hasExternalApply ? (function(){ try { const a = document.createElement('a'); a.href = externalApplyUrl; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.click(); } catch(e){ const w = window.open(externalApplyUrl,'_blank'); if(w) w.opener = null;} })() : null)}
                className={cn(
                  "w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-base font-bold transition-all shadow-lg",
                  isClosed
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-primary text-white hover:bg-primary/90 shadow-primary/30 hover:-translate-y-0.5"
                )}
                disabled={isClosed}
              >
                {isClosed ? "Application Closed" : isFuture ? "Pre-Register Now" : t("jobs.apply")}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Pre-Register Dialog */}
      <Dialog open={showPreRegister} onOpenChange={setShowPreRegister}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-8">
          <PreRegisterForm 
            jobId={job.id}
            jobTitle={job.title}
            company={job.company}
            onClose={() => setShowPreRegister(false)}
            onSuccess={() => setShowPreRegister(false)}
          />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
