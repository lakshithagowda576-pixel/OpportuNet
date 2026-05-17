import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { internalApplicationSchema, InternalApplicationInput } from "@workspace/api-zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { FileUp, Landmark, ShieldCheck } from "lucide-react";

interface CompanyBranding {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  logoUrl?: string | null;
  formBackgroundColor?: string | null;
  buttonColor?: string | null;
  buttonTextColor?: string | null;
}

interface Job {
  id: number;
  title: string;
  company: string;
  category: "IT" | "NON_IT" | "STATE_GOVT" | "CENTRAL_GOVT";
  branding?: CompanyBranding | null;
}

interface CompanyBrandedFormProps {
  job: Job;
  onSubmit: (data: InternalApplicationInput) => void;
  isSubmitting: boolean;
}

export const CompanyBrandedForm: React.FC<CompanyBrandedFormProps> = ({
  job,
  onSubmit,
  isSubmitting,
}) => {
  const { toast } = useToast();
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");

  const branding = job.branding;
  const isGov = job.category === "STATE_GOVT" || job.category === "CENTRAL_GOVT";

  // Determine design elements dynamically
  const isGoogle = job.company.toLowerCase() === "google";
  const isMicrosoft = job.company.toLowerCase() === "microsoft";

  let primaryColor = branding?.primaryColor || "#3b82f6";
  let secondaryColor = branding?.secondaryColor || "#1e3a8a";
  let formBackground = branding?.formBackgroundColor || "#ffffff";
  let buttonColor = branding?.buttonColor || "#3b82f6";
  let buttonTextColor = branding?.buttonTextColor || "#ffffff";
  let logoUrl = branding?.logoUrl || "";

  // Built-in hardcoded fallbacks for premium rendering
  if (isGoogle) {
    primaryColor = "#4285F4";
    secondaryColor = "#34A853";
    buttonColor = "#4285F4";
    logoUrl = logoUrl || "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png";
  } else if (isMicrosoft) {
    primaryColor = "#F25022";
    secondaryColor = "#7FBA00";
    buttonColor = "#00A4EF";
    logoUrl = logoUrl || "https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg";
  } else if (isGov) {
    primaryColor = "#FF9933"; // Saffron
    secondaryColor = "#138808"; // Green
    formBackground = "#FFFBF2"; // Off-white tint
    buttonColor = "#000080"; // Navy blue (Chakra)
    logoUrl = logoUrl || "https://upload.wikimedia.org/wikipedia/commons/e/e3/Emblem_of_India.svg";
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InternalApplicationInput>({
    resolver: zodResolver(internalApplicationSchema),
    defaultValues: {
      jobId: job.id,
      acceptedTerms: false,
      qualification: "Bachelor's",
      resumeUrl: "",
    },
  });

  const resumeUrl = watch("resumeUrl");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (10MB) and type
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Resume must be smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    const allowedExtensions = [".pdf", ".doc", ".docx"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      toast({
        title: "Invalid file type",
        description: "Only PDF, DOC, and DOCX files are allowed",
        variant: "destructive",
      });
      return;
    }

    setUploadingResume(true);
    setUploadedFileName(file.name);

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const response = await fetch(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/upload-resume`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const result = await response.json();
      setValue("resumeUrl", result.url, { shouldValidate: true });
      toast({
        title: "Resume uploaded",
        description: "File uploaded successfully!",
      });
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message || "Failed to upload resume file",
        variant: "destructive",
      });
      setUploadedFileName("");
      setValue("resumeUrl", "");
    } finally {
      setUploadingResume(false);
    }
  };

  return (
    <div
      className="p-6 rounded-2xl border transition-all duration-300 shadow-xl"
      style={{
        backgroundColor: formBackground,
        borderColor: isGov ? "#ffc17a" : `${primaryColor}20`,
      }}
    >
      {/* Branding Header */}
      <div className="flex flex-col items-center text-center pb-6 mb-6 border-b border-gray-100">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={`${job.company} Logo`}
            className={`h-12 mb-3 object-contain ${isGov ? "p-1 bg-white rounded-full shadow-sm" : ""}`}
            onError={(e) => {
              // Hide image if URL is broken and render text fallback
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        ) : isGov ? (
          <Landmark className="h-12 w-12 text-amber-600 mb-3" />
        ) : (
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg mb-3"
            style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
          >
            {job.company[0]}
          </div>
        )}

        <h2 className="text-xl font-bold tracking-tight" style={{ color: isGov ? "#9E5800" : primaryColor }}>
          Official Job Application Portal
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Apply to <span className="font-semibold">{job.company}</span> for the role of{" "}
          <span className="font-semibold">{job.title}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1">
          <Label className="text-sm font-medium text-gray-700">Full Name *</Label>
          <Input
            placeholder="John Doe"
            className="w-full"
            {...register("fullName")}
          />
          {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1">
          <Label className="text-sm font-medium text-gray-700">Email Address *</Label>
          <Input
            type="email"
            placeholder="john.doe@example.com"
            className="w-full"
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <Label className="text-sm font-medium text-gray-700">Password (or setup password) *</Label>
          <Input
            type="password"
            placeholder="••••••••"
            className="w-full"
            {...register("password")}
          />
          <p className="text-[10px] text-gray-400">If you are a new user, this password will create your account.</p>
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>

        {/* Row: Age & Qualification */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-sm font-medium text-gray-700">Age *</Label>
            <Input type="number" placeholder="24" className="w-full" {...register("age")} />
            {errors.age && <p className="text-xs text-red-500">{errors.age.message}</p>}
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium text-gray-700">Highest Qualification *</Label>
            <select
              className="w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register("qualification")}
            >
              <option value="10th">10th</option>
              <option value="12th">12th</option>
              <option value="Diploma">Diploma</option>
              <option value="Bachelor's">Bachelor's</option>
              <option value="Master's">Master's</option>
              <option value="PhD">PhD</option>
            </select>
            {errors.qualification && <p className="text-xs text-red-500">{errors.qualification.message}</p>}
          </div>
        </div>

        {/* Row: Years of Experience & Current Company */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-sm font-medium text-gray-700">Years of Experience *</Label>
            <Input
              type="number"
              step="any"
              placeholder="3"
              className="w-full"
              {...register("yearsOfExperience")}
            />
            {errors.yearsOfExperience && <p className="text-xs text-red-500">{errors.yearsOfExperience.message}</p>}
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium text-gray-700">Current/Previous Company (Optional)</Label>
            <Input placeholder="Acme Corp" className="w-full" {...register("currentCompany")} />
            {errors.currentCompany && <p className="text-xs text-red-500">{errors.currentCompany.message}</p>}
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-1">
          <Label className="text-sm font-medium text-gray-700">Key Skills *</Label>
          <Textarea
            placeholder="React, TypeScript, Node.js, Tailwind CSS"
            className="w-full min-h-[60px]"
            {...register("skills")}
          />
          <p className="text-[10px] text-gray-400">Please enter skills separated by commas.</p>
          {errors.skills && <p className="text-xs text-red-500">{errors.skills.message}</p>}
        </div>

        {/* Cover Letter */}
        <div className="space-y-1">
          <Label className="text-sm font-medium text-gray-700">Cover Letter (Optional)</Label>
          <Textarea
            placeholder="Write a brief cover letter expressing your interest..."
            className="w-full min-h-[80px]"
            {...register("coverLetter")}
          />
        </div>

        {/* Resume Upload */}
        <div className="space-y-1">
          <Label className="text-sm font-medium text-gray-700">Upload Resume *</Label>
          <div className="flex items-center gap-3">
            <label className="flex items-center justify-center px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-600 gap-2">
              <FileUp className="w-4 h-4 text-gray-500" />
              <span>{uploadedFileName ? "Change File" : "Choose Resume"}</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>

            {uploadingResume && <Spinner className="h-5 w-5 text-blue-500" />}

            {uploadedFileName && (
              <span className="text-xs text-gray-600 font-medium truncate max-w-[200px]">
                {uploadedFileName}
              </span>
            )}
          </div>
          <p className="text-[10px] text-gray-400">Accepts PDF, DOC, DOCX up to 10MB.</p>
          {errors.resumeUrl && <p className="text-xs text-red-500">{errors.resumeUrl.message}</p>}
        </div>

        {/* Terms Acceptance */}
        <div className="flex items-start space-x-2 pt-2">
          <Checkbox
            id="acceptedTerms"
            checked={watch("acceptedTerms")}
            onCheckedChange={(checked) => setValue("acceptedTerms", !!checked, { shouldValidate: true })}
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="acceptedTerms"
              className="text-xs text-gray-600 cursor-pointer font-medium select-none"
            >
              I certify that all the details provided in this application are correct and I accept the terms of
              applying.
            </label>
            {errors.acceptedTerms && <p className="text-xs text-red-500 mt-1">{errors.acceptedTerms.message}</p>}
          </div>
        </div>

        {/* Google / Government decorative elements */}
        {isGoogle && (
          <div className="flex justify-center gap-1.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse delay-75" />
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse delay-150" />
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse delay-200" />
          </div>
        )}

        {isGov && (
          <div className="flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-50 rounded-lg border border-amber-100 text-[10px] text-amber-800 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Secured Government Job Portal - Verified with UPSC/SSC Standards</span>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full font-semibold transition-all duration-300 py-2.5 rounded-xl shadow-md mt-4 hover:brightness-105 active:scale-[0.98]"
          style={{
            backgroundColor: buttonColor,
            color: buttonTextColor,
          }}
          disabled={isSubmitting || uploadingResume}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <Spinner className="h-4 w-4" />
              <span>Submitting Application...</span>
            </div>
          ) : (
            <span>Submit Official Application</span>
          )}
        </Button>
      </form>
    </div>
  );
};
