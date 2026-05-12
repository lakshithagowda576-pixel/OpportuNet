import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Loader2, Upload, FileText, CheckCircle } from "lucide-react";

const formSchema = z.object({
  applicantName: z.string().min(2, "Name must be at least 2 characters"),
  applicantEmail: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  age: z.number().int().positive("Age must be a positive number").min(16, "Must be at least 16 years old").max(100, "Age must be 100 or younger"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  currentLocation: z.string().min(2, "Location is required"),
  yearsExperience: z.string().min(1, "Years of experience is required"),
  qualification: z.string().min(2, "Qualification is required"),
  education: z.string().min(2, "Education details are required"),
  currentCompany: z.string().optional(),
  coverLetter: z.string().optional(),
  portfolioUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  linkedinUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  skills: z.string().min(2, "Skills are required"),
  photo: z.any().refine((files) => files?.length > 0, "Profile photo is required"),
  resume: z.any().refine((files) => files?.length > 0, "Resume is required"),
  declaration: z.boolean().refine((val) => val === true, "You must accept the declaration"),
  digitalSignature: z.boolean().optional(),
}).refine((data) => {
  // If we had access to isGov here, but we don't in the static schema.
  // We'll handle this in the form submission or with a more complex schema.
  return true;
}, {});

type FormValues = z.infer<typeof formSchema>;

interface ApplicationFormProps {
  jobId: number;
  companyName: string;
  isGov?: boolean;
  onSubmit: (data: FormData) => Promise<void>;
  isLoading: boolean;
}

const ApplicationForm: React.FC<ApplicationFormProps> = ({ jobId, companyName, isGov, onSubmit, isLoading }) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      applicantName: "",
      applicantEmail: "",
      password: "",
      age: undefined,
      phone: "",
      currentLocation: "",
      yearsExperience: "",
      qualification: "",
      education: "",
      currentCompany: "",
      coverLetter: "",
      portfolioUrl: "",
      linkedinUrl: "",
      skills: "",
      photo: undefined,
      resume: undefined,
      declaration: false,
      digitalSignature: false,
    },
  });

  const handleSubmit = async (values: FormValues) => {
    if (isGov && !values.digitalSignature) {
      form.setError("digitalSignature", { message: "Digital signature is required for government jobs" });
      return;
    }

    const formData = new FormData();
    formData.append("jobId", jobId.toString());
    formData.append("applicantName", values.applicantName);
    formData.append("applicantEmail", values.applicantEmail);
    formData.append("password", values.password);
    formData.append("age", values.age.toString());
    formData.append("phone", values.phone);
    formData.append("currentLocation", values.currentLocation);
    formData.append("yearsExperience", values.yearsExperience);
    formData.append("qualification", values.qualification);
    formData.append("education", values.education);
    formData.append("currentCompany", values.currentCompany || "");
    formData.append("coverLetter", values.coverLetter || "");
    formData.append("portfolioUrl", values.portfolioUrl || "");
    formData.append("linkedinUrl", values.linkedinUrl || "");
    formData.append("skills", values.skills);
    formData.append("photo", values.photo[0]);
    formData.append("resume", values.resume[0]);

    await onSubmit(formData);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="p-6 border-b bg-gray-50/50">
        <h2 className="text-xl font-bold text-gray-900">Application Form</h2>
        <p className="text-sm text-gray-500">Apply for this position at {companyName}</p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="applicantName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="applicantEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input placeholder="john@example.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password *</FormLabel>
                  <FormControl>
                    <Input placeholder="Create a password" type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 25" type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="+91 9876543210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currentLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Location *</FormLabel>
                  <FormControl>
                    <Input placeholder="City, State" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="yearsExperience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Years of Experience *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 3 years" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="qualification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Highest Qualification *</FormLabel>
                  <FormControl>
                    <Input placeholder="B.Tech, MBA, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="education"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Education Details *</FormLabel>
                <FormControl>
                  <Input placeholder="Institution, major, year" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="skills"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Key Skills *</FormLabel>
                <FormControl>
                  <Input placeholder="React, Node.js, SQL..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="portfolioUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Portfolio / GitHub Link</FormLabel>
                  <FormControl>
                    <Input placeholder="https://github.com/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="linkedinUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn Profile</FormLabel>
                  <FormControl>
                    <Input placeholder="https://linkedin.com/in/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="coverLetter"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cover Letter (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Why are you a good fit for this role?" 
                    className="min-h-[120px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="photo"
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Upload Profile Photo *</FormLabel>
                  <FormControl>
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-gray-300 transition-colors bg-gray-50/30">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="photo-upload"
                        onChange={(e) => onChange(e.target.files)}
                        {...fieldProps}
                      />
                      <label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center">
                        <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
                          {value && value.length > 0 ? (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          ) : (
                            <Upload className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        {value && value.length > 0 ? (
                          <div className="text-sm font-medium text-gray-900">{value[0].name}</div>
                        ) : (
                          <>
                            <div className="text-sm font-medium text-gray-900">Click to upload or drag and drop</div>
                            <div className="text-xs text-gray-500 mt-1">JPEG, PNG, WEBP (Max 5MB)</div>
                          </>
                        )}
                      </label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="resume"
              render={({ field: { value, onChange, ...fieldProps } }) => (
              <FormItem>
                <FormLabel>Upload Resume (PDF/DOC) *</FormLabel>
                <FormControl>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-gray-300 transition-colors bg-gray-50/30">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      id="resume-upload"
                      onChange={(e) => onChange(e.target.files)}
                      {...fieldProps}
                    />
                    <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center">
                      <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
                        {value && value.length > 0 ? (
                          <FileText className="h-6 w-6 text-green-600" />
                        ) : (
                          <Upload className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      {value && value.length > 0 ? (
                        <div className="text-sm font-medium text-gray-900">{value[0].name}</div>
                      ) : (
                        <>
                          <div className="text-sm font-medium text-gray-900">Click to upload or drag and drop</div>
                          <div className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX (Max 5MB)</div>
                        </>
                      )}
                    </label>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          </div>

          <FormField
            control={form.control}
            name="declaration"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-gray-50/50">
                <FormControl>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary mt-1"
                    checked={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-medium text-gray-900">
                    {isGov ? "Declaration of Truthfulness" : "Terms & Conditions"}
                  </FormLabel>
                  <p className="text-xs text-gray-500">
                    {isGov 
                      ? "I hereby declare that all the information provided above is true to the best of my knowledge. I understand that any false information may lead to disqualification."
                      : "I agree to the terms of service and privacy policy of " + companyName + "."}
                  </p>
                </div>
              </FormItem>
            )}
          />

          {isGov && (
            <FormField
              control={form.control}
              name="digitalSignature"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-orange-50/50 border-orange-200">
                  <FormControl>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 mt-1"
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-bold text-orange-900">
                      Digital Signature *
                    </FormLabel>
                    <p className="text-xs text-orange-800">
                      I understand that by checking this box, I am providing a digital signature which has the same legal effect as a handwritten signature.
                    </p>
                  </div>
                </FormItem>
              )}
            />
          )}

          <Button 
            type="submit" 
            className="w-full h-12 text-lg font-bold shadow-md hover:shadow-lg transition-all"
            style={{ backgroundColor: 'var(--brand-primary)', color: 'white' }}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Submitting Application...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                Submit Application
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default ApplicationForm;
