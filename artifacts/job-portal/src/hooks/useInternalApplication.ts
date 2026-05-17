import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { InternalApplicationInput } from "@workspace/api-zod";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function useSubmitInternalApplication() {
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: InternalApplicationInput) =>
      fetch(`${BASE}/api/applications/internal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      }).then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || r.statusText);
        return body;
      }),
    onSuccess: () => {
      toast({ title: "Success", description: "Application submitted successfully!" });
      qc.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to submit application", variant: "destructive" });
    },
  });
}

export function useTrackExternalApplication() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: { jobId: number; applicantName?: string; applicantEmail?: string }) =>
      fetch(`${BASE}/api/applications/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      }).then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || r.statusText);
        return body;
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}
