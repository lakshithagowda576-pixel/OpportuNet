"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api-client"
import { trackEvent } from "@/lib/analytics"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Star, Plus, Flag, ThumbsUp, ThumbsDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useParams } from "wouter"
import { cn } from "@/lib/utils"

interface CompanyReview {
  id: number
  companyId: number
  userId?: number
  rating: number
  title?: string
  content?: string
  isAnonymous: boolean
  interviewExperience?: number
  cultureRating?: number
  workLifeBalanceRating?: number
  salaryRating?: number
  managementRating?: number
  helpfulCount: number
  unhelpfulCount: number
  status: "pending" | "approved" | "rejected"
  createdAt: string
}

const RatingInput = ({
  label,
  value,
  onChange,
}: {
  label: string
  value?: number
  onChange: (val: number) => void
}) => (
  <div>
    <label className="text-sm font-bold text-foreground mb-2 block">{label}</label>
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className={`transition-all ${
            (value ?? 0) >= i
              ? "text-yellow-500 scale-110"
              : "text-muted-foreground hover:text-yellow-400"
          }`}
        >
          <Star
            className="w-6 h-6 fill-current"
            onClick={() => onChange(i)}
          />
        </button>
      ))}
    </div>
  </div>
)

export default function CompanyReviews() {
  const params = useParams()
  const companyId = parseInt(params?.companyId as string)

  useEffect(() => {
    trackEvent({
      eventType: "page_view",
      eventCategory: "CompanyReviews",
      eventAction: "view",
      page: `/company/${companyId}/reviews`,
      metadata: { companyId },
    });
  }, [companyId]);

  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    rating: 5,
    title: "",
    content: "",
    isAnonymous: false,
    interviewExperience: 3,
    cultureRating: 3,
    workLifeBalanceRating: 3,
    salaryRating: 3,
    managementRating: 3,
  })

  const queryClient = useQueryClient()

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["company-reviews", companyId],
    queryFn: () => apiFetch(`/company-reviews/${companyId}`).then((r: Response) => r.json()),
    enabled: !!companyId,
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiFetch("/company-reviews", {
        method: "POST",
        body: JSON.stringify({
          companyId,
          ...data,
        }),
      }).then((r: Response) => r.json())
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-reviews", companyId] })
      trackEvent({
        eventType: "review_submitted",
        eventCategory: "Review",
        eventAction: "submit",
        metadata: { companyId, rating: formData.rating, isAnonymous: formData.isAnonymous },
      });
      setFormData({
        rating: 5,
        title: "",
        content: "",
        isAnonymous: false,
        interviewExperience: 3,
        cultureRating: 3,
        workLifeBalanceRating: 3,
        salaryRating: 3,
        managementRating: 3,
      })
      setIsOpen(false)
    },
  })

  const voteMutation = useMutation({
    mutationFn: async ({ reviewId, voteType }: { reviewId: number; voteType: "helpful" | "unhelpful" }) => {
      return apiFetch(`/company-reviews/${reviewId}/vote`, {
        method: "POST",
        body: JSON.stringify({ voteType }),
      }).then((r: Response) => r.json())
    },
    onSuccess: (_, { reviewId, voteType }) => {
      queryClient.invalidateQueries({ queryKey: ["company-reviews", companyId] })
      trackEvent({
        eventType: "review_voted",
        eventCategory: "Review",
        eventAction: "vote",
        metadata: { reviewId, voteType },
      });
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return
    createMutation.mutate(formData)
  }

  const approvedReviews = reviews.filter((r: CompanyReview) => r.status === "approved")
  const avgRating =
    approvedReviews.length > 0
      ? (approvedReviews.reduce((sum: number, r: CompanyReview) => sum + r.rating, 0) / approvedReviews.length).toFixed(1)
      : "N/A"

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 rounded-3xl blur-3xl -z-10" />
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-foreground">Company Reviews</h1>
              <p className="text-muted-foreground">See what employees and candidates say</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black text-primary">{avgRating}</div>
              <div className="flex gap-1 justify-end mt-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-4 h-4",
                      parseFloat(avgRating as string) >= i
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-muted-foreground"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Write Review Button */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button size="lg" className="w-full gap-2">
            <Plus className="w-5 h-5" /> Write a Review
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Share Your Experience</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <RatingInput
              label="Overall Rating"
              value={formData.rating}
              onChange={(val) => setFormData({ ...formData, rating: val })}
            />

            <div>
              <label className="text-sm font-bold text-foreground">Review Title</label>
              <Input
                placeholder="e.g., Great company culture"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-2"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-foreground">Your Review</label>
              <Textarea
                placeholder="Share your experience..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="mt-2 h-24"
              />
            </div>

            <div className="space-y-2">
              <RatingInput
                label="Interview Experience"
                value={formData.interviewExperience}
                onChange={(val) => setFormData({ ...formData, interviewExperience: val })}
              />
              <RatingInput
                label="Company Culture"
                value={formData.cultureRating}
                onChange={(val) => setFormData({ ...formData, cultureRating: val })}
              />
              <RatingInput
                label="Work-Life Balance"
                value={formData.workLifeBalanceRating}
                onChange={(val) => setFormData({ ...formData, workLifeBalanceRating: val })}
              />
              <RatingInput
                label="Salary & Benefits"
                value={formData.salaryRating}
                onChange={(val) => setFormData({ ...formData, salaryRating: val })}
              />
              <RatingInput
                label="Management Quality"
                value={formData.managementRating}
                onChange={(val) => setFormData({ ...formData, managementRating: val })}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="anonymous"
                checked={formData.isAnonymous}
                onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="anonymous" className="text-sm font-bold cursor-pointer">
                Post anonymously
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Submitting..." : "Submit Review"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reviews List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-secondary/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : approvedReviews.length === 0 ? (
        <Card>
          <CardContent className="pt-12 text-center">
            <p className="text-muted-foreground text-sm">No reviews yet. Be the first to share!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {approvedReviews.map((review: CompanyReview, idx: number) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className={cn(
                                "w-4 h-4",
                                review.rating >= i
                                  ? "fill-yellow-500 text-yellow-500"
                                  : "text-muted-foreground"
                              )}
                            />
                          ))}
                        </div>
                        <CardTitle className="text-base">{review.title}</CardTitle>
                        <CardDescription className="text-xs">
                          {review.isAnonymous ? "Anonymous" : "Verified User"} •{" "}
                          {new Date(review.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Flag className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-foreground">{review.content}</p>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {review.interviewExperience && (
                        <div>
                          <span className="text-muted-foreground">Interview:</span>{" "}
                          <span className="font-bold">{review.interviewExperience}/5</span>
                        </div>
                      )}
                      {review.cultureRating && (
                        <div>
                          <span className="text-muted-foreground">Culture:</span>{" "}
                          <span className="font-bold">{review.cultureRating}/5</span>
                        </div>
                      )}
                      {review.workLifeBalanceRating && (
                        <div>
                          <span className="text-muted-foreground">Work-Life:</span>{" "}
                          <span className="font-bold">{review.workLifeBalanceRating}/5</span>
                        </div>
                      )}
                      {review.salaryRating && (
                        <div>
                          <span className="text-muted-foreground">Salary:</span>{" "}
                          <span className="font-bold">{review.salaryRating}/5</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => voteMutation.mutate({ reviewId: review.id, voteType: "helpful" })}
                        className="gap-1"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span className="text-xs">{review.helpfulCount}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => voteMutation.mutate({ reviewId: review.id, voteType: "unhelpful" })}
                        className="gap-1"
                      >
                        <ThumbsDown className="w-4 h-4" />
                        <span className="text-xs">{review.unhelpfulCount}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
