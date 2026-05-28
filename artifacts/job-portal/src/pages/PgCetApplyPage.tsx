import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetExam } from "@workspace/api-client-react";
import { 
  ArrowLeft, Loader2, CheckCircle2, 
  User, Mail, Phone, MapPin as AddressIcon, BookOpen, 
  CheckSquare, GraduationCap, School
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export default function PgCetApplyPage() {
  const [, params] = useRoute("/exams/:id/apply") as any;
  const examId = params?.id ? Number(params.id) : NaN;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [applicationNumber, setApplicationNumber] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    applicantName: "",
    applicantEmail: "",
    applicantPhone: "",
    applicantAddress: "",
    education: "",
    qualification: "",
    course: "", // Mandatory for PGCET
    acceptedTerms: false,
  });

  const { data: exam, isLoading: isExamLoading } = useGetExam(examId);

  useEffect(() => {
    if (user && !isAuthLoading) {
      setFormData(prev => ({
        ...prev,
        applicantName: user.name || "",
        applicantEmail: user.email || "",
        applicantPhone: user.phone || "",
        applicantAddress: user.address || "",
        education: user.education || "",
        qualification: user.qualification || "",
      }));
    }
  }, [user, isAuthLoading]);

  if (isAuthLoading || isExamLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium animate-pulse">Setting up your registration environment...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-8 text-center shadow-xl">
          <GraduationCap className="w-16 h-16 text-amber-600 mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold text-amber-900 mb-2">Login Required</h1>
          <p className="text-amber-700 mb-6">You must be logged in to register for PG-CET exams.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login" className="px-8 py-3 rounded-xl bg-primary text-white font-bold hover:shadow-lg transition-all inline-block">
              Sign In / Register
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!exam) return <div className="text-center py-32 text-xl font-bold">Exam not found.</div>;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.course) {
      toast({ title: "Course Selection Required", description: "Please select a course to continue.", variant: "destructive" });
      return;
    }
    if (!formData.acceptedTerms) {
      toast({ title: "Terms & Conditions", description: "You must accept the terms to proceed.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId,
          userId: user?.id,
          ...formData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Registration failed");
      }
      
      const data = await response.json();
      setApplicationNumber(data.id);
      setIsSuccess(true);
      toast({ title: "Success!", description: "Registered successfully." });
    } catch (error: any) {
      toast({ title: "Registration Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center animate-in fade-in slide-in-from-bottom-8 duration-700 px-4">
        <div className="w-24 h-24 bg-gradient-to-tr from-indigo-600 to-violet-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-200 rotate-3 hover:rotate-0 transition-transform duration-300">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-display font-black text-foreground mb-4">Registration Success!</h1>
        <p className="text-muted-foreground text-lg mb-8">You have successfully registered for <span className="text-primary font-bold">{exam.name}</span>.</p>
        
        <div className="glass-panel p-8 rounded-[2rem] border-primary/10 shadow-2xl mb-10 text-left relative overflow-hidden bg-white/50 backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary font-black mb-6">Registration Details</p>
          <div className="space-y-4 relative z-10">
            <div className="flex justify-between items-center py-3 border-b border-border/50">
              <span className="text-muted-foreground font-medium">Application Number</span>
              <span className="font-mono font-bold text-primary bg-primary/5 px-3 py-1 rounded-lg">#{(applicationNumber || 0).toString().padStart(6, "0")}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-border/50">
              <span className="text-muted-foreground font-medium">Course Selected</span>
              <span className="text-foreground font-bold">{formData.course}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-border/50">
              <span className="text-muted-foreground font-medium">Exam Name</span>
              <span className="text-foreground font-bold text-sm">{exam.fullName}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={() => navigate(`/applications?id=${applicationNumber}`)} className="px-8 py-4 rounded-2xl bg-primary text-white font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all">
            Track Registration
          </button>
          <button onClick={() => navigate("/exams")} className="px-8 py-4 rounded-2xl bg-secondary text-secondary-foreground font-bold hover:bg-secondary/80 transition-all">
            Back to Exam Hub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 px-4 animate-in fade-in duration-700">
      <div className="mb-8">
        <Link href="/exams" className="group flex items-center text-sm font-bold text-muted-foreground hover:text-primary transition-colors gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Exam Hub
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Exam Info Card */}
        <div className="md:col-span-1">
          <div className="glass-panel p-6 rounded-3xl border-primary/10 shadow-xl bg-indigo-50/50">
            <School className="w-10 h-10 text-primary mb-4" />
            <h2 className="text-xl font-black text-foreground mb-2">{exam.name}</h2>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-4">Registration Form</p>
            <div className="space-y-4 pt-4 border-t border-border/50">
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase">Exam Date</p>
                <p className="text-sm font-bold">{exam.examDate}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase">Eligibilty</p>
                <p className="text-xs font-medium text-muted-foreground line-clamp-3">{exam.eligibility}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <div className="md:col-span-2">
          <div className="bg-card rounded-[2.5rem] border border-border shadow-2xl p-8 md:p-12">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <h3 className="text-2xl font-black flex items-center gap-2">
                  <User className="w-6 h-6 text-primary" /> Candidate Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
                    <input 
                      required name="applicantName" type="text" value={formData.applicantName} onChange={handleInputChange}
                      className="w-full px-5 py-3.5 rounded-2xl bg-background border border-border focus:border-primary/50 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email</label>
                    <input 
                      disabled value={formData.applicantEmail}
                      className="w-full px-5 py-3.5 rounded-2xl bg-secondary border border-transparent outline-none text-sm font-medium opacity-70 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Phone</label>
                    <input 
                      required name="applicantPhone" type="tel" value={formData.applicantPhone} onChange={handleInputChange}
                      className="w-full px-5 py-3.5 rounded-2xl bg-background border border-border focus:border-primary/50 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">City</label>
                    <input 
                      required name="applicantAddress" type="text" value={formData.applicantAddress} onChange={handleInputChange}
                      className="w-full px-5 py-3.5 rounded-2xl bg-background border border-border focus:border-primary/50 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-2xl font-black flex items-center gap-2">
                  <GraduationCap className="w-6 h-6 text-primary" /> Course Selection
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Select Your Course</label>
                    <select 
                      required name="course" value={formData.course} onChange={handleInputChange}
                      className="w-full px-5 py-3.5 rounded-2xl bg-background border border-border focus:border-primary/50 outline-none transition-all text-sm font-bold appearance-none cursor-pointer"
                    >
                      <option value="">-- Choose Course --</option>
                      <option value="MBA">Master of Business Administration (MBA)</option>
                      <option value="MCA">Master of Computer Applications (MCA)</option>
                      <option value="M.Tech">Master of Technology (M.Tech)</option>
                      <option value="M.Arch">Master of Architecture (M.Arch)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border flex items-center gap-3">
                 <input 
                    required type="checkbox" checked={formData.acceptedTerms} onChange={() => setFormData(p => ({...p, acceptedTerms: !p.acceptedTerms}))}
                    className="w-5 h-5 rounded border-primary accent-primary"
                 />
                 <label className="text-xs font-bold text-muted-foreground">
                    I declare that all information provided is accurate and I am eligible for the selected course.
                 </label>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl font-black bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckSquare className="w-5 h-5" /> Submit Registration</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
