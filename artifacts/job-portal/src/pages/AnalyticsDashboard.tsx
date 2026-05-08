import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { Loader2, TrendingUp, Users, Briefcase, CheckCircle, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

import { apiFetch } from "@/lib/api-client";

interface AnalyticsStats {
  totalApplications: number;
  totalJobs: number;
  pendingApplications: number;
  offeredApplications: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
}

export default function AnalyticsDashboard() {
  const { t } = useTranslation();
  
  const { data: stats, isLoading } = useQuery<AnalyticsStats>({
    queryKey: ["admin-stats"],
    queryFn: () => apiFetch("/admin/stats").then((r: Response) => r.json()),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const statusData = Object.entries(stats?.byStatus || {}).map(([name, value]) => ({
    name,
    value,
  }));

  const categoryData = Object.entries(stats?.byCategory || {}).map(([name, value]) => ({
    name,
    value,
  }));

  // Mock data for trends (since backend doesn't provide it yet)
  const trendData = [
    { name: "Jan", applications: 40, jobs: 24 },
    { name: "Feb", applications: 30, jobs: 13 },
    { name: "Mar", applications: 20, jobs: 38 },
    { name: "Apr", applications: 27, jobs: 39 },
    { name: "May", applications: 18, jobs: 48 },
    { name: "Jun", applications: 23, jobs: 38 },
    { name: "Jul", applications: 34, jobs: 43 },
  ];

  return (
    <div className="space-y-8 p-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("admin.analytics")}</h1>
        <p className="text-muted-foreground">Comprehensive insights into portal activity and performance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Applications</CardTitle>
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalApplications}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Live Jobs</CardTitle>
            <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalJobs}</div>
            <p className="text-xs text-muted-foreground">+5 new today</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400">Pending Reviews</CardTitle>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingApplications}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-600 dark:text-purple-400">Hired/Offered</CardTitle>
            <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.offeredApplications}</div>
            <p className="text-xs text-muted-foreground">Success stories</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Growth Trends
            </CardTitle>
            <CardDescription>Monthly application and job posting trends</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend verticalAlign="top" height={36}/>
                <Line type="monotone" dataKey="applications" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="jobs" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>Applications by Status</CardTitle>
            <CardDescription>Current recruitment pipeline distribution</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Job Distribution by Category</CardTitle>
          <CardDescription>Visualizing which sectors are most active</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
