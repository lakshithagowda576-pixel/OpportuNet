import { useEffect, useMemo } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { trackEvent } from "@/lib/analytics";
import {
  useListJobs,
  useListApplications,
  getListApplicationsQueryKey
} from "@workspace/api-client-react";
import {
  Briefcase,
  FileText,
  TrendingUp,
  ArrowRight,
  Loader2,
  Building2,
  GraduationCap,
  LayoutDashboard,
  Sparkles,
  ExternalLink,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Zap
} from "lucide-react";
import { JobCard } from "@/components/JobCard";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Dashboard() {
  const { user } = useAuth();
  const { data: jobs, isLoading: isJobsLoading } = useListJobs();
  const { data: applications, isLoading: isAppsLoading, error: appsError } = useListApplications({ 
    query: { 
      queryKey: getListApplicationsQueryKey(),
      enabled: !!user 
    } 
  });

  // Group applications by recent days (last 7 days)
  const recentActivityByDay = useMemo(() => {
    if (!applications) return {};
    
    const grouped: Record<string, any[]> = {};
    const today = new Date();
    
    applications.forEach((app: any) => {
      const appDate = new Date(app.appliedAt);
      const diffTime = today.getTime() - appDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      let dayLabel = "";
      if (diffDays === 0) dayLabel = "Today";
      else if (diffDays === 1) dayLabel = "Yesterday";
      else if (diffDays < 7) dayLabel = `${diffDays} days ago`;
      else return;
      
      if (!grouped[dayLabel]) grouped[dayLabel] = [];
      grouped[dayLabel].push(app);
    });
    
    return grouped;
  }, [applications]);

  useEffect(() => {
    trackEvent({
      eventType: "page_view",
      eventCategory: "Dashboard",
      eventAction: "view",
      page: "/dashboard",
      metadata: { jobCount: jobs?.length || 0, applicationCount: applications?.length || 0 },
    });
  }, []);
  const { data: appSummary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["applicationSummary"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/applications/summary`, { credentials: "include" });
      if (!res.ok) return { total: 0, byStatus: {}, byCategory: {} };
      return res.json();
    },
    enabled: !!user // Only fetch summary if user is logged in
  });

  if (isJobsLoading || isAppsLoading || isSummaryLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-sm font-black uppercase tracking-widest text-muted-foreground animate-pulse">Initializing Portal...</p>
        </div>
      </div>
    );
  }

  // Filter jobs by sector
  const itJobs = jobs?.filter(j => j.category === "IT").slice(0, 3) || [];
  const nonItJobs = jobs?.filter(j => j.category === "NON_IT").slice(0, 3) || [];
  const stateGovtJobs = jobs?.filter(j => j.category === "STATE_GOVT").slice(0, 3) || [];
  const centralGovtJobs = jobs?.filter(j => j.category === "CENTRAL_GOVT").slice(0, 3) || [];
  const upcomingJobs = jobs?.filter(j => new Date(j.startDate) > new Date()).slice(0, 4) || [];

  const stats = [
    {
      label: "Active Roles",
      value: jobs?.length || 0,
      icon: Briefcase,
      trend: "Verified Today",
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      label: "Your Submissions",
      value: appSummary?.total ?? applications?.length ?? 0,
      icon: FileText,
      trend: `${appSummary?.byStatus?.Offered || 0} Successful`,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      label: "In Review",
      value: (appSummary?.byStatus?.Pending || 0) + (appSummary?.byStatus?.Reviewed || 0),
      icon: TrendingUp,
      trend: "Tracking Live",
      color: "text-purple-600",
      bg: "bg-purple-50"
    },
    {
      label: "Sectors Covered",
      value: "04",
      icon: LayoutDashboard,
      trend: "State & Central",
      color: "text-amber-600",
      bg: "bg-amber-50"
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const SectionHeader = ({ title, link, icon: Icon, color }: { title: string, link: string, icon: any, color: string }) => (
    <div className="flex items-center justify-between mb-8 group">
      <div className="flex items-center gap-4">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-12 duration-500", color)}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-black text-foreground">
            {title}
          </h2>
          <div className="h-1 w-12 bg-primary/20 rounded-full mt-1 group-hover:w-24 transition-all duration-500"></div>
        </div>
      </div>
      <Link href={link} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-sm font-black hover:bg-primary hover:text-white transition-all group-hover:shadow-lg">
        Explore <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-16 pb-20"
    >
      {/* Hero Section */}
      <motion.section 
        variants={itemVariants}
        className="relative rounded-[3rem] overflow-hidden bg-[#060B19] min-h-[450px] flex items-center group border border-indigo-900/20 shadow-[0_0_100px_-20px_rgba(79,70,229,0.15)]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-[#060B19] to-violet-900/20 z-10"></div>
        <div className="absolute inset-0 overflow-hidden">
           <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse"></div>
           <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative z-20 p-8 md:p-16 w-full flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex-1 text-center md:text-left space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> India's Most Unified Portal
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
              className="text-5xl md:text-7xl font-display font-black tracking-tighter leading-[1.1] text-white">
              Bridge to Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-fuchsia-400">
                Professional Future.
              </span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
              className="text-indigo-100/60 text-lg max-w-xl font-medium leading-relaxed">
              OpportuNet simplifies your career journey across IT sectors, Corporate roles, and Government examinations with real-time tracking and guided applications.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
              className="flex flex-wrap gap-4 justify-center md:justify-start">
              <Link href="/jobs" className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-black shadow-2xl shadow-indigo-600/40 hover:scale-105 hover:bg-indigo-500 transition-all active:scale-95 flex items-center gap-2">
                Browse Directory <ArrowRight className="w-5 h-5" />
              </Link>
              <div className="flex flex-wrap gap-4">
                <Link href="/exams" className="px-8 py-4 rounded-2xl bg-white/5 text-white font-black backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2">
                  PG-CET Hub <GraduationCap className="w-5 h-5" />
                </Link>
              </div>
            </motion.div>
          </div>

          <div className="hidden lg:block flex-1 relative">
             <div className="relative w-full aspect-square max-w-md mx-auto">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-[3rem] rotate-6 opacity-30 blur-lg animate-pulse"></div>
                <div className="absolute inset-0 bg-[#090E1F]/90 backdrop-blur-2xl border border-indigo-500/20 rounded-[3rem] p-8 shadow-2xl overflow-hidden group-hover:rotate-0 transition-transform duration-700">
                    <div className="space-y-6">
                       {[1,2,3].map(i => (
                         <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 hover:bg-indigo-500/10 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shadow-inner">
                               <Briefcase className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div className="flex-1 h-2 bg-indigo-500/20 rounded-full"></div>
                            <div className="w-12 h-2 bg-purple-500/30 rounded-full"></div>
                         </div>
                       ))}
                    </div>
                </div>
             </div>
          </div>
        </div>
      </motion.section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, index) => (
          <motion.div
            variants={itemVariants}
            key={stat.label}
            className="group bg-card hover:bg-white rounded-[2.5rem] p-8 border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-500"
          >
            <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner`}>
              <stat.icon className="w-7 h-7" />
            </div>
            <h3 className="text-4xl font-display font-black text-foreground mb-1 tracking-tighter">
              {stat.value}
            </h3>
            <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">{stat.label}</p>
            <div className="mt-6 pt-6 border-t border-border/50 flex items-center justify-between">
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">{stat.trend}</span>
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Upcoming Opportunities */}
      {upcomingJobs.length > 0 && (
        <motion.section variants={itemVariants} className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[3rem] p-10 border border-indigo-500/20 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] -z-0"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-black text-white">Upcoming Opportunities</h2>
                  <p className="text-indigo-300/60 text-sm font-medium uppercase tracking-widest">Pre-Register for Fast Application</p>
                </div>
              </div>
              <Link href="/jobs" className="px-6 py-3 rounded-xl bg-white/10 text-white text-sm font-black hover:bg-white/20 transition-all backdrop-blur-xl border border-white/10">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {upcomingJobs.map(job => (
                <div key={job.id} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-widest border border-indigo-500/30">
                      {job.category}
                    </span>
                    <Calendar className="w-4 h-4 text-indigo-400" />
                  </div>
                  <h4 className="font-bold text-white mb-1 truncate group-hover:text-indigo-300 transition-colors">{job.title}</h4>
                  <p className="text-xs text-indigo-100/40 font-medium mb-6 flex items-center gap-1.5">
                    <Building2 className="w-3 h-3" /> {job.company}
                  </p>
                  <Link href="/jobs" className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-500 transition-all">
                    Pre-Register <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Recent Days Activity Timeline */}
      {Object.keys(recentActivityByDay).length > 0 && (
        <motion.section variants={itemVariants} className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-[3rem] p-8 md:p-12 border border-border shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent -z-0 blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-12">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-lg shadow-primary/30">
                <Zap className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-display font-black text-foreground">Recent Days Activity</h2>
                <p className="text-sm text-muted-foreground font-medium mt-1">Your applications from the last 7 days</p>
              </div>
            </div>

            <div className="space-y-8">
              {["Today", "Yesterday", "2 days ago", "3 days ago", "4 days ago", "5 days ago", "6 days ago"].map((dayLabel, index) => 
                recentActivityByDay[dayLabel] && recentActivityByDay[dayLabel].length > 0 ? (
                  <motion.div
                    key={dayLabel}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                  >
                    {/* Timeline Connector */}
                    {index !== Object.keys(recentActivityByDay).length - 1 && (
                      <div className="absolute left-6 top-16 w-1 h-8 bg-gradient-to-b from-primary/60 to-transparent"></div>
                    )}
                    
                    <div className="flex items-start gap-6">
                      {/* Timeline Dot */}
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-lg shadow-primary/40 z-10 relative border-4 border-background">
                          {dayLabel === "Today" ? (
                            <Zap className="w-5 h-5" />
                          ) : dayLabel === "Yesterday" ? (
                            <Clock className="w-5 h-5" />
                          ) : (
                            <Calendar className="w-5 h-5" />
                          )}
                        </div>
                      </div>

                      {/* Activities Container */}
                      <div className="flex-1 mt-1">
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="text-lg font-display font-black text-foreground">{dayLabel}</h3>
                          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black">{recentActivityByDay[dayLabel].length} application{recentActivityByDay[dayLabel].length > 1 ? 's' : ''}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {recentActivityByDay[dayLabel].map((app: any) => (
                            <motion.div
                              key={app.id}
                              whileHover={{ y: -4 }}
                              className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-border hover:border-primary/50 shadow-sm hover:shadow-lg transition-all group"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary">
                                  {app.examId ? (
                                    <GraduationCap className="w-5 h-5" />
                                  ) : (
                                    <Briefcase className="w-5 h-5" />
                                  )}
                                </div>
                                <span className={cn(
                                  "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5",
                                  app.status === "Pending" ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900" :
                                  app.status === "Offered" ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900" :
                                  app.status === "Reviewed" ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900" :
                                  "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600"
                                )}>
                                  {app.status === "Pending" && <Clock className="w-3 h-3" />}
                                  {app.status === "Offered" && <CheckCircle className="w-3 h-3" />}
                                  {app.status === "Reviewed" && <AlertCircle className="w-3 h-3" />}
                                  {app.status}
                                </span>
                              </div>

                              <h4 className="font-bold text-foreground text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                                {app.examId ? app.examName : app.job?.title || "Application"}
                              </h4>
                              <p className="text-xs text-muted-foreground font-medium mb-3">
                                {app.examId ? "KEA Karnataka" : app.job?.company || "Company"}
                              </p>

                              <div className="pt-3 border-t border-border/50 flex items-center justify-between text-[10px]">
                                <span className="text-muted-foreground font-black uppercase">Applied</span>
                                <span className="font-bold text-foreground">
                                  {new Date(app.appliedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : null
              )}
            </div>

            <div className="mt-12 pt-8 border-t border-border/50">
              <Link href="/applications" className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-primary text-white font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40">
                <FileText className="w-5 h-5" />
                View Complete Application History
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </motion.section>
      )}

      {/* Recent Activity */}
      {applications && applications.length > 0 && (
        <motion.section variants={itemVariants} className="bg-card rounded-[3rem] p-8 md:p-10 border border-border shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <h2 className="text-2xl md:text-3xl font-display font-black text-foreground flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" /> Your Submissions
            </h2>
            <Link href="/applications" className="text-sm font-bold text-primary hover:underline whitespace-nowrap">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {applications.slice(0, 6).map((app: any) => (
              <motion.div
                key={app.id}
                whileHover={{ y: -4 }}
                className="p-6 bg-secondary/30 rounded-2xl border border-border/50 hover:bg-secondary/50 hover:border-primary/30 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                    {app.examId ? (
                      <GraduationCap className="w-5 h-5 text-primary" />
                    ) : (
                      <Briefcase className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                    app.status === "Pending" ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400" :
                    app.status === "Offered" ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400" :
                    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400"
                  )}>
                    {app.status}
                  </span>
                </div>
                <h4 className="font-bold text-foreground mb-1 truncate group-hover:text-primary transition-colors">
                  {app.examId ? app.examName : app.job?.title || "Application"}
                </h4>
                <p className="text-xs text-muted-foreground font-medium mb-4">
                  {app.examId ? "KEA Karnataka" : app.job?.company || "Company"}
                </p>
                <div className="pt-4 border-t border-border/50 flex justify-between items-center">
                   <span className="text-[10px] font-black text-muted-foreground uppercase">Applied</span>
                   <span className="text-xs font-bold text-foreground">
                     {new Date(app.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                   </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16">

        {/* IT Sector */}
        <motion.section variants={itemVariants}>
          <SectionHeader
            title="Technology & IT"
            link="/jobs?category=IT"
            icon={Briefcase}
            color="bg-blue-600 text-white shadow-blue-200"
          />
          <div className="grid grid-cols-1 gap-6">
            {itJobs.map(job => <JobCard key={job.id} job={job} />)}
            {itJobs.length === 0 && <p className="text-muted-foreground italic text-center py-10 bg-secondary/20 rounded-3xl border border-dashed border-border">No IT roles available.</p>}
          </div>
        </motion.section>

        {/* Corporate */}
        <motion.section variants={itemVariants}>
          <SectionHeader
            title="Corporate & Non-IT"
            link="/jobs?category=NON_IT"
            icon={Building2}
            color="bg-emerald-600 text-white shadow-emerald-200"
          />
          <div className="grid grid-cols-1 gap-6">
            {nonItJobs.map(job => <JobCard key={job.id} job={job} />)}
            {nonItJobs.length === 0 && <p className="text-muted-foreground italic text-center py-10 bg-secondary/20 rounded-3xl border border-dashed border-border">No Corporate roles available.</p>}
          </div>
        </motion.section>

        {/* State Govt */}
        <motion.section variants={itemVariants}>
          <SectionHeader
            title="State Government"
            link="/jobs?category=STATE_GOVT"
            icon={FileText}
            color="bg-purple-600 text-white shadow-purple-200"
          />
          <div className="grid grid-cols-1 gap-6">
            {stateGovtJobs.map(job => <JobCard key={job.id} job={job} />)}
            {stateGovtJobs.length === 0 && <p className="text-muted-foreground italic text-center py-10 bg-secondary/20 rounded-3xl border border-dashed border-border">No State Govt roles available.</p>}
          </div>
        </motion.section>

        {/* Central Govt */}
        <motion.section variants={itemVariants}>
          <SectionHeader
            title="Central Government"
            link="/jobs?category=CENTRAL_GOVT"
            icon={TrendingUp}
            color="bg-amber-600 text-white shadow-amber-200"
          />
          <div className="grid grid-cols-1 gap-6">
            {centralGovtJobs.map(job => <JobCard key={job.id} job={job} />)}
            {centralGovtJobs.length === 0 && <p className="text-muted-foreground italic text-center py-10 bg-secondary/20 rounded-3xl border border-dashed border-border">No Central Govt roles available.</p>}
          </div>
        </motion.section>

      </div>

      {/* PG-CET CTA */}
      <motion.section
        variants={itemVariants}
        className="relative bg-slate-900 rounded-[3rem] p-10 md:p-16 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/20 to-transparent z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
        <div className="relative z-10 flex items-center gap-8">
          <div className="w-24 h-24 bg-gradient-to-tr from-primary to-accent rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-primary/40 group-hover:scale-110 transition-transform duration-500">
            <GraduationCap className="w-12 h-12" />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-display font-black text-white mb-2 tracking-tighter">Academic Excellence Hub</h2>
            <p className="text-white/50 max-w-md font-medium">Ace your PG-CET 2026 with curated study materials, real-time exam tracking, and application assistance.</p>
          </div>
        </div>
        <Link href="/exams" className="relative z-10 px-10 py-5 bg-white text-slate-950 rounded-2xl font-black shadow-2xl hover:bg-primary hover:text-white transition-all duration-300 flex items-center gap-3 group/btn">
          Access Hub <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
        </Link>
      </motion.section>
    </motion.div>
  );
}
