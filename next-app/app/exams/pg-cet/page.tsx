"use client"

import { EXAMS } from "@/lib/data"
import { Navbar } from "@/components/Navbar"
import { Button } from "@/components/ui/button"
import { 
  Calendar, 
  FileText, 
  Download, 
  BookOpen, 
  ExternalLink,
  ChevronRight,
  ClipboardList
} from "lucide-react"
import Link from "next/link"
import { PgCetCollegeMatcher } from "@/components/PgCetCollegeMatcher"

export default function PGCETPortal() {
  const exam = EXAMS[0] // Assuming one main PG-CET for now

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header Hero */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-rose-500 to-rose-700 p-8 md:p-16 text-white mb-12 shadow-2xl shadow-rose-500/20">
          <div className="absolute top-0 right-0 p-8 opacity-20">
            <BookOpen className="h-64 w-64 rotate-12" />
          </div>
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-bold backdrop-blur-md mb-6 border border-white/20">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Registration Open
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
              {exam.title}
            </h1>
            <p className="text-xl text-rose-100 font-medium leading-relaxed">
              {exam.description}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button size="lg" className="rounded-2xl bg-white text-rose-600 hover:bg-rose-50 font-bold px-8 h-14 text-lg">
                Apply for Exam
              </Button>
              <Button size="lg" variant="ghost" className="rounded-2xl border-2 border-white/30 text-white hover:bg-white/10 px-8 h-14 text-lg">
                View Syllabus
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-12">
            {/* Exam Date & Schedule */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-500/10 text-rose-600">
                  <Calendar className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-black">Exam Schedule</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-3xl border bg-card p-6 border-l-8 border-l-rose-500">
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Exam Date</p>
                  <p className="text-3xl font-black text-primary">{new Date(exam.examDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div className="rounded-3xl border bg-card p-6">
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Duration</p>
                  <p className="text-3xl font-black text-primary">120 Minutes</p>
                </div>
              </div>
            </section>

            <PgCetCollegeMatcher />

            {/* Steps to Apply */}
            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-500/10 text-rose-600">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-black">Steps to Apply</h2>
              </div>
              <div className="space-y-4">
                {exam.applySteps.map((step, i) => (
                  <div key={i} className="group relative flex items-center gap-6 rounded-3xl border bg-card p-6 transition-all hover:border-rose-500/50 hover:shadow-lg hover:shadow-rose-500/5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-500/5 text-rose-600 text-2xl font-black transition-transform group-hover:scale-110">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-bold">{step}</p>
                      <p className="text-sm text-muted-foreground mt-1">Ensure you have all necessary documents ready before starting this step.</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-rose-500 transition-colors" />
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Study Materials */}
            <div className="rounded-[2.5rem] border bg-card p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-rose-500" />
                Study Materials
              </h3>
              <div className="space-y-3">
                {exam.studyMaterials.map((material, i) => (
                  <a 
                    key={i} 
                    href={material.url}
                    className="flex items-center justify-between group rounded-2xl bg-secondary/50 p-4 border border-transparent transition-all hover:border-rose-500/30 hover:bg-rose-500/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-rose-500/10 text-rose-600 shadow-sm">
                        <FileText className="h-5 w-5" />
                      </div>
                      <span className="font-bold text-sm tracking-tight">{material.name}</span>
                    </div>
                    <Download className="h-4 w-4 text-muted-foreground group-hover:text-rose-600 group-hover:translate-y-0.5 transition-all" />
                  </a>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-8 rounded-2xl border-2 border-rose-500/20 text-rose-600 hover:bg-rose-500/5 h-12 font-bold">
                Browse All Resources
              </Button>
            </div>

            {/* Quick Links */}
            <div className="rounded-[2.5rem] bg-secondary/30 p-8">
              <h3 className="text-lg font-bold mb-6">Internal Resources</h3>
              <ul className="space-y-4">
                <li>
                  <Link href="#" className="flex items-center gap-3 text-sm font-medium hover:text-rose-600 transition-colors">
                    <ExternalLink className="h-4 w-4" /> Official Notifications
                  </Link>
                </li>
                <li>
                  <Link href="#" className="flex items-center gap-3 text-sm font-medium hover:text-rose-600 transition-colors">
                    <ExternalLink className="h-4 w-4" /> Eligibility Criteria
                  </Link>
                </li>
                <li>
                  <Link href="#" className="flex items-center gap-3 text-sm font-medium hover:text-rose-600 transition-colors">
                    <ExternalLink className="h-4 w-4" /> FAQ & Helpdesk
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
)
}
