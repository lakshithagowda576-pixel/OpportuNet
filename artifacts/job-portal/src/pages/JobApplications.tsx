import { useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { trackEvent } from "@/lib/analytics";
import { format } from "date-fns";
import {
  Loader2, ArrowLeft, Users, CheckCircle2, Clock, 
  XCircle, FileText, Building2, Eye, Calendar
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const apiFetch = (path: string) =>
  fetch(`${BASE}/api${path}`, { credentials: "include" }).then(r => r.json());

const STATUS_COLORS: Record<string, string> = {
  "Pre-Registered": "bg-slate-100 text-slate-800 border-slate-200",
  Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Reviewed: "bg-blue-100 text-blue-800 border-blue-200",
  Interview: "bg-purple-100 text-purple-800 border-purple-200",
  Offered: "bg-green-100 text-green-800 border-green-200",
  Rejected: "bg-red-100 text-red-800 border-red-200",
  Redirected: "bg-indigo-100 text-indigo-800 border-indigo-200",
};

export default function JobApplications() {
  const [, params] = useRoute("/jobs/:id/applications");
  const jobId = Number(params?.id);

  useEffect(() => {
    trackEvent({
      eventType: "page_view",
      eventCategory: "Applications",
      eventAction: "view",
      page: `/jobs/${jobId}/applications`,
      metadata: { jobId },
    });
  }, [jobId]);

  const { data: job } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => apiFetch(`/jobs/${jobId}`),
  });

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["job-applications", jobId],
    queryFn: () => apiFetch(`/applications?jobId=${jobId}`),
  });

  if (isLoading) {
    return <div className="flex justify-center py-32"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }

  const stats = {
    total: applications.length,
    pending: applications.filter((a: any) => a.status === "Pending").length,
    reviewed: applications.filter((a: any) => a.status === "Reviewed").length,
    interview: applications.filter((a: any) => a.status === "Interview").length,
    offered: applications.filter((a: any) => a.status === "Offered").length,
    rejected: applications.filter((a: any) => a.status === "Rejected").length,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link href={`/jobs/${jobId}`} className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors gap-1">
        <ArrowLeft className="w-4 h-4" /> Back to Job Details
      </Link>

      {/* Header */}
      <div className="bg-card rounded-3xl p-8 border border-border shadow-xl">
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          Applications for {job?.title}
        </h1>
        <p className="text-muted-foreground flex items-center gap-2">
          <Building2 className="w-4 h-4" /> {job?.company}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total", value: stats.total, icon: Users, color: "text-blue-600 bg-blue-50" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-yellow-600 bg-yellow-50" },
          { label: "Reviewed", value: stats.reviewed, icon: Eye, color: "text-blue-600 bg-blue-50" },
          { label: "Interview", value: stats.interview, icon: FileText, color: "text-purple-600 bg-purple-50" },
          { label: "Offers", value: stats.offered, icon: CheckCircle2, color: "text-green-600 bg-green-50" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-2xl p-4 border border-border ${stat.color.split(" ").pop() === "50" ? stat.color.split(" ").pop() : ""} flex flex-col items-center`}>
            <stat.icon className={`w-6 h-6 mb-2 ${stat.color.split(" ")[0]}`} />
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Applications List */}
      <div className="bg-card rounded-3xl border border-border shadow-xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> All Applications ({applications.length})
          </h2>
        </div>

        {applications.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No applications yet for this job.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Applicant</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Applied Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {applications.map((app: any) => (
                  <tr key={app.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-foreground">{app.applicantName}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-muted-foreground text-sm">{app.applicantEmail}</p>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      {format(new Date(app.appliedAt), "MMM dd, yyyy")}
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn("text-xs font-semibold px-3 py-1 rounded-full border", STATUS_COLORS[app.status])}>
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
