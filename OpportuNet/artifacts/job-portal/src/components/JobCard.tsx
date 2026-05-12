import { Link } from "wouter";
import { Building2, MapPin, Clock, IndianRupee, Users, ChevronRight, Calendar, Mail, ExternalLink, BookOpen } from "lucide-react";
import { Job, JobCategory } from "@workspace/api-client-react";
import { formatDate, cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface JobCardProps {
  job: Job;
  applicantCount?: number;
  index?: number;
}

export function JobCard({ job, applicantCount, index = 0 }: JobCardProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case JobCategory.IT: return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
      case JobCategory.NON_IT: return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800";
      case JobCategory.STATE_GOVT: return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800";
      case JobCategory.CENTRAL_GOVT: return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "IT": return "IT Sector";
      case "NON_IT": return "Non-IT";
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="group bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border/60 shadow-lg hover:shadow-2xl hover:border-primary/40 transition-all flex flex-col h-full relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 rounded-2xl -z-10"></div>
      
      {/* Header */}
      <div className="flex justify-between items-start mb-3 gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
            {job.title}
          </h3>
          <div className="flex items-center gap-1.5 mt-1.5 text-muted-foreground text-sm">
            <Building2 className="w-4 h-4 shrink-0 text-primary/70" />
            <span className="font-medium truncate">{job.company}</span>
          </div>
        </div>
        <span className={cn("px-2.5 py-1.5 rounded-lg text-[11px] font-bold border whitespace-nowrap shrink-0 shadow-sm", getCategoryColor(job.category))}>
          {getCategoryLabel(job.category)}
        </span>
      </div>

      {/* Description snippet */}
      <p className="text-sm text-muted-foreground line-clamp-2 mb-5 leading-relaxed">
        {job.description}
      </p>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-y-3 gap-x-2 mb-5 text-xs text-muted-foreground bg-secondary/30 p-3 rounded-xl border border-border/50">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-primary/80 shrink-0" />
          <span className="line-clamp-1 font-medium">{job.location}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-primary/80 shrink-0" />
          <span className="font-medium">{getShiftLabel(job.shift)}</span>
        </div>
        <div className="flex items-center gap-1.5 col-span-2">
          <IndianRupee className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="font-bold text-foreground text-sm">{job.salary}</span>
        </div>
        <div className="flex items-center gap-1.5 col-span-2">
          <Calendar className="w-3.5 h-3.5 text-primary/70 shrink-0" />
          <span><span className="font-medium text-foreground">{formatDate(job.startDate)}</span> → <span className="font-medium text-destructive">{formatDate(job.endDate)}</span></span>
        </div>
      </div>

      {/* Openings badge */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-50/80 text-emerald-700 border border-emerald-200/60 font-bold shadow-sm flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          {job.openings} Opening{job.openings !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="mt-auto pt-4 border-t border-border/60 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          href={`/apply/${job.id}`}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
        >
          <BookOpen className="w-4 h-4" /> Apply Here
        </Link>

        {job.applicationLink ? (
          <a
            href={job.applicationLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-secondary text-foreground hover:bg-secondary/90 transition-all duration-300"
          >
            <ExternalLink className="w-4 h-4" /> Apply Now
          </a>
        ) : (
          <Link
            href={`/apply/${job.id}`}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-secondary text-foreground hover:bg-secondary/90 transition-all duration-300"
          >
            <ExternalLink className="w-4 h-4" /> Apply Now
          </Link>
        )}

        <Link
          href={`/jobs/${job.id}`}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-card text-muted-foreground hover:bg-secondary transition-all duration-300"
        >
          View Details
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}
