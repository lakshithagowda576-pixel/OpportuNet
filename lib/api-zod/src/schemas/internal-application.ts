import { z } from "zod";

export const internalApplicationSchema = z.object({
  jobId: z.coerce.number().int().positive("Valid Job ID is required"),
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(255),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  age: z.coerce.number().int().min(18, "Age must be at least 18").max(65, "Age cannot exceed 65"),
  qualification: z.enum(["10th", "12th", "Diploma", "Bachelor's", "Master's", "PhD"], {
    errorMap: () => ({ message: "Please select a valid qualification" }),
  }),
  yearsOfExperience: z.coerce.number().min(0, "Experience cannot be negative").max(50, "Experience cannot exceed 50"),
  currentCompany: z.string().optional(),
  skills: z.string().min(1, "Please list at least one skill"),
  resumeUrl: z.string().min(1, "Resume is required"),
  coverLetter: z.string().optional(),
  acceptedTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

export type InternalApplicationInput = z.infer<typeof internalApplicationSchema>;
