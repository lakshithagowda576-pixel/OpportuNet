import { useState, useEffect, useMemo } from "react";
import { useListJobs, ListJobsCategory } from "@workspace/api-client-react";
import { trackEvent } from "@/lib/analytics";
import { Search, Filter, Loader2, Calendar, MapPin, Briefcase, IndianRupee, ArrowUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { JobCard } from "@/components/JobCard";
import { cn } from "@/lib/utils";

export default function JobsDirectory() {
  const [activeTab, setActiveTab] = useState<ListJobsCategory | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMonth, setActiveMonth] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 21; // 3x7 grid
  const [locationFilter, setLocationFilter] = useState<string>("ALL");
  const [jobTypeFilter, setJobTypeFilter] = useState<string>("ALL");
  const [salaryMin, setSalaryMin] = useState<number | undefined>(undefined);
  const [salaryMax, setSalaryMax] = useState<number | undefined>(undefined);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 500);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    trackEvent({
      eventType: "page_view",
      eventCategory: "JobsDirectory",
      eventAction: "view",
      page: "/jobs",
    });
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const timer = setTimeout(() => {
        trackEvent({
          eventType: "job_search",
          eventCategory: "Search",
          eventAction: "search",
          metadata: { query: searchQuery },
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  const { data: jobs, isLoading: isApiLoading } = useListJobs({
    category: activeTab === "ALL" ? undefined : activeTab,
    search: searchQuery || undefined
  });

  const [localJobs, setLocalJobs] = useState<any[] | undefined>(undefined);
  const [isLocalLoading, setIsLocalLoading] = useState(false);

  useEffect(() => {
    if ((!jobs || jobs.length === 0) && !isApiLoading && !localJobs) {
      setIsLocalLoading(true);
      fetch('/jobs.json')
        .then((r) => r.ok ? r.json() : Promise.reject(new Error('no local jobs')))
        .then((data) => {
          setLocalJobs(data);
          setIsLocalLoading(false);
        })
        .catch(() => {
          setLocalJobs([]);
          setIsLocalLoading(false);
        });
    }
  }, [jobs, isApiLoading, localJobs]);

  const sourceJobs = useMemo(() => jobs ?? localJobs ?? [], [jobs, localJobs]);
  const isLoading = isApiLoading || isLocalLoading;

  const availableLocations = useMemo(() => 
    Array.from(new Set((sourceJobs || []).map((j: any) => j.location))).sort()
  , [sourceJobs]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery, activeMonth, locationFilter, jobTypeFilter, salaryMin, salaryMax]);

  const parseSalary = (s?: string | number) => {
    if (!s) return 0;
    const onlyDigits = (s + "").replace(/[^0-9]/g, "");
    return parseInt(onlyDigits || "0", 10);
  };

  const filteredJobs = useMemo(() => {
    return sourceJobs.filter((job: any) => {
      if (activeTab !== "ALL" && job.category !== activeTab) return false;
      if (searchQuery && !`${job.title} ${job.company} ${job.location}`.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (activeMonth !== "ALL") {
        const startMonth = new Date(job.startDate).getMonth();
        if (startMonth !== parseInt(activeMonth)) return false;
      }
      if (locationFilter !== "ALL" && job.location !== locationFilter) return false;
      if (jobTypeFilter !== "ALL" && job.shift !== jobTypeFilter) return false;
      const numeric = parseSalary(job.salary);
      if (salaryMin !== undefined && numeric < salaryMin) return false;
      if (salaryMax !== undefined && numeric > salaryMax) return false;
      return true;
    });
  }, [sourceJobs, activeTab, searchQuery, activeMonth, locationFilter, jobTypeFilter, salaryMin, salaryMax]);

  const totalPages = Math.max(1, Math.ceil((filteredJobs?.length || 0) / pageSize));
  const paginatedJobs = useMemo(() => 
    filteredJobs.slice((page - 1) * pageSize, page * pageSize)
  , [filteredJobs, page, pageSize]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const categories = [
    { id: "ALL", label: "All Sectors", icon: Briefcase },
    { id: ListJobsCategory.IT, label: "IT Sector", icon: Info },
    { id: ListJobsCategory.NON_IT, label: "Non-IT", icon: Info },
    { id: ListJobsCategory.STATE_GOVT, label: "State Govt", icon: Info },
    { id: ListJobsCategory.CENTRAL_GOVT, label: "Central Govt", icon: Info },
  ];

  const months = [
    { id: "ALL", label: "Any Month" },
    { id: "0", label: "Jan" }, { id: "1", label: "Feb" }, { id: "2", label: "Mar" },
    { id: "3", label: "Apr" }, { id: "4", label: "May" }, { id: "5", label: "Jun" },
    { id: "6", label: "Jul" }, { id: "7", label: "Aug" }, { id: "8", label: "Sep" },
    { id: "9", label: "Oct" }, { id: "10", label: "Nov" }, { id: "11", label: "Dec" },
  ];

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20 px-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-2"
        >
          <h1 className="text-4xl md:text-5xl font-display font-black text-foreground tracking-tight">
            Job <span className="text-primary">Directory</span>
          </h1>
          <p className="text-muted-foreground text-lg font-medium max-w-xl">
            Explore <span className="text-foreground font-bold">{sourceJobs.length.toLocaleString()}+</span> active roles curated for your career growth.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex gap-4"
        >
          <div className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-foreground leading-none">{filteredJobs.length.toLocaleString()}</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Matched Roles</div>
            </div>
          </div>
          <div className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-foreground leading-none">{availableLocations.length}</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Locations</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filter Sidebar + Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-3xl p-6 shadow-xl shadow-primary/5 sticky top-24"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-foreground uppercase tracking-widest text-xs flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" /> Filter Options
              </h3>
              {(searchQuery || activeTab !== "ALL" || activeMonth !== "ALL" || locationFilter !== "ALL" || jobTypeFilter !== "ALL" || salaryMin || salaryMax) && (
                <button 
                  onClick={() => {
                    setSearchQuery(""); setActiveTab("ALL"); setActiveMonth("ALL");
                    setLocationFilter("ALL"); setJobTypeFilter("ALL"); setSalaryMin(undefined); setSalaryMax(undefined);
                  }}
                  className="text-[10px] font-black text-primary hover:underline uppercase"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="space-y-6">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Keyword Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="Role, company, skills..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm font-bold"
                  />
                </div>
              </div>

              {/* Sectors */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Sector</label>
                <div className="flex flex-col gap-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveTab(cat.id as any)}
                      className={cn(
                        "w-full px-4 py-2.5 rounded-xl text-left text-sm font-bold transition-all border flex items-center justify-between group",
                        activeTab === cat.id
                          ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                          : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                      )}
                    >
                      {cat.label}
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md", activeTab === cat.id ? "bg-white/20" : "bg-secondary")}>
                        {cat.id === "ALL" ? sourceJobs.length : sourceJobs.filter(j => j.category === cat.id).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Location</label>
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm font-bold appearance-none cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <option value="ALL">All Locations</option>
                  {availableLocations.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Job Type */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Job Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {['ALL','Full_time','Part_time','Shift','Remote'].map(t => (
                    <button 
                      key={t} 
                      onClick={() => setJobTypeFilter(t)} 
                      className={cn(
                        'px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all border', 
                        jobTypeFilter===t? 'bg-primary text-white border-primary' : 'bg-background text-muted-foreground border-border hover:bg-secondary'
                      )}
                    >
                      {t === 'ALL' ? 'Any' : t.replace('_',' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Salary */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Monthly Salary (₹)</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    placeholder="Min" 
                    value={salaryMin ?? ''} 
                    onChange={(e) => setSalaryMin(e.target.value ? parseInt(e.target.value,10) : undefined)} 
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm font-bold" 
                  />
                  <span className="text-muted-foreground">—</span>
                  <input 
                    type="number" 
                    placeholder="Max" 
                    value={salaryMax ?? ''} 
                    onChange={(e) => setSalaryMax(e.target.value ? parseInt(e.target.value,10) : undefined)} 
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm font-bold" 
                  />
                </div>
              </div>

              {/* Opening Month */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Opening Month</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {months.map((month) => (
                    <button
                      key={month.id}
                      onClick={() => setActiveMonth(month.id)}
                      className={cn(
                        "py-2 rounded-lg text-[9px] font-black uppercase transition-all border text-center",
                        activeMonth === month.id
                          ? "bg-accent text-accent-foreground border-accent shadow-sm"
                          : "bg-background text-muted-foreground border-border hover:bg-secondary"
                      )}
                    >
                      {month.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Jobs Grid */}
        <div className="lg:col-span-3 space-y-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Loading database...</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-foreground">
                  Showing <span className="text-primary">{filteredJobs.length.toLocaleString()}</span> Roles
                </h2>
                <div className="text-xs font-bold text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full border border-border">
                  Page {page} of {totalPages}
                </div>
              </div>

              <AnimatePresence mode="popLayout">
                <motion.div 
                  layout
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                >
                  {paginatedJobs.length ? (
                    paginatedJobs.map((job, idx) => (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (idx % 6) * 0.05 }}
                      >
                        <JobCard job={job} />
                      </motion.div>
                    ))
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="col-span-full py-32 flex flex-col items-center justify-center bg-card rounded-[3rem] border-2 border-dashed border-border text-center px-10"
                    >
                      <div className="w-20 h-20 bg-secondary rounded-3xl flex items-center justify-center mb-6 rotate-3 shadow-inner">
                        <Search className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <h3 className="text-2xl font-black text-foreground mb-3 tracking-tight">No opportunities match your criteria</h3>
                      <p className="text-muted-foreground max-w-sm font-medium leading-relaxed">
                        Try adjusting your filters or search terms. We have {sourceJobs.length.toLocaleString()} other roles available!
                      </p>
                      <button 
                        onClick={() => { setSearchQuery(""); setActiveTab("ALL"); setLocationFilter("ALL"); }}
                        className="mt-8 px-8 py-3 rounded-2xl bg-primary text-white font-black text-sm shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                      >
                        Reset All Filters
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Enhanced Pagination */}
              {filteredJobs.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-10 border-t border-border">
                  <div className="text-sm font-bold text-muted-foreground order-2 sm:order-1">
                    Showing <span className="text-foreground">{(page - 1) * pageSize + 1}</span> to <span className="text-foreground">{Math.min(page * pageSize, filteredJobs.length)}</span> of <span className="text-foreground">{filteredJobs.length.toLocaleString()}</span> roles
                  </div>
                  
                  <div className="flex items-center gap-2 order-1 sm:order-2">
                    <button 
                      onClick={() => { setPage(1); scrollToTop(); }} 
                      disabled={page === 1}
                      className="p-2.5 rounded-xl border border-border bg-card text-muted-foreground disabled:opacity-30 hover:bg-primary/5 hover:text-primary transition-all"
                    >
                      <ChevronsLeft className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => { setPage(Math.max(1, page - 1)); scrollToTop(); }} 
                      disabled={page === 1}
                      className="p-2.5 rounded-xl border border-border bg-card text-muted-foreground disabled:opacity-30 hover:bg-primary/5 hover:text-primary transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-1.5 px-2">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => { setPage(pageNum); scrollToTop(); }}
                            className={cn(
                              "w-10 h-10 rounded-xl text-sm font-black transition-all",
                              page === pageNum 
                                ? "bg-primary text-white shadow-lg shadow-primary/30 scale-110 z-10" 
                                : "bg-card text-muted-foreground border border-border hover:border-primary/50"
                            )}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button 
                      onClick={() => { setPage(Math.min(totalPages, page + 1)); scrollToTop(); }} 
                      disabled={page === totalPages}
                      className="p-2.5 rounded-xl border border-border bg-card text-muted-foreground disabled:opacity-30 hover:bg-primary/5 hover:text-primary transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => { setPage(totalPages); scrollToTop(); }} 
                      disabled={page === totalPages}
                      className="p-2.5 rounded-xl border border-border bg-card text-muted-foreground disabled:opacity-30 hover:bg-primary/5 hover:text-primary transition-all"
                    >
                      <ChevronsRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Floating Scroll to Top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-primary text-white shadow-2xl shadow-primary/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[100]"
          >
            <ArrowUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
