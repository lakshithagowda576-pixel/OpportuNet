import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Upload, Loader2, CheckCircle2, ArrowRight, ArrowLeft, User, Briefcase, FileText, Globe, Linkedin, Calendar, GraduationCap, Image } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const applicationSchema = z.object({
  applicantName: z.string().min(2, "Name is too short"),
  applicantEmail: z.string().email("Invalid email address"),
  applicantPhone: z.string().min(10, "Invalid phone number"),
  age: z.string().min(1, "Age is required"),
  college: z.string().min(2, "College name is required"),
  currentLocation: z.string().min(2, "Location is required"),
  yearsOfExperience: z.string().min(1, "Experience is required"),
  currentCompany: z.string().optional(),
  portfolioLink: z.string().url("Invalid URL").optional().or(z.literal("")),
  linkedinProfile: z.string().url("Invalid URL").optional().or(z.literal("")),
  skills: z.string().min(5, "Please list some skills"),
  education: z.string().min(5, "Education details are required"),
  coverLetter: z.string().optional(),
  declaration: z.boolean().refine(v => v === true, "You must accept the declaration"),
  digitalSignature: z.string().optional(),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

interface ApplicationFormProps {
  jobId: number;
  companyName: string;
  isGovernment?: boolean;
}

export const ApplicationForm: React.FC<ApplicationFormProps> = ({ jobId, companyName, isGovernment }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      declaration: false,
    }
  });

  // Autofill from user profile
  useEffect(() => {
    if (user) {
      setValue("applicantName", user.name || "");
      setValue("applicantEmail", user.email || "");
      setValue("applicantPhone", user.phone || "");
      setValue("currentLocation", user.address || "");
      setValue("skills", user.skills || "");
      setValue("education", user.education || "");
    }
  }, [user, setValue]);

  useEffect(() => {
    trackEvent({
      eventType: "application_form_view",
      eventCategory: "ApplicationForm",
      eventAction: "view",
      page: `/apply/${jobId}`,
      metadata: { jobId, companyName, isGovernment },
    });
  }, [jobId, companyName, isGovernment]);

  const nextStep = async () => {
    let fieldsToValidate: (keyof ApplicationFormData)[] = [];
    if (step === 1) {
      fieldsToValidate = ["applicantName", "applicantEmail", "applicantPhone", "age", "college", "currentLocation"];
    } else if (step === 2) {
      fieldsToValidate = ["yearsOfExperience", "education", "skills"];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      trackEvent({
        eventType: "application_form_step",
        eventCategory: "ApplicationForm",
        eventAction: "next_step",
        metadata: { currentStep: step, nextStep: step + 1, jobId, companyName },
      });
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    trackEvent({
      eventType: "application_form_step",
      eventCategory: "ApplicationForm",
      eventAction: "prev_step",
      metadata: { currentStep: step, previousStep: step - 1, jobId, companyName },
    });
    setStep(step - 1);
  };

  const onSubmit = async (data: ApplicationFormData) => {
    if (!resumeFile && !user?.resumeUrl) {
      toast.error("Please upload your resume");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("jobId", jobId.toString());
      if (resumeFile) {
        formData.append("resume", resumeFile);
      } else if (user?.resumeUrl) {
        formData.append("resumeUrl", user.resumeUrl);
      }
      if (photoFile) {
        formData.append("photo", photoFile);
      }
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      const response = await fetch("/api/applications/direct", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit application");
      }

      setIsSuccess(true);
      trackEvent({
        eventType: "application_form_submitted",
        eventCategory: "ApplicationForm",
        eventAction: "submit",
        metadata: { jobId, companyName, applicantEmail: data.applicantEmail, isGovernment },
      });
      toast.success("Application submitted successfully!");
    } catch (error: any) {
      trackEvent({
        eventType: "application_form_submission_failed",
        eventCategory: "ApplicationForm",
        eventAction: "submit_failure",
        metadata: { jobId, companyName, error: error.message },
      });
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl p-12 text-center border border-green-100 dark:border-green-900"
      >
        <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 dark:bg-green-900 rounded-full mb-8">
          <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">Application Sent!</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-10 max-w-md mx-auto text-lg">
          Success! Your application for the position at <span className="font-bold text-gray-900 dark:text-white">{companyName}</span> has been received. 
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button 
            onClick={() => window.location.href = "/applications"}
            className="h-14 px-10 rounded-2xl bg-green-600 hover:bg-green-700 text-lg font-bold shadow-xl shadow-green-200 dark:shadow-none"
          >
            View My Applications
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.location.href = "/jobs"}
            className="h-14 px-10 rounded-2xl text-lg font-bold"
          >
            Browse More Jobs
          </Button>
        </div>
      </motion.div>
    );
  }

  const steps = [
    { id: 1, name: "Personal", icon: User },
    { id: 2, name: "Professional", icon: Briefcase },
    { id: 3, name: "Review", icon: FileText },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl p-10 border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Stepper Header */}
      <div className="flex items-center justify-between mb-12 px-4">
        {steps.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center gap-3 relative">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                step >= s.id ? 'bg-[var(--brand-primary)] text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
              }`}>
                <s.icon className="w-6 h-6" />
              </div>
              <span className={`text-xs font-black uppercase tracking-widest ${step >= s.id ? 'text-[var(--brand-primary)]' : 'text-gray-400'}`}>
                {s.name}
              </span>
              {step === s.id && (
                <motion.div layoutId="step-indicator" className="absolute -bottom-2 w-2 h-2 bg-[var(--brand-primary)] rounded-full" />
              )}
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-1 mx-4 rounded-full transition-colors duration-300 ${
                step > s.id ? 'bg-[var(--brand-primary)]' : 'bg-gray-100 dark:bg-gray-700'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="space-y-6"
            >
              <h3 className="text-2xl font-bold mb-6">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-bold uppercase tracking-tight">Full Name</Label>
                  <Input {...register("applicantName")} placeholder="John Doe" className="h-12 rounded-xl border-gray-200" />
                  {errors.applicantName && <p className="text-xs text-red-500 font-medium">{errors.applicantName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold uppercase tracking-tight">Age</Label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input type="number" {...register("age")} placeholder="25" className="h-12 pl-12 rounded-xl border-gray-200" />
                  </div>
                  {errors.age && <p className="text-xs text-red-500 font-medium">{errors.age.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold uppercase tracking-tight">Email Address</Label>
                  <Input type="email" {...register("applicantEmail")} placeholder="john@example.com" className="h-12 rounded-xl border-gray-200" />
                  {errors.applicantEmail && <p className="text-xs text-red-500 font-medium">{errors.applicantEmail.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold uppercase tracking-tight">Phone Number</Label>
                  <Input {...register("applicantPhone")} placeholder="+91 98765 43210" className="h-12 rounded-xl border-gray-200" />
                  {errors.applicantPhone && <p className="text-xs text-red-500 font-medium">{errors.applicantPhone.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold uppercase tracking-tight">College Name</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input {...register("college")} placeholder="XYZ University" className="h-12 pl-12 rounded-xl border-gray-200" />
                  </div>
                  {errors.college && <p className="text-xs text-red-500 font-medium">{errors.college.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold uppercase tracking-tight">Current Location</Label>
                  <Input {...register("currentLocation")} placeholder="Bengaluru, India" className="h-12 rounded-xl border-gray-200" />
                  {errors.currentLocation && <p className="text-xs text-red-500 font-medium">{errors.currentLocation.message}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="space-y-6"
            >
              <h3 className="text-2xl font-bold mb-6">Professional Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-bold uppercase tracking-tight">Years of Experience</Label>
                  <Input {...register("yearsOfExperience")} placeholder="e.g. 5 years" className="h-12 rounded-xl border-gray-200" />
                  {errors.yearsOfExperience && <p className="text-xs text-red-500 font-medium">{errors.yearsOfExperience.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold uppercase tracking-tight">Current Company (Optional)</Label>
                  <Input {...register("currentCompany")} placeholder="ACME Corp" className="h-12 rounded-xl border-gray-200" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold uppercase tracking-tight">Education Details</Label>
                <Textarea {...register("education")} placeholder="e.g. B.Tech in CS, XYZ University" className="rounded-xl border-gray-200" />
                {errors.education && <p className="text-xs text-red-500 font-medium">{errors.education.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold uppercase tracking-tight">Key Skills</Label>
                <Input {...register("skills")} placeholder="React, Node.js, PostgreSQL" className="h-12 rounded-xl border-gray-200" />
                {errors.skills && <p className="text-xs text-red-500 font-medium">{errors.skills.message}</p>}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="space-y-6"
            >
              <h3 className="text-2xl font-bold mb-6">Final Review & Documents</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label className="text-sm font-bold uppercase tracking-tight">Resume Upload</Label>
                  <div 
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700/30 ${
                      resumeFile || user?.resumeUrl ? 'border-green-500 bg-green-50/50' : 'border-gray-200'
                    }`}
                    onClick={() => {
                      trackEvent({
                        eventType: "resume_upload_clicked",
                        eventCategory: "ApplicationForm",
                        eventAction: "click_resume_upload",
                        metadata: { jobId, companyName },
                      });
                      document.getElementById('resume-upload')?.click();
                    }}
                  >
                    <input id="resume-upload" type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} />
                    {resumeFile || user?.resumeUrl ? (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                        <p className="font-bold text-green-700">{resumeFile?.name || "Resume from Profile Linked"}</p>
                        <p className="text-xs text-green-600">Click to replace</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-10 h-10 text-gray-400" />
                        <p className="text-gray-600 font-medium">Click to upload your resume</p>
                        <p className="text-xs text-gray-500">PDF, DOC, DOCX</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-bold uppercase tracking-tight">Photo Upload</Label>
                  <div 
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700/30 ${
                      photoFile ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200'
                    }`}
                    onClick={() => {
                      trackEvent({
                        eventType: "photo_upload_clicked",
                        eventCategory: "ApplicationForm",
                        eventAction: "click_photo_upload",
                        metadata: { jobId, companyName },
                      });
                      document.getElementById('photo-upload')?.click();
                    }}
                  >
                    <input id="photo-upload" type="file" className="hidden" accept="image/jpeg,image/png,image/jpg" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
                    {photoFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 className="w-10 h-10 text-blue-500" />
                        <p className="font-bold text-blue-700">{photoFile.name}</p>
                        <p className="text-xs text-blue-600">Click to replace</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Image className="w-10 h-10 text-gray-400" />
                        <p className="text-gray-600 font-medium">Click to upload your photo</p>
                        <p className="text-xs text-gray-500">JPG, PNG (recommended: passport size)</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-bold uppercase tracking-tight">LinkedIn Profile</Label>
                  <div className="relative">
                    <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input {...register("linkedinProfile")} placeholder="https://linkedin.com/..." className="h-12 pl-12 rounded-xl border-gray-200" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold uppercase tracking-tight">Portfolio / GitHub</Label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input {...register("portfolioLink")} placeholder="https://github.com/..." className="h-12 pl-12 rounded-xl border-gray-200" />
                  </div>
                </div>
              </div>

              {isGovernment && (
                <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 space-y-4">
                  <Label className="text-sm font-bold text-amber-900 uppercase tracking-tight">Official Declaration</Label>
                  <div className="flex items-start gap-3">
                    <input type="checkbox" id="declaration" {...register("declaration")} className="mt-1 w-5 h-5 accent-amber-600" />
                    <Label htmlFor="declaration" className="text-xs text-amber-800 leading-relaxed font-medium">
                      I hereby declare that all information is true. Any false info may lead to disqualification.
                    </Label>
                  </div>
                  <Input {...register("digitalSignature")} placeholder="Type full name to sign" className="bg-white/50 border-amber-200" />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-4 mt-12 pt-8 border-t border-gray-100 dark:border-gray-700">
          {step > 1 && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={prevStep}
              className="flex-1 h-14 rounded-2xl border-2 font-bold text-gray-600"
            >
              <ArrowLeft className="w-5 h-5 mr-2" /> Previous
            </Button>
          )}
          
          {step < 3 ? (
            <Button 
              type="button" 
              onClick={nextStep}
              className="flex-1 h-14 rounded-2xl bg-[var(--brand-primary)] hover:opacity-90 font-bold shadow-xl shadow-blue-100 dark:shadow-none"
            >
              Continue <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-[2] h-14 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-lg shadow-2xl"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  Finalizing...
                </>
              ) : (
                "Submit Application Now"
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};
