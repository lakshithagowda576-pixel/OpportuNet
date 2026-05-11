import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

interface JobAlert {
  id: number;
  title: string;
  company: string;
  newJobsCount: number;
  lastCheckTime: string;
}

export const JobAlertNotification: React.FC = () => {
  const { user } = useAuth();
  const [showNotification, setShowNotification] = useState(false);
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);

  // Check for new jobs daily
  const { data: newJobs } = useQuery({
    queryKey: ["daily-job-updates", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get last check time from localStorage
      const lastCheckKey = `job-check-${user.id}`;
      const lastCheck = localStorage.getItem(lastCheckKey);
      const lastCheckTime = lastCheck ? new Date(lastCheck) : new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Fetch jobs from API
      const response = await fetch(`/api/jobs?since=${lastCheckTime.toISOString()}`);
      if (!response.ok) return null;

      const jobs = await response.json();

      // Save current check time
      localStorage.setItem(lastCheckKey, new Date().toISOString());

      return jobs;
    },
    enabled: !!user?.id,
    staleTime: 60 * 60 * 1000, // 1 hour
    refetchInterval: 24 * 60 * 60 * 1000, // 24 hours
  });

  useEffect(() => {
    if (newJobs && Array.isArray(newJobs) && newJobs.length > 0) {
      // Group jobs by company
      const groupedJobs: { [key: string]: JobAlert } = {};

      newJobs.forEach((job: any) => {
        if (!groupedJobs[job.company]) {
          groupedJobs[job.company] = {
            id: job.id,
            title: job.title,
            company: job.company,
            newJobsCount: 0,
            lastCheckTime: new Date().toISOString(),
          };
        }
        groupedJobs[job.company].newJobsCount += 1;
      });

      const alertsList = Object.values(groupedJobs);
      setAlerts(alertsList);
      setNotificationCount(alertsList.length);
      setShowNotification(alertsList.length > 0);

      // Track event
      trackEvent({
        eventType: "daily_job_alert_shown",
        eventCategory: "JobAlerts",
        eventAction: "notification_shown",
        metadata: { 
          alertsCount: alertsList.length, 
          totalNewJobs: newJobs.length,
          userId: user?.id 
        },
      });

      // Show toast notification
      if (alertsList.length > 0) {
        const totalJobs = newJobs.length;
        toast.success(`🎉 ${totalJobs} new job${totalJobs !== 1 ? 's' : ''} found for you!`, {
          description: `Check out the latest opportunities matching your interests.`,
          duration: 6000,
          action: {
            label: "View Jobs",
            onClick: () => {
              window.location.href = "/jobs";
              setShowNotification(false);
            },
          },
        });
      }
    }
  }, [newJobs, user?.id]);

  if (!user || notificationCount === 0) {
    return null;
  }

  return (
    <>
      {/* Notification Badge */}
      {notificationCount > 0 && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setShowNotification(!showNotification)}
            className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center group"
          >
            <Bell className="w-6 h-6" />
            {notificationCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Notification Panel */}
      {showNotification && notificationCount > 0 && (
        <div className="fixed bottom-24 right-6 z-40 w-96 max-h-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              <h3 className="font-bold">Daily Job Updates</h3>
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Jobs List */}
          <div className="overflow-y-auto max-h-80 p-4 space-y-3">
            {alerts.map((alert) => (
              <div
                key={`${alert.company}-${alert.id}`}
                className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                onClick={() => {
                  trackEvent({
                    eventType: "daily_job_alert_clicked",
                    eventCategory: "JobAlerts",
                    eventAction: "alert_clicked",
                    metadata: { company: alert.company, jobCount: alert.newJobsCount },
                  });
                  window.location.href = `/jobs?search=${alert.company}`;
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                      {alert.company}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {alert.newJobsCount} new job{alert.newJobsCount !== 1 ? "s" : ""} posted
                    </p>
                  </div>
                  <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-500 rounded-full">
                    {alert.newJobsCount}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex gap-2">
            <Button
              onClick={() => {
                trackEvent({
                  eventType: "daily_job_alert_view_all",
                  eventCategory: "JobAlerts",
                  eventAction: "view_all",
                  metadata: { totalAlerts: alerts.length },
                });
                window.location.href = "/jobs";
                setShowNotification(false);
              }}
              className="flex-1 bg-blue-500 hover:bg-blue-600"
            >
              View All Jobs
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowNotification(false);
                toast.success("Notification dismissed");
              }}
              className="flex-1"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default JobAlertNotification;
