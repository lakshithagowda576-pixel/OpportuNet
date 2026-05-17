import React from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CompanyBrandedForm } from "./CompanyBrandedForm";
import { useSubmitInternalApplication } from "@/hooks/useInternalApplication";
import { InternalApplicationInput } from "@workspace/api-zod";

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

interface ApplicationModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ApplicationModal: React.FC<ApplicationModalProps> = ({ job, isOpen, onClose }) => {
  const submitApplication = useSubmitInternalApplication();

  if (!job) return null;

  const handleSubmit = (data: InternalApplicationInput) => {
    submitApplication.mutate(data, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl border-none">
        <DialogTitle className="sr-only">Apply to {job.company} - {job.title}</DialogTitle>
        <DialogDescription className="sr-only">Internal application form for {job.title} at {job.company}</DialogDescription>
        <CompanyBrandedForm
          job={job}
          onSubmit={handleSubmit}
          isSubmitting={submitApplication.isPending}
        />
      </DialogContent>
    </Dialog>
  );
};
