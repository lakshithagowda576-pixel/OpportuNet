import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Briefcase, LayoutDashboard, FileText, GraduationCap, Menu, X,
  Bell, Shield, LogOut, LogIn, ChevronDown, User,
  Github, Twitter, Mail, MapPin, Phone, ExternalLink, Sparkles, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Info, Star } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";
import JobAlertNotification from "@/components/JobAlertNotification";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, logout, isLoading } = useAuth();
  const [showMonthlyUpdate, setShowMonthlyUpdate] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const currentMonth = new Date().getMonth();
    const lastShown = localStorage.getItem("lastMonthlyUpdate");
    
    if (lastShown !== currentMonth.toString()) {
      const timer = setTimeout(() => {
        setShowMonthlyUpdate(true);
        localStorage.setItem("lastMonthlyUpdate", currentMonth.toString());
      }, 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navigation = [
    { name: t("nav.dashboard"), href: "/", icon: LayoutDashboard },
    { name: t("nav.jobs"), href: "/jobs", icon: Briefcase },
    { name: t("nav.applications"), href: "/applications", icon: FileText },
    { name: t("nav.jobAlerts"), href: "/job-alerts", icon: Bell },
    { name: t("nav.exams"), href: "/exams", icon: GraduationCap },
  ];

  if (user?.role === "admin") {
    navigation.push({ name: t("nav.admin"), href: "/admin", icon: Shield });
  }

  const initials = user ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "?";

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/20">
      {/* Top Navigation Bar */}
      <header className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300 border-b",
        isScrolled 
          ? "bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-border/50 py-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)]" 
          : "bg-transparent border-transparent py-4"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="relative w-10 h-10 overflow-hidden rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-all duration-500 group-hover:rotate-12 flex items-center justify-center p-1.5 shadow-inner">
                   <div className="absolute inset-0 bg-gradient-to-tr from-primary to-accent opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  <img 
                    src={`${import.meta.env.BASE_URL}logo.png`} 
                    alt="OpportuNet Logo" 
                    className="w-full h-full object-contain relative z-10"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-black text-xl text-foreground tracking-tighter hidden sm:block leading-none">
                    Opportu<span className="text-primary">Net</span>
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground hidden sm:block">Future Ready</span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 bg-secondary/50 p-1 rounded-2xl border border-border/50 backdrop-blur-sm">
              {navigation.map((item) => {
                const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                return (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    className={cn(
                      "relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 group flex items-center gap-2 overflow-hidden",
                      isActive 
                        ? "text-primary bg-white shadow-sm" 
                        : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                    )}
                  >
                    <item.icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", isActive ? "text-primary" : "text-muted-foreground")} />
                    {item.name}
                    {isActive && (
                      <motion.div 
                        layoutId="nav-active" 
                        className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {!isLoading && (
                user ? (
                  <div className="relative">
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-2xl bg-secondary/80 hover:bg-secondary transition-all group border border-border/50 shadow-sm"
                    >
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-accent text-white flex items-center justify-center font-bold text-xs shadow-md group-hover:scale-105 transition-transform">
                        {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full rounded-xl object-cover" /> : initials}
                      </div>
                      <span className="text-sm font-bold text-foreground hidden sm:block max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                      <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300", isUserMenuOpen && "rotate-180")} />
                    </button>

                    <AnimatePresence>
                      {isUserMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)} />
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 top-full mt-3 w-64 bg-card/95 backdrop-blur-2xl border border-border rounded-[2rem] shadow-2xl shadow-primary/10 z-20 overflow-hidden"
                          >
                            <div className="px-6 py-5 border-b border-border bg-primary/5">
                              <p className="font-black text-foreground text-sm truncate">{user.name}</p>
                              <p className="text-xs text-muted-foreground font-medium truncate">{user.email}</p>
                              <div className="flex gap-2 mt-2">
                                <span className={cn(
                                  "text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider",
                                  user.role === "admin" ? "bg-red-100 text-red-700" : "bg-primary/10 text-primary"
                                )}>
                                  {user.role === "admin" ? "Administrator" : "Candidate"}
                                </span>
                              </div>
                            </div>
                            <div className="p-2">
                              <Link href="/profile" onClick={() => setIsUserMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all group">
                                <div className="p-2 rounded-lg bg-secondary group-hover:bg-primary/10 transition-colors">
                                  <User className="w-4 h-4" />
                                </div>
                                My Profile
                              </Link>
                              <Link href="/applications" onClick={() => setIsUserMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all group">
                                <div className="p-2 rounded-lg bg-secondary group-hover:bg-primary/10 transition-colors">
                                  <FileText className="w-4 h-4" />
                                </div>
                                My Applications
                              </Link>
                              <div className="h-px bg-border my-2 mx-4" />
                              <button
                                onClick={() => { logout(); setIsUserMenuOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all group">
                                <div className="p-2 rounded-lg bg-red-100/50 group-hover:bg-red-100 transition-colors">
                                  <LogOut className="w-4 h-4" />
                                </div>
                                Sign Out
                              </button>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link href="/login"
                    className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-primary text-white text-sm font-black hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 hover:scale-105 active:scale-95">
                    <LogIn className="w-4 h-4" /> Sign In
                  </Link>
                )
              )}

              <LanguageSwitcher />
              <ThemeToggle />

              {/* Mobile Menu Button */}
              <button 
                className="md:hidden p-2.5 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="md:hidden fixed inset-0 z-[60] bg-background pt-20 px-6 pb-10 flex flex-col"
          >
            <div className="flex-1 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-2 mb-6">{t("nav.mainNavigation")}</p>
              <nav className="flex flex-col gap-3">
                {navigation.map((item) => {
                  const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                  return (
                    <Link 
                      key={item.name} 
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-4 px-6 py-5 rounded-[2rem] text-lg font-black transition-all",
                        isActive 
                          ? "bg-primary text-white shadow-2xl shadow-primary/30" 
                          : "bg-secondary/50 text-foreground hover:bg-secondary"
                      )}
                    >
                      <item.icon className="w-6 h-6" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            
            <div className="pt-8 border-t border-border space-y-4">
              {user ? (
                <>
                  <div className="flex items-center gap-4 px-6 py-4 bg-secondary/30 rounded-[2rem]">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-accent text-white flex items-center justify-center font-black text-lg shadow-lg">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-foreground truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-secondary text-foreground font-bold">
                      <User className="w-4 h-4" /> Profile
                    </Link>
                    <button onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                      className="flex items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-red-50 text-red-700 font-bold">
                      <LogOut className="w-4 h-4" /> Exit
                    </button>
                  </div>
                </>
              ) : (
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-3 px-6 py-5 rounded-[2rem] text-lg font-black bg-primary text-white shadow-xl">
                  <LogIn className="w-6 h-6" /> Sign In / Register
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Premium Footer */}
      <footer className="bg-card border-t border-border pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-16">
            {/* Branding */}
            <div className="space-y-6">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center p-1.5 shadow-lg shadow-primary/20">
                   <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" className="w-full h-full object-contain brightness-0 invert" />
                </div>
                <span className="font-display font-black text-2xl tracking-tighter">Opportu<span className="text-primary">Net</span></span>
              </Link>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                Empowering candidates across IT, Non-IT, and Government sectors with real-time opportunities and comprehensive exam resources.
              </p>
              <div className="flex gap-4">
                {[Github, Twitter].map((Icon, i) => (
                  <a key={i} href="#" className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all shadow-sm">
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-black text-foreground mb-6 uppercase tracking-widest text-xs">Navigation</h4>
              <ul className="space-y-4">
                {navigation.map(item => (
                  <li key={item.name}>
                    <Link href={item.href} className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/20 group-hover:bg-primary transition-colors"></div>
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-black text-foreground mb-6 uppercase tracking-widest text-xs">Get in Touch</h4>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors group">
                  <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all">
                    <Mail className="w-4 h-4" />
                  </div>
                  lakshithajanhavi@gmail.com
                </li>
                <li className="flex items-center gap-3 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors group">
                  <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all">
                    <MapPin className="w-4 h-4" />
                  </div>
                  Bangalore, Karnataka
                </li>

              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs font-bold text-muted-foreground">
              © {new Date().getFullYear()} OpportuNet Portal. All rights reserved.
            </p>
            <div className="flex gap-8">
              <a href="#" className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors">Cookie Settings</a>
            </div>
          </div>
        </div>
      </footer>
      {/* Monthly Update Modal */}
      <Dialog open={showMonthlyUpdate} onOpenChange={setShowMonthlyUpdate}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogTitle className="sr-only">Monthly Update</DialogTitle>
          <div className="bg-primary p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <Sparkles className="w-24 h-24 rotate-12" />
            </div>
            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-widest">
                <Calendar className="w-3 h-3" /> Monthly Update
              </div>
              <h2 className="text-3xl font-display font-black leading-tight">
                Fresh Opportunities in <br />
                <span className="text-indigo-200">{new Date().toLocaleString('default', { month: 'long' })}</span>
              </h2>
            </div>
          </div>
          <div className="p-8 bg-white dark:bg-slate-900 space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-secondary/50 border border-border/50">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-black text-sm text-foreground">15+ New IT Roles</p>
                  <p className="text-xs text-muted-foreground font-medium">Major companies like Accenture and Google have refreshed their listings.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-secondary/50 border border-border/50">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center flex-shrink-0">
                  <Star className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-black text-sm text-foreground">Government Exams</p>
                  <p className="text-xs text-muted-foreground font-medium">PG-CET 2026 application window is now open for pre-registration.</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowMonthlyUpdate(false)}
              className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              Let's Explore <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Daily Job Alerts for Logged-in Users */}
      <JobAlertNotification />
    </div>
  );
}
