
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import type { LoanApplicationData } from '@/components/LoanApplication/LoanApplication';
import { format, subMonths } from 'date-fns';

interface DashboardChartsProps {
  loanApplications: LoanApplicationData[];
}

const statusColors = {
  Approved: 'hsl(var(--chart-2))', // Greenish
  Pending: 'hsl(var(--chart-3))',  // Yellowish
  Rejected: 'hsl(var(--chart-5))', // Reddish
};

const DashboardCharts = ({ loanApplications }: DashboardChartsProps) => {

  // Data for Loan Status Pie Chart
  const statusChartData = React.useMemo(() => {
    const statusCounts = loanApplications.reduce((acc, app) => {
      const currentStatus = app.status || 'Pending'; // Default to Pending if status is undefined
      acc[currentStatus] = (acc[currentStatus] || 0) + 1;
      return acc;
    }, {} as Record<LoanApplicationData['status'], number>);
    
    return [
      { status: 'Approved', count: statusCounts.Approved || 0, fill: statusColors.Approved },
      { status: 'Pending', count: statusCounts.Pending || 0, fill: statusColors.Pending },
      { status: 'Rejected', count: statusCounts.Rejected || 0, fill: statusColors.Rejected },
    ].filter(item => item.count > 0);
  }, [loanApplications]);

  const statusChartConfig: ChartConfig = {
    Approved: { label: 'Approved', color: statusColors.Approved },
    Pending: { label: 'Pending', color: statusColors.Pending },
    Rejected: { label: 'Rejected', color: statusColors.Rejected },
    count: { label: 'Count' }
  };

  // Data for Loan Applications by Month Bar Chart
  const monthlyApplicationsChartData = React.useMemo(() => {
    const data: { [key: string]: { month: string, shortLabel: string, new: number, approved: number } } = {};
    const now = new Date();

    // Initialize the last 6 months to ensure they exist in the chart
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(now, i);
      const monthKey = format(date, 'yyyy-MM'); // Unique key e.g., "2024-01"
      data[monthKey] = { month: monthKey, shortLabel: format(date, 'MMM'), new: 0, approved: 0 };
    }

    loanApplications.forEach(app => {
        // Process new applications
        const submissionTimestamp = app.submissionTimestamp;
        if (submissionTimestamp) {
            const submissionDate = typeof submissionTimestamp === 'string' ? new Date(submissionTimestamp) : (submissionTimestamp as any).toDate();
            const monthKey = format(submissionDate, 'yyyy-MM');
            if (data[monthKey]) {
                data[monthKey].new++;
            }
        }
        
        // Process approved applications
        const approvalTimestamp = app.approvalDate;
        if (approvalTimestamp) {
            const approvalDate = typeof approvalTimestamp === 'string' ? new Date(approvalTimestamp) : (approvalTimestamp as any).toDate();
            const approvalMonthKey = format(approvalDate, 'yyyy-MM');
            if (data[approvalMonthKey]) {
                data[approvalMonthKey].approved++;
            }
        }
    });

    return Object.values(data);
  }, [loanApplications]);
  
  const monthlyChartConfig = {
      new: { label: 'New Apps', color: 'hsl(var(--chart-1))' },
      approved: { label: 'Approved', color: 'hsl(var(--chart-2))' },
  } satisfies ChartConfig;

  return (
    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Monthly Loan Activity</CardTitle>
          <CardDescription>New applications vs. approvals over the last 6 months.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={monthlyChartConfig} className="h-[300px] w-full">
            <BarChart data={monthlyApplicationsChartData} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="shortLabel" tickLine={false} tickMargin={10} axisLine={false} />
              <YAxis />
              <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
              <Legend />
              <Bar dataKey="new" fill="var(--color-new)" radius={4} />
              <Bar dataKey="approved" fill="var(--color-approved)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Application Status Distribution</CardTitle>
           <CardDescription>Breakdown of all loan applications by their current status.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex justify-center items-center pb-0">
           <ChartContainer config={statusChartConfig} className="mx-auto aspect-square h-full">
            <PieChart>
              <Tooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="status" />} />
              <Pie
                data={statusChartData}
                dataKey="count"
                nameKey="status"
                innerRadius={60}
                strokeWidth={5}
                labelLine={false}
                label={({ percent, ...entry }) => `${entry.status}: ${(percent * 100).toFixed(0)}%`}
              >
                {statusChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="status" />} className="-translate-y-2 flex-wrap gap-2" />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardCharts;

    
