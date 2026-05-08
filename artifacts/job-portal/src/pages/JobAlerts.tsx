"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api-client"
import { trackEvent } from "@/lib/analytics"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Trash2, Bell, MapPin, Briefcase, Search, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const categories = ["IT", "NON_IT", "STATE_GOVT", "CENTRAL_GOVT"]
const frequencies = ["daily", "weekly"]

interface JobAlert {
  id: number
  name: string
  filters: {
    categories?: string[]
    locations?: string[]
    keywords?: string[]
    minSalary?: number
    maxSalary?: number
  }
  frequency: "daily" | "weekly"
  isActive: boolean
  createdAt: string
  lastSentAt?: string
}

export default function JobAlerts() {
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    categories: [] as string[],
    locations: "",
    keywords: "",
    frequency: "daily" as const,
  })

  useEffect(() => {
    trackEvent({
      eventType: "page_view",
      eventCategory: "JobAlerts",
      eventAction: "view",
      page: "/alerts",
    });
  }, []);

  const queryClient = useQueryClient()

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["job-alerts"],
    queryFn: () => apiFetch("/job-alerts").then((r: Response) => r.json()),
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiFetch("/job-alerts", {
        method: "POST",
        body: JSON.stringify({
          name: data.name,
          filters: {
            categories: data.categories.length > 0 ? data.categories : undefined,
            locations: data.locations ? [data.locations] : undefined,
            keywords: data.keywords ? data.keywords.split(",").map((k: string) => k.trim()) : undefined,
          },
          frequency: data.frequency,
        }),
      }).then((r: Response) => r.json())
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-alerts"] })
      trackEvent({
        eventType: "alert_created",
        eventCategory: "JobAlerts",
        eventAction: "create_alert",
        metadata: { categories: formData.categories, frequency: formData.frequency },
      });
      setFormData({ name: "", categories: [], locations: "", keywords: "", frequency: "daily" })
      setIsOpen(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/job-alerts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-alerts"] })
      trackEvent({
        eventType: "alert_deleted",
        eventCategory: "JobAlerts",
        eventAction: "delete_alert",
      });
    },
  })

  const toggleCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiFetch(`/job-alerts/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }).then((r: Response) => r.json())
    },
    onSuccess: (_, { data }) => {
      queryClient.invalidateQueries({ queryKey: ["job-alerts"] })
      trackEvent({
        eventType: "alert_updated",
        eventCategory: "JobAlerts",
        eventAction: "update_alert",
        metadata: { categories: data.filters?.categories },
      });
    },
  })

  const handleCategoryToggle = (alertId: number, category: string) => {
    const alert = alerts.find((a: JobAlert) => a.id === alertId)
    if (!alert) return

    const currentCategories = alert.filters?.categories || []
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter((c: string) => c !== category)
      : [...currentCategories, category]

    toggleCategoryMutation.mutate({
      id: alertId,
      data: {
        filters: { ...alert.filters, categories: newCategories },
      },
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    createMutation.mutate(formData)
  }

  const activeAlerts = alerts.filter((a: JobAlert) => a.isActive)
  const inactiveAlerts = alerts.filter((a: JobAlert) => !a.isActive)

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 rounded-3xl blur-3xl -z-10" />
        <div className="space-y-2 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-foreground">Job Alerts</h1>
              <p className="text-muted-foreground">Never miss opportunities matching your criteria</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Alert Button */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button size="lg" className="w-full gap-2">
            <Plus className="w-5 h-5" /> Create New Alert
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Job Alert</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-bold text-foreground">Alert Name</label>
              <Input
                placeholder="e.g., Senior Developer Jobs"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-2"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-foreground">Categories</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      const newCats = formData.categories.includes(cat)
                        ? formData.categories.filter((c) => c !== cat)
                        : [...formData.categories, cat]
                      setFormData({ ...formData, categories: newCats })
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                      formData.categories.includes(cat)
                        ? "bg-primary text-white"
                        : "bg-secondary text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-foreground">Location</label>
              <Input
                placeholder="e.g., Bangalore, Mumbai"
                value={formData.locations}
                onChange={(e) => setFormData({ ...formData, locations: e.target.value })}
                className="mt-2"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-foreground">Keywords (comma-separated)</label>
              <Input
                placeholder="e.g., Python, React, DevOps"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                className="mt-2"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-foreground">Frequency</label>
              <div className="flex gap-2 mt-2">
                {frequencies.map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setFormData({ ...formData, frequency: freq as any })}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                      formData.frequency === freq
                        ? "bg-primary text-white"
                        : "bg-secondary text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Alert"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alerts List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-secondary/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <Card>
          <CardContent className="pt-12 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-bold text-foreground mb-2">No Alerts Yet</h3>
            <p className="text-muted-foreground text-sm">Create your first job alert to get notified about new opportunities</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">Active ({activeAlerts.length})</TabsTrigger>
            <TabsTrigger value="inactive">Inactive ({inactiveAlerts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-3 mt-4">
            <AnimatePresence>
              {activeAlerts.map((alert: JobAlert, idx: number) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{alert.name}</CardTitle>
                          <CardDescription>
                            {alert.frequency === "daily" ? "📅 Daily" : "📅 Weekly"} • Last sent:{" "}
                            {alert.lastSentAt ? new Date(alert.lastSentAt).toLocaleDateString() : "Not sent yet"}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(alert.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {alert.filters?.categories && alert.filters.categories.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {alert.filters.categories.map((cat: string) => (
                            <span
                              key={cat}
                              className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full flex items-center gap-1"
                            >
                              <Briefcase className="w-3 h-3" /> {cat}
                            </span>
                          ))}
                        </div>
                      )}
                      {alert.filters?.locations && alert.filters.locations.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {alert.filters.locations.map((loc: string, i: number) => (
                            <span
                              key={i}
                              className="px-3 py-1 bg-accent/10 text-accent text-xs font-bold rounded-full flex items-center gap-1"
                            >
                              <MapPin className="w-3 h-3" /> {loc}
                            </span>
                          ))}
                        </div>
                      )}
                      {alert.filters?.keywords && alert.filters.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {alert.filters.keywords.map((kw: string, i: number) => (
                            <span
                              key={i}
                              className="px-3 py-1 bg-warning/10 text-warning text-xs font-bold rounded-full flex items-center gap-1"
                            >
                              <Search className="w-3 h-3" /> {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="inactive" className="space-y-3 mt-4">
            {inactiveAlerts.length === 0 ? (
              <Card>
                <CardContent className="pt-8 text-center">
                  <p className="text-muted-foreground text-sm">No inactive alerts</p>
                </CardContent>
              </Card>
            ) : (
              <AnimatePresence>
                {inactiveAlerts.map((alert: JobAlert, idx: number) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="opacity-60">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{alert.name}</CardTitle>
                            <CardDescription>Inactive</CardDescription>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(alert.id)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
