import { z } from "zod";
export declare const internalApplicationSchema: z.ZodObject<{
    jobId: z.ZodNumber;
    fullName: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    age: z.ZodNumber;
    qualification: z.ZodEnum<["10th", "12th", "Diploma", "Bachelor's", "Master's", "PhD"]>;
    yearsOfExperience: z.ZodNumber;
    currentCompany: z.ZodOptional<z.ZodString>;
    skills: z.ZodString;
    resumeUrl: z.ZodString;
    coverLetter: z.ZodOptional<z.ZodString>;
    acceptedTerms: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
}, "strip", z.ZodTypeAny, {
    jobId: number;
    fullName: string;
    email: string;
    skills: string;
    resumeUrl: string;
    qualification: "10th" | "12th" | "Diploma" | "Bachelor's" | "Master's" | "PhD";
    yearsOfExperience: number;
    age: number;
    acceptedTerms: boolean;
    password: string;
    currentCompany?: string | undefined;
    coverLetter?: string | undefined;
}, {
    jobId: number;
    fullName: string;
    email: string;
    skills: string;
    resumeUrl: string;
    qualification: "10th" | "12th" | "Diploma" | "Bachelor's" | "Master's" | "PhD";
    yearsOfExperience: number;
    age: number;
    acceptedTerms: boolean;
    password: string;
    currentCompany?: string | undefined;
    coverLetter?: string | undefined;
}>;
export type InternalApplicationInput = z.infer<typeof internalApplicationSchema>;
//# sourceMappingURL=internal-application.d.ts.map